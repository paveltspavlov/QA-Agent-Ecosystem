/**
 * Token Utility Functions
 * 
 * Provides helpers for:
 * - Generating random tokens and strings
 * - Creating JWT tokens for testing
 * - Token validation and expiration checks
 */

import * as crypto from 'crypto';

/**
 * Generate a random string of specified length
 * Useful for creating mock tokens, IDs, etc.
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a JWT-like token (for testing only, not cryptographically signed)
 * In real tests, this should match your backend's JWT format
 */
export function generateJWT(payload: Record<string, any>): string {
  // Header (algorithm and type)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');

  // Payload
  const defaultPayload = {
    iat: Math.floor(Date.now() / 1000),
    ...payload,
  };
  const encodedPayload = Buffer.from(JSON.stringify(defaultPayload)).toString('base64url');

  // Signature (mock signature for testing)
  const mockSecret = 'test-secret-key';
  const signature = crypto
    .createHmac('sha256', mockSecret)
    .update(`${header}.${encodedPayload}`)
    .digest('base64url');

  return `${header}.${encodedPayload}.${signature}`;
}

/**
 * Decode a JWT token (for verification in tests)
 */
export function decodeJWT(token: string): Record<string, any> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(payload);
  } catch (e) {
    return null;
  }
}

/**
 * Check if a JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return false;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

/**
 * Get token expiration time
 */
export function getTokenExpirationTime(token: string): Date | null {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return null;

  return new Date(payload.exp * 1000);
}

/**
 * Generate a reset token link (URL safe)
 */
export function generateResetTokenLink(baseUrl: string, token: string): string {
  const encodedToken = encodeURIComponent(token);
  return `${baseUrl}/reset-password?token=${encodedToken}`;
}

/**
 * Extract token from reset URL
 */
export function extractTokenFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('token');
  } catch {
    return null;
  }
}

