// Biến lưu email dùng chung cho agent
exports.sharedEmail = null;
// agent.js
const path = require("path");

// === [Log file setup] ===
const logPath = process.env.AUTOMATION_LOG_PATH || path.join(__dirname, 'log.txt');
//const logPathMail = path.join(__dirname, 'mail.txt');

function safeLog(data) {
  try {
    fs.appendFileSync(logPath, `${new Date().toISOString()} - ${data}\n`);
  } catch (err) {
    console.error(`[ERROR] Cannot write log to ${logPath}:`, err);
  }
}
const fs = require("fs");
const axios = require("axios");
const screenshot = require("screenshot-desktop");
const { mouse, Button, Point, keyboard, Key } = require("@nut-tree-fork/nut-js");

//require('dotenv').config();

// ⚙️ Cấu hình Azure Vision
const AZURE_VISION_ENDPOINT = "https://nichehunterai.cognitiveservices.azure.com/vision/v3.2/read/analyze/";
const AZURE_KEY = "6Pcg0B7mMmHtzj5hjKzIA42Y7UFv9Y0uLK7Pmeeed2u5kl3BzcwQJQQJ99BGACYeBjFXJ3w3AAABACOGTD05";

safeLog("🤖 Automation Agent started...");

// ⚙️ Text cần click
let STEPS = [
  { id: 1, text: "Start Install", status: "New", wait: 5, maxRetryTime: 10 },
  { id: 2, text: "Launch Comet", status: "New", wait: 25, maxRetryTime: 100 },
  { id: 3, text: "Get started", status: "New", wait: 30, maxRetryTime: 100 },
  { id: 4, text: "Import", status: "New", wait: 5, maxRetryTime: 100 },
  { id: 5, text: "Proceed without cookies", status: "New", wait: 10, maxRetryTime: 10 },
  { id: 6, text: "Continue", status: "New", wait: 3, maxRetryTime: 10 },
  { id: 7, text: "Open Setting", status: "New", wait: 3, maxRetryTime: 10 },
  {
    id: 8,
    text: "Set default",
    status: "New",
    wait: 5,
    maxRetryTime: 3,
    postAction: async () => {
  safeLog("🪟 Đã mở form Setting Default — sẽ đóng lại...");
      await new Promise((r) => setTimeout(r, 4000)); // chờ form hiện rõ
      await keyboard.pressKey(Key.LeftAlt, Key.F4);
      await keyboard.releaseKey(Key.LeftAlt, Key.F4);
      await new Promise((r) => setTimeout(r, 1000));
  safeLog("✅ Form Setting Default đã đóng!");
    },
  },
  { id: 9, text: "Start Comet", status: "New", wait: 3, maxRetryTime: 100 },
  {
    id: 10,
    text: "Enter your email",
    status: "New",
    wait: 10,
    maxRetryTime: 100,
    postAction: async () => {
      const email = emailFromLog || "";
      if (!email) {
        safeLog("❌ Không tìm thấy email, dừng tại step 10!");
        throw new Error("Email không hợp lệ");
      }
      safeLog(`⌨️ Đang nhập email: ${email}`);
        await keyboard.type(email);
        await keyboard.pressKey(Key.Enter);
        await keyboard.releaseKey(Key.Enter);
      await new Promise((r) => setTimeout(r, 1000));
      safeLog("✅ Đã nhập email!");
    },
  },
  {
    id: 11,
    text: "Enter Code",
    status: "New",
    wait: 10,
    maxRetryTime: 100,
    postAction: async () => {
      const code = await getCodeByEmail(emailFromLog || "");
      safeLog(`⌨️ Đang nhập code: ${code}`);
      await keyboard.type(code);
      await new Promise((r) => setTimeout(r, 1000));
      safeLog("✅ Đã nhập code!");
    },
  },
  {
    id: 12,
    text: "Ask anything",
    status: "New",
    wait: 2,
    maxRetryTime: 10,    
  },
];

// Lấy email từ log
function getLastEmailFromLog(logPathMail, retryCount = 3, retryDelay = 2000) {
    for (let i = 0; i < retryCount; i++) {
      if (fs.existsSync(logPathMail)) {
        let email = fs.readFileSync(logPathMail, 'utf-8').trim();
        if (email) return email;
      }
      if (i < retryCount - 1) {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, retryDelay); // Sleep sync
      }
    }
    return null;
}

const logPathMail = 'C:\\automation\\mail.txt';
const emailFromLog = exports.sharedEmail || getLastEmailFromLog(logPathMail);

