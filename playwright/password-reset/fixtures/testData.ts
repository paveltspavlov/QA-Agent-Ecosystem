/**
 * Test Data Fixtures for Password Reset Feature
 * 
 * This module provides:
 * - Test user accounts with various scenarios
 * - Valid and invalid password test cases
 * - Mock reset tokens and email addresses
 * - Common test data for reuse across specs
 */

import { generateRandomString, generateJWT } from '../utils/tokenUtils';

export interface TestUser {
  email: string;
  firstName: string;
  lastName: string;
  currentPassword: string;
  id: string;
}

export interface PasswordTestCase {
  password: string;
  isValid: boolean;
  reason?: string;
}

export interface ResetToken {
  token: string;
  email: string;
  expiresAt: Date;
  isExpired: boolean;
}

/**
 * Test Users — various scenarios for password reset
 */
export const TEST_USERS = {
  // Standard valid user for happy path tests
  standardUser: (): TestUser => ({
    id: generateRandomString(12),
    email: `test.user.${Date.now()}@example.com`,
    firstName: 'John',
    lastName: 'Doe',
    currentPassword: 'CurrentPass123!',
  }),

  // User with special characters in email
  specialEmailUser: (): TestUser => ({
    id: generateRandomString(12),
    email: `test+special.${Date.now()}@example.co.uk`,
    firstName: 'Jane',
    lastName: 'Smith',
    currentPassword: 'SecurePass456!',
  }),

  // Admin user
  adminUser: (): TestUser => ({
    id: generateRandomString(12),
    email: `admin.${Date.now()}@example.com`,
    firstName: 'Admin',
    lastName: 'User',
    currentPassword: 'AdminPass789!',
  }),

  // User with common name (edge case)
  commonNameUser: (): TestUser => ({
    id: generateRandomString(12),
    email: `john.smith.${Date.now()}@example.com`,
    firstName: 'John',
    lastName: 'Smith',
    currentPassword: 'Pass1234!!',
  }),

  // Bulk users for performance testing
  bulkUsers: (count: number): TestUser[] =>
    Array.from({ length: count }, (_, i) => ({
      id: generateRandomString(12),
      email: `bulk.user.${i}.${Date.now()}@example.com`,
      firstName: `User${i}`,
      lastName: `Bulk`,
      currentPassword: 'BulkPass123!',
    })),
};

/**
 * Password Validation Test Cases
 * Tests various password complexity requirements
 */
export const PASSWORD_TEST_CASES: PasswordTestCase[] = [
  // Valid passwords
  {
    password: 'ValidPass123!',
    isValid: true,
    reason: 'Meets all requirements: uppercase, lowercase, number, special char',
  },
  {
    password: 'MyS@fePa55word',
    isValid: true,
    reason: 'Complex password with mixed case, number, special char',
  },
  {
    password: 'Tr0picThund3r!',
    isValid: true,
    reason: '14 characters with all requirements',
  },
  {
    password: 'P@ssw0rd2024!',
    isValid: true,
    reason: 'Contains current year',
  },

  // Invalid passwords — too short
  {
    password: 'Pass1!',
    isValid: false,
    reason: 'Too short (6 chars, minimum 8 required)',
  },
  {
    password: 'Pw1!',
    isValid: false,
    reason: 'Too short (4 chars)',
  },

  // Invalid passwords — missing complexity
  {
    password: 'password123',
    isValid: false,
    reason: 'Missing uppercase letter',
  },
  {
    password: 'PASSWORD123',
    isValid: false,
    reason: 'Missing lowercase letter',
  },
  {
    password: 'PasswordABCD',
    isValid: false,
    reason: 'Missing number',
  },
  {
    password: 'Password123',
    isValid: false,
    reason: 'Missing special character',
  },

  // Invalid passwords — too common
  {
    password: 'Password123!',
    isValid: false,
    reason: 'Too common (top password list)',
  },
  {
    password: 'Qwerty123!',
    isValid: false,
    reason: 'Keyboard pattern',
  },

  // Invalid passwords — personal info
  {
    password: 'John@Doe123!',
    isValid: false,
    reason: 'Contains first name',
  },
  {
    password: 'Doe@1990!',
    isValid: false,
    reason: 'Contains last name and potential DOB',
  },

  // Edge cases
  {
    password: '',
    isValid: false,
    reason: 'Empty password',
  },
  {
    password: ' ',
    isValid: false,
    reason: 'Whitespace only',
  },
  {
    password: 'P@ssw0rdP@ssw0rdP@ssw0rdP@ssw0rdP@ssw0rdP@ssw0rd',
    isValid: false,
    reason: 'Exceeds max length (64 chars)',
  },
];

/**
 * Mock Reset Tokens
 */
