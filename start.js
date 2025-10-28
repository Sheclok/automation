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

    safeLog("=== [Automation Started with Stealth Mode] ===");

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

    // Chờ trình duyệt chạy ổn định
    await new Promise(res => setTimeout(res, 3000)); // chờ 3 giây

    safeLog("[SUCCESS] Edge launched.");

    const page = await browser.newPage();

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    await page.goto("https://pplx.ai/brittneysa68862", { waitUntil: "domcontentloaded" });

    // Claim invitation
    // Lặp kiểm tra nút Claim invitation xuất hiện và chỉ click khi có
    try {
      let maxRetry = 30; // tử 3-4s cho mỗi lần thử, tổng tối đa ~60-120s (tuỳ chỉnh)
      let found = false, clicked = false;
      for (let i = 0; i < maxRetry; i++) {
        try {

          safeLog(`[DEBUG] page object (${i}): ${JSON.stringify(Object.keys(page))}`);

          const buttons = await page.$$('button');
          for (const btn of buttons) {
            const text = await btn.evaluate(el => el.innerText.trim());
            if (text.includes('Claim invitation')) {
              found = true;
              await btn.click();
              safeLog('[SUCCESS] Claim invitation button clicked.');
              console.log('Claim invitation button clicked!');
              clicked = true;
              break;
            }
          }
          if (clicked) break;
        } catch (btnErr) {
          // không log lỗi nhỏ từng lần thử
        }
        if (!found) {
          if (i === 0) safeLog('[INFO] Waiting for Claim invitation...');
          await new Promise(res => setTimeout(res, 3000)); // chờ 3 giây mỗi lần thử
        }
      }
      if (!clicked) {
        safeLog('[WARNING] Timeout: Claim invitation button not found or not clickable.');
        console.warn('Timeout: Claim invitation button not found or not clickable.');
      }
    } catch (e) {
      safeLog('[ERROR] Error loop finding/clicking Claim invitation: ' + e.message);
      console.error('Error loop finding/clicking Claim invitation:', e);
    }

    console.log("Edge opened successfully!");

    // Call API
    let info = {};
    try {
        let fetchFn = global.fetch;
        if (!fetchFn) {
          fetchFn = (await import('node-fetch')).default;
        }
        const apiRes = await fetchFn('https://api.vn60s.com/api/customers/first');
        if (!apiRes.ok) throw new Error('API request failed: ' + apiRes.status);
        info = await apiRes.json();
        const outMsg = `[API] Id: ${info.id || ''} | Email: ${info.email || ''} | Status: ${info.status || ''} | Code: ${info.code || ''}`;
        safeLog(outMsg);
        console.log(outMsg);
      } catch (e) {
        safeLog('[ERROR] API call failed: ' + e.message);
        console.error('API call error:', e);
      }
      console.log("API called successfully!");

      if (!info || !info.email) {
        safeLog('[WARNING] No valid info or Email from API.');
        console.warn('No valid info or Email from API.');
        return;
      }

    // Fill email
    try {
      if (info.email) {
        await page.waitForSelector('input[placeholder="Enter your email"]', { visible: true, timeout: 5000 });
        await page.type('input[placeholder="Enter your email"]', info.email, { delay: 50 });
        safeLog(`[SUCCESS] Filled email (${info.email}) into input box.`);
        console.log(`Filled email (${info.email}) into input box.`);
      } else {
        safeLog('[WARNING] Không có Email từ API để điền vào input.');
        console.warn('No Email from API to fill input.');
      }
    } catch (e) {
      safeLog('[ERROR] Fill email failed: ' + e.message);
      console.error('Error filling email:', e);
    }

    // Button accept invitation
    try {
      await page.waitForSelector('button', { visible: true, timeout: 6000 });
      const buttons = await page.$$('button');
      let clicked = false;
      for (const btn of buttons) {
        const text = await btn.evaluate(el => el.innerText.trim());
        if (text.includes('Continue with email')) {
          // kiểm tra trạng thái disabled
          const isDisabled = await btn.evaluate(el => el.disabled);
          if (!isDisabled) {
            await btn.click();
            safeLog('[SUCCESS] Continue with email button clicked.');
            console.log('Continue with email button clicked!');
            clicked = true;
          } else {
            safeLog('[WARNING] Continue with email button is disabled.');
            console.warn('Continue with email button is disabled.');
          }
          break;
        }
      }
      if (!clicked) {
        safeLog('[WARNING] Continue with email button not found or not clickable.');
        console.warn('Continue with email button not found or not clickable.');
      }
    } catch (e) {
      safeLog('[ERROR] Error finding/clicking Continue with email button: ' + e.message);
      console.error('Error finding/clicking Continue with email button:', e);
    }

    //await browser.close();
  } catch (err) {
    console.error("[ERROR] Automation failed:", err);
    safeLog(`[ERROR] ${err.message}`);
  }
})();
