## Priority Ranking

Assign priorities using the P0–P3 framework:

- **P0 (Critical)**: Core user flows with no tests or coverage — login, checkout, payment, authentication. Must be fixed/covered immediately; blocks release.
- **P1 (High)**: Business logic without negative tests — form validation, permissions, data integrity. High business impact if broken.
- **P2 (Medium)**: Edge cases and boundary conditions — boundary values, empty states, concurrent access. Important but not release-blocking.
- **P3 (Low)**: Cosmetic differences, accessibility improvements, minor UI variations. Nice to have; low business risk.
