import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: ["--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    colorScheme: "dark",
    locale: "en-US",
  });
  await page.goto("http://127.0.0.1:5174/");
  await page.waitForTimeout(3000);
  const canvas = page.locator(".globe-canvas canvas");
  const still = await canvas.evaluate((c) => {
    const scaled = document.createElement("canvas");
    scaled.width = 1200;
    scaled.height = Math.round((c.height / c.width) * 1200);
    scaled.getContext("2d").drawImage(c, 0, 0, scaled.width, scaled.height);
    return scaled.toDataURL("image/webp", 0.9);
  });
  await fs.writeFile(
    new URL("../public/media/globe-fallback.webp", import.meta.url),
    Buffer.from(still.split(",")[1], "base64"),
  );
  const video = await canvas.evaluate(async (c) => {
    const copy = document.createElement("canvas");
    copy.width = 960;
    copy.height = Math.round((c.height / c.width) * 960);
    document.body.appendChild(copy);
    copy.style.cssText = "position:fixed;inset:0;z-index:99999";
    const ctx = copy.getContext("2d");
    ctx.drawImage(c, 0, 0, copy.width, copy.height);
    const stream = copy.captureStream(20),
      track = stream.getVideoTracks()[0],
      rec = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8",
        videoBitsPerSecond: 1100000,
      }),
      chunks = [];
    const timer = setInterval(() => {
      ctx.drawImage(c, 0, 0, copy.width, copy.height);
      track.requestFrame();
    }, 50);
    return await new Promise((resolve) => {
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = async () => {
        clearInterval(timer);
        const reader = new FileReader();
        reader.onload = () => {
          stream.getTracks().forEach((t) => t.stop());
          resolve(reader.result);
        };
        reader.readAsDataURL(new Blob(chunks, { type: "video/webm" }));
      };
      rec.start();
      setTimeout(() => {
        rec.requestData();
        rec.stop();
      }, 5000);
    });
  });
  await fs.writeFile(
    new URL("../public/media/globe-fallback.webm", import.meta.url),
    Buffer.from(video.split(",")[1], "base64"),
  );
  console.log("Saved local globe image and video fallbacks.");
} finally {
  await browser.close();
}
