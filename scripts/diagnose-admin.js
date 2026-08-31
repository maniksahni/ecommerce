import { chromium } from "playwright";
import http from "http";
import fs from "fs";
import path from "path";

const root = process.cwd();

// Simple static server for dist
const server = http.createServer((req, res) => {
  let reqPath = req.url.split("?")[0];
  if (reqPath === "/" || reqPath === "") reqPath = "/index.html";
  if (reqPath === "/admin" || reqPath === "/admin/") reqPath = "/admin/index.html";
  
  let filePath = path.join(root, "dist", reqPath);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(root, reqPath);
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const contentType = ext === ".html" ? "text/html" :
                        ext === ".js" ? "application/javascript" :
                        ext === ".css" ? "text/css" :
                        ext === ".json" ? "application/json" : "text/plain";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(fs.readFileSync(filePath));
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(4123, async () => {
  console.log("Server listening on port 4123");
  const browser = await chromium.launch({ headless: true });
  
  try {
    const page = await browser.newPage();
    const consoleLogs = [];
    const pageErrors = [];

    page.on("console", msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
    page.on("pageerror", err => pageErrors.push(err.stack || err.message));

    console.log("--- Testing http://localhost:4123/admin ---");
    await page.goto("http://localhost:4123/admin", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    console.log("Console logs on load:", consoleLogs);
    console.log("Page errors on load:", pageErrors);

    // Try logging in with master passcode
    const passInput = await page.$("#admin-passcode");
    console.log("Password input found?", Boolean(passInput));
    if (passInput) {
      await page.fill("#admin-passcode", "Shivara@2026");
      await page.click("#login-btn");
      await page.waitForTimeout(1500);

      const isScreenActive = await page.evaluate(() => {
        const adminScreen = document.querySelector("#admin-screen");
        const loginScreen = document.querySelector("#login-screen");
        return {
          adminClass: adminScreen?.className,
          adminDisplay: window.getComputedStyle(adminScreen).display,
          loginDisplay: window.getComputedStyle(loginScreen).display
        };
      });
      console.log("After login screen status:", isScreenActive);
      console.log("Console logs after login:", consoleLogs);
      console.log("Page errors after login:", pageErrors);
    }
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
    server.close();
  }
});
