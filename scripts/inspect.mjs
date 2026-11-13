import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const out = new URL("../qa/", import.meta.url);
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: ["--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  colorScheme: "dark",
  locale: "en-US",
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(process.env.NEXORA_URL || "http://127.0.0.1:4173/");
await page.waitForTimeout(4500);
await page.getByRole("button", { name: "Dismiss demo notice" }).click();
await page.mouse.move(1400, 950);
await page.evaluate(async () => {
  for (const img of document.images) img.loading = "eager";
  await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));
});
await page.screenshot({path: "../NEXORA-preview.png", fullPage: false});
await page.screenshot({
  path: new URL("home-desktop.png", out).pathname.replace(/^\/([A-Z]:)/, "$1"),
  fullPage: true,
});
console.log(
  JSON.stringify({
    title: await page.title(),
    errors,
    body: (await page.locator("body").innerText()).slice(0, 400),
    overflow: await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  }),
);
console.log("Unloaded images:",await page.evaluate(() => [...document.images].filter(i=>!i.naturalWidth).map(i=>i.src)));
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({
  path: new URL("home-mobile.png", out).pathname.replace(/^\/([A-Z]:)/, "$1"),
  fullPage: true,
});
await browser.close();
