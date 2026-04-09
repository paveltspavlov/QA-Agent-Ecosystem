/**
 * =========================================================================
 * Password Reset Test Data Factory - Privacy-Safe, GDPR-Compliant
 * =========================================================================
 * 
 * Comprehensive synthetic test data for password reset feature testing.
 * All data is generated, randomized, and deterministically reproducible.
 * 
 * No real personal data:
 * - Emails are synthetic (testuser###@demoqa.example.com)
 * - Names are generic (Test User 001, etc.)
 * - IPs are generated or from test ranges
 * 
 * GDPR Compliance:
 * - No sensitive data retention after test completion
 * - Tokens, sessions, and reset requests auto-deleted
 * - All PII hashed in audit logs
 * - 90-day retention policy for compliance data
 */

import { randomBytes, createHash } from 'crypto';

// =========================================================================
// 1. CONFIGURATION & CONSTANTS
// =========================================================================

export interface DataFactoryConfig {
  seed?: number;
  emailDomain?: string;
  gdprCompliant?: boolean;
  logAnonymization?: 'none' | 'hashed' | 'redacted';
  tokenExpirationMs?: number;
  dataRetentionDays?: number;
}

const DEFAULT_CONFIG: Required<DataFactoryConfig> = {
  seed: Date.now(),
  emailDomain: 'demoqa.example.com',
  gdprCompliant: true,
  logAnonymization: 'hashed',
  tokenExpirationMs: 24 * 60 * 60 * 1000,
  dataRetentionDays: 90
};

// =========================================================================
// 2. TYPE DEFINITIONS
// =========================================================================

export interface TestUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHistory: string[];
  accountStatus: 'active' | 'inactive' | 'suspended';
  createdDate: Date;
  lastLogin: Date | null;
  mfaEnabled: boolean;
  emailVerified: boolean;
}

export interface PasswordTestCase {
  password: string;
  category: 'valid' | 'invalid' | 'boundary' | 'special';
  reason?: string;
  minLength?: number;
  maxLength?: number;
}

export interface EmailTestCase {
  email: string;
  category: 'valid' | 'invalid' | 'unregistered';
  reason?: string;
}

export interface PasswordResetToken {
  token: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  isExpired: boolean;
  isUsed: boolean;
  usedAt?: Date;
}

export interface ResetRequest {
  requestId: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  errorCode?: string;
}

export interface RateLimitScenario {
  userId: string;
  ipAddress: string;
  requests: ResetRequest[];
  resetCounterAt?: Date;
}

export interface SessionData {
  sessionId: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  browserType: 'Chrome' | 'Firefox' | 'Safari' | 'Edge';
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  deviceOS: 'Windows' | 'macOS' | 'iOS' | 'Android';
  ipAddress: string;
  rememberMeToken?: string;
  rememberMeExpiry?: Date;
}

export interface AuditLogEntry {
  logId: string;
  timestamp: Date;
  userId: string;
  action: 'reset_request' | 'reset_success' | 'reset_failed' | 'token_validated' | 'password_changed';
  status: 'success' | 'failure';
  details: {
    ipAddress: string;
    browser?: string;
    device?: string;
    reason?: string;
    errorCode?: string;
  };
  retentionExpiry: Date;
}

export interface TimingScenario {
  scenarioId: string;
  emailDeliveryTimeMs: number;
  linkExpirationMs: number;
  expectedResult: 'success' | 'timeout' | 'expired';
}

export interface ErrorScenario {
  scenarioId: string;
  errorType: 'network_timeout' | 'service_down' | 'invalid_token' | 'corrupted_data' | 'csrf_missing' | 'rate_limited';
  httpStatusCode?: number;
  errorMessage: string;
  recoverable: boolean;
}

// =========================================================================
// 3. UTILITY FUNCTIONS
// =========================================================================

class Random {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    const a = 1664525;
    const c = 1013904223;
    const m = 2 ** 32;
    this.seed = (a * this.seed + c) % m;
    return this.seed / m;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextItem<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }

  nextItems<T>(array: T[], count: number): T[] {
    const result: T[] = [];
    const indices = new Set<number>();
    while (indices.size < Math.min(count, array.length)) {
      indices.add(this.nextInt(0, array.length - 1));
    }
    return Array.from(indices).map(i => array[i]);
  }
}

function hashData(data: string): string {
  return createHash('sha256').update(data).digest('hex').substring(0, 16);
}

function anonymizeIp(ip: string): string {
  const parts = ip.split('.');
  return parts.slice(0, 2).join('.') + '.***.***.';
}

function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

function generateUuid(): string {
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return [
    bytes.slice(0, 4).toString('hex'),
    bytes.slice(4, 6).toString('hex'),
    bytes.slice(6, 8).toString('hex'),
    bytes.slice(8, 10).toString('hex'),
    bytes.slice(10, 16).toString('hex')
  ].join('-');
}


// =========================================================================
// 4. TEST USER FACTORY
// =========================================================================

export class TestUserFactory {
  private rng: Random;
  private config: Required<DataFactoryConfig>;

