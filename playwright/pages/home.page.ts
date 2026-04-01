import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * HomePage - Main landing page of demoqa.com
 */
export class HomePage extends BasePage {
  // Locators
  readonly pageHeading = this.page.getByText('Welcome to DEMOQA');
  readonly elementsLink = this.page.getByRole('link', { name: 'Elements' });
  readonly formsLink = this.page.getByRole('link', { name: 'Forms' });
  readonly alertsLink = this.page.getByRole('link', { name: 'Alerts, Frame & Windows' });
  readonly widgetsLink = this.page.getByRole('link', { name: 'Widgets' });
  readonly interactionsLink = this.page.getByRole('link', { name: 'Interactions' });
  readonly bookStoreLink = this.page.getByRole('link', { name: 'Book Store Application' });

  // Navigation methods
  async navigateToElements() {
    await this.elementsLink.click();
  }

  async navigateToForms() {
    await this.formsLink.click();
  }

  async navigateToAlerts() {
    await this.alertsLink.click();
  }

  async navigateToWidgets() {
    await this.widgetsLink.click();
  }

  async navigateToInteractions() {
    await this.interactionsLink.click();
  }

  async navigateToBookStore() {
    await this.bookStoreLink.click();
  }

  async isMainMenuVisible(): Promise<boolean> {
    return this.elementsLink.isVisible();
  }
}
