/** Resolve bundled public files at both / and a GitHub Pages repository path. */
export const publicAsset = (path: string) =>
  import.meta.env.BASE_URL + path.replace(/^\/+/, "");

export const propertyUrl = (slug: string) =>
  new URL(publicAsset(`properties/${encodeURIComponent(slug)}`), location.origin).href;
