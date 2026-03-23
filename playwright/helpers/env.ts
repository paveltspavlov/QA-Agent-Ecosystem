/** Typed environment helpers. */

export function getBaseUrl(): string {
  return process.env.BASE_URL || 'http://localhost:3000';
}

export function getApiBaseUrl(): string {
  return process.env.API_BASE_URL || `${getBaseUrl()}/api`;
}

export function isCI(): boolean {
  return !!process.env.CI;
}

export function isHeadless(): boolean {
  return process.env.HEADLESS !== 'false';
}

export function validateRequiredEnvVars(vars: string[]): void {
  const missing = vars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
