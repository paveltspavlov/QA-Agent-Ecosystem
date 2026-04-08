/**
 * Example Test: Test Fixtures & Data Factories in Action
 *
 * This test file demonstrates:
 * - Using enhanced fixtures
 * - Generating realistic test data
 * - Tracking resources for automatic cleanup
 * - Managing test lifecycle
 *
 * Copy this file as a template for your own test files.
 */

import { test, expect } from '../../fixtures/enhanced.fixture';
import { TestData } from '../../test-data/factory';
import { TIMEOUTS } from '../../helpers/timeouts';

test.describe('Test Fixtures & Data Factories Examples @examples', () => {
  /**
   * Example 1: Basic fixture usage with page objects
   */
  test('login using fixture', async ({ loginPage, homePage }) => {
    // Arrange
    const testUser = TestData.user();

    // Act
    await loginPage.goto();
    // Note: demoqa.com doesn't require real login, just navigate to home

    // Assert
    await expect(homePage.pageHeading).toBeVisible({ timeout: TIMEOUTS.SHORT });
  });

  /**
   * Example 2: Use test context and tracking
   */
  test('test context with resource tracking', async ({ testContext, trackResource, page }) => {
    // Arrange
    console.log(`Run ID: ${testContext.runId}`);
    console.log(`Test started at: ${testContext.startTime.toISOString()}`);

    // Generate test data
    const user = TestData.user();
    console.log(`Generated user: ${user.firstName} ${user.lastName}`);

    // Act - Simulate creating a user
    const userId = `user-${testContext.runId}-123`;
    trackResource('user', userId);

    // Verify resource was tracked
    const tracked = testContext.cleanupTracker.getIds('users');
    console.log(`Tracked users: ${tracked}`);

    // Assert
    expect(tracked).toContain(userId);

    // Automatic cleanup happens in afterEach
  });

  /**
   * Example 3: Page state management
   */
  test('page state manager usage', async ({ pageState, page, assertPageIsClean }) => {
    // Arrange
    const initialPath = pageState.getCurrentPath();
    console.log(`Initial path: ${initialPath}`);

    // Act - Navigate and wait
    await pageState.navigateAndWait('/', {
      waitForSelector: '[id="app"]',
      timeout: TIMEOUTS.NAVIGATION,
    });

    // Assert
    await assertPageIsClean();

    // Take screenshot
    const screenshotPath = await pageState.screenshot('example-test-001');
    console.log(`Screenshot saved: ${screenshotPath}`);
  });

  /**
   * Example 4: Generate bulk test data
   */
  test('bulk data generation', async ({ testContext }) => {
    // Generate multiple users
    const users = TestData.users(3);
    console.log(`Generated ${users.length} users:`);
    users.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
    });

    // Generate products
    const products = TestData.products(5);
    console.log(`Generated ${products.length} products:`);
    products.slice(0, 2).forEach((product, i) => {
      console.log(`  ${i + 1}. ${product.name} - $${product.price}`);
    });

    // Generate books
    const books = TestData.books(3);
    console.log(`Generated ${books.length} books:`);
    books.forEach((book, i) => {
      console.log(`  ${i + 1}. "${book.title}" by ${book.author}`);
    });

    // All data is unique and isolated per test run
    expect(users[0].email).not.toBe(users[1].email);
    expect(products[0].sku).not.toBe(products[1].sku);
    expect(books[0].isbn).not.toBe(books[1].isbn);
  });

  /**
   * Example 5: Generate form data
   */
  test('form data generation', async () => {
    // Text box form
    const textBox = TestData.textBox();
    console.log(`Text box data: ${textBox.fullName}, ${textBox.email}`);
    expect(textBox.email).toContain('@example.com');

    // Student registration form
    const student = TestData.studentForm();
    console.log(`Student: ${student.firstName} ${student.lastName}`);
    console.log(`  Gender: ${student.gender}`);
    console.log(`  Mobile: ${student.mobileNumber}`);
    console.log(`  Subjects: ${student.subjects.join(', ')}`);

    expect(student.mobileNumber).toMatch(/^\d{10}$/);
    expect(student.subjects).toContain('Maths');
  });

  /**
   * Example 6: Order data with calculated totals
   */
  test('order data generation', async () => {
    // Generate multiple orders
    const orders = TestData.orders(3);

    console.log('Generated orders:');
    orders.forEach((order) => {
      console.log(`  Order ${order.orderId}:`);
      console.log(`    Quantity: ${order.quantity}`);
      console.log(`    Unit Price: $${order.price}`);
      console.log(`    Total: $${order.total}`);
      console.log(`    Status: ${order.status}`);
    });

    // Verify totals are calculated correctly
    orders.forEach((order) => {
      const expected = order.quantity * order.price;
      expect(Math.abs(order.total - expected)).toBeLessThan(0.01);
    });
  });

  /**
   * Example 7: Resource cleanup tracking
   */
  test('resource cleanup tracker', async ({ cleanupTracker, trackResource }) => {
    // Track multiple resources
    trackResource('user', 'user-123');
    trackResource('user', 'user-456');
    trackResource('product', 'prod-789');
    trackResource('order', 'ord-abc123');

    // Get specific type
    const userIds = cleanupTracker.getIds('user');
    console.log(`Tracked users: ${userIds.join(', ')}`);
    expect(userIds).toHaveLength(2);

    // Get all tracked
    const all = cleanupTracker.getAllTracked();
    console.log('All tracked resources:');
    Object.entries(all).forEach(([type, ids]) => {
      if (ids.length > 0) {
        console.log(`  ${type}: ${ids.join(', ')}`);
      }
    });

    // Get total count
    const total = cleanupTracker.total;
    console.log(`Total tracked: ${total}`);
    expect(total).toBe(4);
  });

  /**
   * Example 8: Data generation with overrides
   */
  test('data generation with overrides', async () => {
    // Override role
    const admin = TestData.user({ role: 'admin', firstName: 'Admin' });
    expect(admin.role).toBe('admin');
    expect(admin.firstName).toBe('Admin');

    // Override product price
    const expensive = TestData.product({ price: 9999.99 });
    expect(expensive.price).toBe(9999.99);

    // Override order status
    const completed = TestData.order({ status: 'completed' });
    expect(completed.status).toBe('completed');

    // Override address
    const ukAddress = TestData.address({ country: 'UK', state: 'LDN' });
    expect(ukAddress.country).toBe('UK');
  });

  /**
   * Example 9: Test with multiple data points
   */
  test('multi-part test with progressive data creation', async ({
    testContext,
    trackResource,
    clearTrackedResources,
  }) => {
    // Part 1: Create initial data
    const initialUsers = TestData.users(2);
    console.log(`Part 1: Created ${initialUsers.length} users`);
    trackResource('user', 'initial-user-1');
    trackResource('user', 'initial-user-2');

    let tracked = testContext.cleanupTracker.getAllTracked();
    expect(tracked.users).toHaveLength(2);

    // Part 2: Add more data (keep previous)
    const additionalUsers = TestData.users(3);
    console.log(`Part 2: Created ${additionalUsers.length} more users`);
    trackResource('user', 'additional-user-1');
    trackResource('user', 'additional-user-2');
    trackResource('user', 'additional-user-3');

    tracked = testContext.cleanupTracker.getAllTracked();
    expect(tracked.users).toHaveLength(5);

    // Part 3: Clear and create new set (e.g., for different test phase)
    clearTrackedResources();
    trackResource('order', 'order-123');
    trackResource('order', 'order-456');

    tracked = testContext.cleanupTracker.getAllTracked();
    expect(tracked.users).toHaveLength(0);  // Cleared
    expect(tracked.orders).toHaveLength(2);
  });

  /**
   * Example 10: Assertion helpers
   */
  test('page assertion helpers', async ({ assertPageIsClean, page }) => {
    // Navigate to home
    await page.goto('/');

    // Use assertion helper
    await assertPageIsClean();

    // Page should be ready for next test
  });
});

