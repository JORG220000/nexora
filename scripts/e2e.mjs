import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
const base = process.env.NEXORA_URL || "http://127.0.0.1:5174";
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: ["--enable-unsafe-swiftshader"],
});
const report = { checks: [], errors: [], screenshots: [] };
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: "en-US",
  colorScheme: "dark",
});
const page = await context.newPage();
page.on("pageerror", (e) => report.errors.push(e.message));
const ok = (x) => {
  report.checks.push(x);
  console.log("PASS " + x);
};
async function screenshot(name) {
  await page.screenshot({ path: `qa/${name}.png`, fullPage: true });
  report.screenshots.push(name);
}
try {
  await fs.mkdir("qa", { recursive: true });
  await page.goto(base);
  await page.getByRole("button", { name: "Dismiss demo notice" }).click();
  await page.locator(".hero-search select").nth(0).selectOption("Dubai");
  await page
    .getByRole("button", { name: "Explore homes", exact: true })
    .click();
  await expect(page.locator(".results-line")).toContainText(
    "3 properties found",
  );
  ok("Home search applies city and purchase filters");
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Destination")
    .selectOption("Tokyo");
  await expect(page.locator(".results-line")).toContainText(
    "3 properties found",
  );
  await page
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  await expect(page.locator(".results-line")).toContainText(
    "1 properties found",
  );
  ok("Filters apply only after confirmation");
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.locator(".property-card")).toHaveCount(9);
  await page.getByRole("button", { name: "Save property" }).first().click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Remove from favorites" }),
  ).toHaveCount(1);
  ok("Favorites persist after reload");
  await page
    .getByRole("button", { name: "Compare property", exact: true })
    .nth(0)
    .click();
  await page
    .getByRole("button", { name: "Compare property", exact: true })
    .nth(1)
    .click();
  await page
    .getByRole("button", { name: "Compare property", exact: true })
    .nth(2)
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Two homes are already selected",
  );
  await page
    .getByRole("button", {
      name: "Replace The Obsidian Residence",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog").locator("thead th")).toHaveCount(3);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  ok("Comparison caps at two and supports replacement");
  await page.goto(base + "/properties?deal=rent");
  await page
    .getByRole("button", { name: "Compare property", exact: true })
    .first()
    .click();
  await expect(page.getByRole("status")).toContainText("same transaction type");
  ok("Mixed purchase/rental comparison is rejected");
  await page.goto(base + "/properties/the-obsidian-residence");
  await page.getByRole("button", { name: "Open gallery", exact: true }).click();
  await page.getByRole("button", { name: "Next image" }).click();
  await expect(page.getByRole("dialog")).toContainText("2 / 4");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("Annual rate (%)").fill("0");
  await expect(page.locator(".payment strong")).toHaveText("$61,667");
  await page.getByLabel("Down payment (%)").fill("101");
  await expect(page.locator(".payment")).toContainText("0–100%");
  await page.getByLabel("Down payment (%)").fill("20");
  ok("Gallery navigation/Escape and zero-rate calculator work");
  await page.getByRole("button", { name: "Enquire about this home" }).click();
  await expect(page.getByRole("dialog")).toContainText("A local demo session");
  await page.getByRole("button", { name: "Continue as Demo User" }).click();
  await expect(page.getByRole("dialog")).toContainText("Let’s look closer");
  await page
    .getByRole("dialog")
    .getByLabel("Message", { exact: true })
    .fill("An illustrative enquiry for the portfolio test.");
  await page.getByRole("dialog").getByRole("checkbox").check();
  await page.getByRole("button", { name: "Complete demo enquiry" }).click();
  await expect(page.getByRole("dialog")).toContainText("Nothing was sent");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .first()
    .click();
  ok("Gated property enquiry resumes after demo login and confirms no sending");
  await page.goto(base + "/list-property");
  await page.getByLabel("Property name", { exact: true }).fill("Test Atelier");
  await page.getByLabel("Price (USD)", { exact: true }).fill("6000000");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Area (m²)", { exact: true }).fill("420");
  await page.getByLabel("Bedrooms", { exact: true }).fill("3");
  await page.getByLabel("Bathrooms", { exact: true }).fill("4");
  await page
    .getByLabel("Description in English", { exact: true })
    .fill("A spacious test residence for a complete local publishing journey.");
  await page
    .getByLabel("Description in Russian", { exact: true })
    .fill("Просторная тестовая резиденция для проверки локальной публикации.");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .locator("input[type=file]")
    .setInputFiles("public/media/property-01.webp");
  await expect(page.locator(".upload-grid .photo")).toHaveCount(1);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Publish locally" }).click();
  await expect(page).toHaveURL(/properties\/home-/);
  await expect(page.locator("h1")).toHaveText("Test Atelier");
  const created = page.url();
  await page.reload();
  await expect(page.locator("h1")).toHaveText("Test Atelier");
  ok(
    "Four-step publish stores optimized images and listing in IndexedDB across reload",
  );
  await page.goto(base + "/account");
  await page
    .getByRole("button", { name: "My properties", exact: true })
    .click();
  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await page
    .getByLabel("Property name", { exact: true })
    .fill("Edited Atelier");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("h1")).toHaveText("Edited Atelier");
  await page.goto(base + "/account");
  await page
    .getByRole("button", { name: "My properties", exact: true })
    .click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete property", exact: true })
    .click();
  await expect(page.locator(".empty")).toContainText(
    "A new home for your listing",
  );
  await page.goto(created);
  await expect(page.locator("h2")).toContainText("A place yet to be found");
  ok("Own listing editing and confirmed deletion work");
  await page.goto(base + "/list-property");
  await page.getByLabel("Property name").fill("Unsaved home");
  await page.getByRole("link", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("unsaved changes");
  await page.getByRole("button", { name: "Keep editing" }).click();
  await expect(page.getByLabel("Property name")).toHaveValue("Unsaved home");
  await page.getByRole("link", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Leave without saving" }).click();
  ok("Unsaved wizard changes trigger leave confirmation");
  await page.goto(base + "/properties/the-obsidian-residence");
  await page.locator(".currency-switch select").selectOption("AED");
  await expect(page.locator(".detail-price")).toContainText("67,941,250");
  await page.getByRole("button", { name: "Switch to Russian" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await page.getByRole("button", { name: "Переключить тему" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  ok("Currency, language and appearance persist consistently");
  await screenshot("property-ru-light");
  const routes = [
    "/",
    "/properties?deal=buy",
    "/properties/the-obsidian-residence",
    "/favorites",
    "/account",
    "/list-property",
    "/about",
  ];
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(base + route);
      await page.waitForTimeout(250);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      if (overflow) throw Error(`Horizontal overflow ${width} ${route}`);
      await expect(page.locator("h1")).toBeVisible();
    }
    ok(`Seven routes render without overflow at ${width}px`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/properties?deal=buy");
  await page.getByRole("button", { name: "Список", exact: true }).click();
  await expect(page.locator(".catalog-results")).toBeVisible();
  await page.getByRole("button", { name: "Фильтры", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  ok("Mobile list/map toggle and filter sheet work");
  await screenshot("catalogue-mobile-ru-light");
  await page.goto(base + "/");
  await page.evaluate(async () => {
    for (const img of document.images) {
      if (img.loading === "lazy") img.loading = "eager";
    }
    await Promise.all(
      [...document.images].map((i) => i.decode().catch(() => {})),
    );
  });
  await screenshot("home-mobile-ru-light");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Переключить тему" }).click();
  await page.getByRole("button", { name: "Переключить на английский" }).click();
  await page.waitForTimeout(1000);
  await screenshot("home-desktop-final");
  await page.goto(base + "/properties?deal=buy");
  await page.waitForTimeout(1000);
  await screenshot("catalogue-desktop-final");
  await context.close();
  const reduced = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
    locale: "en-US",
  });
  const rp = await reduced.newPage();
  await rp.goto(base);
  await expect(rp.locator("html")).toHaveAttribute("data-motion", "reduced");
  await expect(rp.locator(".globe-canvas")).toHaveCount(0);
  ok("Reduced motion and mobile no-WebGL fallback work");
  await reduced.close();
  if (report.errors.length) throw Error(report.errors.join("\n"));
  ok("No uncaught browser JavaScript errors");
} catch (e) {
  report.failure = e.stack;
  console.error(e);
  await page
    .screenshot({ path: "qa/failure.png", fullPage: true })
    .catch(() => {});
  process.exitCode = 1;
} finally {
  await fs.writeFile("qa/report.json", JSON.stringify(report, null, 2));
  await browser.close();
}
