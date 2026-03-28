# Workflow 14 -- Release Sign-off: SauceDemo v3.2.0

Run Workflow 14 — Release Sign-off / Go-Live Checklist.

## Release

- Version: v3.2.0
- Release date: 2026-04-01
- App URL (staging): https://www.saucedemo.com
- Release branch: release/v3.2.0

## Scope of Changes

### New Features
- **Wishlist** -- users can save items to a wishlist from the product listing page
- **Order history** -- logged-in users can view past orders with status tracking
- **Product search** -- search bar on the inventory page with instant filtering

### Bug Fixes
- Fixed: cart badge count showing negative numbers after rapid add/remove
- Fixed: checkout form accepting empty postal code on slow connections
- Fixed: product images not loading for "problem_user" account

### Infrastructure
- Upgraded React from 17 to 18
- Migrated from Create React App to Vite
- Updated all npm dependencies to latest stable versions

## Requirements in Scope

| ID | Requirement | Priority |
|----|-------------|----------|
| PBI-2090 | Wishlist -- add/remove items, persist across sessions | P0 |
| PBI-2091 | Order history -- view past orders with status | P1 |
| PBI-2092 | Product search with instant filtering | P1 |
| BUG-1044 | Cart badge negative count | P0 |
| BUG-1051 | Empty postal code accepted | P0 |
| BUG-1053 | Problem user broken images | P2 |

## Quality Gates

- Coverage threshold: >= 80% of in-scope requirements must have passing tests
- Critical failures (P0): 0 allowed
- High failures (P1): 0 allowed
- Medium failures (P2): <= 3 allowed
- Flaky test rate: < 5% (no more than 2 flaky tests in the suite)
- All @smoke tests must pass on Chromium, Firefox, and WebKit

## Regression Suite

- Path: playwright/tests/
- Smoke tag: @smoke (core user journeys)
- Regression tag: @regression (full suite)
- Estimated run time: ~8 minutes (chromium), ~15 minutes (all browsers)

## Sign-off Approvers

- QA Lead: Pavel Spavlov
- Product Owner: (stakeholder name)
- Engineering Lead: (tech lead name)

## Rollback Plan

- Revert to v3.1.2 tag if any P0 failures are found post-deployment
- Feature flags: wishlist and order history can be toggled off independently
- Database: no schema migrations in this release (safe to rollback)

## Pre-Deployment Checklist (manual)

- [ ] All CI pipelines green on release branch
- [ ] Staging environment matches production config
- [ ] Feature flags set to ON for new features
- [ ] Monitoring dashboards updated with new feature metrics
- [ ] On-call engineer confirmed for deployment window
