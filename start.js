import puppeteer from "puppeteer-core";
import fetch from "node-fetch";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

(async () => {
  console.log("=== [Automation Started] ===");

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"],
  });

  const page = await browser.newPage();
  await page.goto("https://example.com/login");

  // Nhập email
  await page.type("#email", "your_email@example.com");
  await page.click("#next");

  console.log("Đang chờ mã xác minh...");

  // Gọi API lấy mã code
//   const res = await fetch("https://your-function-url/api/getcode");
//   const { code } = await res.json();

//   await page.type("#code", code);
//   await page.click("#submit");

//   console.log("Đăng nhập thành công!");

  // Tùy chọn: click cài đặt phần mềm, hoặc thao tác GUI khác
  await page.waitForTimeout(3000);
//   await page.goto("https://example.com/install");
//   await page.click("#install");

  console.log("=== [Automation Completed] ===");
//   await browser.close();
})();
