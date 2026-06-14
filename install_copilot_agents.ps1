<#
.SYNOPSIS
  Install QA Agent Ecosystem Copilot agents into VS Code's user-level agents folder.

.DESCRIPTION
  Copies every *.agent.md file from .github/agents/ into the user-level Copilot
  agents directory so the agents are available in all workspaces, not just this repo.

  User agents folder (created if absent):
    %USERPROFILE%\.copilot\agents\

.PARAMETER Force
  Overwrite existing agent files without prompting.

.EXAMPLE
  .\install_copilot_agents.ps1
  .\install_copilot_agents.ps1 -Force
#>
param(
    [switch]$Force
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
$installed  = [System.Collections.Generic.List[string]]::new()
$overwritten = [System.Collections.Generic.List[string]]::new()
$skipped    = [System.Collections.Generic.List[string]]::new()

foreach ($file in $AgentFiles) {
    $dest = Join-Path $DestDir $file.Name
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
