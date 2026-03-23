import { test as setup, expect } from '@playwright/test';

const AUTH_FILE = '.auth/state.json';

setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL || 'test@example.com';
  const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

  await page.goto('/login');
  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByRole('textbox', { name: /password/i }).fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  // Wait for redirect after successful login
  await expect(page).not.toHaveURL(/\/login/);

  // Save authentication state
  await page.context().storageState({ path: AUTH_FILE });
});
