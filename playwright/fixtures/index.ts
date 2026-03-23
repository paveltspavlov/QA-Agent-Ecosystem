import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

/** Custom test fixtures for the QA ecosystem. */
type QAFixtures = {
  loginPage: LoginPage;
};

export const test = base.extend<QAFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
});

export { expect } from '@playwright/test';
