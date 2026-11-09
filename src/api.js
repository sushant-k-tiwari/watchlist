// Free, keyless, CORS-enabled sources whose images can also be downloaded for offline use:
// Wikipedia (movies), AniList (anime), TVMaze (series, dramas and custom tags).
const get = async (url, init) => {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
};
const strip = (html) => html?.replace(/<[^>]+>/g, "").trim() ?? "";
const bareTitle = (t) => t.replace(/\s*\(.*\)$/, ""); // "Lift (2024 film)" -> "Lift"

const sources = {
  movie: async (q) => {
    const params = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: `${q} film`,
      gsrlimit: "8",
      prop: "pageimages|extracts",
      piprop: "thumbnail",
      pithumbsize: "400",
      pilicense: "any", // film posters are non-free images, excluded by default
      exintro: "1",
      explaintext: "1",
      exsentences: "3",
      format: "json",
      origin: "*",
    });
    const pages = Object.values(
      (await get(`https://en.wikipedia.org/w/api.php?${params}`)).query
        ?.pages ?? {},
    );
    return pages
      .sort((a, b) => a.index - b.index)
      .map((p) => ({
        title: bareTitle(p.title),
        year:
          (p.title.match(/\((\d{4})/) ??
            p.extract?.match(/\b((?:19|20)\d{2})\b/))?.[1] ?? null,
        // the ?utm_ params trigger a redirect without CORS headers, which blocks saving the image offline
        poster: p.thumbnail?.source.split("?")[0] ?? null,
        rating: null,
        plot: p.extract,
      }));
  },
  anime: async (q) => {
    const query = `query($q: String) { Page(perPage: 6) { media(search: $q, type: ANIME) {
      title { english romaji } seasonYear averageScore description(asHtml: false) coverImage { large } } } }`;
    const r = await get("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { q } }),
    });
    return r.data.Page.media.map((m) => ({
      title: m.title.english ?? m.title.romaji,
      year: m.seasonYear,
      poster: m.coverImage?.large,
      rating: m.averageScore ? (m.averageScore / 10).toFixed(1) : null,
      plot: strip(m.description),
    }));
  },
  series: async (q, language) =>
    (
      await get(
        `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`,
      )
    )
      // e.g. a "K-Drama" Family Matters should beat the American sitcom
      .sort(
        (a, b) =>
          (b.show.language === language) - (a.show.language === language),
      )
      .slice(0, 6)
      .map(({ show: s }) => ({
        title: s.name,
        year: s.premiered?.slice(0, 4),
        poster: s.image?.medium,
        rating: s.rating?.average,
        plot: strip(s.summary),
        language: s.language,
      })),
};

const LANGUAGES = {
  "k-drama": "Korean",
  "j-drama": "Japanese",
  "c-drama": "Chinese",
};

export const search = (tag, query) => {
  const t = tag.trim().toLowerCase();
  return sources[t === "movie" || t === "anime" ? t : "series"](
    query.trim(),
    LANGUAGES[t],
  );
};

const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ""); // "Cha-Cha-Cha" == "Cha Cha Cha"

// Best match for a title added by name: exact title with a poster, then any poster, then anything.
// Dramas only accept an exact title in their language: a same-named show in another language is
// usually a different show (K-Drama "Family Matters" vs the US sitcom), so it stays name-only.
export async function lookup(tag, title) {
  const results = await search(tag, title);
  const exact = (r) => norm(r.title) === norm(title);
  const language = LANGUAGES[tag.trim().toLowerCase()];
  if (language) return results.find((r) => exact(r) && r.language === language) ?? null;
  return (
    results.find((r) => exact(r) && r.poster) ??
    results.find((r) => r.poster) ??
    results[0] ??
    null
  );
}
