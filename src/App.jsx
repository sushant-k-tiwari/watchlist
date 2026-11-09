import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  DiceIcon,
  Download04Icon,
  ImageAdd01Icon,
  PlusSignIcon,
  Search01Icon,
  StarIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { lookup, search } from "./api";
import { clearPosters, deletePoster, getPoster, savePoster } from "./posters";

const STORAGE_KEY = "watchnext:list";
const PRESET_TAGS = ["Movie", "Series", "Anime", "K-Drama"];
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const Icon = ({ icon, size = 20 }) => <HugeiconsIcon icon={icon} size={size} strokeWidth={2} />;

// The original hard-coded list, imported once on first visit.
const SEED = {
  Movie: ["Iron Mask", "Companion", "Kiss Kiss Bang Bang", "Only the Brave", "Sunday", "Get Out", "Remember Me", "Gigi & Nate", "The Layover", "The Guest", "Front of the Class", "What Women Want", "G-Force", "Bhagwan Bharose", "The Gambler", "Alienoid", "The Darjeeling Limited", "Cashback", "How to Build a Better Boy", "Zombies", "Green Book", "Mr. Deeds", "I Not Stupid 3", "Fairy Tale", "Hi Papa", "Lift", "Aquaman and the Lost Kingdom", "Inglourious Basterds", "Fight Club", "The Wild Robot", "Edge of Tomorrow", "Ant-Man and the Wasp", "Guardians of the Galaxy Vol. 3", "Anora", "Babylon", "Now You See Me", "Thunderbolts", "Captain America: Brave New World", "The Marvels", "Animal"],
  Series: ["Scorpion", "Prime Target", "Shameless", "From", "Ted Lasso", "Under Ninja", "A Series of Unfortunate Events", "Time Bandits", "Tatlubaaz", "You", "Alice in Borderland", "Rick and Morty", "Lucifer", "Money Heist", "Dark", "The Sandman", "The Witcher", "Titans", "The Playlist", "Another Life", "The Last of Us", "The Studio", "X-Men '97", "The Boys", "Gen V"],
  "K-Drama": ["Family Matters", "Forgotten", "A Little Reunion", "Love Scout", "Family by Choice", "Brewing Love", "Hometown Cha-Cha-Cha", "Queen of Tears", "The Uncanny Counter", "Vincenzo", "Hierarchy", "Tale of the Nine Tailed", "Squid Game", "See You in My 19th Life"],
};
const seed = () =>
  Object.entries(SEED).flatMap(([tag, titles]) => titles.map((title) => ({ id: newId(), title, tag, watched: false })));

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? seed();
  } catch {
    return seed();
  }
};

const needsWork = (i) => !i.lookedUp || (i.poster && !i.posterSaved);
const patchItem = (id, patch) => (list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i));

// Fills in missing details and saves the poster to IndexedDB for offline use. Throws when offline.
async function enrich(item) {
  const patch = {};
  if (!item.lookedUp) {
    const info = await lookup(item.tag, item.title);
    Object.assign(patch, info, { title: item.title, poster: item.poster ?? info?.poster ?? null, lookedUp: true });
  }
  const poster = patch.poster ?? item.poster;
  if (poster && !item.posterSaved) {
    try {
      await savePoster(item.id, poster);
      patch.posterSaved = Date.now();
      if (poster.startsWith("data:")) patch.poster = null; // move older uploads out of localStorage
    } catch {
      // keep showing the remote URL; saving is retried on the next load
    }
  }
  return patch;
}

// Saved poster from IndexedDB if there is one, else the remote URL.
function usePosterSrc(item) {
  const [saved, setSaved] = useState(null);
  useEffect(() => {
    if (!item.posterSaved) {
      setSaved(null);
      return;
    }
    let live = true;
    let url;
    getPoster(item.id)
      .then((blob) => live && blob && setSaved((url = URL.createObjectURL(blob))))
      .catch(() => {});
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [item.id, item.posterSaved]);
  return saved ?? item.poster ?? null;
}

function PosterPicker({ onPick, children, className }) {
  return (
    <label className={`cursor-pointer ${className}`}>
      {children}
      <input
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files[0];
          e.target.value = "";
          if (file) onPick(file);
        }}
      />
    </label>
  );
}

