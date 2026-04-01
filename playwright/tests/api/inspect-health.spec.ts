import { test } from '@playwright/test';

test('inspect /health endpoint', async ({ request }) => {
  const response = await request.get('https://demoqa.com/api/health', { validateStatus: () => true });
  console.log(`\nStatus: ${response.status()}`);
  console.log(`Content-Type: ${response.headers()['content-type']}`);
  
  const text = await response.text();
  console.log(`Response length: ${text.length}`);
  console.log(`First 200 chars:\n${text.substring(0, 200)}`);
});
