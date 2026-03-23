/** Named timeout constants — never use magic numbers in tests. */
export const TIMEOUTS = {
  SHORT: 3_000,
  MEDIUM: 5_000,
  LONG: 10_000,
  NAVIGATION: 15_000,
  TEST: 30_000,
  CI_EXTENDED: 60_000,
} as const;
