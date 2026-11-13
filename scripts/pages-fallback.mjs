import { writeFile, readFile } from "node:fs/promises";
const base = "/nexora/";
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>NEXORA</title><script>
const base = ${JSON.stringify(base)};
const route = location.pathname + location.search + location.hash;
location.replace(base + '?__nexora_path=' + encodeURIComponent(route));
</script></head><body><a href="${base}">Open NEXORA</a></body></html>`;
await writeFile(new URL("../dist-pages/404.html", import.meta.url), html);
await writeFile(new URL("../dist-pages/.nojekyll", import.meta.url), "");
const creditsFile = new URL("../dist-pages/asset-credits.html", import.meta.url);
await writeFile(creditsFile, (await readFile(creditsFile, "utf8")).replace('href="/"', `href="${base}"`));
console.log("GitHub Pages: repository base path and deep-link fallback ready.");
