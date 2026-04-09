import { chromium } from "@playwright/test";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const result: any = {
    loginPage: {},
    urlTests: []
  };

  try {
    // 1. Explore login page
    console.log("Loading login page...");
    await page.goto("https://demoqa.com/login", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const loginText = await page.evaluate(() => document.body.innerText);
    result.loginPage = {
      url: page.url(),
      title: await page.title(),
      hasUserInput: loginText.includes("UserName"),
      hasPasswordInput: loginText.includes("Password"),
      hasNewUserLink: loginText.includes("New User"),
      text: loginText
    };

    // 2. Test URLs
    console.log("Testing URLs...");
    const urls = ["/forgot", "/forgot-password", "/reset-password", "/password-reset", "/register"];
    
    for (const path of urls) {
      const fullUrl = "https://demoqa.com" + path;
      const res = await page.goto(fullUrl, { waitUntil: "domcontentloaded", timeout: 5000 }).catch(() => null);
      const text = await page.evaluate(() => document.body.innerText).catch(() => "");
      result.urlTests.push({
        path,
        status: res?.status() || "error",
        hasContent: text.length > 100,
        textLength: text.length
      });
    }

    await browser.close();
    console.log(JSON.stringify(result, null, 2));
  } catch (e: any) {
    console.error("Error:", e.message);
    process.exit(1);
  }
})();
