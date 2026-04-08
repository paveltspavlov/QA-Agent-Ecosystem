/** Test data factory — generates unique, realistic test data per run. */

/**
 * Generate a unique identifier using timestamp and random suffix.
 * Format: `${Date.now()}-${randomSuffix}`
 */
function uid(prefix = ''): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

// Curated pools of realistic data
const FIRST_NAMES = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana', 'Edward', 'Fiona'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
const PRODUCT_NAMES = ['Laptop', 'Monitor', 'Keyboard', 'Mouse', 'Headphones', 'Webcam', 'Desk Lamp'];
const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Denver', 'Seattle'];
const STATES = ['NY', 'CA', 'IL', 'TX', 'AZ', 'CO', 'WA'];
const BOOK_TITLES = ['Learning JavaScript', 'Mastering TypeScript', 'Web Automation 101', 'Test Automation Guide'];
const BOOK_AUTHORS = ['John Developer', 'Jane Engineer', 'Bob Tester', 'Alice QA'];

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export const TestData = {
  /**
   * Generate a test user with realistic first/last names and unique email.
   * @param overrides - Override default generated values
   * @returns User object with firstName, lastName, email, password, role
   */
  user(overrides?: Partial<{ firstName: string; lastName: string; email: string; password: string; role: string }>) {
    const id = uid('user');
    return {
      firstName: randomItem(FIRST_NAMES),
      lastName: randomItem(LAST_NAMES),
      email: `test-${id}@example.com`,
      password: 'Test@1234', // DemoQA requires at least one special char
      role: 'user',
      ...overrides,
    };
  },

  /**
   * Generate multiple unique users.
   * @param count - Number of users to generate
   * @param overrides - Apply same overrides to all
   * @returns Array of user objects
   */
  users(count: number, overrides?: Partial<{ firstName: string; lastName: string; email: string; password: string; role: string }>) {
    return Array.from({ length: count }, () => this.user(overrides));
  },

  /**
   * Generate a test product with realistic name and unique SKU.
   * @param overrides - Override default generated values
   * @returns Product object
   */
  product(overrides?: Partial<{ name: string; sku: string; price: number; category: string; description: string }>) {
    const id = uid('prod');
    const price = Math.floor(Math.random() * 5000) / 100;
    return {
      name: `${randomItem(PRODUCT_NAMES)} - ${id}`,
      sku: `SKU-${id}`,
      price,
      category: 'Electronics',
      description: `Test product created at ${new Date().toISOString()}`,
      ...overrides,
    };
  },

  /**
   * Generate multiple unique products.
   * @param count - Number of products to generate
   * @param overrides - Apply same overrides to all
   * @returns Array of product objects
   */
  products(count: number, overrides?: Partial<{ name: string; sku: string; price: number; category: string; description: string }>) {
    return Array.from({ length: count }, () => this.product(overrides));
  },

  /**
   * Generate a test order with realistic order ID and items.
   * @param overrides - Override default generated values
   * @returns Order object
   */
  order(overrides?: Partial<{ orderId: string; quantity: number; price: number; total: number; status: string; createdAt: string }>) {
    const id = uid('ord');
    const quantity = Math.floor(Math.random() * 10) + 1;
    const price = Math.floor(Math.random() * 5000) / 100;
    return {
      orderId: id,
      quantity,
      price,
      total: Math.round(quantity * price * 100) / 100,
      status: 'pending',
      createdAt: new Date().toISOString(),
      ...overrides,
    };
  },

  /**
   * Generate multiple unique orders.
   * @param count - Number of orders to generate
   * @param overrides - Apply same overrides to all
   * @returns Array of order objects
   */
  orders(count: number, overrides?: Partial<{ orderId: string; quantity: number; price: number; total: number; status: string; createdAt: string }>) {
    return Array.from({ length: count }, () => this.order(overrides));
  },

  /**
   * Generate a realistic address.
   * @param overrides - Override default generated values
   * @returns Address object
   */
  address(overrides?: Partial<{ street: string; city: string; state: string; zip: string; country: string }>) {
    const streetNum = Math.floor(Math.random() * 9999) + 1;
    return {
      street: `${streetNum} Test Street`,
      city: randomItem(CITIES),
      state: randomItem(STATES),
      zip: String(Math.floor(Math.random() * 90000) + 10000),
      country: 'US',
      ...overrides,
    };
  },

  /**
   * Generate a book for Book Store tests.
   * @param overrides - Override default generated values
   * @returns Book object
   */
  book(overrides?: Partial<{ title: string; author: string; isbn: string; price: number; pages: number; publishYear: number }>) {
    const id = uid('book');
    return {
      title: `${randomItem(BOOK_TITLES)} - ${id}`,
      author: randomItem(BOOK_AUTHORS),
      isbn: `ISBN-${id}`,
      price: Math.floor(Math.random() * 80) + 10,
      pages: Math.floor(Math.random() * 500) + 100,
      publishYear: new Date().getFullYear(),
      ...overrides,
    };
  },

  /**
   * Generate multiple books.
   * @param count - Number of books to generate
   * @param overrides - Apply same overrides to all
   * @returns Array of book objects
   */
  books(count: number, overrides?: Partial<{ title: string; author: string; isbn: string; price: number; pages: number; publishYear: number }>) {
    return Array.from({ length: count }, () => this.book(overrides));
  },

  /**
   * Generate a text box entry for Elements tests.
   * @param overrides - Override default values
   * @returns TextBox object
   */
  textBox(overrides?: Partial<{ fullName: string; email: string; currentAddress: string; permanentAddress: string }>) {
    const id = uid('txt');
    return {
      fullName: `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`,
      email: `test-${id}@example.com`,
      currentAddress: `${Math.floor(Math.random() * 999) + 1} Test Lane`,
      permanentAddress: `${Math.floor(Math.random() * 999) + 1} Permanent Ave`,
      ...overrides,
    };
  },

  /**
   * Generate a student registration form data for Forms tests.
   * @param overrides - Override default values
   * @returns StudentForm object
   */
  studentForm(overrides?: Partial<{ firstName: string; lastName: string; email: string; gender: string; mobileNumber: string; dateOfBirth: Date; subjects: string[]; hobbies: string[]; picture: string; currentAddress: string; state: string; city: string }>) {
    const id = uid('student');
    return {
      firstName: randomItem(FIRST_NAMES),
      lastName: randomItem(LAST_NAMES),
      email: `student-${id}@example.com`,
      gender: randomItem(['Male', 'Female', 'Other']),
      mobileNumber: String(Math.floor(Math.random() * 9000000000) + 1000000000),
      dateOfBirth: new Date(1990 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      subjects: ['Maths', 'English'],
      hobbies: ['Reading', 'Sports'],
      picture: '',
      currentAddress: `${Math.floor(Math.random() * 999) + 1} Test Street, ${randomItem(CITIES)}`,
      state: randomItem(STATES),
      city: randomItem(CITIES),
      ...overrides,
    };
  },

  /**
   * Get the run ID for batch cleanup (timestamp-based for uniqueness).
   */
  getRunId(): string {
    return uid('run');
  },
} as const;
