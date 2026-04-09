import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const result: any = {
    pages: {}
  };

  try {
    // 1. Login page
    console.log('Exploring /login...');
    await page.goto('https://demoqa.com/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    result.pages.login = {
      url: page.url(),
      title: await page.title(),
      content: await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a, [role=button]')).slice(0, 10).map((el: any) => ({
          text: el.textContent?.trim(),
          tag: el.tagName,
          href: el.href,
          onclick: el.onclick?.toString().substring(0, 100)
        }));
        const inputs = Array.from(document.querySelectorAll('input, label')).slice(0, 10).map((el: any) => ({
          type: el.type,
          name: el.name,
          id: el.id,
          text: el.textContent?.trim()
        }));
        return { buttons, inputs };
      })
    };

    // 2. Forgot page
    console.log('Exploring /forgot...');
    await page.goto('https://demoqa.com/forgot', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    result.pages.forgot = {
      url: page.url(),
      title: await page.title(),
      content: await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a, [role=button]')).slice(0, 10).map((el: any) => ({
          text: el.textContent?.trim(),
          tag: el.tagName
        }));
        const inputs = Array.from(document.querySelectorAll('input, label')).slice(0, 10).map((el: any) => ({
          type: el.type,
          name: el.name,
          id: el.id,
          placeholder: el.placeholder,
          text: el.textContent?.trim()
        }));
        const forms = Array.from(document.querySelectorAll('form')).map((f: any) => ({
          inputs: Array.from(f.querySelectorAll('input, textarea')).map((i: any) => ({
            type: i.type,
            name: i.name,
            id: i.id,
            placeholder: i.placeholder
          }))
        }));
        return { buttons, inputs, forms };
      })
    };

    // 3. Reset page
    console.log('Exploring /reset-password...');
    await page.goto('https://demoqa.com/reset-password', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    result.pages.reset = {
      url: page.url(),
      title: await page.title(),
      content: await page.evaluate(() => {
        const forms = Array.from(document.querySelectorAll('form')).map((f: any) => ({
          inputs: Array.from(f.querySelectorAll('input, textarea')).map((i: any) => ({
            type: i.type,
            name: i.name,
            id: i.id,
            placeholder: i.placeholder
          })),
          buttons: Array.from(f.querySelectorAll('button')).map((b: any) => ({
            text: b.textContent?.trim(),
            type: b.type
          }))
        }));
        return { forms };
      })
    };

    await browser.close();
    console.log(JSON.stringify(result, null, 2));

  } catch(e: any) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();
