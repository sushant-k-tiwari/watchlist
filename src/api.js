// Free, keyless APIs: Kitsu (anime) + TVMaze (series/dramas/custom tags).
// Movies have no lookup: the user adds a name and an optional poster.
const get = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
};
const strip = (html) => html?.replace(/<[^>]+>/g, "") ?? "";

const sources = {
  anime: async (q) =>
    (await get(`https://kitsu.io/api/edge/anime?filter[text]=${q}&page[limit]=6`)).data.map(({ attributes: a }) => ({
      title: a.canonicalTitle,
      year: a.startDate?.slice(0, 4),
      poster: a.posterImage?.small,
      rating: a.averageRating ? (a.averageRating / 10).toFixed(1) : null,
      plot: a.synopsis,
    })),
  series: async (q) =>
    (await get(`https://api.tvmaze.com/search/shows?q=${q}`)).slice(0, 6).map(({ show: s }) => ({
      title: s.name,
      year: s.premiered?.slice(0, 4),
      poster: s.image?.medium,
      rating: s.rating?.average,
      plot: strip(s.summary),
    })),
};

export const isMovie = (tag) => tag.trim().toLowerCase() === "movie";

export const search = async (tag, query) => {
  if (isMovie(tag)) return [];
  const source = tag.trim().toLowerCase() === "anime" ? sources.anime : sources.series;
  return source(encodeURIComponent(query.trim()));
};

// Best match for an item added without details (e.g. seed titles). Throws when offline.
export const lookup = async (tag, title) => (await search(tag, title))[0] ?? null;
