import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * WidgetsPage - Tests for Widgets section
 */
export class WidgetsPage extends BasePage {
  readonly accordianLink = this.page.getByRole('link', { name: 'Accordian' });
  readonly autoCompleteLink = this.page.getByRole('link', { name: 'Auto Complete' });
  readonly datePickerLink = this.page.getByRole('link', { name: 'Date Picker' });
  readonly sliderLink = this.page.getByRole('link', { name: 'Slider' });
  readonly progressBarLink = this.page.getByRole('link', { name: 'Progress Bar' });
  readonly tabsLink = this.page.getByRole('link', { name: 'Tabs' });
  readonly toolTipsLink = this.page.getByRole('link', { name: 'Tool Tips' });
  readonly menuLink = this.page.getByRole('link', { name: 'Menu' });
  readonly selectMenuLink = this.page.getByRole('link', { name: 'Select Menu' });

  async navigateToAccordian() {
    await this.accordianLink.click();
  }

  async navigateToAutoComplete() {
    await this.autoCompleteLink.click();
  }

  async navigateDatePicker() {
    await this.datePickerLink.click();
  }

  async navigateToSlider() {
    await this.sliderLink.click();
  }

  async navigateToProgressBar() {
    await this.progressBarLink.click();
  }

  async navigateToTabs() {
    await this.tabsLink.click();
  }

  async navigateToToolTips() {
    await this.toolTipsLink.click();
  }

  async navigateToMenu() {
    await this.menuLink.click();
  }

  async navigateToSelectMenu() {
    await this.selectMenuLink.click();
  }
}

/**
 * AccordianPage - Tests for Accordian widget
 */
export class AccordianPage extends BasePage {
  readonly heading1 = this.page.locator('#heading1');
  readonly heading2 = this.page.locator('#heading2');
  readonly heading3 = this.page.locator('#heading3');
  readonly collapse1 = this.page.locator('#collapse1');
  readonly collapse2 = this.page.locator('#collapse2');
  readonly collapse3 = this.page.locator('#collapse3');

  async expandSection1() {
    await this.heading1.click();
  }

  async expandSection2() {
    await this.heading2.click();
  }

  async expandSection3() {
    await this.heading3.click();
  }

  async isSection1Expanded(): Promise<boolean> {
    return this.collapse1.isVisible();
  }

  async isSection2Expanded(): Promise<boolean> {
    return this.collapse2.isVisible();
  }

  async isSection3Expanded(): Promise<boolean> {
    return this.collapse3.isVisible();
  }
}

/**
 * DatePickerPage - Tests for Date Picker widget
 */
export class DatePickerPage extends BasePage {
  readonly dateInput = this.page.locator('#datePickerMonthYearInput');
  readonly dateTimeInput = this.page.locator('#dateAndTimePickerInput');

  async selectDate(date: string) {
    // Date format: MM/DD/YYYY
    await this.dateInput.fill(date);
  }

  async selectDateTime(dateTime: string) {
    // Date time format: MM/DD/YYYY hh:mm aa
    await this.dateTimeInput.fill(dateTime);
  }

  async getSelectedDate(): Promise<string | null> {
    return this.dateInput.inputValue();
  }
}

/**
 * SliderPage - Tests for Slider widget
 */
export class SliderPage extends BasePage {
  readonly slider = this.page.locator('input[type="range"]');
  readonly sliderValue = this.page.locator('#sliderValue');

  async setSliderValue(value: number) {
    await this.slider.fill(value.toString());
  }

  async getSliderValue(): Promise<string | null> {
    return this.sliderValue.textContent();
  }
}

/**
 * ProgressBarPage - Tests for Progress Bar widget
 */
export class ProgressBarPage extends BasePage {
  readonly startButton = this.page.getByRole('button', { name: 'Start' });
  readonly progressBar = this.page.locator('.progress-bar');
  readonly resetButton = this.page.getByRole('button', { name: 'Reset' });

  async startProgress() {
    await this.startButton.click();
  }

  async resetProgress() {
    await this.resetButton.click();
  }

  async getProgressPercentage(): Promise<string | null> {
    return this.progressBar.getAttribute('aria-valuenow');
  }

  async waitForProgressComplete() {
    await this.page.waitForFunction(() => {
      const progressValue = document.querySelector('.progress-bar')?.getAttribute('aria-valuenow');
      return progressValue === '100';
    });
  }
}

/**
 * TabsPage - Tests for Tabs widget
 */
export class TabsPage extends BasePage {
  readonly what = this.page.getByRole('tab', { name: 'What' });
  readonly origin = this.page.getByRole('tab', { name: 'Origin' });
  readonly use = this.page.getByRole('tab', { name: 'Use' });
  readonly moreList = this.page.getByRole('tab', { name: 'More' });

  async clickWhatTab() {
    await this.what.click();
  }

  async clickOriginTab() {
    await this.origin.click();
  }

  async clickUseTab() {
    await this.use.click();
  }

  async clickMoreListTab() {
    await this.moreList.click();
  }

  async isTabSelected(tabName: string): Promise<boolean> {
    const tab = this.page.getByRole('tab', { name: tabName });
    return tab.evaluate((el: any) => el.getAttribute('aria-selected') === 'true');
  }
}

/**
 * SelectMenuPage - Tests for Select Menu widget
 */
export class SelectMenuPage extends BasePage {
  readonly selectValue = this.page.locator('#withOptGroup');
  readonly selectOne = this.page.locator('#selectOne');
  readonly oldSelectMenu = this.page.locator('#oldSelectMenu');

  async selectValueOption(option: string) {
    await this.selectValue.click();
    await this.page.getByRole('option', { name: option }).click();
  }

  async selectOneOption(option: string) {
    await this.selectOne.click();
    await this.page.getByRole('option', { name: option }).click();
  }

  async selectOldMenuOption(option: string) {
    await this.oldSelectMenu.selectOption(option);
  }

  async getSelectedValue(): Promise<string | null> {
    return this.selectValue.inputValue();
  }
}

/**
 * ToolTipsPage - Tests for Tooltips
 */
export class ToolTipsPage extends BasePage {
  readonly buttonWithTooltip = this.page.getByRole('button', { name: 'Hover me to see' });
  readonly inputWithTooltip = this.page.locator('input.tooltipped');
  readonly textWithTooltip = this.page.locator('a.tooltipped').first();

  async hoverButton() {
    await this.buttonWithTooltip.hover();
  }

  async hoverInput() {
    await this.inputWithTooltip.hover();
  }

  async hoverText() {
    await this.textWithTooltip.hover();
  }

  async getTooltipText(): Promise<string | null> {
    return this.page.locator('.tooltip-inner').textContent();
  }
}

/**
 * MenuPage - Tests for Menu widget
 */
export class MenuPage extends BasePage {
  readonly mainMenu = this.page.locator('.navbar');

  async navigateMenuPath(...items: string[]) {
    for (const item of items) {
      await this.page.getByText(item).hover();
    }
  }

  async isMenuItemVisible(itemName: string): Promise<boolean> {
    return this.page.getByText(itemName).isVisible();
  }
}
