# QA Agent Ecosystem — Troubleshooting Guide

Common errors and fixes when using the QA Agent Ecosystem, especially with GitHub Copilot.

---

## 0. `ModuleNotFoundError: No module named 'qa_ecosystem'` after install

**Error:** Running `qa-agent <anything>` raises `ModuleNotFoundError: No module named 'qa_ecosystem'` even though `pip install -e .` reported success.

**Cause:** Editable installs (`pip install -e .`) bake an absolute path into a finder file in site-packages. Common triggers:

- A previous install on the same machine left a stale finder in user-site or global site-packages.
- `pip` was invoked from a non-venv Python (e.g., venv activation silently failed under PowerShell's execution policy).
- The repo folder was moved or re-extracted after install.

**Fix:** Re-run the installer with `-Force` (Windows) / `--force` (Linux/macOS). It recreates `.venv` and uninstalls any prior copy of the package before re-installing.

```powershell
# Windows
.\install.ps1 -Force
```

```bash
# Linux / macOS
./install.sh --force
```

If you must fix manually, always invoke pip via the venv's python by absolute path so shell `PATH` cannot point at the wrong interpreter:

```powershell
# Windows — from the repo root
.\.venv\Scripts\python.exe -m pip uninstall -y qa-agent-ecosystem
.\.venv\Scripts\python.exe -m pip install -e .
.\.venv\Scripts\python.exe -c "import qa_ecosystem; print(qa_ecosystem.__version__)"
```

The third command must print `2.0.0`. If it doesn't, your `pip` is not pointing at the venv's Python.

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

> **Windows note:** The CLI uses `shutil.which("npx")` to locate `npx.cmd` automatically — no extra steps needed on Windows once Node.js is on your PATH.

---

## 8. Windows: `UnicodeEncodeError` in Terminal

**Error:** `UnicodeEncodeError: 'charmap' codec can't encode character '\u2192'`

**Cause:** Windows terminals default to `cp1252` encoding, which cannot encode Unicode characters (such as `→`) used in the CLI help text.

**Fix:** This is handled automatically — the CLI calls `sys.stdout.reconfigure(encoding='utf-8')` at startup. If you still see the error, set the terminal encoding manually before running:

```powershell
# PowerShell / CMD
chcp 65001
qa-agent --help
```

Or set it permanently in your environment:
```powershell
$env:PYTHONUTF8 = "1"
```

---

## 10. Windows: `asyncio` Event Loop Error

**Error:** `ValueError: set_wakeup_fd only works in main thread` or similar asyncio errors on Windows.

**Cause:** Python < 3.10, or a conflict with the `WindowsSelectorEventLoopPolicy`.

**Fix:**
- Confirm Python 3.10+: `python --version`
- The runner already sets `WindowsSelectorEventLoopPolicy` on Windows (see `runner.py` near the bottom). If errors persist, try running in a fresh virtual environment.

---

## 11. `qa-agent` Command Not Found

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

## 12. Orchestration Fails Mid-Workflow

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
