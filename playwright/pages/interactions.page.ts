import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * InteractionsPage - Tests for Interactions section
 */
export class InteractionsPage extends BasePage {
  readonly sortableLink = this.page.getByRole('link', { name: 'Sortable' });
  readonly selectableLink = this.page.getByRole('link', { name: 'Selectable' });
  readonly resizableLink = this.page.getByRole('link', { name: 'Resizable' });
  readonly droppableLink = this.page.getByRole('link', { name: 'Droppable' });
  readonly dragabbleLink = this.page.getByRole('link', { name: 'Dragabble' });

  async navigateToSortable() {
    await this.sortableLink.click();
  }

  async navigateToSelectable() {
    await this.selectableLink.click();
  }

  async navigateToResizable() {
    await this.resizableLink.click();
  }

  async navigateToDroppable() {
    await this.droppableLink.click();
  }

  async navigateToDragabble() {
    await this.dragabbleLink.click();
  }
}

/**
 * SortablePage - Tests for Sortable interactions
 */
export class SortablePage extends BasePage {
  readonly listItems = this.page.locator('.list-group > li');
  readonly gridItems = this.page.locator('.grid > div');

  async dragAndDropInList(fromIndex: number, toIndex: number) {
    const items = await this.listItems.all();
    if (items[fromIndex] && items[toIndex]) {
      await items[fromIndex].dragTo(items[toIndex]);
    }
  }

  async getListItemsOrder(): Promise<string[]> {
    const items = await this.listItems.all();
    const order = [];
    for (const item of items) {
      const text = await item.textContent();
      if (text) order.push(text.trim());
    }
    return order;
  }

  async getListItemCount(): Promise<number> {
    return this.listItems.count();
  }
}

/**
 * SelectablePage - Tests for Selectable interactions
 */
export class SelectablePage extends BasePage {
  readonly listItems = this.page.locator('#verticalListContainer li');
  readonly gridItems = this.page.locator('#selectableGridContainer .list-group-item');

  async clickListItem(index: number) {
    const items = await this.listItems.all();
    if (items[index]) {
      await items[index].click();
    }
  }

  async isListItemSelected(index: number): Promise<boolean> {
    const items = await this.listItems.all();
    if (!items[index]) return false;
    return items[index].evaluate((el) => el.classList.contains('active'));
  }

  async selectMultipleItems(...indices: number[]) {
    for (const index of indices) {
      const items = await this.listItems.all();
      if (items[index]) {
        await items[index].click({ modifiers: ['Control'] });
      }
    }
  }
}

/**
 * ResizablePage - Tests for Resizable interactions
 */
export class ResizablePage extends BasePage {
  readonly resizableBox = this.page.locator('#resizable');
  readonly resizeHandle = this.page.locator('#resizable .ui-resizable-handle');
  readonly restrictedResizable = this.page.locator('#resizableBoxWithRestriction');

  async resizeBox(x: number, y: number) {
    const handle = this.resizeHandle.first();
    await handle.dragTo(this.resizableBox, {
      targetPosition: { x, y },
    });
  }

  async getBoxDimensions(): Promise<{ width: string; height: string }> {
    const width = await this.resizableBox.evaluate((el) => window.getComputedStyle(el).width);
    const height = await this.resizableBox.evaluate((el) => window.getComputedStyle(el).height);
    return { width, height };
  }
}

/**
 * DroppablePage - Tests for Droppable interactions
 */
export class DroppablePage extends BasePage {
  readonly simpleTab = this.page.getByRole('tab', { name: 'Simple' });
  readonly acceptTab = this.page.getByRole('tab', { name: 'Accept' });
  readonly preventPropagationTab = this.page.getByRole('tab', { name: 'Prevent Propagation' });
  readonly revertDraggableTab = this.page.getByRole('tab', { name: 'Revert Draggable' });

  readonly dragSource = this.page.locator('#draggable');
  readonly dragSourceAccept = this.page.locator('#draggable-accept-2');
  readonly dropTarget = this.page.locator('#droppable');
  readonly dropTargetAccept = this.page.locator('#droppable-accept');

  async clickSimpleTab() {
    await this.simpleTab.click();
  }

  async clickAcceptTab() {
    await this.acceptTab.click();
  }

  async dragAndDrop() {
    await this.dragSource.dragTo(this.dropTarget);
  }

  async dragAndDropWithAccept() {
    await this.dragSourceAccept.dragTo(this.dropTargetAccept);
  }

  async getDropTargetText(): Promise<string | null> {
    return this.dropTarget.textContent();
  }
}

/**
 * DragabblePage - Tests for Draggable interactions
 */
export class DragabblePage extends BasePage {
  readonly simpleTab = this.page.getByRole('tab', { name: 'Simple' });
  readonly axisRestrictedTab = this.page.getByRole('tab', { name: 'Axis Restricted' });
  readonly containerRestrictedTab = this.page.getByRole('tab', { name: 'Container Restricted' });
  readonly cursorStyleTab = this.page.getByRole('tab', { name: 'Cursor Style' });

  readonly dragBox = this.page.locator('#dragBox');
  readonly xAxisBox = this.page.locator('#dragBoxWithAxisRestriction-x');
  readonly yAxisBox = this.page.locator('#dragBoxWithAxisRestriction-y');
  readonly containerBox = this.page.locator('#dragBoxContainer');

  async clickSimpleTab() {
    await this.simpleTab.click();
  }

  async dragBox(x: number, y: number) {
    // Get current position and drag relative to it
    const currentPos = await this.dragBox.boundingBox();
    if (currentPos) {
      await this.dragBox.dragTo(this.page.locator('body'), {
        targetPosition: {
          x: currentPos.x + x,
          y: currentPos.y + y,
        },
      });
    }
  }

  async getBoxPosition(): Promise<{ x: number; y: number }> {
    const box = await this.dragBox.boundingBox();
    if (!box) return { x: 0, y: 0 };
    return { x: box.x, y: box.y };
  }
}
