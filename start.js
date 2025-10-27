const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const fs = require('fs');

puppeteer.use(StealthPlugin());

// === [Log file setup] ===
const logPath = "C:\\automation\\puppeteer_log.txt";
fs.appendFileSync(logPath, `${new Date().toISOString()} - [START] Launching Edge...\n`);

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

(async () => {
  console.log("=== [Automation Started with Stealth Mode] ===");

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: false,
    defaultViewport: null,
    ignoreDefaultArgs: ["--enable-automation"],
    args: [
      "--start-maximized",
      "--no-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-gpu",
      "--disable-dev-shm-usage"
    ],
  });

  const page = await browser.newPage();

  // Hide "webdriver" flag manually (extra layer)
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  await page.goto("https://pplx.ai/brittneysa68862", { waitUntil: "domcontentloaded" });
  console.log("Edge opened successfully!");

  fs.appendFileSync(logPath, `${new Date().toISOString()} - [SUCCESS] Edge launched and page opened.\n`);
})();
