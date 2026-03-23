/** Test data factory — generates unique, realistic test data per run. */

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const TestData = {
  user(overrides?: Partial<ReturnType<typeof TestData.user>>): {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
  } {
    const id = uid();
    return {
      firstName: `Test`,
      lastName: `User-${id}`,
      email: `test-${id}@example.com`,
      password: `P@ssw0rd-${id}`,
      role: 'user',
      ...overrides,
    };
  },

  product(overrides?: Partial<ReturnType<typeof TestData.product>>): {
    name: string;
    sku: string;
    price: number;
    description: string;
  } {
    const id = uid();
    return {
      name: `Product-${id}`,
      sku: `SKU-${id}`,
      price: Math.round(Math.random() * 10000) / 100,
      description: `Test product created at ${new Date().toISOString()}`,
      ...overrides,
    };
  },

  order(overrides?: Partial<ReturnType<typeof TestData.order>>): {
    orderId: string;
    quantity: number;
    status: string;
  } {
    const id = uid();
    return {
      orderId: `ORD-${id}`,
      quantity: Math.floor(Math.random() * 10) + 1,
      status: 'pending',
      ...overrides,
    };
  },

  address(overrides?: Partial<ReturnType<typeof TestData.address>>): {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  } {
    const id = uid();
    return {
      street: `${Math.floor(Math.random() * 9999) + 1} Test Street`,
      city: 'Test City',
      state: 'TC',
      zip: `${Math.floor(Math.random() * 90000) + 10000}`,
      country: 'US',
      ...overrides,
    };
  },
} as const;
