# UI Test Design: SauceDemo Checkout Flow

Generate a complete Page Object Model and test suite for the SauceDemo checkout flow.

## Target Application

- URL: https://www.saucedemo.com
- Framework: React SPA
- Auth: Username/password login (no MFA)

## Test Credentials

| User | Username | Password | Behavior |
|------|----------|----------|----------|
| Standard | `standard_user` | `secret_sauce` | Normal operation |
| Locked Out | `locked_out_user` | `secret_sauce` | Login rejected |
| Problem | `problem_user` | `secret_sauce` | Broken images, wrong items |
| Glitch | `performance_glitch_user` | `secret_sauce` | 1-5s delays on actions |

## Pages to Model

### 1. Login Page (`/`)
- Fields: username, password
- Actions: login(username, password)
- Assertions: error message visible, redirect to inventory

### 2. Inventory Page (`/inventory.html`)
- Elements: product cards (image, name, description, price, add-to-cart button), sort dropdown, cart badge
- Actions: addToCart(productName), removeFromCart(productName), sortBy(option), goToCart()
- Sort options: Name (A-Z), Name (Z-A), Price (low-high), Price (high-low)

### 3. Cart Page (`/cart.html`)
- Elements: cart items (name, description, quantity, price), continue shopping button, checkout button
- Actions: removeItem(productName), continueShopping(), checkout()

### 4. Checkout Step One (`/checkout-step-one.html`)
- Fields: first name, last name, postal code
- Actions: fillInfo(first, last, zip), continue(), cancel()
- Validation: error on empty fields

### 5. Checkout Step Two (`/checkout-step-two.html`)
- Elements: item summary, payment info, shipping info, subtotal, tax, total
- Actions: finish(), cancel()

### 6. Checkout Complete (`/checkout-complete.html`)
- Elements: success icon, "Thank you" header, order dispatch text
- Actions: backToProducts()

## Test Scenarios

### Happy Path
1. Login as standard_user
2. Add "Sauce Labs Backpack" and "Sauce Labs Bike Light" to cart
3. Open cart, verify both items present with correct prices
4. Proceed to checkout, fill in shipping info
5. Verify order summary: subtotal = $39.98, tax = $3.20, total = $43.18
6. Complete checkout, verify confirmation message
7. Click "Back Home", verify redirect to inventory with empty cart

### Negative Cases
1. Login with invalid credentials -- verify error message
2. Login as locked_out_user -- verify lockout message
3. Checkout with empty fields -- verify validation errors
4. Remove all items from cart, try to checkout -- verify cart is empty

### Sorting
1. Sort products by Price (low to high) -- verify order
2. Sort products by Price (high to low) -- verify order
3. Sort products by Name (Z to A) -- verify order

### Cart Persistence
1. Add items, navigate to inventory, return to cart -- items still present
2. Add items, logout, login -- cart is cleared

### Problem User
1. Login as problem_user, add items -- verify known UI glitches are caught

## Viewports

- Desktop: 1280x800
- Tablet: 768x1024
- Mobile: 375x812
