// Posters are stored in IndexedDB as small JPEG blobs keyed by item id, so they show offline
// and stay out of localStorage's ~5MB limit.
let db;
const open = () =>
  (db ??= new Promise((resolve, reject) => {
    const req = indexedDB.open("watchnext", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("posters");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));

const run = (mode, op) =>
  open().then(
    (d) =>
      new Promise((resolve, reject) => {
        const req = op(d.transaction("posters", mode).objectStore("posters"));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );

export const getPoster = (id) => run("readonly", (store) => store.get(id));
export const deletePoster = (id) => run("readwrite", (store) => store.delete(id));
export const clearPosters = () => run("readwrite", (store) => store.clear());

async function toThumb(blob) {
  const bmp = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = 300;
  canvas.height = Math.round((bmp.height * 300) / bmp.width);
  canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
}

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`poster ${res.status}`);
  return res.blob();
}

// source: an uploaded File, or an image URL (remote or data:) to download.
// API posters are already small (~20-110KB) so they're stored as-is; uploads (phone photos) get shrunk.
export async function savePoster(id, source) {
  const blob = typeof source === "string" ? await download(source) : await toThumb(source);
  await run("readwrite", (store) => store.put(blob, id));
}
