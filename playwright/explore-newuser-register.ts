import { chromium } from "@playwright/test";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const result: any = {
    loginPageDetails: {},
    registerPageDetails: {},
    newUserFlowAnalysis: {}
  };

  try {
    // 1. Detailed login page analysis
    console.log("Analyzing login page...");
    await page.goto("https://demoqa.com/login", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    result.loginPageDetails = {
      url: page.url(),
      elements: await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll("input, textarea, label, button, a")).map((el: any) => ({
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 100),
          id: el.id,
          href: el.href,
          type: el.type,
          name: el.name
        }));
        return inputs;
      })
    };

    // 2. Check register page
    console.log("Analyzing register page...");
    await page.goto("https://demoqa.com/register", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    result.registerPageDetails = {
      url: page.url(),
      text: await page.evaluate(() => document.body.innerText),
      elements: await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll("input, textarea, label, button")).map((el: any) => ({
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 50),
          id: el.id,
          type: el.type,
          name: el.name,
          placeholder: el.placeholder
        }));
        return inputs;
      })
    };

    // 3. Analyze if "New User" link points to register
    console.log("Analyzing New User flow...");
    await page.goto("https://demoqa.com/login", { waitUntil: "domcontentloaded" });
    
    const newUserLink = await page.locator('text=/new user/i').first();
    const href = await newUserLink.getAttribute("href").catch(() => "");
    const newUserText = await newUserLink.textContent().catch(() => "");
    
    result.newUserFlowAnalysis = {
      linkText: newUserText,
      linkHref: href,
      pointsToRegister: href?.includes("register") || false
    };

    // 4. Test password reset scenario from register page
    console.log("Testing password reset from register page...");
    await page.goto("https://demoqa.com/register", { waitUntil: "domcontentloaded" });
    
    const allLinks = await page.$$("a");
    const forgotPasswordLink = await Promise.all(allLinks.map(async (link) => {
      const text = await link.textContent();
      const href = await link.getAttribute("href");
      return { text, href };
    })).then(links => links.find(l => l.text?.toLowerCase().includes("forgot") || l.text?.toLowerCase().includes("password")));

    result.newUserFlowAnalysis.forgotPasswordLinkFromRegister = forgotPasswordLink || "Not found";

    await browser.close();
    console.log(JSON.stringify(result, null, 2));
  } catch (e: any) {
    console.error("Error:", e.message);
    process.exit(1);
  }
})();