async function getCodeByEmail(email) {
  const fetchFn = (typeof fetch !== 'undefined' ? fetch : (await import('node-fetch')).default);
  const codeApiUrl = `https://api.vn60s.com/api/customers/code?email=${encodeURIComponent(email)}`;
  let codeInfo = null;
  while (true) {
    try {
      const codeRes = await fetchFn(codeApiUrl);
      if (!codeRes.ok) throw new Error('API request failed: ' + codeRes.status);
      codeInfo = await codeRes.json();
      if (codeInfo && codeInfo.code) return codeInfo.code;
    } catch (e) {
      // chỉ log nếu cần
    }
    await new Promise(res => setTimeout(res, 10000)); // đợi 10s rồi thử lại
  }
}

// 🧠 OCR + Click
async function findAndClickText(targetText, maxRetryTime = 10, stepId = 0) {
  const retryInterval = 2000; // 2 giây/lần thử
  const maxTries = Math.ceil((maxRetryTime * 1000) / retryInterval);
  const safeText = targetText.replace(/[^a-zA-Z0-9_-]/g, "_");

  // 📁 Tạo thư mục lưu ảnh
  const folder = path.join(__dirname, "screens");
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

  for (let attempt = 1; attempt <= maxTries; attempt++) {
  safeLog(`🔍 (${attempt}/${maxTries}) Tìm "${targetText}"...`);

    // 📸 Lưu hình theo step và thứ tự thử
    const imgPath = path.join(folder, `step${stepId}_${safeText}_try${attempt}.jpg`);
    await screenshot({ filename: imgPath });

    const imageBuffer = fs.readFileSync(imgPath);

    try {
      const postRes = await axios.post(AZURE_VISION_ENDPOINT, imageBuffer, {
        headers: {
          "Ocp-Apim-Subscription-Key": AZURE_KEY,
          "Content-Type": "application/octet-stream",
        },
      });

      const operationUrl = postRes.headers["operation-location"];
      await new Promise((r) => setTimeout(r, 3000)); // chờ OCR xử lý

      const getRes = await axios.get(operationUrl, {
        headers: { "Ocp-Apim-Subscription-Key": AZURE_KEY },
      });

      const results = getRes.data.analyzeResult?.readResults || [];
      let found = null;
      for (const page of results) {
        for (const line of page.lines || []) {
          if (line.text.toLowerCase().includes(targetText.toLowerCase())) {
            found = line;
            break;
          }
        }
        if (found) break;
      }

      if (found) {
        const box = found.boundingBox;
        const clickX = (box[0] + box[2]) / 2;
        const clickY = (box[1] + box[5]) / 2;
        safeLog(`✅ Tìm thấy "${found.text}" tại (${clickX}, ${clickY})`);

        await mouse.setPosition(new Point(clickX, clickY));
        await mouse.click(Button.LEFT);
        safeLog(`🖱️ Đã click "${found.text}"!`);
        return true;
      }
    } catch (err) {
        safeLog(`⚠️ OCR lỗi (${attempt}): ${err.message}`);
    }

    if (attempt < maxTries) {
      safeLog(`⏳ Chờ ${retryInterval / 1000}s rồi thử lại...`);
      await new Promise((r) => setTimeout(r, retryInterval));
    }
  }

    safeLog(`❌ Không tìm thấy "${targetText}" sau ${maxRetryTime}s.`);
  return false;
}

// 🚀 Main runner
async function main() {
  try {
    for (const step of STEPS) {
  safeLog(`\n=== 🧩 Step ${step.id}: "${step.text}" | Status: ${step.status} ===`);

      if (step.status !== "New") {
  safeLog("⏭️ Bỏ qua (đã xử lý trước đó).");
        continue;
      }

      if (step.wait > 0) {
  safeLog(`⏳ Đợi ${step.wait}s để màn hình ổn định trước khi tìm "${step.text}"...`);
        await new Promise((r) => setTimeout(r, step.wait * 1000));
      }

      const success = await findAndClickText(step.text, step.maxRetryTime, step.id);

      if (success) {
        step.status = "Done";
  safeLog(`✅ Hoàn tất Step ${step.id}: "${step.text}"`);

         // 🔧 Nếu có hành động sau khi click, chạy nó
        if (typeof step.postAction === "function") {
          try {
            await step.postAction();
          } catch (e) {
            safeLog(`⚠️ Lỗi khi chạy postAction Step ${step.id}: ${e.message}`);
          }
        }

        if (step.wait > 0) {
          safeLog(`⏳ Đợi ${step.wait}s trước bước tiếp theo...`);
          await new Promise((r) => setTimeout(r, step.wait * 1000));
        }
      } else {
        step.status = "Failed";
  safeLog(`❌ Step ${step.id} thất bại, dừng pipeline.`);
        break;
      }
    }

  safeLog("\n📋 Tóm tắt trạng thái:");
  STEPS.forEach((s) => safeLog(`- Step ${s.id}: ${s.text} => ${s.status}`));
  } catch (err) {
  safeLog(`❌ Lỗi: ${err.message}`);
  }
}

// ⚡ Export để file khác gọi
module.exports = { main };

// Tuỳ chọn: chạy trực tiếp file này
if (require.main === module) {
  main();
}
