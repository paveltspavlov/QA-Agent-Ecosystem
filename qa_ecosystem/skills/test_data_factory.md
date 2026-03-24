## Test Data Factory Pattern

1. Generate unique per-run data using timestamp-based UIDs:
   - UID format: `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
   - Every test run gets completely unique data to prevent collisions

2. Factory functions for common entities:
   - `TestData.user()`: generates `{ firstName, lastName, email (unique), password, role }`
   - `TestData.product()`: generates `{ name, sku (unique), price, category, description }`
   - `TestData.order()`: generates `{ orderId (unique), items, total, status, shippingAddress }`
   - `TestData.address()`: generates `{ street, city, state, zip, country }`
   - All fields use realistic values from curated pools (faker-like approach)

3. Factory configuration:
   - Override defaults: `TestData.user({ role: 'admin' })` merges with generated data
   - Bulk generation: `TestData.users(5)` returns array of unique users
   - Related data: `TestData.orderWithUser()` creates user + order linked together

4. Cleanup helpers:
   - Provide `deleteUser(id)`, `deleteOrder(id)` helpers for test teardown
   - Tag all test-created data with a run ID for batch cleanup
