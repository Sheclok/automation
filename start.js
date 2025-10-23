const puppeteer = require("puppeteer-core");

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

(async () => {
  console.log("=== [Automation Started] ===");

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: false,
    defaultViewport: null,
    ignoreDefaultArgs: ["--enable-automation"], // ❌ bỏ cờ automation
    args: [
      "--start-maximized",
      "--no-sandbox",
      "--disable-blink-features=AutomationControlled", // ❌ ẩn window.navigator.webdriver
      "--disable-gpu",
    ],
  });

  const page = await browser.newPage();

  // ⚙️ Loại bỏ thuộc tính 'webdriver' để tránh bị phát hiện
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });
  });

  // ⚙️ Xóa thông báo automation trên UI
  await page.evaluateOnNewDocument(() => {
    const newProto = navigator.__proto__;
    delete newProto.webdriver;
    navigator.__proto__ = newProto;
  });

  await page.goto("https://example.com");
  console.log("✅ Edge đã mở và không hiện dòng automation nữa");
})();
