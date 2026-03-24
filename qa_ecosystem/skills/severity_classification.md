## Severity Classification

Classify findings using the four-level severity scale:

- **CRITICAL**: Hardcoded secrets, API keys, private keys, passwords; core functionality completely missing or broken; data loss or security breach risk. Requires immediate remediation before deployment.
- **HIGH**: Exposed credentials in fixtures, committed `.env` files, connection strings; visible layout breaks; business logic failures; significant functionality impaired. Must be resolved before release.
- **MEDIUM**: Unsafe code patterns (`eval`, `innerHTML`), disabled SSL verification; cosmetic layout differences; non-critical functionality affected. Should be resolved in the current sprint.
- **LOW**: Internal URLs, style issues, minor configuration concerns; copy/style variances; minor UI inconsistencies. Address in backlog; low business risk.
