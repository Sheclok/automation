// agent.js
const fs = require("fs");
const axios = require("axios");
const screenshot = require("screenshot-desktop");
const { mouse, Button, Point, keyboard, Key } = require("@nut-tree-fork/nut-js");
const path = require("path");


// ⚙️ Cấu hình Azure Vision
const AZURE_VISION_ENDPOINT = "https://nichehunterai.cognitiveservices.azure.com/vision/v3.2/read/analyze/";
const AZURE_KEY = "";

// ⚙️ Text cần click
let STEPS = [
  { id: 1, text: "Start Install", status: "New", wait: 5, maxRetryTime: 5 },
  { id: 2, text: "Launch Comet", status: "New", wait: 25, maxRetryTime: 5 },
  { id: 3, text: "Get started", status: "New", wait: 30, maxRetryTime: 5 },
  { id: 4, text: "Import", status: "New", wait: 5, maxRetryTime: 3 },
  { id: 5, text: "Continue", status: "New", wait: 3, maxRetryTime: 3 },
  { id: 6, text: "Start Comet", status: "New", wait: 3, maxRetryTime: 3 },
  {
    id: 7,
    text: "Set default",
    status: "New",
    wait: 5,
    maxRetryTime: 3,
    postAction: async () => {
      console.log("🪟 Đã mở form Setting Default — sẽ đóng lại...");
      await new Promise((r) => setTimeout(r, 4000)); // chờ form hiện rõ
      await keyboard.type(Key.Escape); // hoặc Alt+F4 tùy trường hợp
      await new Promise((r) => setTimeout(r, 1000));
      console.log("✅ Form Setting Default đã đóng!");
    },
  },
];

// 🧠 OCR + Click
async function findAndClickText(targetText, maxRetryTime = 10, stepId = 0) {
  const retryInterval = 2000; // 2 giây/lần thử
  const maxTries = Math.ceil((maxRetryTime * 1000) / retryInterval);
  const safeText = targetText.replace(/[^a-zA-Z0-9_-]/g, "_");

  // 📁 Tạo thư mục lưu ảnh
  const folder = path.join(__dirname, "screens");
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

  for (let attempt = 1; attempt <= maxTries; attempt++) {
    console.log(`🔍 (${attempt}/${maxTries}) Tìm "${targetText}"...`);

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
        console.log(`✅ Tìm thấy "${found.text}" tại (${clickX}, ${clickY})`);

        await mouse.setPosition(new Point(clickX, clickY));
        await mouse.click(Button.LEFT);
        console.log(`🖱️ Đã click "${found.text}"!`);
        return true;
      }
    } catch (err) {
      console.log(`⚠️ OCR lỗi (${attempt}):`, err.message);
    }

    if (attempt < maxTries) {
      console.log(`⏳ Chờ ${retryInterval / 1000}s rồi thử lại...`);
      await new Promise((r) => setTimeout(r, retryInterval));
    }
  }

  console.log(`❌ Không tìm thấy "${targetText}" sau ${maxRetryTime}s.`);
  return false;
}

// 🚀 Main runner
async function main() {
  try {
    for (const step of STEPS) {
      console.log(`\n=== 🧩 Step ${step.id}: "${step.text}" | Status: ${step.status} ===`);

      if (step.status !== "New") {
        console.log("⏭️ Bỏ qua (đã xử lý trước đó).");
        continue;
      }

      if (step.wait > 0) {
        console.log(`⏳ Đợi ${step.wait}s để màn hình ổn định trước khi tìm "${step.text}"...`);
        await new Promise((r) => setTimeout(r, step.wait * 1000));
      }

      const success = await findAndClickText(step.text, step.maxRetryTime, step.id);

      if (success) {
        step.status = "Done";
        console.log(`✅ Hoàn tất Step ${step.id}: "${step.text}"`);

         // 🔧 Nếu có hành động sau khi click, chạy nó
        if (typeof step.postAction === "function") {
          try {
            await step.postAction();
          } catch (e) {
            console.log(`⚠️ Lỗi khi chạy postAction Step ${step.id}:`, e.message);
          }
        }

        if (step.wait > 0) {
          console.log(`⏳ Đợi ${step.wait}s trước bước tiếp theo...`);
          await new Promise((r) => setTimeout(r, step.wait * 1000));
        }
      } else {
        step.status = "Failed";
        console.log(`❌ Step ${step.id} thất bại, dừng pipeline.`);
        break;
      }
    }

    console.log("\n📋 Tóm tắt trạng thái:");
    STEPS.forEach((s) => console.log(`- Step ${s.id}: ${s.text} => ${s.status}`));
  } catch (err) {
    console.error("❌ Lỗi:", err.message);
  }
}

// ⚡ Export để file khác gọi
module.exports = { main };

// Tuỳ chọn: chạy trực tiếp file này
if (require.main === module) {
  main();
}