// caption: bottom overlay with the title (and rating). Without an image the title is always shown.
function Poster({ item, className = "", caption = false }) {
  const src = usePosterSrc(item);
  const [broken, setBroken] = useState(null); // unsaved remote posters fail offline -> show the title instead
  const hasImage = src && src !== broken;
  return (
    <div
      className={`relative aspect-[2/3] w-full overflow-hidden rounded-md bg-gradient-to-br from-neutral-700 to-neutral-900 ${className}`}
    >
      {hasImage && (
        <img src={src} alt="" loading="lazy" onError={() => setBroken(src)} className="size-full object-cover" />
      )}
      {(caption || !hasImage) && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-2.5 pt-10 pb-2">
          <p className="line-clamp-2 text-xs leading-tight font-semibold text-white sm:text-sm">{item.title}</p>
          {caption && item.rating && <p className="mt-0.5 text-[11px] font-semibold text-green-400">★ {item.rating}</p>}
        </div>
      )}
    </div>
  );
}

const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-black sm:px-6 sm:py-3 sm:text-base transition hover:bg-white/80 active:scale-95 disabled:opacity-40",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-md bg-neutral-500/50 px-4 py-2 text-sm font-semibold text-white sm:px-6 sm:py-3 sm:text-base backdrop-blur transition hover:bg-neutral-500/70 active:scale-95",
  round:
    "grid size-9 shrink-0 place-items-center rounded-full border-2 border-white/40 bg-black/30 text-white backdrop-blur transition hover:border-white sm:size-12",
};

function AddForm({ tags, onAdd }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("Movie");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("");
  const [poster, setPoster] = useState(null); // { file, url } of an uploaded image

  useEffect(() => {
    if (query.trim().length < 2 || !tag.trim()) {
      setResults([]);
      return;
    }
    let stale = false;
    const t = setTimeout(async () => {
      setStatus("Searching…");
      try {
        const r = await search(tag, query);
        if (stale) return;
        setResults(r);
        setStatus(r.length ? "" : "No matches. You can still add it by name.");
      } catch {
        if (!stale) setStatus("Search failed. You can still add it by name.");
      }
    }, 400);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [query, tag]);

  const add = (data) => {
    setQuery("");
    setResults([]);
    setPoster(null);
    setStatus(`Added “${data.title}” to ${tag.trim()}`);
    onAdd({ ...data, tag: tag.trim(), lookedUp: Boolean(data.plot || data.poster) }, poster?.file);
  };

  const field =
    "w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition focus:border-white/60";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (query.trim() && tag.trim()) add({ title: query.trim() });
      }}
      className="space-y-5"
    >
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-white/60">Type</legend>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag(t)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${tag === t ? "border-white bg-white font-semibold text-black" : "border-white/20 text-white/80 hover:border-white/60"}`}
            >
              {t}
            </button>
          ))}
          <input
            value={tags.includes(tag) ? "" : tag}
            onChange={(e) => setTag(e.target.value || "Movie")}
            placeholder="+ New tag"
            aria-label="New tag"
            className="w-28 rounded-full border border-dashed border-white/30 bg-transparent px-4 py-1.5 text-sm text-white placeholder-white/50 outline-none focus:border-white"
          />
        </div>
      </fieldset>

      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-white/40">
          <Icon icon={Search01Icon} size={18} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Title"
          placeholder={`Search ${tag || "titles"}…`}
          className={`${field} pl-11`}
        />
      </div>

      <PosterPicker
        onPick={(file) => setPoster({ file, url: URL.createObjectURL(file) })}
        className="flex items-center gap-4 rounded-md border border-dashed border-white/20 p-3 text-sm text-white/70 transition hover:border-white/60"
      >
        {poster ? (
          <img src={poster.url} alt="Poster preview" className="h-16 w-11 rounded object-cover" />
        ) : (
          <span className="grid h-16 w-11 place-items-center rounded bg-white/5">
            <Icon icon={ImageAdd01Icon} />
          </span>
        )}
        <span>
          <span className="block font-medium text-white">{poster ? "Change poster" : "Add a poster"}</span>
          Optional, pick an image from your device
        </span>
      </PosterPicker>

      {status && <p className="text-sm text-white/50">{status}</p>}

      {results.length > 0 && (
        <ul className="-mx-2 space-y-1">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => add(r)}
                className="flex w-full items-center gap-4 rounded-md p-2 text-left transition hover:bg-white/10"
              >
                <Poster item={r} className="w-12! shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{r.title}</span>
                  <span className="flex items-center gap-2 text-sm text-white/50">
                    {r.year}
                    {r.rating && <span className="text-green-400">★ {r.rating}</span>}
                  </span>
                </span>
                <Icon icon={PlusSignIcon} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button className="w-full rounded-md bg-brand py-3 font-semibold text-white transition hover:bg-brand/85 active:scale-[0.99]">
        Add to watchlist
      </button>
    </form>
  );
}

