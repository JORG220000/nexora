import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
const base = process.env.NEXORA_URL || "http://127.0.0.1:5174";
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: ["--enable-unsafe-swiftshader"],
});
const checks = [];
const ok = (t) => {
  checks.push(t);
  console.log("PASS " + t);
};
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
    colorScheme: "dark",
  });
  const page = await context.newPage();
  await page.goto(base);
  await page.getByRole("button", { name: "Dismiss demo notice" }).click();
  await page
    .locator(".hero-city-controls")
    .getByRole("button", { name: "Monaco", exact: true })
    .click();
  await expect(page.locator(".city-float")).toContainText(
    "3 exceptional properties",
  );
  await page.locator(".city-float a").click();
  await expect(page.locator(".results-line")).toContainText(
    "3 properties found",
  );
  ok("Globe city selection opens corresponding filtered catalogue");
  await page.goto(base);
  await expect(page.locator("#destinations .price-pin")).toHaveCount(5);
  await page
    .locator("#destinations .price-pin")
    .filter({ hasText: "Tokyo" })
    .click();
  await expect(page.locator(".map-popup")).toContainText("Tokyo");
  ok("World map exposes five selectable destination markers");
  await page.goto(base + "/properties?deal=buy");
  await page.locator(".price-pin").first().click();
  await expect(page.locator(".map-popup")).toBeVisible();
  await page.locator(".map-popup a").click();
  await expect(page).toHaveURL(/properties\/[a-z]/);
  ok("Property map marker opens its matching listing");
  await page.goto(base + "/properties?deal=rent");
  await page.locator(".card-title").first().click();
  await expect(page.locator(".calculator")).toHaveCount(0);
  await expect(page.locator(".detail-price")).toContainText("/ month");
  ok("Rental period is explicit and rental homes omit mortgage calculator");
  await page.goto(base + "/list-property");
  await page.getByRole("button", { name: "Start demo session" }).click();
  await page.getByRole("button", { name: "Continue as Demo User" }).click();
  await page.getByLabel("Property name").fill("Image limit test");
  await page.getByLabel("Price (USD)").fill("1");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Area (m²)").fill("100");
  await page.getByLabel("Bedrooms", { exact: true }).fill("0");
  await page.getByLabel("Bathrooms", { exact: true }).fill("1");
  await page
    .getByLabel("Description in English")
    .fill("This is an image validation test residence.");
  await page
    .getByLabel("Description in Russian")
    .fill("Тестовое описание для проверки загрузки фотографий.");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "too-large.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
    });
  await expect(page.getByRole("alert")).toContainText("5 MB");
  await page
    .locator("input[type=file]")
    .setInputFiles(
      Array.from({ length: 11 }, (_, i) => ({
        name: `test-${i}.png`,
        mimeType: "image/png",
        buffer: Buffer.alloc(10),
      })),
    );
  await expect(page.getByRole("alert")).toContainText("at most 10");
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "bad.webp",
      mimeType: "image/webp",
      buffer: Buffer.from("not-an-image"),
    });
  await expect(page.getByRole("alert")).toContainText("could not be opened");
  ok("Upload count, size and corrupt image validation work");
  page.on("dialog", (d) => d.accept());
  await page.goto(base);
  await page.getByRole("button", { name: "Preferences", exact: true }).click();
  await page.getByLabel("Reduce motion").check();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await page.keyboard.press("Escape");
  ok("User reduced-motion preference is applied");
  const video = await page.evaluate(async () => {
    const v = document.createElement("video");
    v.muted = true;
    v.src = "/media/globe-fallback.webm";
    document.body.append(v);
    await new Promise((res, rej) => {
      v.onloadeddata = res;
      v.onerror = () => rej(Error("video decode"));
      setTimeout(() => rej(Error("video timeout")), 5000);
    });
    await v.play();
    await new Promise((r) => setTimeout(r, 500));
    const result = {
      width: v.videoWidth,
      height: v.videoHeight,
      time: v.currentTime,
    };
    v.remove();
    return result;
  });
  if (video.width < 100 || video.time <= 0)
    throw Error("Invalid globe fallback");
  ok("Globe video fallback decodes and plays");
  await page.evaluate(() => {
    localStorage.setItem("nexora.settings.v1", "{broken");
    localStorage.setItem("nexora.favorites.v1", "42");
    localStorage.setItem("nexora.session.v1", "[1,2]");
  });
  await page.reload();
  await expect(page.locator("h1")).toBeVisible();
  await page.goto(base + "/account");
  await expect(
    page.getByRole("button", { name: "Start demo session" }),
  ).toBeVisible();
  ok("Malformed stored preferences, favourites and session recover safely");
  await context.close();
  const fallbackContext = await browser.newContext({
    viewport: { width: 1200, height: 900 },
    locale: "en-US",
  });
  await fallbackContext.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (
        type === "webgl" ||
        type === "webgl2" ||
        type === "experimental-webgl"
      )
        return null;
      return original.call(this, type, ...args);
    };
  });
  const fp = await fallbackContext.newPage();
  await fp.goto(base);
  await expect(fp.locator(".globe-video")).toBeVisible();
  await expect(fp.locator(".hero-city-controls button")).toHaveCount(6);
  ok("WebGL refusal uses fallback while city buttons stay available");
  await fallbackContext.close();
  const blocked = await browser.newContext({ locale: "en-US" });
  await blocked.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked");
      },
    });
    Object.defineProperty(window, "indexedDB", {
      get() {
        throw new Error("blocked");
      },
    });
  });
  const bp = await blocked.newPage();
  await bp.goto(base);
  await expect(bp.locator("h1")).toBeVisible();
  await expect(bp.locator(".storage-notice")).toBeVisible();
  ok("Unavailable browser storage does not crash the application");
  await blocked.close();
  await fs.writeFile("qa/edge-cases.json", JSON.stringify({ checks }, null, 2));
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
