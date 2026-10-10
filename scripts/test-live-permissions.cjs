const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const key = "AIzaSyBIejOcangE6DzqzW0xrwHDFSMHwAboCt4";
const identity = "https://identitytoolkit.googleapis.com/v1/accounts:";
const password = randomUUID() + "-A9!";
const email = "qa-" + randomUUID() + "@example.invalid";
(async () => {
  let account;
  let browser;
  try {
    let r = await fetch(identity + "signUp?key=" + key, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    account = await r.json();
    assert(r.ok, "Temporary customer account creation");
    browser = await chromium.launch({
      headless: true,
      args: ["--disable-quic"],
      ...(process.env.CHROME_PATH
        ? { executablePath: process.env.CHROME_PATH }
        : {}),
    });
    const page = await browser.newPage();
    page.setDefaultTimeout(60000);
    await page.goto("https://the-shivara-group-86c9c.web.app/admin", {
      waitUntil: "domcontentloaded",
    });
    await page.locator("#admin-email").fill(email);
    await page.locator("#admin-passcode").fill(password);
    await page.locator("#login-form").evaluate((f) => f.requestSubmit());
    await page
      .locator("#login-error")
      .getByText("This account does not have administrator access.", {
        exact: true,
      })
      .waitFor();
    assert.equal(
      await page.locator("#admin-screen").getAttribute("class"),
      null,
    );
    const denied = await page.evaluate(async () => {
      const { db } = await import("/src/firebase.js");
      const { setDoc, doc, getDocFromServer } = await import(
        "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js"
      );
      const results = [];
      for (const name of ["products", "customers"]) {
        try {
          if (name === "products")
            await setDoc(doc(db, name, "qa-permission-denied-probe"), {
              title: "Must never be created",
            });
          else
            await getDocFromServer(doc(db, name, "qa-permission-denied-probe"));
          results.push(false);
        } catch (e) {
          results.push(e.code === "permission-denied");
        }
      }
      return results;
    });
    assert.deepEqual(denied, [true, true]);
    console.log(
      "PASS: signed-in customer cannot unlock admin, mutate products or read private customers",
    );
    const out = path.resolve(
      process.env.QA_ARTIFACT_DIR || "artifacts/full-audit/permissions",
    );
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(
      path.join(out, "result.json"),
      JSON.stringify(
        {
          nonAdminLoginBlocked: true,
          nonAdminProductWriteDenied: true,
          privateCustomersReadDenied: true,
        },
        null,
        2,
      ),
    );
  } finally {
    if (account?.idToken) {
      const r = await fetch(identity + "delete?key=" + key, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: account.idToken }),
      });
      assert(r.ok, "Temporary authentication account cleanup");
      console.log("PASS: temporary authentication account deleted");
    }
    await browser?.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
