const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const fs = require('fs');

puppeteer.use(StealthPlugin());

// === [Log file setup] ===

// environment variable để override log & browser, fallback
const logPath = process.env.AUTOMATION_LOG_PATH || path.join(__dirname, 'puppeteer_log.txt');
const edgePath = process.env.EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

function safeLog(data) {
  try {
    fs.appendFileSync(logPath, `${new Date().toISOString()} - ${data}\n`);
  } catch (err) {
    console.error(`[ERROR] Cannot write log to ${logPath}:`, err);
  }
}

safeLog("[START] Launching Edge...");

(async () => {
  try {
    console.log("=== [Automation Started with Stealth Mode] ===");

    const browser = await puppeteer.launch({
      executablePath: edgePath,
      headless: false, // Azure VM headless
      defaultViewport: null,
      ignoreDefaultArgs: ["--enable-automation"],
      args: [
        "--no-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--window-size=1280,800" // mặc định VM nên set window size
      ],
    });

    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    await page.goto("https://pplx.ai/brittneysa68862", { waitUntil: "domcontentloaded" });
    console.log("Edge opened successfully!");
    safeLog("[SUCCESS] Edge launched and page opened.");

    //await browser.close();
    safeLog("[END] Browser closed.");
  } catch (err) {
    console.error("[ERROR] Automation failed:", err);
    safeLog(`[ERROR] ${err.message}`);
  }
})();
