<#
.SYNOPSIS
  Install the QA Agent Ecosystem into a local .venv on Windows.

.DESCRIPTION
  Creates .venv if missing, upgrades pip/setuptools/wheel, removes any prior
  install of qa-agent-ecosystem (to clear stale PEP 660 editable finders that
  can cause `ModuleNotFoundError: No module named 'qa_ecosystem'`), then runs
  `pip install -e .` and verifies the install by importing the package.

  All pip invocations use the venv's python.exe by absolute path, so the
  install is correct regardless of shell PATH state or PowerShell execution
  policy issues with venv activation.

.PARAMETER Extras
  Optional extras group to install: copilot | anthropic | claude | openai | all.

.PARAMETER Force
  Delete and recreate .venv from scratch before installing. Use when a previous
  install left the environment in a broken state.

.EXAMPLE
  .\install.ps1
  .\install.ps1 -Extras copilot
  .\install.ps1 -Force
#>
param(
    [ValidateSet("", "copilot", "anthropic", "claude", "openai", "all")]
    [string]$Extras = "",
    [switch]$Force
)

$ErrorActionPreference = "Stop"

function Fail($msg) {
    Write-Host ""
    Write-Host "ERROR: $msg" -ForegroundColor Red
    exit 1
}

function Info($msg)  { Write-Host "==> $msg" -ForegroundColor Cyan }
function Ok($msg)    { Write-Host "OK  $msg" -ForegroundColor Green }

$RepoRoot = $PSScriptRoot
$PyProject = Join-Path $RepoRoot "pyproject.toml"

# 1. Sanity: run from repo root.
if (-not (Test-Path $PyProject)) {
    Fail "pyproject.toml not found at $PyProject. Run this script from the repo root."
}
if (-not (Select-String -Path $PyProject -Pattern 'name\s*=\s*"qa-agent-ecosystem"' -Quiet)) {
    Fail "pyproject.toml at $PyProject is not the qa-agent-ecosystem project."
}

# 2. Verify python on PATH and version >= 3.10.
$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    Fail "python is not on PATH. Install Python 3.10+ and retry."
}
$versionLine = & python -c "import sys; print('%d.%d' % sys.version_info[:2])"
$parts = $versionLine.Trim().Split('.')
$major = [int]$parts[0]; $minor = [int]$parts[1]
if ($major -lt 3 -or ($major -eq 3 -and $minor -lt 10)) {
    Fail "Python 3.10+ required (found $versionLine)."
}
Ok "Python $versionLine detected"

$VenvDir = Join-Path $RepoRoot ".venv"
$VenvPy  = Join-Path $VenvDir "Scripts\python.exe"

# 3. Force-rebuild venv if requested.
if ($Force -and (Test-Path $VenvDir)) {
    Info "Removing existing .venv (-Force)"
    Remove-Item -Recurse -Force $VenvDir
}

# 4. Create venv if missing.
if (-not (Test-Path $VenvPy)) {
    Info "Creating virtual environment at $VenvDir"
    & python -m venv $VenvDir
    if ($LASTEXITCODE -ne 0) { Fail "python -m venv failed." }
}
Ok "Using venv python: $VenvPy"

# 5. Upgrade bootstrap toolchain.
Info "Upgrading pip, setuptools, wheel"
& $VenvPy -m pip install --upgrade pip setuptools wheel
if ($LASTEXITCODE -ne 0) { Fail "Failed to upgrade pip/setuptools/wheel." }

# 6. Remove any prior install (clears stale PEP 660 finders that cause
#    ModuleNotFoundError: No module named 'qa_ecosystem').
Info "Removing any prior install of qa-agent-ecosystem"
& $VenvPy -m pip uninstall -y qa-agent-ecosystem 2>&1 | Out-Null
# Ignore non-zero exit when the package wasn't installed.

# 7. Editable install (with optional extras).
$installTarget = if ($Extras) { ".[$Extras]" } else { "." }
Info "Installing (editable): pip install -e `"$installTarget`""
& $VenvPy -m pip install -e $installTarget
if ($LASTEXITCODE -ne 0) { Fail "pip install -e $installTarget failed." }

# 8. Verify import and console script.
Info "Verifying install"
$version = & $VenvPy -c "import qa_ecosystem; print(qa_ecosystem.__version__)" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host $version -ForegroundColor Red
    Fail "qa_ecosystem still not importable after install. See docs/TROUBLESHOOTING.md section 0."
}
Ok "Install verified: qa_ecosystem $($version.Trim())"

$qaAgentExe = Join-Path $VenvDir "Scripts\qa-agent.exe"
if (Test-Path $qaAgentExe) {
    $smoke = & $qaAgentExe list-agents 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host $smoke -ForegroundColor Red
        Fail "qa-agent.exe failed to run. See docs/TROUBLESHOOTING.md."
    }
    Ok "qa-agent list-agents executed successfully"
} else {
    Fail "qa-agent.exe not found at $qaAgentExe after install."
}

# 9. Next steps.
Write-Host ""
Write-Host "Install complete." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Activate the venv:    .venv\Scripts\Activate.ps1"
Write-Host "  2. Run the bootstrap:    qa-agent setup"
Write-Host "  3. Troubleshooting:      docs\TROUBLESHOOTING.md"
Write-Host ""
