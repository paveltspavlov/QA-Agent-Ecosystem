/**
 * Mock Server Setup - API Request Interception
 * 
 * Intercepts API calls and returns mocked responses for:
 * - /api/forgot-password - Initial password reset request
 * - /api/reset-password - Complete password reset
 * - /api/validate-token - Verify reset token validity
 * - Email service calls
 * 
 * Uses Playwright's APIRequestContext.route() for interception
 */

import { Page, APIRequestContext, Route } from '@playwright/test';
import { API_RESPONSES } from '../fixtures/testData';

export interface MockServerConfig {
  delayMs?: number;
  shouldSucceed?: boolean;
  customResponses?: Record<string, any>;
}

/**
 * Setup API mocking for password reset endpoints
 */
export async function setupPasswordResetMocks(page: Page, config: MockServerConfig = {}): Promise<void> {
  const { delayMs = 100, shouldSucceed = true } = config;

  // Mock POST /api/forgot-password
  await page.route('**/api/forgot-password', async (route) => {
    await simulateDelay(delayMs);

    const request = route.request();
    const postData = request.postDataJSON() as any;
    const email = postData?.email;

    if (!shouldSucceed) {
      await route.abort('failed');
      return;
    }

    if (!email) {
      await route.respond({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'error',
          code: 'MISSING_EMAIL',
          message: 'Email is required',
        }),
      });
      return;
    }

    // Success response
    await route.respond({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(API_RESPONSES.successResetRequest(email)),
    });
  });

  // Mock POST /api/reset-password
  await page.route('**/api/reset-password', async (route) => {
    await simulateDelay(delayMs);

    const request = route.request();
    const postData = request.postDataJSON() as any;
    const { token, newPassword, email } = postData;

    if (!shouldSucceed) {
      await route.abort('failed');
      return;
    }

    // Validation
    if (!token) {
      await route.respond({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify(API_RESPONSES.errorInvalidToken()),
      });
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      await route.respond({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify(API_RESPONSES.errorPasswordInvalid('Password too short')),
      });
      return;
    }

    // Success
    await route.respond({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(API_RESPONSES.successResetComplete(email || 'user@example.com')),
    });
  });

  // Mock GET /api/validate-token
  await page.route('**/api/validate-token*', async (route) => {
    await simulateDelay(delayMs);

    const url = new URL(route.request().url());
    const token = url.searchParams.get('token');

    if (!shouldSucceed) {
      await route.abort('failed');
      return;
    }

    if (!token) {
      await route.respond({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify(API_RESPONSES.errorInvalidToken()),
      });
      return;
    }

    // Assume token is valid for mock
    await route.respond({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          valid: true,
          email: 'user@example.com',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      }),
    });
  });
}

/**
 * Setup rate limiting mock
 */
export async function setupRateLimitingMock(page: Page, maxRequests: number = 5): Promise<void> {
  let requestCount = 0;

  await page.route('**/api/forgot-password', async (route) => {
    requestCount++;

    if (requestCount > maxRequests) {
      await route.respond({
        status: 429, // Too Many Requests
        contentType: 'application/json',
        body: JSON.stringify(API_RESPONSES.errorTooManyRequests()),
      });
      return;
    }

    // Allow request through
    await route.continue();
  });
}

/**
 * Setup email interception (mock email service)
 */
export async function setupEmailMock(page: Page, config: MockServerConfig = {}): Promise<EmailMockCapture> {
  const { delayMs = 100 } = config;
  const capturedEmails: EmailCapture[] = [];

  await page.route('**/api/email/**', async (route) => {
    await simulateDelay(delayMs);

    const request = route.request();
    const postData = request.postDataJSON() as any;

    capturedEmails.push({
      to: postData?.to,
      subject: postData?.subject,
      template: postData?.template,
      data: postData?.data,
      timestamp: new Date(),
    });

    // Mock success response
    await route.respond({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        messageId: `msg-${Date.now()}`,
      }),
    });
  });

  return new EmailMockCapture(capturedEmails);
}

/**
 * Setup database mock endpoints
 */
export async function setupDatabaseMocks(page: Page, config: MockServerConfig = {}): Promise<void> {
  const { delayMs = 100 } = config;

  // Mock GET /api/users/:id
  await page.route('**/api/users/*', async (route) => {
    await simulateDelay(delayMs);
    const url = new URL(route.request().url());
    const userId = url.pathname.split('/').pop();

    await route.respond({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          id: userId,
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          lastPasswordChange: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        },
      }),
    });
  });

  // Mock POST /api/audit-log
  await page.route('**/api/audit-log', async (route) => {
    await simulateDelay(delayMs);
    const postData = route.request().postDataJSON();

    await route.respond({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          id: `audit-${Date.now()}`,
          ...postData,
          createdAt: new Date().toISOString(),
        },
      }),
    });
  });
}

/**
 * Simulate network delay
 */
export async function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Email capture interface
 */
export interface EmailCapture {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  timestamp: Date;
}

/**
 * Email mock capture helper class
 */
export class EmailMockCapture {
  constructor(private capturedEmails: EmailCapture[]) {}

  /**
   * Get all captured emails
   */
  getAllEmails(): EmailCapture[] {
    return this.capturedEmails;
  }

  /**
   * Find email by recipient
   */
  findEmailToRecipient(email: string): EmailCapture | undefined {
    return this.capturedEmails.find((e) => e.to === email);
  }

  /**
   * Find email by subject
   */
  findEmailBySubject(subject: string | RegExp): EmailCapture | undefined {
    return this.capturedEmails.find((e) => {
      if (typeof subject === 'string') {
        return e.subject === subject;
      }
      return subject.test(e.subject);
    });
  }

  /**
   * Extract reset token from email (if included in template data)
   */
  extractResetTokenFromEmail(email: EmailCapture): string | null {
    if (email.data?.resetToken) {
      return email.data.resetToken;
    }
    if (email.data?.resetUrl) {
      const match = email.data.resetUrl.match(/token=([^&]*)/);
      return match ? match[1] : null;
    }
    return null;
  }

  /**
   * Clear all captured emails
   */
  clear(): void {
    this.capturedEmails.length = 0;
  }

  /**
   * Get count of emails sent
   */
  count(): number {
    return this.capturedEmails.length;
  }
}

/**
 * Disable all mocks (allow real requests)
 */
export async function disableMocks(page: Page): Promise<void> {
  // Unroute all mocked endpoints
  await page.unroute('**/api/**');
}

