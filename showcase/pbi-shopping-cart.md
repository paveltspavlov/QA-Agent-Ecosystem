# PBI-2087: Shopping Cart with Real-Time Price Calculation

## User Story

As a logged-in customer, I want to add products to a shopping cart and see the total price update in real time so that I can review my order before checkout.

## Description

Implement a shopping cart for the SauceDemo e-commerce application (https://www.saucedemo.com). Users can add items from the product catalogue, adjust quantities, remove items, and proceed to checkout. The cart total must update instantly without a page reload.

The cart persists across page navigations within the same session but is cleared on logout.

## Acceptance Criteria

1. Users can add any product to the cart from the product listing page by clicking "Add to cart".
2. The cart badge in the header shows the total number of distinct items.
3. Users can open the cart page to see all added items with name, description, quantity, and unit price.
4. Users can remove individual items from the cart.
5. The subtotal updates instantly when items are added or removed (no page reload).
6. Users can proceed to checkout from the cart page.
7. The checkout flow collects first name, last name, and postal code before showing an order summary.
8. The order summary displays item total, tax (8%), and grand total.
9. Completing the checkout shows a confirmation message with an order reference.
10. The cart is cleared after a successful checkout.
11. The cart persists across page navigations (e.g., going back to the product listing and returning to the cart).
12. The cart is cleared when the user logs out.

## Technical Notes

- Target URL: https://www.saucedemo.com
- Test credentials:
  - Standard user: `standard_user` / `secret_sauce`
  - Locked out user: `locked_out_user` / `secret_sauce`
  - Problem user: `problem_user` / `secret_sauce` (intentionally broken UI)
  - Performance glitch user: `performance_glitch_user` / `secret_sauce` (slow responses)
- Frontend: React (single-page application)
- State management: Local/session storage
- No backend API -- all data is client-side

## Edge Cases to Consider

- Adding the same product twice (should not duplicate, badge count stays at 1)
- Cart behavior with the "problem_user" account (known UI glitches)
- Cart behavior with the "performance_glitch_user" account (delayed responses)
- Checkout with an empty cart (should be blocked or show a message)
- Very long product names in the cart layout
- Tax rounding on odd totals

## Mockups

- Product listing: https://www.saucedemo.com/inventory.html
- Cart page: https://www.saucedemo.com/cart.html
- Checkout step 1: https://www.saucedemo.com/checkout-step-one.html
- Checkout step 2: https://www.saucedemo.com/checkout-step-two.html
- Checkout complete: https://www.saucedemo.com/checkout-complete.html
