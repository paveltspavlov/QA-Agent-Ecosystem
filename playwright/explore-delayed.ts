import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const result: any = {
    pages: {}
  };

  try {
    // Navigate to forgot and wait for full render
    console.log('Loading /forgot with extended wait...');
    await page.goto('https://demoqa.com/forgot', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Try to find any text content
    const text = await page.evaluate(() => document.body.innerText);
    const html = await page.evaluate(() => document.documentElement.outerHTML.substring(0, 10000));

    result.pages.forgot = {
      url: page.url(),
      text: text,
      hasContent: text && text.length > 50,
      elementCount: await page.evaluate(() => document.querySelectorAll('*').length),
      formCount: await page.evaluate(() => document.querySelectorAll('form').length),
      inputCount: await page.evaluate(() => document.querySelectorAll('input').length),
      html: html
    };

    console.log('Loading /reset-password with extended wait...');
    await page.goto('https://demoqa.com/reset-password', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    result.pages.reset = {
      url: page.url(),
      text: await page.evaluate(() => document.body.innerText),
      elementCount: await page.evaluate(() => document.querySelectorAll('*').length),
      formCount: await page.evaluate(() => document.querySelectorAll('form').length),
      inputCount: await page.evaluate(() => document.querySelectorAll('input').length),
      html: await page.evaluate(() => document.documentElement.outerHTML.substring(0, 10000))
    };

    await browser.close();
    console.log(JSON.stringify(result, null, 2));

  } catch(e: any) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();
