"""Session paths — every CLI invocation owns a single session directory.

All artifacts produced by agents and workflows for a single run are written
under ``outputs/{app_name}/{timestamp}/`` so each test execution is fully
isolated and traceable.

Usage
-----
    from qa_ecosystem.session import init_session, get_session_dir, sub_dir

    session_dir = init_session(prompt)           # call once at CLI entry
    bug_dir = sub_dir("bugs")                     # outputs/{app}/{ts}/bugs
    report_dir = sub_dir("reports")               # outputs/{app}/{ts}/reports

The session is global to the Python process. Subsequent ``init_session``
calls within the same process return the already-initialized directory
unless ``force=True`` is passed.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
from datetime import datetime
from pathlib import Path

from qa_ecosystem.output_parser import extract_app_name


def _slugify(name: str) -> str:
    """Lowercase, replace non-alphanumeric runs with hyphens, trim."""
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", name.strip().lower()).strip("-")
    return slug or "session"

OUTPUTS_ROOT = Path(__file__).resolve().parent.parent / "outputs"

_session_dir: Path | None = None
_app_name: str | None = None
_timestamp: str | None = None


def init_session(
    prompt: str = "",
    *,
    force: bool = False,
    project_name: str | None = None,
) -> Path:
    """Create and remember the session directory for this run.

    Resolves ``outputs/{app_name}/{timestamp}/``. ``project_name`` takes
    precedence over auto-detection from the prompt; if omitted, the legacy
    URL/word-based extraction runs. If a session is already active and
    ``force`` is False, returns the existing one.
    """
    global _session_dir, _app_name, _timestamp

    if _session_dir is not None and not force:
        return _session_dir

    if project_name:
        name = _slugify(project_name)
    else:
        name = extract_app_name(prompt) if prompt else "session"
        if name in ("unnamed-app", "session") and prompt:
            # Disambiguate fallback names with a short prompt-hash so concurrent
            # runs without a URL don't clobber each other.
            suffix = hashlib.sha1(prompt.encode("utf-8")).hexdigest()[:6]
            name = f"{name}-{suffix}"

    _app_name = name
    _timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    _session_dir = OUTPUTS_ROOT / _app_name / _timestamp
    _session_dir.mkdir(parents=True, exist_ok=True)

    # Redirect any Playwright subprocess (npx playwright test, or a Bash tool
    # spawned by an agent) into the per-session dir. The scaffold config in
    # playwright/playwright.config.ts honors this env var.
    os.environ["PW_OUTPUT_BASE"] = (_session_dir / "playwright").as_posix()

    return _session_dir


def get_session_dir() -> Path:
    """Return the active session dir, initializing a default one if needed."""
    if _session_dir is None:
        return init_session("session")
    return _session_dir


def get_app_name() -> str:
    if _app_name is None:
        init_session("session")
    return _app_name or "session"


def get_timestamp() -> str:
    if _timestamp is None:
        init_session("session")
    return _timestamp or ""


def sub_dir(name: str) -> Path:
    """Return (and create) a named subfolder inside the session directory."""
    p = get_session_dir() / name
    p.mkdir(parents=True, exist_ok=True)
    return p


def write_manifest() -> Path | None:
    """Write a manifest.json describing every artifact in the session."""
    if _session_dir is None:
        return None

    entries: list[dict] = []
    for path in sorted(_session_dir.rglob("*")):
        if path.is_dir() or path.name == "manifest.json":
            continue
        try:
            data = path.read_bytes()
            entries.append({
                "path": path.relative_to(_session_dir).as_posix(),
                "size_bytes": len(data),
                "sha1": hashlib.sha1(data).hexdigest(),
            })
        except OSError:
            continue

    manifest = {
        "app": _app_name,
        "timestamp": _timestamp,
        "session_dir": str(_session_dir),
        "artifact_count": len(entries),
        "artifacts": entries,
    }
    manifest_path = _session_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest_path


def list_sessions() -> list[dict]:
    """List every session under outputs/, newest first."""
    if not OUTPUTS_ROOT.is_dir():
        return []
    sessions: list[dict] = []
    for app_dir in OUTPUTS_ROOT.iterdir():
        if not app_dir.is_dir():
            continue
        for ts_dir in app_dir.iterdir():
            if not ts_dir.is_dir():
                continue
            sessions.append({
                "app": app_dir.name,
                "timestamp": ts_dir.name,
                "path": str(ts_dir),
                "mtime": ts_dir.stat().st_mtime,
            })
    sessions.sort(key=lambda s: s["mtime"], reverse=True)
    return sessions


def reset() -> None:
    """Forget the current session. Mainly for tests."""
    global _session_dir, _app_name, _timestamp
    _session_dir = None
    _app_name = None
    _timestamp = None