  constructor(config: DataFactoryConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rng = new Random(this.config.seed);
  }

  private getGenericName(index: number): string {
    return Test User $('{0:D3}' -f );
  }

  generateUser(index: number, overrides?: Partial<TestUser>): TestUser {
    const statusOptions = ['active', 'inactive', 'suspended'] as const;
    const accountStatus = this.rng.nextItem(statusOptions);
    
    const ageVariance = this.rng.nextInt(0, 365 * 5);
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - ageVariance);

    let lastLogin: Date | null = null;
    if (accountStatus === 'active') {
      const daysAgo = this.rng.nextInt(0, 30);
      lastLogin = new Date();
      lastLogin.setDate(lastLogin.getDate() - daysAgo);
    }

    const userId = generateUuid();
    const firstName = this.getGenericName(index);

    return {
      userId,
      email: 	estuser$('{0:D3}' -f )@${this.config.emailDomain},
      firstName,
      lastName: 'AutoTest',
      passwordHistory: [
        'OldPass1234!',
        'PreviousPass1!',
        'InitialPass1!'
      ],
      accountStatus,
      createdDate,
      lastLogin,
      mfaEnabled: this.rng.next() > 0.7,
      emailVerified: accountStatus !== 'suspended',
      ...overrides
    };
  }

  generateUsers(count: number, overrides?: Partial<TestUser>): TestUser[] {
    return Array.from({ length: count }, (_, i) =>
      this.generateUser(i + 1, overrides)
    );
  }

  getStandardTestSet(): TestUser[] {
    return this.generateUsers(25, {});
  }
}

// =========================================================================
// 5. PASSWORD TEST FACTORY
// =========================================================================

export class PasswordFactory {
  validPasswords(): string[] {
    return [
      'Test1234',
      'SecurePass2024',
      'MyP@ssw0rd',
      'Pass1 Word',
      'Complex@Pass99',
      'MySecure#Pass1',
      'Admin2024!Pwd',
      'Test\',
      'Secure%Pass2024',
      'MyPass^123',
      'Test&Secure1',
      'Quick*Password1',
      'Strong_Pass2024',
      'MyPass-Secure1',
      'ValidPass2024!'
    ];
  }

  invalidPasswords(): string[] {
    return [
      'test1234',
      'TEST1234',
      'TestTest',
      'Test123',
      'Test',
      '',
      '   ',
      '12345678',
      'ABCDEFGH',
      'abcdefgh',
      'Test@',
      ' Test1234',
      'Test1234 ',
      'Pass123'
    ];
  }

  boundaryPasswords(): string[] {
    return [
      'Test1234',
      'Test123',
      'Test12345',
      'Test' + 'X'.repeat(124) + '1',
      'A' + 'B'.repeat(127) + '1',
      'P' + 'a'.repeat(122) + 's1',
      'Valid' + '1'.repeat(120) + '!'
    ];
  }

  specialCasePasswords(): string[] {
    return [
      'Test1234!@#\$%',
      'PassW0rd!',
      'Secure@2024',
      'MyP@ssword1',
      'Test1234!',
      'Pass123\',
      'Test1234"',
      'Complex&Pass1'
    ];
  }

  generateRandomValid(count: number, seed: number = Date.now()): string[] {
    const rng = new Random(seed);
    const results: string[] = [];
    const chars = {
      upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lower: 'abcdefghijklmnopqrstuvwxyz',
      digits: '0123456789',
      special: '@\$!#%&*'
    };

    for (let i = 0; i < count; i++) {
      let password = '';
      password += rng.nextItem(chars.upper);
      password += rng.nextItem(chars.lower);
      password += rng.nextItem(chars.digits);
      password += rng.nextItem(chars.special);

      const targetLength = rng.nextInt(8, 16);
      while (password.length < targetLength) {
        password += rng.nextItem(Object.values(chars).join(''));
      }

      results.push(password);
    }

    return results;
  }

  getAllTestCases(): PasswordTestCase[] {
    return [
      ...this.validPasswords().map(p => ({
        password: p,
        category: 'valid' as const,
        minLength: 8
      })),
      ...this.invalidPasswords().map(p => ({
        password: p,
        category: 'invalid' as const,
        reason: this.getInvalidReason(p)
      })),
      ...this.boundaryPasswords().map(p => ({
        password: p,
        category: 'boundary' as const,
        minLength: 8,
        maxLength: 128
      })),
      ...this.specialCasePasswords().map(p => ({
        password: p,
        category: 'special' as const
      }))
    ];
  }

  private getInvalidReason(password: string): string {
    if (password.length === 0) return 'Empty password';
    if (/^\s+$/.test(password)) return 'Whitespace only';
    if (password.length < 8) return 'Too short (< 8 chars)';
    if (!/[A-Z]/.test(password)) return 'Missing uppercase';
    if (!/[a-z]/.test(password)) return 'Missing lowercase';
    if (!/\d/.test(password)) return 'Missing digit';
    if (!/[@\$!#%&*]/.test(password)) return 'Missing special char';
    return 'Invalid format';
  }
}

