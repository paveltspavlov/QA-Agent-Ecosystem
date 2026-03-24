## Selector Strategy

Use selectors in strict priority order:

1. **`getByRole()`** — BEST: use ARIA roles and accessible names (e.g., `getByRole('button', { name: 'Submit' })`)
2. **`getByTestId()`** — GOOD: use `data-testid` attributes when roles are ambiguous
3. **`getByText()` / `getByLabel()`** — ACCEPTABLE: for visible text or form labels
4. **CSS selectors** — LAST RESORT: only when no semantic alternative exists
5. **XPath** — NEVER: do not use XPath selectors under any circumstances
