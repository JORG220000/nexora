import { chromium, expect } from "@playwright/test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../dist-pages/", import.meta.url));
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".webm": "video/webm" };
let server;
let base = process.env.NEXORA_URL;
if (!base) {
  server = createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://local").pathname);
    let file = path.resolve(root, "." + pathname.replace(/^\/nexora/, ""));
    if (pathname.endsWith("/")) file = path.join(file, "index.html");
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    try {
      const data = await readFile(file);
      res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream" }).end(data);
    } catch {
      res.writeHead(404, { "Content-Type": "text/html" }).end(await readFile(path.join(root, "404.html")));
    }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}/nexora/`;
}
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--enable-unsafe-swiftshader"] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: "dark", locale: "en-US" });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  const assets = [];
  page.on("response", r => { if (/\/(assets|media)\//.test(r.url()) && r.status() >= 400) assets.push(r.url()); });
  await page.goto(base);
  await expect(page.locator("h1")).toContainText("THE WORLD IS");
  await page.getByRole("button", { name: "Dismiss demo notice" }).click();
  await page.evaluate(async () => {
    for (const image of document.images) image.loading = "eager";
    await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
  });
  expect(await page.evaluate(() => [...document.images].filter(image => !image.naturalWidth).map(image => image.src))).toEqual([]);
  const propertyLink = page.locator('a[href*="/properties/"]').first();
  const target = new URL(await propertyLink.getAttribute("href"), base).href;
  expect(new URL(target).pathname).toMatch(/^\/nexora\/properties\//);
  await page.goto(target + "?test=direct#gallery");
  await expect(page.locator("h1")).not.toHaveText("NEXORA");
  await page.waitForFunction(() => location.search === "?test=direct");
  expect(page.url()).toBe(target + "?test=direct#gallery");
  await expect(page.locator("h1")).toBeVisible();
  await page.reload();
  await expect(page.locator("h1")).toBeVisible();
  await page.goto(base + "properties?city=Dubai&deal=buy");
  await expect(page.locator("h1")).toBeVisible();
  expect(new URL(page.url()).searchParams.get("city")).toBe("Dubai");
  const credits = await page.locator('a[href$="asset-credits.html"]').getAttribute("href");
  expect(credits).toBe("/nexora/asset-credits.html");
  expect(errors).toEqual([]);
  expect(assets).toEqual([]);
  console.log(JSON.stringify({ base, images: "passed", deepLinkAndReload: "passed", queryAndHash: "passed", assetErrors: assets, jsErrors: errors }));
} finally {
  await browser.close();
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}
