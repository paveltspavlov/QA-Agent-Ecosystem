import { APIResponse, expect } from '@playwright/test';

/** Assert JSON response with status check. */
export async function assertJsonResponse<T = unknown>(
  response: APIResponse,
  expectedStatus: number = 200,
): Promise<T> {
  expect(response.status()).toBe(expectedStatus);
  const body = await response.json();
  return body as T;
}

/** Assert response status code. */
export function assertStatus(response: APIResponse, expected: number): void {
  expect(response.status()).toBe(expected);
}

/** Log response details for debugging. */
export async function logResponse(response: APIResponse): Promise<void> {
  console.log(`${response.status()} ${response.url()}`);
  try {
    const body = await response.json();
    console.log(JSON.stringify(body, null, 2));
  } catch {
    console.log(await response.text());
  }
}

/** Build URL with query params. */
export function buildUrl(path: string, params?: Record<string, string>): string {
  if (!params) return path;
  const qs = new URLSearchParams(params).toString();
  return `${path}?${qs}`;
}
