#!/usr/bin/env bash
# Install QA Agent Ecosystem Copilot agents into the user-level Copilot agents folder.
#
# Copies every *.agent.md from Dragan/ into ~/.copilot/agents/. Dragan/ is not
# auto-loaded by Copilot, so there is no risk of duplicate agents in the picker.
#
# Usage:
#   ./Dragan/install_copilot_agents.sh           # install agents
#   ./Dragan/install_copilot_agents.sh --force   # overwrite without prompting

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
info()  { printf '\033[0;36m==> %s\033[0m\n' "$*"; }
ok()    { printf '\033[0;32mOK  %s\033[0m\n' "$*"; }
warn()  { printf '\033[0;33mWARN %s\033[0m\n' "$*"; }
fail()  { printf '\n\033[0;31mERROR: %s\033[0m\n' "$*"; exit 1; }

# ── Args ─────────────────────────────────────────────────────────────────────
FORCE=0
for arg in "$@"; do
    case "$arg" in
        --force) FORCE=1 ;;
        *) fail "Unknown argument: $arg" ;;
    esac
done

# ── Locate source ─────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
SOURCE_DIR="$REPO_ROOT/Dragan"

[[ -d "$SOURCE_DIR" ]] || fail "Agent source folder not found: $SOURCE_DIR"

mapfile -t AGENT_FILES < <(find "$SOURCE_DIR" -maxdepth 1 -name '*.agent.md' | sort)
[[ ${#AGENT_FILES[@]} -gt 0 ]] || fail "No *.agent.md files found in $SOURCE_DIR"

# ── Locate Copilot user-agents folder ─────────────────────────────────────────
DEST_DIR="$HOME/.copilot/agents"

info "Source : $SOURCE_DIR (${#AGENT_FILES[@]} agents)"
info "Dest   : $DEST_DIR"

# ── Create destination if missing ─────────────────────────────────────────────
mkdir -p "$DEST_DIR"

# ── Copy agents ───────────────────────────────────────────────────────────────
installed=()
overwritten=()
skipped=()

for filepath in "${AGENT_FILES[@]}"; do
    filename="$(basename "$filepath")"
    dest="$DEST_DIR/$filename"

    if [[ -f "$dest" ]]; then
        if [[ $FORCE -eq 0 ]]; then
            read -r -p "  $filename already exists. Overwrite? [y/N] " answer
            if [[ ! "$answer" =~ ^[Yy]$ ]]; then
                skipped+=("$filename")
                continue
            fi
        fi
        cp "$filepath" "$dest"
        overwritten+=("$filename")
    else
        cp "$filepath" "$dest"
        installed+=("$filename")
    fi
done

# ── Report ────────────────────────────────────────────────────────────────────
echo ""
[[ ${#installed[@]}   -gt 0 ]] && { ok "Installed (${#installed[@]}):";   printf '    %s\n' "${installed[@]}";   }
[[ ${#overwritten[@]} -gt 0 ]] && { ok "Updated (${#overwritten[@]}):";   printf '    %s\n' "${overwritten[@]}"; }
[[ ${#skipped[@]}     -gt 0 ]] && { warn "Skipped (${#skipped[@]}):";     printf '    %s\n' "${skipped[@]}";     }

total=$(( ${#installed[@]} + ${#overwritten[@]} ))
if [[ $total -eq 0 ]]; then
    echo ""
    warn "Nothing installed (all files skipped)."
    exit 0
fi

echo ""
printf '\033[0;32mDone. %d agent(s) installed to:\033[0m\n' "$total"
echo "  $DEST_DIR"
echo ""
echo "Reload VS Code (Developer: Reload Window) to pick up new agents."
echo ""
