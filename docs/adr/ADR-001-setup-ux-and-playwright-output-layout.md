# ADR-001: Setup UX simplification and per-session Playwright output layout

**Status:** Accepted
**Date:** 2026-05-06
**Deciders:** Project maintainer

## Context

Two unrelated frictions surfaced for new and returning users:

1. **Setup is multi-step and easy to get wrong.** Installation requires picking the
   right `pip install -e ".[…]"` extra, running `gh auth login`, installing
   Playwright, and creating an `.env` — five separate commands across two README
   sections. The default model role (`claude-sonnet-api`) requires an Anthropic
   key the user may not have, even though Copilot is the documented "primary"
   provider. When a user runs their first command without a key, they get a raw
   stack trace.
2. **Generated Playwright tests pollute the committed scaffold.** `qa-agent
   playwright-gen` writes new TypeScript files into `playwright/tests/`, the same
   directory that contains the committed scaffold (config, fixtures, helpers,
   page objects). Generated tests get mixed with framework code, accumulate
   across runs, and end up tracked in git. There is no per-target isolation, so
   running `playwright-gen` against a new URL overwrites or interleaves with the
   previous target's tests. Re-running and reporting against a specific target
   is awkward.

The session system introduced in v2.2 (`outputs/{app}/{timestamp}/`) already
solves the isolation problem for agent results, bugs, and reports. Playwright
tests are the remaining artifact type that does not use it.

## Decision

**Part A — Setup UX**

1. Add `qa-agent setup` as a single end-to-end interactive bootstrap that wraps
   `init`, dependency installation, `gh auth login`, Playwright install, and
   `doctor` validation.
2. Change the `default` role in `models.yaml` from `claude-sonnet-api` to
   `copilot-claude-haiku`. Copilot is the documented primary provider and Haiku
   is the cost-efficient choice; users who want Sonnet still get the
   `copilot-claude-sonnet` profile via `-m`.
3. When a command fails to resolve an API key for the chosen provider, print a
   short, actionable error pointing the user to `qa-agent setup` instead of a
   raw stack trace.
4. Add `docs/CONFIG_PRECEDENCE.md` documenting how `models.yaml`, env vars, the
   root-level `--role` flag, and the per-command `-m/--model` flag combine.

Out of scope: README consolidation, removing existing root-level guides.

**Part B — Playwright output layout**

1. `qa-agent playwright-gen` defaults `--output-dir` to
   `outputs/{app}/{timestamp}/playwright-tests/` (resolved via `session.sub_dir`).
   Each generation run produces a fresh, isolated suite under its own session.
2. The command auto-generates a per-session `playwright.config.ts` next to the
   generated tests. The config inherits the committed scaffold's defaults and
   only overrides `testDir` to point at the generated folder, so generated
   tests can use the scaffold's fixtures, helpers, and page objects.
3. `qa-agent playwright-run` accepts `--app <name>` and `--session <timestamp>`.
   Without flags it runs the latest session for the most recently active app.
   With `--app` only, it runs the latest session for that app. With both, it
   runs that exact session. The command `cd`s into the session folder and runs
   `npx playwright test --config <session>/playwright.config.ts`.
4. Existing showcase artifacts under `playwright/tests/`, `playwright/specs/`,
   and `playwright/explore-*.ts` migrate to `outputs/demoqa-com/legacy/` so
   they remain locally available but are no longer tracked in git
   (`outputs/` is already gitignored).
5. The committed `playwright/` scaffold keeps `playwright.config.ts`,
   `fixtures/`, `helpers/`, `pages/`, `auth/`, `package.json`, and
   `tsconfig.json`. These are framework code, not generated artifacts.

## Options Considered

### Part B — test file location

#### Option A: Per-session, `outputs/{app}/{timestamp}/playwright-tests/` (chosen)

| Dimension | Assessment |
|-----------|------------|
| Isolation | High — each run is fully traceable |
| Re-run UX | Medium — needs `--app`/`--session` resolution |
| Storage | Higher — duplicates per run |
| Implementation | Small — extends the existing session system |

**Pros:** Matches the existing session model exactly. Reports, bugs, and tests
for one run live together. No collision between runs.
**Cons:** Re-running an "old" suite needs an explicit `--session`. Disk usage
grows linearly with runs (mitigated by manual `outputs/` cleanup).

#### Option B: Per-app, `outputs/{app}/playwright-tests/` (rejected)

**Pros:** Stable on-disk path, easy to re-run.
**Cons:** New generations must merge or clobber, breaking traceability.
Reports timestamped under `outputs/{app}/{timestamp}/` but tests sitting
outside that timestamp violates the "one folder per run" invariant.

#### Option C: Self-contained `outputs/{app}/playwright/` with full scaffold copy (rejected)

**Pros:** Each app is fully portable.
**Cons:** Duplicates the scaffold per app; updates to fixtures or page objects
must be propagated everywhere. Heavy, fights the existing single-scaffold model.

### Part A — default model

The Copilot Haiku profile was chosen over Sonnet to minimize cost on the most
common path; users who want higher quality flip with `-m copilot-claude-sonnet`
or via `--role default=copilot-claude-sonnet`.

## Trade-off Analysis

The dominant trade-off in Part B is **disk usage vs. traceability**. We accept
linear disk growth in exchange for a simple, unambiguous "the tests for this
run live here" guarantee that matches every other artifact type. Disk pressure
is a manual cleanup concern, not a correctness concern.

The dominant trade-off in Part A is **first-run friction vs. flexibility**. We
collapse five commands into one and pick a sensible default, but every override
remains possible — `models.yaml`, `--role`, and `-m` all still work as before.

## Consequences

**Easier**
- New users run `qa-agent setup` → ready to use one command.
- A failed run gives a one-line, one-link recovery message.
- "Run that test suite again" reduces to `qa-agent playwright-run --app demoqa-com`.
- Reports correlate cleanly to the test files they were generated from (same
  session dir).

**Harder**
- Generated tests can no longer reference each other across runs by relative
  path; each session is its own world.
- Fixture/page-object imports from the scaffold must use the absolute scaffold
  path or a TypeScript path alias (the auto-generated config sets
  `tsconfig.json` `paths` to point at `playwright/`).

**To revisit**
- Disk pressure: if `outputs/` grows large, add `qa-agent prune-sessions
  --older-than 30d`.
- Cumulative regression suites: if users want a stable suite per app, add
  `qa-agent playwright-promote --session <ts>` to copy a session's tests into
  a permanent per-app folder. Not built now — wait for demand.

## Action Items

1. [x] `qa_ecosystem/models.yaml`: switch `roles.default` to `copilot-claude-haiku`.
2. [x] `qa_ecosystem/commands/setup.py`: add `setup` subcommand.
3. [x] `qa_ecosystem/runner.py`: friendly missing-key error.
4. [x] `docs/CONFIG_PRECEDENCE.md`: new doc.
5. [x] `qa_ecosystem/commands/playwright.py`: route `playwright-gen` to session
   dir, auto-generate per-session config, add `--app/--session` to `playwright-run`.
6. [x] Migrate `playwright/tests/`, `playwright/specs/`, `playwright/explore-*.ts`
   to `outputs/demoqa-com/legacy/` (locally only — `outputs/` is gitignored).
