# QA Agent Ecosystem — Troubleshooting Guide

Common errors and fixes when using the QA Agent Ecosystem, especially with GitHub Copilot.

---

## 1. `github-copilot-sdk not installed`

**Error:** `ModuleNotFoundError: No module named 'copilot'` or `github-copilot-sdk is not installed`

**Cause:** The Copilot SDK package is missing from the virtual environment.

**Fix:**
```bash
pip install -e ".[copilot]"
```

---

## 2. GitHub CLI Not Authenticated

**Error:** `gh auth status` fails, or Copilot sessions return 401 / permission errors.

**Cause:** GitHub CLI is not logged in.

**Fix:**
```bash
gh auth login --web
gh auth status   # verify it shows your GitHub username
qa-agent doctor  # re-run doctor to confirm
```

---

## 3. Session Timed Out

**Error:** `asyncio.TimeoutError` or `Copilot session timed out after 300s`

**Cause:** The orchestrator session exceeded the 5-minute (single agent) or 10-minute (orchestrator) timeout. Usually happens with very large prompts or slow network.

**Fix:**
- Break your input into smaller files
- Use a shorter `--template` (e.g. `--template default` instead of a verbose one)
- Run individual agents instead of the full orchestrator: `qa-agent run <agent> --input ...`
- Retry — transient network issues often self-resolve

---

## 4. No API Key Found

**Error:** `[red]No API key found for profile 'claude-sonnet-api'[/red]`

**Cause:** The required environment variable (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, etc.) is not set.

**Fix:**
```bash
# Copy the example and fill in your key
cp .env.example .env
# Edit .env with your real key, then re-run
qa-agent doctor
```

If you already have `.env`, ensure the variable name matches exactly what `models.yaml` specifies under `api_key_env:`.

---

## 5. Unknown Model Profile

**Error:** `KeyError: 'my-custom-profile'` or profile not found in `models.yaml`

**Cause:** The `--model` flag value doesn't match any profile name in `models.yaml`.

**Fix:**
```bash
qa-agent list-models   # see all valid profile names
```

Profile names are case-sensitive. Use exactly the name shown (e.g. `copilot-gpt4o`, not `copilot-GPT4o`).

---

## 6. Empty Output / Wrong Template

**Symptom:** Agent runs but produces generic or irrelevant output.

**Cause:** Wrong `--template` name, or the default template doesn't match your use case.

**Fix:**
```bash
qa-agent list-templates --agent <agent-name>   # see all valid template names
qa-agent run <agent> --input ... --template <correct-template-name>
```

---

## 7. Playwright: `npx` Not Found

**Error:** `FileNotFoundError: npx` or `'npx' is not recognized`

**Cause:** Node.js / npm is not installed, or the `playwright/node_modules` directory is missing.

**Fix:**
```bash
# Install Node.js from https://nodejs.org (LTS version)
# Then:
cd playwright
npm install
npx playwright install --with-deps
```

---

## 8. Windows: `asyncio` Event Loop Error

**Error:** `ValueError: set_wakeup_fd only works in main thread` or similar asyncio errors on Windows.

**Cause:** Python < 3.10, or a conflict with the `WindowsSelectorEventLoopPolicy`.

**Fix:**
- Confirm Python 3.10+: `python --version`
- The runner already sets `WindowsSelectorEventLoopPolicy` on Windows (see `runner.py` near the bottom). If errors persist, try running in a fresh virtual environment.

---

## 9. `qa-agent` Command Not Found

**Error:** `'qa-agent' is not recognized` or `command not found: qa-agent`

**Cause:** The package is not installed in the active virtual environment, or the venv is not activated.

**Fix:**
```bash
# Activate venv
source .venv/bin/activate          # Linux/macOS
.venv\Scripts\activate             # Windows CMD
.venv\Scripts\Activate.ps1         # Windows PowerShell

# Re-install if needed
pip install -e ".[copilot]"
qa-agent --help
```

---

## 10. Orchestration Fails Mid-Workflow

**Symptom:** Orchestration crashes or times out partway through a complex workflow.

**Fix — Resume from checkpoint:**
```bash
# Checkpoints are automatically saved to outputs/checkpoints/<session-id>.json
# Find the latest checkpoint:
ls outputs/checkpoints/

# Resume from it:
qa-agent orchestrate --input examples/sample_pbi.md --resume outputs/checkpoints/<session-id>.json
```

**Fix — Use dry-run to validate first:**
```bash
qa-agent orchestrate --input examples/sample_pbi.md --dry-run
```

---

## Still Stuck?

Run the diagnostic command:
```bash
qa-agent doctor
```

Use `--verbose` to see full request/response details:
```bash
qa-agent run <agent> --input <file> --verbose
```

Use `--log-file` to capture a structured log:
```bash
qa-agent run <agent> --input <file> --log-file debug.log
cat debug.log
```
