#!/usr/bin/env bash
# Install QA Agent Ecosystem Copilot agents into the user-level Copilot agents folder.
#
# Copies every *.agent.md from .github/agents/ into ~/.copilot/agents/, then removes
# the copies from .github/agents/ to prevent Copilot from loading duplicates (it loads
# agents from both the workspace folder and the user folder).
#
# Usage:
#   ./install_copilot_agents.sh                    # install + remove workspace copies
#   ./install_copilot_agents.sh --force            # overwrite user-folder files without prompting
#   ./install_copilot_agents.sh --keep-workspace   # skip cleanup of .github/agents/

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
info()  { printf '\033[0;36m==> %s\033[0m\n' "$*"; }
ok()    { printf '\033[0;32mOK  %s\033[0m\n' "$*"; }
warn()  { printf '\033[0;33mWARN %s\033[0m\n' "$*"; }
fail()  { printf '\n\033[0;31mERROR: %s\033[0m\n' "$*"; exit 1; }

# ── Args ─────────────────────────────────────────────────────────────────────
FORCE=0
KEEP_WORKSPACE=0
for arg in "$@"; do
    case "$arg" in
        --force)          FORCE=1          ;;
        --keep-workspace) KEEP_WORKSPACE=1 ;;
        *) fail "Unknown argument: $arg"   ;;
    esac
done

# ── Locate source ─────────────────────────────────────────────────────────────
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$REPO_ROOT/.github/agents"

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

# ── Remove workspace-level copies to prevent Copilot from showing duplicates ─
cleaned=()

if [[ $KEEP_WORKSPACE -eq 0 ]]; then
    for filepath in "${AGENT_FILES[@]}"; do
        filename="$(basename "$filepath")"
        if [[ ! " ${skipped[*]} " =~ " $filename " ]]; then
            rm -f "$filepath"
            cleaned+=("$filename")
        fi
    done
fi

# ── Report ────────────────────────────────────────────────────────────────────
echo ""
[[ ${#installed[@]}   -gt 0 ]] && { ok "Installed (${#installed[@]}):";   printf '    %s\n' "${installed[@]}";   }
[[ ${#overwritten[@]} -gt 0 ]] && { ok "Updated (${#overwritten[@]}):";   printf '    %s\n' "${overwritten[@]}"; }
[[ ${#skipped[@]}     -gt 0 ]] && { warn "Skipped (${#skipped[@]}):";     printf '    %s\n' "${skipped[@]}";     }
if [[ ${#cleaned[@]}  -gt 0 ]]; then
    ok "Removed from .github/agents/ (${#cleaned[@]}) — no more duplicates:"
    printf '    %s\n' "${cleaned[@]}"
    echo ""
    warn "The .github/agents/ deletions are unstaged. Run:"
    printf '    git add -A .github/agents && git commit -m "chore: move agents to user-level copilot folder"\n'
fi

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
