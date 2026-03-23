import { type Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

/** Login page object. */
export class LoginPage extends BasePage {
  // Selectors — role-based first, test-id fallback
  private readonly emailInput = () => this.getByRole('textbox', { name: /email/i });
  private readonly passwordInput = () => this.getByRole('textbox', { name: /password/i });
  private readonly submitButton = () => this.getByRole('button', { name: /sign in|log in/i });
  private readonly errorMessage = () => this.getByRole('alert');

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await super.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
    await this.submitButton().click();
  }

  async expectError(message: string | RegExp): Promise<void> {
    await expect(this.errorMessage()).toContainText(message);
  }

  async expectLoggedIn(): Promise<void> {
    // After successful login, user should be redirected away from /login
    await expect(this.page).not.toHaveURL(/\/login/);
  }
}
