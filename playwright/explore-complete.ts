import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const result: any = {
    timestamp: new Date().toISOString(),
    baseUrl: 'https://demoqa.com',
    exploration: {
      loginPage: {},
      registrationFlow: {},
      navigationPaths: {},
      selectors: {}
    }
  };

  try {
    // 1. Explore login page in detail
    console.log('1. Detailed login page exploration...');
    await page.goto('https://demoqa.com/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    result.exploration.loginPage = {
      url: page.url(),
      title: await page.title(),
      allText: await page.evaluate(() => document.body.innerText),
      structure: await page.evaluate(() => {
        const structure: any = {};
        
        // All inputs
        const inputs = Array.from(document.querySelectorAll('input, textarea')).map((el: any) => ({
          tag: el.tagName,
          type: el.type || el.getAttribute('type'),
          id: el.id,
          name: el.name,
          placeholder: el.placeholder,
          class: el.className
        }));

        // All buttons
        const buttons = Array.from(document.querySelectorAll('button, [role=button], a.btn')).map((el: any) => ({
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 50),
          id: el.id,
          class: el.className,
          href: el.href,
          type: el.getAttribute('type')
        }));

        // All links
        const links = Array.from(document.querySelectorAll('a[href]')).map((el: any) => ({
          text: el.textContent?.trim().substring(0, 50),
          href: el.href,
          class: el.className
        })).filter((l: any) => l.href);

        return { inputs, buttons, links };
      })
    };

    // 2. Check common password reset URLs
    console.log('2. Testing common password reset URLs...');
    const urlsToTest = [
      '/forgot-password',
      '/forgot',
      '/reset-password',
      '/password-reset',
      '/password-recovery',
      '/recover',
      '/register',
      '/signup'
    ];

    const foundUrls: any[] = [];
    for (const path of urlsToTest) {
      try {
        const res = await page.goto(\https://demoqa.com\\, { 
          waitUntil: 'domcontentloaded',
          timeout: 5000 
        });
        const status = res?.status();
        const text = await page.evaluate(() => document.body.innerText).catch(() => '');
        
        foundUrls.push({
          path,
          status,
          hasContent: text && text.length > 100,
          contentLength: text ? text.length : 0
        });
      } catch(e: any) {
        foundUrls.push({
          path,
          status: 'timeout/error',
          hasContent: false
        });
      }
    }
    result.exploration.navigationPaths.urlTests = foundUrls;

    await browser.close();
    console.log(JSON.stringify(result, null, 2));

  } catch(e: any) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();
