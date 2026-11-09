import { useEffect, useState } from "react";
import { isMovie, lookup, search } from "./api";

const STORAGE_KEY = "watchnext:list";
const PRESET_TAGS = ["Movie", "Series", "Anime", "K-Drama"];
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

// The original hard-coded list, imported once on first visit.
const SEED = {
  Movie: ["Iron Mask", "Companion", "Kiss Kiss Bang Bang", "Only the Brave", "Sunday", "Get Out", "Remember Me", "Gigi & Nate", "The Layover", "The Guest", "Front of the Class", "What Women Want", "G-Force", "Bhagwan Bharose", "The Gambler", "Alienoid", "The Darjeeling Limited", "Cashback", "How to Build a Better Boy", "Zombies", "Green Book", "Mr. Deeds", "I Not Stupid 3", "Fairy Tale", "Hi Papa", "Lift", "Aquaman and the Lost Kingdom", "Inglourious Basterds", "Fight Club", "The Wild Robot", "Edge of Tomorrow", "Ant-Man and the Wasp", "Guardians of the Galaxy Vol. 3", "Anora", "Babylon", "Now You See Me", "Thunderbolts", "Captain America: Brave New World", "The Marvels", "Animal"],
  Series: ["Scorpion", "Prime Target", "Shameless", "From", "Ted Lasso", "Under Ninja", "A Series of Unfortunate Events", "Time Bandits", "Tatlubaaz", "You", "Alice in Borderland", "Rick and Morty", "Lucifer", "Money Heist", "Dark", "The Sandman", "The Witcher", "Titans", "The Playlist", "Another Life", "The Last of Us", "The Studio", "X-Men '97", "The Boys", "Gen V"],
  "K-Drama": ["Family Matters", "Forgotten", "A Little Reunion", "Love Scout", "Family by Choice", "Brewing Love", "Hometown Cha-Cha-Cha", "Queen of Tears", "The Uncanny Counter", "Vincenzo", "Hierarchy", "Tale of the Nine Tailed", "Squid Game", "See You in My 19th Life"],
};
const seed = () =>
  Object.entries(SEED).flatMap(([tag, titles]) => titles.map((title) => ({ id: newId(), title, tag, watched: false })));

// Shrink uploaded posters so they fit in localStorage (~5MB total).
async function toThumb(file) {
  const bmp = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = 300;
  canvas.height = Math.round((bmp.height * 300) / bmp.width);
  canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

function PosterPicker({ onPick, children, className }) {
  return (
    <label className={`cursor-pointer ${className}`}>
      {children}
      <input
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const file = e.target.files[0];
          e.target.value = "";
          if (file) onPick(await toThumb(file).catch(() => null));
        }}
      />
    </label>
  );
}

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? seed();
  } catch {
    return seed();
  }
};

function Poster({ item, className = "" }) {
  const [broken, setBroken] = useState(false); // remote posters fail offline -> show the name's initial
  return item.poster && !broken ? (
    <img src={item.poster} alt="" loading="lazy" onError={() => setBroken(true)} className={`aspect-[2/3] w-full rounded-lg object-cover ${className}`} />
  ) : (
    <div className={`grid aspect-[2/3] w-full place-items-center rounded-lg bg-white/10 text-4xl font-bold text-white/40 ${className}`}>
      {item.title[0]}
    </div>
  );
}

