/**
 * TestData - Factory for generating unique test data
 * All test data is timestamped to ensure uniqueness across runs
 */

export class TestData {
  private static readonly baseTime = Date.now();
  private static readonly baseRandom = Math.random().toString(36).slice(2, 7);

  /**
   * Generate unique identifier
   */
  static generateUid(prefix: string): string {
    return `${prefix}-${this.baseTime}-${this.baseRandom}`;
  }

  /**
   * Generate user object with unique email
   */
  static user(overrides: Partial<User> = {}): User {
    const uid = this.generateUid('user');
    const defaults: User = {
      firstName: 'John',
      lastName: 'Doe',
      email: `user.${uid}@example.com`,
      password: 'SecurePass123!',
      phone: '9876543210',
      role: 'user'
    };
    return { ...defaults, ...overrides };
  }

  /**
   * Generate multiple unique users
   */
  static users(count: number, overrides: Partial<User> = {}): User[] {
    return Array.from({ length: count }, (_, i) => 
      this.user({ ...overrides, firstName: `User${i + 1}` })
    );
  }

  /**
   * Generate product object with unique SKU
   */
  static product(overrides: Partial<Product> = {}): Product {
    const uid = this.generateUid('prod');
    const defaults: Product = {
      name: `Product ${uid}`,
      sku: uid,
      price: Math.floor(Math.random() * 1000) + 10,
      category: 'Electronics',
      description: `Test product ${uid}`
    };
    return { ...defaults, ...overrides };
  }

  /**
   * Generate order with unique order ID
   */
  static order(overrides: Partial<Order> = {}): Order {
    const uid = this.generateUid('order');
    const defaults: Order = {
      orderId: uid,
      items: [this.product()],
      total: 99.99,
      status: 'pending',
      shippingAddress: this.address()
    };
    return { ...defaults, ...overrides };
  }

  /**
   * Generate address object
   */
  static address(overrides: Partial<Address> = {}): Address {
    const defaults: Address = {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'United States'
    };
    return { ...defaults, ...overrides };
  }

  /**
   * Generate registration form data
   */
  static registrationForm(overrides: Partial<RegistrationForm> = {}): RegistrationForm {
    const user = this.user();
    const defaults: RegistrationForm = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      gender: 'Male',
      dateOfBirth: '15/03/1990',
      subjects: ['English', 'Mathematics'],
      hobbies: ['Sports', 'Reading'],
      address: '123 Test Street, Test City',
      state: 'NCR',
      city: 'Delhi'
    };
    return { ...defaults, ...overrides };
  }

  /**
   * Generate text box form data
   */
  static textBoxForm(overrides: Partial<TextBoxForm> = {}): TextBoxForm {
    const user = this.user();
    const defaults: TextBoxForm = {
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      currentAddress: '456 Current Avenue, Old City',
      permanentAddress: '789 Permanent Boulevard, New City'
    };
    return { ...defaults, ...overrides };
  }

  /**
   * Generate web table row data
   */
  static webTableRow(overrides: Partial<WebTableRow> = {}): WebTableRow {
    const user = this.user();
    const defaults: WebTableRow = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      age: Math.floor(Math.random() * 50) + 20,
      salary: Math.floor(Math.random() * 100000) + 30000,
      department: ['IT', 'HR', 'Finance', 'Marketing'][Math.floor(Math.random() * 4)]
    };
    return { ...defaults, ...overrides };
  }

  /**
   * Generate button interaction test data
   */
  static buttonInteraction(): ButtonInteraction {
    return {
      clickType: 'single',
      expectedMessage: 'You have done a dynamic click'
    };
  }

  /**
   * Generate alert dialog test data
   */
  static alertDialog(overrides: Partial<AlertDialog> = {}): AlertDialog {
    const defaults: AlertDialog = {
      type: 'alert',
      message: 'You clicked a button',
      userInput: 'Test Input'
    };
    return { ...defaults, ...overrides };
  }

  /**
   * Generate form validation test cases
   */
  static validationScenarios(): ValidationScenario[] {
    return [
      {
        name: 'Valid input',
        input: 'John Doe',
        expectedResult: 'accepted'
      },
      {
        name: 'Empty input',
        input: '',
        expectedResult: 'may require'
      },
      {
        name: 'Special characters',
        input: 'John O\'Brien',
        expectedResult: 'accepted'
      },
      {
        name: 'Long input',
        input: 'A'.repeat(200),
        expectedResult: 'accepted'
      },
      {
        name: 'Numbers',
        input: '12345',
        expectedResult: 'accepted'
      }
    ];
  }

  /**
   * Generate email validation test cases
   */
  static emailValidationScenarios(): EmailValidationScenario[] {
    return [
      { email: 'valid@example.com', expectedResult: 'valid' },
      { email: 'invalid.email', expectedResult: 'invalid' },
      { email: 'test+alias@example.co.uk', expectedResult: 'valid' },
      { email: '@example.com', expectedResult: 'invalid' },
      { email: 'test@', expectedResult: 'invalid' },
      { email: 'test @example.com', expectedResult: 'invalid' }
    ];
  }

  /**
   * Generate phone number validation test cases
   */
  static phoneValidationScenarios(): PhoneValidationScenario[] {
    return [
      { phone: '9876543210', expectedResult: 'valid' },
      { phone: '123', expectedResult: 'invalid' },
      { phone: '+919876543210', expectedResult: 'valid' },
      { phone: '(987) 654-3210', expectedResult: 'valid' },
      { phone: 'abc1234567', expectedResult: 'invalid' }
    ];
  }

  /**
   * Generate age/date boundary values
   */
  static ageValidationScenarios(): AgeValidationScenario[] {
    const today = new Date();
    const minAge = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const maxAge = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());

    return [
      { age: 18, date: minAge, expectedResult: 'valid' },
      { age: 17, date: new Date(), expectedResult: 'invalid' },
      { age: 100, date: maxAge, expectedResult: 'valid' },
      { age: 50, date: new Date(today.getFullYear() - 50, today.getMonth(), today.getDate()), expectedResult: 'valid' }
    ];
  }
}

/**
 * Type Definitions
 */
export interface User {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: string;
}

export interface Product {
  name: string;
  sku: string;
  price: number;
  category: string;
  description: string;
}

export interface Order {
  orderId: string;
  items: Product[];
  total: number;
  status: string;
  shippingAddress: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface RegistrationForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  subjects: string[];
  hobbies: string[];
  address: string;
  state: string;
  city: string;
}

export interface TextBoxForm {
  fullName: string;
  email: string;
  currentAddress: string;
  permanentAddress: string;
}

export interface WebTableRow {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  salary: number;
  department: string;
}

export interface ButtonInteraction {
  clickType: 'single' | 'double' | 'right';
  expectedMessage: string;
}

export interface AlertDialog {
  type: 'alert' | 'confirm' | 'prompt';
  message: string;
  userInput: string;
}

export interface ValidationScenario {
  name: string;
  input: string;
  expectedResult: 'accepted' | 'rejected' | 'may require' | 'valid' | 'invalid';
}

export interface EmailValidationScenario {
  email: string;
  expectedResult: 'valid' | 'invalid';
}

export interface PhoneValidationScenario {
  phone: string;
  expectedResult: 'valid' | 'invalid';
}

export interface AgeValidationScenario {
  age: number;
  date: Date;
  expectedResult: 'valid' | 'invalid';
}
