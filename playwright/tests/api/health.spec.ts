import { test, expect } from '@playwright/test';
import { assertJsonResponse, assertStatus } from '../../helpers/api.helpers';

test.describe('API Health Check', () => {
  test('GET /health returns 200', async ({ request }) => {
    const response = await request.get('/health');
    assertStatus(response, 200);
  });

  test('GET /health returns JSON with status ok', async ({ request }) => {
    const response = await request.get('/health');
    const body = await assertJsonResponse<{ status: string }>(response, 200);
    expect(body.status).toBe('ok');
  });

  test('API responds within acceptable time', async ({ request }) => {
    const start = Date.now();
    const response = await request.get('/health');
    const duration = Date.now() - start;

    assertStatus(response, 200);
    expect(duration).toBeLessThan(5000);
  });
});
