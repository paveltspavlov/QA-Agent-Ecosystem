import { APIResponse, APIRequestContext, expect } from '@playwright/test';

/**
 * API Response Helpers
 * ============================================================================
 */

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

/**
 * API Seeding Helpers
 * ============================================================================
 * Use these to create and clean up test data via API endpoints.
 * Faster than UI automation and respects business logic.
 */

/**
 * Create a resource via API and return its ID.
 * Wraps APIRequestContext for seeding common patterns.
 */
export async function seedResource(
  request: APIRequestContext,
  endpoint: string,
  data: Record<string, unknown>,
): Promise<string> {
  const response = await request.post(endpoint, { data });
  expect(response.status()).toBe(201);
  const json = (await response.json()) as Record<string, unknown>;
  const id = (json.id || json._id || json.resourceId) as string;
  if (!id) throw new Error(`Could not extract ID from response: ${JSON.stringify(json)}`);
  return id;
}

/**
 * Delete a resource via API.
 * Gracefully handles 404 errors (resource already deleted).
 */
export async function deleteResource(request: APIRequestContext, endpoint: string): Promise<void> {
  const response = await request.delete(endpoint);
  // Accept 200-204 (success) or 404 (already deleted)
  expect([200, 201, 204, 404]).toContain(response.status());
}

/**
 * Batch delete multiple resources by ID.
 * Useful for cleanup in afterEach hooks.
 */
export async function batchDeleteResources(
  request: APIRequestContext,
  basePath: string,
  ids: string[],
): Promise<void> {
  const results = await Promise.allSettled(
    ids.map((id) => deleteResource(request, `${basePath}/${id}`)),
  );

  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length > 0) {
    console.warn(`[Cleanup] ${failed.length}/${ids.length} resource deletions failed (ignoring)`);
  }
}

/**
 * Fetch a resource via API.
 * Returns null if not found (404).
 */
export async function fetchResource<T = Record<string, unknown>>(
  request: APIRequestContext,
  endpoint: string,
): Promise<T | null> {
  const response = await request.get(endpoint);

  if (response.status() === 404) {
    return null;
  }

  expect(response.status()).toBe(200);
  return (await response.json()) as T;
}

/**
 * Update a resource via API.
 */
export async function updateResource(
  request: APIRequestContext,
  endpoint: string,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const response = await request.put(endpoint, { data });
  expect([200, 201]).toContain(response.status());
  return (await response.json()) as Record<string, unknown>;
}

