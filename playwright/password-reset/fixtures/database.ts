/**
 * Database Utilities for Test Setup & Cleanup
 * 
 * Provides helpers for:
 * - Seeding test users before tests
 * - Cleaning up after tests
 * - Managing database state (reset tokens, sessions, audit logs)
 * - Querying test data
 * 
 * NOTE: For demoqa.com which has no real backend, these are mock implementations.
 * Replace with actual DB calls for integration tests against a real backend.
 */

import { APIRequestContext } from '@playwright/test';
import { TestUser } from './testData';

/**
 * Mock database for test isolation
 * In production, this would connect to a real database or API
 */
export class TestDatabase {
  private static readonly baseUrl: string = process.env.BASE_URL || 'https://demoqa.com';
  private static readonly apiKey: string = process.env.API_KEY || 'test-key';

  /**
   * Create a test user in the database
   */
  static async createUser(request: APIRequestContext, user: TestUser): Promise<string> {
    try {
      const response = await request.post(`${this.baseUrl}/api/users`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        data: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          password: user.currentPassword,
        },
      });

      if (!response.ok()) {
        console.warn(`[DB] Failed to create user ${user.email}: ${response.status()}`);
        return user.id; // Return mock ID if API fails
      }

      const data = await response.json();
      return data.id || user.id;
    } catch (error) {
      console.warn(`[DB] Error creating user: ${error}`);
      return user.id;
    }
  }

  /**
   * Delete a test user
   */
  static async deleteUser(request: APIRequestContext, userId: string): Promise<void> {
    try {
      const response = await request.delete(`${this.baseUrl}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      if (!response.ok()) {
        console.warn(`[DB] Failed to delete user ${userId}: ${response.status()}`);
      }
    } catch (error) {
      console.warn(`[DB] Error deleting user: ${error}`);
    }
  }

  /**
   * Create a reset token for a user
   */
  static async createResetToken(
    request: APIRequestContext,
    email: string,
    expiresInHours: number = 24,
  ): Promise<string> {
    try {
      const response = await request.post(`${this.baseUrl}/api/reset-tokens`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        data: {
          email,
          expiresIn: expiresInHours * 60 * 60, // Convert to seconds
        },
      });

      if (!response.ok()) {
        console.warn(`[DB] Failed to create reset token for ${email}: ${response.status()}`);
        return `mock-token-${Date.now()}`;
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.warn(`[DB] Error creating reset token: ${error}`);
      return `mock-token-${Date.now()}`;
    }
  }

  /**
   * Validate a reset token
   */
  static async validateResetToken(request: APIRequestContext, token: string): Promise<boolean> {
    try {
      const response = await request.get(`${this.baseUrl}/api/validate-token?token=${token}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      return response.ok();
    } catch {
      return false;
    }
  }

  /**
   * Mark token as used (consumed)
   */
  static async consumeResetToken(request: APIRequestContext, token: string): Promise<void> {
    try {
      await request.post(`${this.baseUrl}/api/reset-tokens/${token}/consume`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
    } catch (error) {
      console.warn(`[DB] Error consuming token: ${error}`);
    }
  }

  /**
   * Update user password
   */
  static async updateUserPassword(
    request: APIRequestContext,
    userId: string,
    newPassword: string,
  ): Promise<boolean> {
    try {
      const response = await request.put(`${this.baseUrl}/api/users/${userId}/password`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        data: { password: newPassword },
      });

      return response.ok();
    } catch (error) {
      console.warn(`[DB] Error updating password: ${error}`);
      return false;
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(request: APIRequestContext, email: string): Promise<TestUser | null> {
    try {
      const response = await request.get(`${this.baseUrl}/api/users?email=${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      if (!response.ok()) {
        return null;
      }

      const data = await response.json();
      return data?.data?.[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Clear all test data (cleanup after tests)
   */
  static async clearTestData(request: APIRequestContext, userIds: string[]): Promise<void> {
    const promises = userIds.map((id) => this.deleteUser(request, id));
    await Promise.all(promises);
    console.log(`[DB] Cleaned up ${userIds.length} test users`);
  }

  /**
   * Log audit trail for password reset
   */
  static async logAuditEvent(
    request: APIRequestContext,
    userId: string,
    action: string,
    details: Record<string, any>,
  ): Promise<void> {
    try {
      await request.post(`${this.baseUrl}/api/audit-log`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        data: {
          userId,
          action,
          details,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.warn(`[DB] Error logging audit event: ${error}`);
    }
  }

  /**
   * Get audit logs for a user
   */
  static async getAuditLogs(request: APIRequestContext, userId: string): Promise<any[]> {
    try {
      const response = await request.get(
        `${this.baseUrl}/api/audit-log?userId=${userId}&action=password_reset`,
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
        },
      );

      if (!response.ok()) {
        return [];
      }

      const data = await response.json();
      return data.data || [];
    } catch {
      return [];
    }
  }

  /**
   * Lock user account (security measure)
   */
  static async lockUserAccount(request: APIRequestContext, userId: string): Promise<void> {
    try {
      await request.put(`${this.baseUrl}/api/users/${userId}/lock`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
    } catch (error) {
      console.warn(`[DB] Error locking account: ${error}`);
    }
  }

  /**
   * Unlock user account
   */
  static async unlockUserAccount(request: APIRequestContext, userId: string): Promise<void> {
    try {
      await request.put(`${this.baseUrl}/api/users/${userId}/unlock`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
    } catch (error) {
      console.warn(`[DB] Error unlocking account: ${error}`);
    }
  }

  /**
   * Check if user is locked
   */
  static async isUserLocked(request: APIRequestContext, userId: string): Promise<boolean> {
    try {
      const response = await request.get(`${this.baseUrl}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      if (!response.ok()) return false;

      const data = await response.json();
      return data.data?.locked || false;
    } catch {
      return false;
    }
  }
}

/**
 * Fixture for automatic database cleanup
 */
export async function withDatabaseCleanup(
  request: APIRequestContext,
  test: () => Promise<string[]>,
): Promise<void> {
  const createdUserIds: string[] = [];

  try {
    // Run test and collect user IDs
    const userIds = await test();
    createdUserIds.push(...userIds);
  } finally {
    // Cleanup
    if (createdUserIds.length > 0) {
      await TestDatabase.clearTestData(request, createdUserIds);
    }
  }
}