function AddForm({ tags, onAdd }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("Movie");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("");
  const [poster, setPoster] = useState(null);
  const movie = isMovie(tag);

  useEffect(() => {
    if (movie || query.trim().length < 2 || !tag.trim()) {
      setStatus("");
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
        setStatus(r.length ? "" : "No matches. Press Add to save it anyway.");
      } catch {
        if (!stale) setStatus("Search failed. You can still add it.");
      }
    }, 400);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [query, tag, movie]);

  const add = (data) => {
    setQuery("");
    setResults([]);
    setPoster(null);
    onAdd({ ...data, tag: tag.trim(), fetched: movie || Boolean(data.plot) });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (query.trim() && tag.trim()) add({ title: query.trim(), poster: movie ? poster : undefined });
      }}
      className="relative"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          list="tag-options"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          aria-label="Tag"
          placeholder="Tag"
          className="rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-amber-400 sm:w-40"
        />
        <datalist id="tag-options">
          {tags.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Title"
          placeholder={movie ? "Movie name" : `Search a ${tag || "title"} to add…`}
          className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-amber-400"
        />
        {movie && (
          <PosterPicker
            onPick={setPoster}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white/80 hover:border-amber-400"
          >
            {poster ? <img src={poster} alt="Poster preview" className="h-6 w-4 rounded-sm object-cover" /> : "＋"}
            {poster ? "Change poster" : "Poster (optional)"}
          </PosterPicker>
        )}
        <button className="rounded-xl bg-white/90 px-5 py-3 font-semibold text-black hover:bg-white">Add</button>
      </div>
      {status && <p className="mt-2 text-sm text-white/60">{status}</p>}
      {results.length > 0 && (
        <ul className="absolute inset-x-0 z-20 mt-2 max-h-96 overflow-y-auto rounded-xl border border-white/15 bg-neutral-900/95 p-2 shadow-2xl backdrop-blur">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => add(r)}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-white/10"
              >
                <Poster item={r} className="w-10! shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-white">{r.title}</span>
                  <span className="text-sm text-white/50">
                    {r.year}
                    {r.rating && ` · ★ ${r.rating}`}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

function App() {
  const [items, setItems] = useState(load);
  const [filter, setFilter] = useState("All");
  const [pickedId, setPickedId] = useState(null);
  const [installEvt, setInstallEvt] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

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
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const tags = [...new Set([...PRESET_TAGS, ...items.map((i) => i.tag)])];
  const usedTags = [...new Set(items.map((i) => i.tag))];
  const shown = items.filter((i) => filter === "All" || i.tag === filter);
  const pool = shown.filter((i) => !i.watched);
  const picked = items.find((i) => i.id === pickedId);

  const update = (id, patch) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const show = async (item) => {
    setPickedId(item.id);
    if (item.fetched) return;
    setLoadingId(item.id);
    try {
      const info = await lookup(item.tag, item.title);
      update(item.id, { ...info, title: item.title, fetched: true });
    } catch {
      // offline or API down: just show the name, leave unfetched so a later pick retries
    } finally {
      setLoadingId(null);
    }
  };

  const draw = () => {
    const choices = pool.length > 1 ? pool.filter((i) => i.id !== pickedId) : pool;
    show(choices[Math.floor(Math.random() * choices.length)]);
  };

  const chip = (active) =>
    `shrink-0 rounded-full px-4 py-1.5 text-sm transition ${active ? "bg-amber-400 font-semibold text-black" : "bg-white/10 text-white/80 hover:bg-white/20"}`;

  return (
    <div className="min-h-dvh bg-[url('./assets/wallpaper2.jpg')] bg-cover bg-fixed bg-center">
      <div className="min-h-dvh bg-black/70 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] text-white backdrop-blur-sm">
        <div className="mx-auto max-w-5xl">
          <header className="flex items-center justify-between py-4">
            <h1 className="font-mono text-3xl font-bold sm:text-4xl">Watch Next</h1>
            {installEvt && (
              <button
                onClick={() => {
                  installEvt.prompt();
                  setInstallEvt(null);
                }}
                className="rounded-full border border-white/30 px-4 py-1.5 text-sm hover:bg-white/10"
              >
                Install app
              </button>
            )}
          </header>

          {/* Filter + draw */}
          <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
            {["All", ...usedTags].map((t) => (
              <button key={t} onClick={() => setFilter(t)} className={chip(filter === t)}>
                {t}
              </button>
            ))}
          </nav>

          <button
            onClick={draw}
            disabled={!pool.length}
            className="mt-4 w-full rounded-2xl bg-amber-400 py-4 text-lg font-bold text-black shadow-lg shadow-amber-400/20 transition hover:bg-amber-300 active:scale-[0.98] disabled:opacity-40"
          >
            {pool.length ? `🎲 Pick something (${pool.length} left)` : "Nothing left to watch here 🎉"}
          </button>

          {picked && (
            <section
              key={picked.id}
              className={`mt-6 flex flex-col gap-5 rounded-2xl border p-4 backdrop-blur-md sm:flex-row sm:p-6 ${picked.watched ? "border-green-400/50 bg-green-400/10" : "border-white/15 bg-white/10"}`}
            >
              <Poster item={picked} className="mx-auto max-w-44 shadow-xl sm:mx-0 sm:w-48 sm:max-w-none" />
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-sm uppercase tracking-widest text-amber-300">Watch this</p>
                <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{picked.title}</h2>
                <p className="mt-1 text-white/60">
                  {[picked.tag, picked.year, picked.rating && `★ ${picked.rating}`].filter(Boolean).join(" · ")}
                </p>
                {(picked.plot || loadingId === picked.id) && (
                  <p className="mt-3 line-clamp-6 text-white/80">{picked.plot || "Fetching details…"}</p>
                )}
                <div className="mt-auto flex gap-2 pt-4">
                  <button
                    onClick={() => update(picked.id, { watched: !picked.watched })}
                    className="flex-1 rounded-xl bg-white/15 py-2.5 font-medium hover:bg-white/25 sm:flex-none sm:px-5"
                  >
                    {picked.watched ? "Mark unwatched" : "✓ Watched"}
                  </button>
                  {isMovie(picked.tag) && (
                    <PosterPicker
                      onPick={(poster) => poster && update(picked.id, { poster })}
                      className="flex-1 rounded-xl border border-white/20 py-2.5 text-center hover:bg-white/10 sm:flex-none sm:px-5"
                    >
                      {picked.poster ? "Change poster" : "Add poster"}
                    </PosterPicker>
                  )}
                  <button
                    onClick={() => setPickedId(null)}
                    className="flex-1 rounded-xl border border-white/20 py-2.5 hover:bg-white/10 sm:flex-none sm:px-5"
                  >
                    Close
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Watchlist */}
          <section className="mt-10">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-xl font-semibold">Watchlist</h2>
              <span className="text-sm text-white/50">
                {pool.length} to watch · {shown.length - pool.length} watched
              </span>
            </div>
            <AddForm tags={tags} onAdd={(data) => setItems((list) => [{ id: newId(), watched: false, ...data }, ...list])} />

            <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {shown.map((item) => (
                <li key={item.id} className={`group relative ${item.watched ? "opacity-40" : ""}`}>
                  <button onClick={() => show(item)} className="block w-full text-left">
                    <Poster item={item} />
                    <p className="mt-1.5 truncate text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-white/50">
                      {item.tag}
                      {item.rating && ` · ★ ${item.rating}`}
                    </p>
                  </button>
                  <div className="absolute top-1.5 right-1.5 flex gap-1">
                    <button
                      onClick={() => update(item.id, { watched: !item.watched })}
                      aria-label={item.watched ? "Mark unwatched" : "Mark watched"}
                      className={`grid size-8 place-items-center rounded-full backdrop-blur ${item.watched ? "bg-green-500 text-black" : "bg-black/60 hover:bg-black/80"}`}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove "${item.title}"?`)) setItems((list) => list.filter((i) => i.id !== item.id));
                      }}
                      aria-label="Remove"
                      className="grid size-8 place-items-center rounded-full bg-black/60 backdrop-blur hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;