/**
 * Test Suite: Real-World Scenarios
 */
test.describe('Real-World Test Scenarios @examples', () => {
  /**
   * Scenario 1: Form submission with test data
   */
  test('submit form with generated student data', async ({
    testContext,
    trackResource,
    page,
  }) => {
    // Generate unique student data
    const student = TestData.studentForm();

    // Navigate to student registration page
    await page.goto('/forms/student-registration-form');

    // Fill form fields with generated data
    await page.getByLabel(/first name/i).fill(student.firstName);
    await page.getByLabel(/last name/i).fill(student.lastName);
    await page.getByLabel(/email/i).fill(student.email);

    // Track this form submission for cleanup
    const formId = `student-form-${testContext.runId}`;
    trackResource('student', formId);

    console.log(`Submitted form for ${student.firstName} ${student.lastName}`);
    expect(student.email).toContain('@example.com');
  });

  /**
   * Scenario 2: Multi-user test scenario
   */
  test('test with multiple user interactions', async ({ trackResource }) => {
    // Create test users
    const users = TestData.users(3);

    // Track each user
    users.forEach((user, i) => {
      trackResource('user', `user-${i}-${user.email.split('@')[0]}`);
    });

    console.log(`Created and tracked ${users.length} users`);

    // Verify all emails are unique
    const emails = users.map((u) => u.email);
    const uniqueEmails = new Set(emails);
    expect(uniqueEmails.size).toBe(emails.length);
  });

  /**
   * Scenario 3: Data validation
   */
  test('validate generated test data', async () => {
    // Validate user data
    const user = TestData.user();
    expect(user.email).toMatch(/^test-\d+-[a-z0-9]+@example\.com$/);
    expect(user.password).toBe('Test@1234');
    expect(user.role).toMatch(/^(user|admin|guest)$/);

    // Validate product data
    const product = TestData.product();
    expect(product.sku).toMatch(/^SKU-\d+-[a-z0-9]+$/);
    expect(product.price).toBeGreaterThan(0);
    expect(product.price).toBeLessThan(50000);

    // Validate order data
    const order = TestData.order();
    expect(order.quantity).toBeGreaterThan(0);
    expect(order.total).toBeGreaterThan(0);

    // Validate address
    const address = TestData.address();
    expect(address.zip).toMatch(/^\d{5}$/);
    expect(address.country).toBe('US');
  });
});

test.describe('Cleanup Verification @examples', () => {
  /**
   * Verify automatic cleanup happens
   */
  test('first test creates resources', async ({ trackResource, testContext }) => {
    trackResource('user', `test-user-${testContext.runId}-1`);
    trackResource('product', `test-product-${testContext.runId}-1`);
    console.log('First test: Resources tracked');
  });

  test('second test has clean state', async ({ testContext, cleanupTracker }) => {
    // Previous test's resources should be cleaned
    const tracked = cleanupTracker.getAllTracked();
    console.log('Second test: Verifying clean state');

    // Can start fresh tracking
    expect(cleanupTracker.total).toBe(0);
  });
});
