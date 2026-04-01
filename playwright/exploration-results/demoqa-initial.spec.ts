import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://demoqa.com/');
  await page.getByRole('link', { name: 'Elements' }).click();
  await page.getByRole('link', { name: 'Text Box' }).click();
  await page.getByRole('link', { name: 'Buttons' }).click();
  await page.getByRole('button', { name: 'Double Click Me' }).click();
  await page.getByText('ButtonsDouble Click MeRight').click();
  await page.getByRole('button', { name: 'Right Click Me' }).click();
  await page.getByRole('button', { name: 'Click Me', exact: true }).click();
  await page.getByRole('link', { name: 'Dynamic Properties' }).click();
});