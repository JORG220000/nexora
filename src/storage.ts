import type { Property } from "./model";
export function readLocal<T>(
  key: string,
  fallback: T,
  valid: (value: unknown) => boolean = () => true,
): T {
  try {
    const value = JSON.parse(
      localStorage.getItem("nexora." + key + ".v1") || "null",
    );
    return value !== null && valid(value) ? value : fallback;
  } catch {
    return fallback;
  }
}
export function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem("nexora." + key + ".v1", JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
let dbPromise: Promise<IDBDatabase> | undefined;
function database() {
  return (dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("nexora", 1);
    r.onupgradeneeded = () =>
      r.result.createObjectStore("listings", { keyPath: "id" });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => {
      dbPromise = undefined;
      reject(r.error);
    };
    r.onblocked = () => reject(Error("Storage blocked"));
  }));
}
function validProperty(p: unknown): p is Property {
  const x = p as Property;
  return (
    !!x &&
    typeof x.id === "string" &&
    typeof x.slug === "string" &&
    typeof x.name === "string" &&
    ["buy", "rent"].includes(x.deal) &&
    ["Dubai", "Monaco", "New York", "Tokyo", "Miami"].includes(x.city) &&
    ["villa", "apartment", "mansion", "waterfront"].includes(x.type) &&
    Number.isFinite(x.price) &&
    x.price > 0 &&
    Number.isFinite(x.area) &&
    Array.isArray(x.photos) &&
    x.photos.length > 0 &&
    x.photos.every((p) => typeof p.src === "string") &&
    typeof x.description?.en === "string" &&
    typeof x.description?.ru === "string" &&
    Array.isArray(x.amenities) &&
    typeof x.features?.en === "string" &&
    typeof x.features?.ru === "string" &&
    !!x.country
  );
}
export async function loadListings() {
  const db = await database();
  return new Promise<Property[]>((res, rej) => {
    const r = db.transaction("listings").objectStore("listings").getAll();
    r.onsuccess = () => res(r.result.filter(validProperty));
    r.onerror = () => rej(r.error);
  });
}
export async function saveListing(p: Property) {
  const db = await database();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction("listings", "readwrite");
    tx.objectStore("listings").put(p);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
    tx.onabort = () => rej(tx.error);
  });
}
export async function deleteListing(id: string) {
  const db = await database();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction("listings", "readwrite");
    tx.objectStore("listings").delete(id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
export async function compressPhoto(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw Error("format");
  if (file.size > 5 * 1024 * 1024) throw Error("size");
  const image = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();
  return canvas.toDataURL("image/webp", 0.82);
}