function Row({ title, items, onOpen, pickedId, grid }) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="mb-1 flex items-baseline gap-3 px-gutter text-lg font-bold sm:text-xl">
        {title}
        <span className="text-sm font-normal text-white/40">{items.length}</span>
      </h2>
      <ul
        className={
          grid
            ? "grid grid-cols-3 gap-x-2 gap-y-6 px-gutter py-3 sm:grid-cols-4 sm:gap-x-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
            : "no-scrollbar flex snap-x gap-2 overflow-x-auto scroll-px-gutter px-gutter py-3 sm:gap-3"
        }
      >
        {items.map((item) => (
          <li key={item.id} className={grid ? "" : "w-28 shrink-0 snap-start sm:w-36 lg:w-44"}>
            <button onClick={() => onOpen(item)} aria-label={item.title} className="group block w-full text-left">
              <div
                className={`relative overflow-hidden rounded-md ring-2 transition duration-300 group-hover:scale-105 group-hover:shadow-2xl ${pickedId === item.id ? "ring-white" : "ring-transparent"} ${item.watched ? "opacity-50" : ""}`}
              >
                <Poster item={item} caption />
                {item.watched && (
                  <span className="absolute top-2 right-2 rounded-full bg-black/70 text-green-400">
                    <Icon icon={CheckmarkCircle02Icon} />
                  </span>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function App() {
  const [items, setItems] = useState(load);
  const [filter, setFilter] = useState("All");
  const [pickedId, setPickedId] = useState(null);
  const [installEvt, setInstallEvt] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const dialog = useRef(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      alert("Storage is full. Remove some titles or posters, or this change won't be saved.");
    }
  }, [items]);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallEvt(e);
    };
    const onScroll = () => setScrolled(window.scrollY > 40);
    let stopped = false;
    let running = false;
    // One pass over the list fetching missing details/posters; re-runs when the device comes back online.
    const backfill = async () => {
      if (running) return;
      running = true;
      for (const item of itemsRef.current.filter(needsWork)) {
        if (stopped || !navigator.onLine) break;
        if (!itemsRef.current.some((i) => i.id === item.id)) continue; // removed/cleared meanwhile
        try {
          const patch = await enrich(item);
          if (!stopped) setItems(patchItem(item.id, patch));
        } catch {
          // offline or API error: retried on the next pass
        }
        await new Promise((r) => setTimeout(r, 300)); // stay under TVMaze/AniList rate limits
      }
      running = false;
    };
    backfill();
    window.addEventListener("online", backfill);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("online", backfill);
      stopped = true;
    };
  }, []);

  const tags = [...new Set([...PRESET_TAGS, ...items.map((i) => i.tag)])];
  const usedTags = [...new Set(items.map((i) => i.tag))];
  const shown = items.filter((i) => filter === "All" || i.tag === filter);
  const pool = shown.filter((i) => !i.watched);
  const picked = items.find((i) => i.id === pickedId);

  const update = (id, patch) => setItems(patchItem(id, patch));
  const heroSrc = usePosterSrc(picked ?? {});

  const refresh = async (item) => {
    try {
      update(item.id, await enrich(item));
    } catch {
      // offline: just show the name; the backfill retries when back online
    }
  };

  const show = async (item) => {
    setPickedId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!needsWork(item)) return;
    setLoadingId(item.id);
    await refresh(item);
    setLoadingId(null);
  };

  const addItem = async (data, file) => {
    const item = { id: newId(), watched: false, ...data };
    if (file) {
      try {
        await savePoster(item.id, file);
        item.posterSaved = Date.now();
      } catch {
        alert("Couldn't read that image, so the title was added without it.");
      }
    }
    setItems((list) => [item, ...list]);
    if (needsWork(item)) refresh(item);
  };

  const uploadPoster = async (item, file) => {
    try {
      await savePoster(item.id, file);
      update(item.id, { posterSaved: Date.now() });
    } catch {
      alert("Couldn't read that image.");
    }
  };

  const draw = () => {
    const choices = pool.length > 1 ? pool.filter((i) => i.id !== pickedId) : pool;
    show(choices[Math.floor(Math.random() * choices.length)]);
  };

  // Wipes this device only; the built-in starter list stays in the code for fresh installs.
  const clearAll = () => {
    if (!confirm(`Delete all ${items.length} titles and their posters from this device? This can't be undone.`)) return;
    setItems([]);
    setPickedId(null);
    setFilter("All");
    clearPosters().catch(() => {});
  };

  const remove = (item) => {
    if (!confirm(`Remove “${item.title}” from your list?`)) return;
    setItems((list) => list.filter((i) => i.id !== item.id));
    deletePoster(item.id).catch(() => {});
    setPickedId(null);
  };

  const tab = (active) =>
    `shrink-0 text-sm transition ${active ? "font-semibold text-white" : "text-white/60 hover:text-white/90"}`;

  return (
    <div className="min-h-dvh bg-ink text-white antialiased">
      {/* Header */}
      <header
        className={`fixed inset-x-0 top-0 z-30 pt-[env(safe-area-inset-top)] transition-colors duration-300 ${scrolled ? "bg-ink/95 shadow-lg backdrop-blur" : "bg-gradient-to-b from-black/80 to-transparent"}`}
      >
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-gutter py-4">
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tighter text-brand uppercase sm:text-3xl">
            <img src="/favicon.svg" alt="" className="size-8 sm:size-9" />
            Watch Next
          </h1>
          <nav className="no-scrollbar order-last -mx-gutter flex w-[calc(100%+2*var(--spacing-gutter))] gap-5 overflow-x-auto px-gutter md:order-none md:mx-0 md:w-auto md:px-0">
            {["All", ...usedTags].map((t) => (
              <button key={t} onClick={() => setFilter(t)} className={tab(filter === t)}>
                {t === "All" ? "Home" : t}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {installEvt && (
              <button
                onClick={() => {
                  installEvt.prompt();
                  setInstallEvt(null);
                }}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <Icon icon={Download04Icon} size={18} />
                <span className="hidden sm:inline">Install</span>
              </button>
            )}
            <button
              onClick={() => dialog.current.showModal()}
              className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-semibold transition hover:bg-brand/85 sm:px-4"
            >
              <Icon icon={PlusSignIcon} size={18} />
              <span className="hidden sm:inline">Add title</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[78svh] items-end overflow-hidden md:min-h-[88vh]">
        {heroSrc ? (
          <img
            key={heroSrc}
            src={heroSrc}
            alt=""
            className="absolute inset-0 size-full scale-110 object-cover opacity-50 blur-2xl"
          />
        ) : (
          <div className="absolute inset-0 bg-[url('./assets/wallpaper2.jpg')] bg-cover bg-center opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink to-transparent" />

        <div className="relative flex w-full flex-col gap-6 px-gutter pt-36 pb-16 sm:flex-row sm:items-end sm:gap-10 md:pb-24">
          {picked && (
            <Poster
              key={picked.id}
              item={picked}
              className="w-36! shrink-0 shadow-2xl shadow-black/60 sm:w-48! lg:w-64!"
            />
          )}
          <div className="max-w-2xl">
            {picked ? (
              <>
                <p className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.3em] text-white/70 uppercase">
                  <span className="h-4 w-1 bg-brand" />
                  {picked.watched ? "Already watched" : "Tonight's pick"}
                </p>
                <h2 className="text-4xl leading-none font-black tracking-tight text-balance sm:text-5xl lg:text-6xl">
                  {picked.title}
                </h2>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/70">
                  {picked.rating && (
                    <span className="inline-flex items-center gap-1 font-semibold text-green-400">
                      <Icon icon={StarIcon} size={16} />
                      {picked.rating}
                    </span>
                  )}
                  {picked.year && <span>{picked.year}</span>}
                  <span className="rounded border border-white/40 px-1.5 py-0.5 text-xs">{picked.tag}</span>
                </div>
                {(picked.plot || loadingId === picked.id) && (
                  <p className="mt-4 line-clamp-4 text-base text-white/80 sm:text-lg">
                    {picked.plot || "Fetching details…"}
                  </p>
                )}
              </>
            ) : (
              <>
                <h2 className="text-4xl leading-none font-black tracking-tight text-balance sm:text-5xl lg:text-6xl">
                  {items.length ? "Can't decide what to watch?" : "Your watchlist is empty"}
                </h2>
                <p className="mt-4 text-base text-white/80 sm:text-lg">
                  {items.length
                    ? `${pool.length} titles are waiting${filter === "All" ? "" : ` in ${filter}`}. Let fate pick one.`
                    : "Add a movie, series or anime to get started."}
                </p>
              </>
            )}

            <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
              {items.length ? (
                <button onClick={draw} disabled={!pool.length} className={`${btn.primary} flex-1 sm:flex-none`}>
                  <Icon icon={DiceIcon} />
                  {!pool.length ? "All watched" : picked ? "Pick" : "Pick for me"}
                </button>
              ) : (
                <button onClick={() => dialog.current.showModal()} className={btn.primary}>
                  <Icon icon={PlusSignIcon} />
                  Add a title
                </button>
              )}
              {picked && (
                <>
                  <button
                    onClick={() => update(picked.id, { watched: !picked.watched })}
                    className={`${btn.secondary} flex-1 sm:flex-none`}
                  >
                    <Icon icon={picked.watched ? Cancel01Icon : Tick02Icon} />
                    {picked.watched ? "Unwatch" : "Watched"}
                  </button>
                  <PosterPicker onPick={(file) => uploadPoster(picked, file)} className={btn.round}>
                    <span className="sr-only">Change poster</span>
                    <Icon icon={ImageAdd01Icon} />
                  </PosterPicker>
                  <button onClick={() => remove(picked)} aria-label="Remove from list" className={btn.round}>
                    <Icon icon={Delete02Icon} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Rows */}
      <main className="relative z-10 -mt-8 space-y-8 pb-[max(4rem,env(safe-area-inset-bottom))] sm:space-y-10">
        {(filter === "All" ? usedTags : [filter]).map((t) => (
          <Row
            key={t}
            title={t}
            grid={filter !== "All"}
            items={pool.filter((i) => i.tag === t)}
            onOpen={show}
            pickedId={pickedId}
          />
        ))}
        <Row title="Watched" items={shown.filter((i) => i.watched)} onOpen={show} pickedId={pickedId} />
        {items.length > 0 && (
          <footer className="border-t border-white/10 px-gutter pt-8 text-center">
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm text-white/50 transition hover:bg-red-500/10 hover:text-red-400"
            >
              <Icon icon={Delete02Icon} size={16} />
              Clear watchlist
            </button>
            <p className="mt-1 text-xs text-white/30">Removes every title and poster so you can start your own list.</p>
          </footer>
        )}
      </main>

      {/* Add dialog: bottom sheet on mobile, centered on larger screens */}
      <dialog
        ref={dialog}
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
        className="mx-auto mt-auto mb-0 max-h-[90dvh] w-full max-w-none rounded-t-2xl bg-panel text-white shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm sm:m-auto sm:max-w-lg sm:rounded-xl"
      >
        <div className="p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Add to watchlist</h2>
            <button
              onClick={() => dialog.current.close()}
              aria-label="Close"
              className="grid size-9 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <Icon icon={Cancel01Icon} />
            </button>
          </div>
          <AddForm tags={tags} onAdd={addItem} />
        </div>
      </dialog>
    </div>
  );
}

export default App;
