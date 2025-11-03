// agent.js
const fs = require("fs");
const axios = require("axios");
const screenshot = require("screenshot-desktop");
const { mouse, Button, Point } = require("@nut-tree-fork/nut-js");

// ⚙️ Cấu hình Azure Vision
const AZURE_VISION_ENDPOINT = "https://nichehunterai.cognitiveservices.azure.com/vision/v3.2/read/analyze/";
const AZURE_KEY = "";

// ⚙️ Text cần click
const TARGET_TEXT = "Start Install"; // bạn có thể đổi "OK", "Submit", "Start", ...

async function main() {
  try {
    console.log("📸 Chụp màn hình...");
    const imgPath = "screen.jpg";
    await screenshot({ filename: imgPath });
    const imageBuffer = fs.readFileSync(imgPath);

    console.log("📤 Gửi ảnh lên Azure Vision OCR...");
    const postRes = await axios.post(AZURE_VISION_ENDPOINT, imageBuffer, {
      headers: {
        "Ocp-Apim-Subscription-Key": AZURE_KEY,
        "Content-Type": "application/octet-stream",
      },
    });

    const operationUrl = postRes.headers["operation-location"];
    console.log("🔗 Operation URL:", operationUrl);

    console.log("⏳ Đang chờ kết quả OCR...");
    await new Promise(r => setTimeout(r, 2000));

    const getRes = await axios.get(operationUrl, {
      headers: { "Ocp-Apim-Subscription-Key": AZURE_KEY },
    });

    const results = getRes.data.analyzeResult?.readResults || [];
    if (!results.length) {
      console.log("⚠️ Không có kết quả OCR!");
      return;
    }

    // 🧠 Tìm text mục tiêu
    let found = null;
    for (const page of results) {
      for (const line of page.lines || []) {
        if (line.text.toLowerCase().includes(TARGET_TEXT.toLowerCase())) {
          found = line;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      console.log(`❌ Không tìm thấy text "${TARGET_TEXT}" trên màn hình.`);
      return;
    }

    // 📍 Lấy toạ độ trung tâm của text
    const box = found.boundingBox;
    const clickX = (box[0] + box[2]) / 2;
    const clickY = (box[1] + box[5]) / 2;
    console.log(`✅ Tìm thấy "${found.text}" tại (${clickX}, ${clickY})`);

    // 🖱️ Click vào toạ độ
    await mouse.setPosition(new Point(clickX, clickY));
    await mouse.click(Button.LEFT);
    console.log("🖱️ Đã click!");

    // (Tuỳ chọn) Gửi log hoặc ảnh
    // await axios.post("https://your-server/log", { text: found.text, x: clickX, y: clickY });

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
