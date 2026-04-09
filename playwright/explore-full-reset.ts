import { chromium, BrowserContext } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context: BrowserContext = await browser.newContext();
  const page = await context.newPage();

  const networkRequests: any[] = [];
  const networkResponses: any[] = [];

  // Intercept all requests
  page.on('request', request => {
    networkRequests.push({
      method: request.method(),
      url: request.url(),
      resourceType: request.resourceType()
    });
  });

  page.on('response', response => {
    if (response.url().includes('api') || response.url().includes('password') || response.url().includes('reset')) {
      networkResponses.push({
        status: response.status(),
        url: response.url(),
        resourceType: response.request().resourceType()
      });
    }
  });

  const result: any = {
    networkActivity: [],
    pages: {}
  };

  try {
    // Navigate to login
    console.log('Loading /login...');
    await page.goto('https://demoqa.com/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Try to find forgot password link
    const allText = await page.evaluate(() => document.body.innerText);
    result.pages.login = {
      url: page.url(),
      pageContent: allText.substring(0, 2000),
      networkRequests: networkRequests.slice(-10)
    };

    networkRequests.length = 0;

    // Navigate to forgot
    console.log('Loading /forgot...');
    await page.goto('https://demoqa.com/forgot', { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    result.pages.forgot = {
      url: page.url(),
      pageContent: await page.evaluate(() => document.body.innerText).catch(() => 'Error'),
      allElements: await page.evaluate(() => {
        const els = document.querySelectorAll('*');
        return {
          totalElements: els.length,
          visibleText: document.body.innerText?.substring(0, 1000),
          forms: Array.from(document.querySelectorAll('form')).length,
          inputs: Array.from(document.querySelectorAll('input')).length,
          buttons: Array.from(document.querySelectorAll('button')).length
        };
      }),
      networkRequests: networkRequests.slice(-10)
    };

    networkRequests.length = 0;

    // Navigate to reset
    console.log('Loading /reset-password...');
    await page.goto('https://demoqa.com/reset-password', { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    result.pages.reset = {
      url: page.url(),
      elements: await page.evaluate(() => {
        const forms = Array.from(document.querySelectorAll('form')).map((f: any, i) => ({
          formIndex: i,
          inputs: Array.from(f.querySelectorAll('input, textarea')).map((inp: any) => ({
            type: inp.type || inp.tagName,
            name: inp.name,
            id: inp.id,
            placeholder: inp.placeholder,
            ariaLabel: inp.getAttribute('aria-label'),
            label: inp.labels?.[0]?.textContent
          })),
          buttons: Array.from(f.querySelectorAll('button, [role=button]')).map((btn: any) => ({
            text: btn.textContent?.trim(),
            type: btn.type,
            onclick: btn.onclick?.toString().substring(0, 50)
          }))
        }));
        return {
          forms,
          totalInputs: document.querySelectorAll('input').length,
          visibleText: document.body.innerText?.substring(0, 1000)
        };
      }),
      networkRequests: networkRequests.slice(-10)
    };

    await browser.close();
    console.log(JSON.stringify(result, null, 2));

  } catch(e: any) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();