export const MOCK_TOKENS = {
  // Valid JWT token (expires in 24 hours)
  validToken: (): ResetToken => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return {
      token: generateJWT({ email: 'user@example.com', exp: Math.floor(expiresAt.getTime() / 1000) }),
      email: 'user@example.com',
      expiresAt,
      isExpired: false,
    };
  },

  // Expired JWT token
  expiredToken: (): ResetToken => {
    const expiresAt = new Date(Date.now() - 1000); // 1 second ago
    return {
      token: generateJWT({ email: 'user@example.com', exp: Math.floor(expiresAt.getTime() / 1000) }),
      email: 'user@example.com',
      expiresAt,
      isExpired: true,
    };
  },

  // Random invalid token
  invalidToken: (): ResetToken => ({
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
    email: 'user@example.com',
    expiresAt: new Date(),
    isExpired: false,
  }),

  // Token with no signature
  malformedToken: (): ResetToken => ({
    token: 'not.a.valid.token',
    email: 'user@example.com',
    expiresAt: new Date(),
    isExpired: false,
  }),

  // Token about to expire (1 minute left)
  almostExpiredToken: (): ResetToken => {
    const expiresAt = new Date(Date.now() + 60 * 1000);
    return {
      token: generateJWT({ email: 'user@example.com', exp: Math.floor(expiresAt.getTime() / 1000) }),
      email: 'user@example.com',
      expiresAt,
      isExpired: false,
    };
  },
};

/**
 * Email Test Data
 */
export const EMAIL_TEST_DATA = {
  validEmails: [
    'user@example.com',
    'john.doe@example.co.uk',
    'user+tag@example.com',
    'test123@subdomain.example.com',
  ],

  invalidEmails: [
    'invalid.email',
    '@example.com',
    'user@',
    'user @example.com',
    'user@example..com',
    'user@.com',
    '',
    ' ',
  ],

  testEmails: {
    primary: 'primaryuser@example.com',
    secondary: 'secondaryuser@example.com',
    inactive: 'inactiveuser@example.com',
    suspicious: 'suspicious@example.com', // For rate limiting tests
  },
};

/**
 * API Response Test Data
 */
export const API_RESPONSES = {
  // Successful password reset request
  successResetRequest: (email: string) => ({
    status: 'success',
    message: 'Password reset email sent successfully',
    data: {
      email,
      resetSentAt: new Date().toISOString(),
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
    },
  }),

  // Successful password reset completion
  successResetComplete: (email: string) => ({
    status: 'success',
    message: 'Password has been reset successfully',
    data: {
      email,
      resetAt: new Date().toISOString(),
      userId: generateRandomString(12),
    },
  }),

  // Error: user not found
  errorUserNotFound: (email: string) => ({
    status: 'error',
    code: 'USER_NOT_FOUND',
    message: `User with email ${email} not found`,
  }),

  // Error: too many reset requests
  errorTooManyRequests: () => ({
    status: 'error',
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many reset requests. Please try again later.',
    retryAfter: 300, // 5 minutes in seconds
  }),

  // Error: invalid token
  errorInvalidToken: () => ({
    status: 'error',
    code: 'INVALID_TOKEN',
    message: 'Invalid or expired reset token',
  }),

  // Error: password validation failed
  errorPasswordInvalid: (reason: string) => ({
    status: 'error',
    code: 'PASSWORD_INVALID',
    message: `Password validation failed: ${reason}`,
  }),

  // Error: token expired
  errorTokenExpired: () => ({
    status: 'error',
    code: 'TOKEN_EXPIRED',
    message: 'Password reset token has expired',
    expiryTime: new Date().toISOString(),
  }),
};

/**
 * Common test data helpers
 */
export const TEST_DATA_HELPERS = {
  /**
   * Get a random valid email from test data
   */
  getRandomValidEmail: (): string => {
    const emails = EMAIL_TEST_DATA.validEmails;
    return emails[Math.floor(Math.random() * emails.length)];
  },

  /**
   * Get a random invalid email from test data
   */
  getRandomInvalidEmail: (): string => {
    const emails = EMAIL_TEST_DATA.invalidEmails.filter(e => e.length > 0);
    return emails[Math.floor(Math.random() * emails.length)];
  },

  /**
   * Get a random valid password
   */
  getRandomValidPassword: (): string => {
    const validPasswords = PASSWORD_TEST_CASES.filter(p => p.isValid);
    return validPasswords[Math.floor(Math.random() * validPasswords.length)].password;
  },

  /**
   * Get a random invalid password
   */
  getRandomInvalidPassword: (): string => {
    const invalidPasswords = PASSWORD_TEST_CASES.filter(p => !p.isValid);
    return invalidPasswords[Math.floor(Math.random() * invalidPasswords.length)].password;
  },
};

