import { test, expect } from '@playwright/test';

test.describe('Exploratory Navigation', () => {
  test('[TC-001] Navigate through Elements section pages', async ({ page }) => {
    // Arrange: Navigate to homepage
    await page.goto('https://demoqa.com/');
    
    // Act: Navigate through Elements section
    await page.getByRole('link', { name: 'Elements' }).click();
    await expect(page).toHaveURL(/.*elements/i);
    
    // Act: Visit Text Box page
    await page.getByRole('link', { name: 'Text Box' }).click();
    await expect(page).toHaveURL(/.*text-box/i);
    
    // Act: Navigate to Buttons page
    await page.getByRole('link', { name: 'Buttons' }).click();
    await expect(page).toHaveURL(/.*buttons/i);
    
    // Act: Interact with buttons
    // Wait for stability and scroll into view to avoid ad interference
    const doubleClickBtn = page.getByRole('button', { name: 'Double Click Me' });
    await doubleClickBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100); // Brief pause for ad rendering
    await doubleClickBtn.click();
    
    // Attempt right-click interaction
    const rightClickBtn = page.getByRole('button', { name: 'Right Click Me' });
    await rightClickBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    
    // Try single click on "Click Me" button
    const clickBtn = page.getByRole('button', { name: 'Click Me', exact: true });
    await clickBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    
    // Assert: Navigate to Dynamic Properties
    await page.getByRole('link', { name: 'Dynamic Properties' }).click();
    await expect(page).toHaveURL(/.*dynamic-properties/i);
  });
});