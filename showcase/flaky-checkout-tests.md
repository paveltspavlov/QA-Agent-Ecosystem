# Workflow 5 -- Flaky Test Investigation: SauceDemo Checkout

Run Workflow 5 — Flaky Test Investigation.

## Flaky Tests

### Test 1: "should complete checkout with multiple items"
- File: playwright/tests/ui/checkout.spec.ts
- Failure rate: ~35% of CI runs
- Error: `TimeoutError: locator.click: Timeout 5000ms exceeded`
- Element: checkout "Finish" button
- Pattern: Passes locally, fails in CI. Passes on retry.

```
Error: locator.click: Timeout 5000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Finish' })
  -   locator resolved to <button class="btn btn_action btn_medium cart_button" id="finish">Finish</button>
  -   attempting click action
  -   waiting for element to be visible, enabled and stable
  -   element is visible and enabled
  -   scrolling into view if needed
  -   element is outside the viewport, scrolling...
```

### Test 2: "should show correct total after adding items"
- File: playwright/tests/ui/cart.spec.ts
- Failure rate: ~20% of CI runs
- Error: `expect(received).toBe(expected) // "$29.99" vs "$0.00"`
- Pattern: Price shows $0.00 when test runs too fast. The price element exists but hasn't been populated yet by React.

```
Error: expect(received).toBe(expected)
Expected: "$29.99"
Received: "$0.00"

  42 |   await page.getByText('Add to cart').first().click();
  43 |   await page.goto('/cart.html');
> 44 |   expect(await page.locator('.inventory_item_price').first().textContent()).toBe('$29.99');
```

### Test 3: "should sort products by price low to high"
- File: playwright/tests/ui/inventory.spec.ts
- Failure rate: ~15% of CI runs
- Error: `expect(received).toEqual(expected) // Array mismatch`
- Pattern: Sort dropdown change triggers a re-render. Test reads prices before DOM settles.

```
Error: expect(received).toEqual(expected)
Expected: ["$7.99", "$9.99", "$15.99", "$29.99", "$49.99"]
Received: ["$29.99", "$9.99", "$15.99", "$49.99", "$7.99"]

  28 |   await page.locator('[data-test="product-sort-container"]').selectOption('lohi');
> 29 |   const prices = await page.locator('.inventory_item_price').allTextContents();
  30 |   expect(prices).toEqual(['$7.99', '$9.99', '$15.99', '$29.99', '$49.99']);
```

### Test 4: "should persist cart across navigation"
- File: playwright/tests/ui/cart.spec.ts
- Failure rate: ~10% of CI runs
- Error: `expect(received).toBe(expected) // "1" vs ""`
- Pattern: Cart badge disappears briefly during SPA navigation. Test checks badge text during transition.

```
Error: expect(received).toBe(expected)
Expected: "1"
Received: ""

  55 |   await page.getByText('Add to cart').first().click();
  56 |   await page.goto('/inventory.html');
> 57 |   expect(await page.locator('.shopping_cart_badge').textContent()).toBe('1');
```

## Recent CI Run Results

Last 10 CI runs (GitHub Actions):
- Run #142: 2 failures (Test 1, Test 2)
- Run #141: PASS
- Run #140: 1 failure (Test 3)
- Run #139: PASS
- Run #138: 3 failures (Test 1, Test 2, Test 4)
- Run #137: PASS
- Run #136: 1 failure (Test 1)
- Run #135: PASS
- Run #134: PASS
- Run #133: 1 failure (Test 2)

Overall: 4 out of 10 runs have at least one flaky failure.

## Environment

- CI: GitHub Actions (ubuntu-latest)
- Node: 20.11.0
- Playwright: 1.42.1
- Browsers: Chromium only
- Workers: 4 (parallel)
- Retries: 1 in CI

## Suspected Root Causes

1. **Test 1**: Element scrolling issue -- the "Finish" button may be below the fold and the scroll doesn't complete before the click timeout.
2. **Test 2**: Race condition -- reading price via `textContent()` before React has rendered the cart item data.
3. **Test 3**: Same race condition -- reading sort results before the DOM re-render completes.
4. **Test 4**: SPA navigation causes a brief unmount/remount of the cart badge component.
