#!/usr/bin/env bash
# Install the QA Agent Ecosystem into a local .venv on Linux/macOS.
#
# Creates .venv if missing, upgrades pip/setuptools/wheel, removes any prior
# install of qa-agent-ecosystem (to clear stale PEP 660 editable finders that
# can cause `ModuleNotFoundError: No module named 'qa_ecosystem'`), then runs
# `pip install -e .` and verifies the install by importing the package.
#
# All pip invocations use the venv's python by absolute path, so the install
# is correct regardless of whether the venv is "activated".
#
# Usage:
#   ./install.sh
#   ./install.sh --extras copilot
#   ./install.sh --force

set -euo pipefail

EXTRAS=""
FORCE=0

while [ $# -gt 0 ]; do
    case "$1" in
        --extras)
            EXTRAS="${2:-}"
            shift 2
            ;;
        --extras=*)
            EXTRAS="${1#*=}"
            shift
            ;;
        --force)
            FORCE=1
            shift
            ;;
        -h|--help)
            sed -n '2,16p' "$0"
            exit 0
            ;;
        *)
            echo "ERROR: unknown argument: $1" >&2
            exit 2
            ;;
    esac
done

case "$EXTRAS" in
    ""|copilot|anthropic|claude|openai|all) ;;
    *)
        echo "ERROR: --extras must be one of: copilot, anthropic, claude, openai, all" >&2
        exit 2
        ;;
esac

info() { printf '\033[36m==> %s\033[0m\n' "$*"; }
ok()   { printf '\033[32mOK  %s\033[0m\n' "$*"; }
fail() { printf '\n\033[31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
PYPROJECT="$REPO_ROOT/pyproject.toml"

# 1. Sanity: run from repo root.
[ -f "$PYPROJECT" ] || fail "pyproject.toml not found at $PYPROJECT. Run from repo root."
grep -q 'name *= *"qa-agent-ecosystem"' "$PYPROJECT" \
    || fail "pyproject.toml at $PYPROJECT is not the qa-agent-ecosystem project."

# 2. Find a system python (prefer python3).
SYS_PY="$(command -v python3 || command -v python || true)"
[ -n "$SYS_PY" ] || fail "python3 not on PATH. Install Python 3.10+ and retry."

VER="$("$SYS_PY" -c 'import sys; print("%d.%d" % sys.version_info[:2])')"
MAJOR="${VER%%.*}"
MINOR="${VER##*.}"
if [ "$MAJOR" -lt 3 ] || { [ "$MAJOR" -eq 3 ] && [ "$MINOR" -lt 10 ]; }; then
    fail "Python 3.10+ required (found $VER)."
fi
ok "Python $VER detected at $SYS_PY"

VENV_DIR="$REPO_ROOT/.venv"
VENV_PY="$VENV_DIR/bin/python"

# 3. Force-rebuild venv if requested.
if [ "$FORCE" -eq 1 ] && [ -d "$VENV_DIR" ]; then
    info "Removing existing .venv (--force)"
    rm -rf "$VENV_DIR"
fi

# 4. Create venv if missing.
if [ ! -x "$VENV_PY" ]; then
    info "Creating virtual environment at $VENV_DIR"
    "$SYS_PY" -m venv "$VENV_DIR"
fi
ok "Using venv python: $VENV_PY"

# 5. Upgrade bootstrap toolchain.
info "Upgrading pip, setuptools, wheel"
"$VENV_PY" -m pip install --upgrade pip setuptools wheel

# 6. Remove any prior install (clears stale PEP 660 finders).
info "Removing any prior install of qa-agent-ecosystem"
"$VENV_PY" -m pip uninstall -y qa-agent-ecosystem >/dev/null 2>&1 || true

# 7. Editable install.
if [ -n "$EXTRAS" ]; then
    TARGET=".[$EXTRAS]"
else
    TARGET="."
fi
info "Installing (editable): pip install -e \"$TARGET\""
"$VENV_PY" -m pip install -e "$TARGET"

# 8. Verify.
info "Verifying install"
if ! VERSION="$("$VENV_PY" -c 'import qa_ecosystem; print(qa_ecosystem.__version__)' 2>&1)"; then
    echo "$VERSION" >&2
    fail "qa_ecosystem still not importable after install. See docs/TROUBLESHOOTING.md section 0."
fi
ok "Install verified: qa_ecosystem $VERSION"

QA_AGENT="$VENV_DIR/bin/qa-agent"
[ -x "$QA_AGENT" ] || fail "qa-agent not found at $QA_AGENT after install."
if ! "$QA_AGENT" list-agents >/dev/null 2>&1; then
    "$QA_AGENT" list-agents || true
    fail "qa-agent failed to run. See docs/TROUBLESHOOTING.md."
fi
ok "qa-agent list-agents executed successfully"

# 9. Next steps.
cat <<EOF

Install complete.

Next steps:
  1. Activate the venv:    source .venv/bin/activate
  2. Run the bootstrap:    qa-agent setup
  3. Troubleshooting:      docs/TROUBLESHOOTING.md

EOF
