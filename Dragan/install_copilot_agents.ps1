<#
.SYNOPSIS
  Install QA Agent Ecosystem Copilot agents into the user-level Copilot agents folder.

.DESCRIPTION
  Copies every *.agent.md file from .github/agents/ into %USERPROFILE%\.copilot\agents\
  so the agents are available in all workspaces, then removes the copies from
  .github/agents/ to prevent Copilot from loading duplicates (it loads agents from
  both the workspace folder and the user folder).

  Pass -KeepWorkspace to skip the cleanup of .github/agents/ (e.g. for CI/CD use
  or if you want workspace-scoped agents to remain for other contributors).

.PARAMETER Force
  Overwrite existing files in the user agents folder without prompting.

.PARAMETER KeepWorkspace
  Do NOT remove *.agent.md files from .github/agents/ after installing.
  Use this only when you intentionally want agents in both locations.

.EXAMPLE
  .\install_copilot_agents.ps1
  .\install_copilot_agents.ps1 -Force
  .\install_copilot_agents.ps1 -KeepWorkspace
#>
param(
    [switch]$Force,
    [switch]$KeepWorkspace
)

$ErrorActionPreference = "Stop"

function Info($msg)  { Write-Host "==> $msg" -ForegroundColor Cyan }
function Ok($msg)    { Write-Host "OK  $msg" -ForegroundColor Green }
function Warn($msg)  { Write-Host "WARN $msg" -ForegroundColor Yellow }
function Fail($msg)  { Write-Host ""; Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }

# ── Locate source ────────────────────────────────────────────────────────────
$RepoRoot  = $PSScriptRoot
$SourceDir = Join-Path $RepoRoot ".github\agents"

if (-not (Test-Path $SourceDir)) {
    Fail "Agent source folder not found: $SourceDir`nRun this script from the repo root."
}

$AgentFiles = Get-ChildItem -Path $SourceDir -Filter "*.agent.md"
if ($AgentFiles.Count -eq 0) {
    Fail "No *.agent.md files found in $SourceDir"
}

# ── Locate Copilot user-agents folder ────────────────────────────────────────
$DestDir = Join-Path $env:USERPROFILE ".copilot\agents"

Info "Source : $SourceDir ($($AgentFiles.Count) agents)"
Info "Dest   : $DestDir"

# ── Create destination if missing ────────────────────────────────────────────
if (-not (Test-Path $DestDir)) {
    Info "Creating $DestDir"
    New-Item -ItemType Directory -Path $DestDir | Out-Null
}

# ── Copy agents ──────────────────────────────────────────────────────────────
$installed   = [System.Collections.Generic.List[string]]::new()
$overwritten = [System.Collections.Generic.List[string]]::new()
$skipped     = [System.Collections.Generic.List[string]]::new()

foreach ($file in $AgentFiles) {
    $dest   = Join-Path $DestDir $file.Name
    $exists = Test-Path $dest

    if ($exists -and -not $Force) {
        $answer = Read-Host "  $($file.Name) already exists. Overwrite? [y/N]"
        if ($answer -notmatch '^[Yy]') {
            $skipped.Add($file.Name)
            continue
        }
    }

    Copy-Item -Path $file.FullName -Destination $dest -Force
    if ($exists) { $overwritten.Add($file.Name) } else { $installed.Add($file.Name) }
}

# ── Remove workspace-level copies to prevent Copilot from showing duplicates ─
$cleaned = [System.Collections.Generic.List[string]]::new()

if (-not $KeepWorkspace) {
    foreach ($file in $AgentFiles) {
        if ($skipped -notcontains $file.Name) {
            Remove-Item -Path $file.FullName -Force
            $cleaned.Add($file.Name)
        }
    }
}

# ── Report ───────────────────────────────────────────────────────────────────
Write-Host ""
if ($installed.Count -gt 0) {
    Ok "Installed ($($installed.Count)):"
    $installed | ForEach-Object { Write-Host "    $_" }
}
if ($overwritten.Count -gt 0) {
    Ok "Updated ($($overwritten.Count)):"
    $overwritten | ForEach-Object { Write-Host "    $_" }
}
if ($skipped.Count -gt 0) {
    Warn "Skipped ($($skipped.Count)):"
    $skipped | ForEach-Object { Write-Host "    $_" }
}
if ($cleaned.Count -gt 0) {
    Ok "Removed from .github/agents/ ($($cleaned.Count)) — no more duplicates:"
    $cleaned | ForEach-Object { Write-Host "    $_" }
    Write-Host ""
    Warn "The .github/agents/ deletions are unstaged. Run:"
    Write-Host "    git add -A .github/agents && git commit -m 'chore: move agents to user-level copilot folder'"
}

$total = $installed.Count + $overwritten.Count
if ($total -eq 0) {
    Write-Host ""
    Write-Host "Nothing installed (all files skipped)." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Done. $total agent(s) installed to:" -ForegroundColor Green
Write-Host "  $DestDir"
Write-Host ""
Write-Host "Reload VS Code (Developer: Reload Window) to pick up new agents."
Write-Host ""
