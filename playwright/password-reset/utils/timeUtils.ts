/**
 * Time Utility Functions for Testing
 * 
 * Provides helpers for:
 * - Mocking time passage (for 24-hour expiration tests)
 * - Controlling clock for deterministic tests
 * - Time-based assertions
 */

/**
 * Mock time utilities for testing expiration scenarios
 * NOTE: In a real Playwright environment, use jest.useFakeTimers() or
 * manipulate system time in test fixtures
 */
export class TimeUtils {
  private static originalDateNow: typeof Date.now;
  private static mockTime: number | null = null;

  /**
   * Start mocking time at a specific timestamp
   */
  static mockTimeAt(timestamp: number): void {
    this.originalDateNow = Date.now;
    this.mockTime = timestamp;

    // Mock Date.now() - Note: This is limited in Playwright as it runs in browser
    // For full time mocking, use MSW or API interception instead
    console.log(`[TimeUtils] Mocking time at: ${new Date(timestamp).toISOString()}`);
  }

  /**
   * Advance mocked time by specified duration (in milliseconds)
   */
  static advanceTimeBy(duration: number): void {
    if (this.mockTime === null) {
      console.warn('[TimeUtils] Time not mocked. Call mockTimeAt() first.');
      return;
    }
    this.mockTime += duration;
    console.log(
      `[TimeUtils] Advanced time by ${duration}ms. Current: ${new Date(this.mockTime).toISOString()}`,
    );
  }

  /**
   * Get current mocked time
   */
  static getCurrentTime(): number {
    return this.mockTime ?? Date.now();
  }

  /**
   * Restore real time
   */
  static restoreRealTime(): void {
    if (this.originalDateNow) {
      this.mockTime = null;
      console.log('[TimeUtils] Restored real time');
    }
  }

  /**
   * Check if a date is in the past
   */
  static isInThePast(date: Date): boolean {
    return date.getTime() < this.getCurrentTime();
  }

  /**
   * Check if a date is in the future
   */
  static isInTheFuture(date: Date): boolean {
    return date.getTime() > this.getCurrentTime();
  }

  /**
   * Get time until expiration in hours
   */
  static getHoursUntilExpiration(expirationDate: Date): number {
    const diff = expirationDate.getTime() - this.getCurrentTime();
    return diff / (1000 * 60 * 60); // Convert to hours
  }

  /**
   * Check if token expires within specified hours
   */
  static expiresWithin(expirationDate: Date, hours: number): boolean {
    const hoursLeft = this.getHoursUntilExpiration(expirationDate);
    return hoursLeft <= hours && hoursLeft > 0;
  }
}

/**
 * Time duration constants
 */
export const TIME_CONSTANTS = {
  ONE_SECOND: 1000,
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
};

/**
 * Helper to create a date in the future
 */
export function futureDate(hoursFromNow: number): Date {
  return new Date(Date.now() + hoursFromNow * TIME_CONSTANTS.ONE_HOUR);
}

/**
 * Helper to create a date in the past
 */
export function pastDate(hoursAgo: number): Date {
  return new Date(Date.now() - hoursAgo * TIME_CONSTANTS.ONE_HOUR);
}

/**
 * Format duration for logging
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

