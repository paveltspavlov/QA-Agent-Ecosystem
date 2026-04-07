import { test } from '@playwright/test';

test('inspect /health endpoint', async ({ request }) => {
  await test.step('GET /api/health and log response', async (step) => {
    const response = await request.get('https://demoqa.com/api/health');
    const text = await response.text();

    await step.attach('health-response', {
      body: JSON.stringify({
        status: response.status(),
        contentType: response.headers()['content-type'],
        bodyLength: text.length,
        bodyPreview: text.substring(0, 200),
      }, null, 2),
      contentType: 'application/json',
    });
  });
});
