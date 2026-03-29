"""Output parser — extracts structured artifacts from agent responses.

Parses markdown output from agents (especially playwright-test-generator) to
extract code blocks, test results, and summaries into separate files.

Supports two extraction modes:
1. Structured JSON — when the agent returns a JSON block matching the output schema
2. Regex fallback — extracts named code blocks from markdown (legacy mode)
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlparse


@dataclass
class ParsedTestOutput:
    """Structured representation of a playwright-test-generator response."""

    summary: str = ""
    test_files: dict[str, str] = field(default_factory=dict)    # filename -> content
    page_objects: dict[str, str] = field(default_factory=dict)   # filename -> content
    fixture_files: dict[str, str] = field(default_factory=dict)  # filename -> content
    helper_files: dict[str, str] = field(default_factory=dict)   # filename -> content
    test_results: list[dict[str, str]] = field(default_factory=list)  # [{name, status, duration?}]
    app_map: dict | None = None  # structured application map from exploration
    raw_output: str = ""


def extract_app_name(prompt: str) -> str:
    """Extract a filesystem-safe application name from the prompt.

    Tries to find a URL first, then falls back to a sanitized slug.
    """
    # Look for URLs in the prompt
    url_match = re.search(r'https?://([^\s/,\)]+)', prompt)
    if url_match:
        hostname = url_match.group(1)
        # Remove www. prefix and port numbers
        hostname = re.sub(r'^www\.', '', hostname)
        hostname = re.sub(r':\d+$', '', hostname)
        # Convert dots to hyphens for filesystem safety
        name = hostname.replace('.', '-')
        return _sanitize_dirname(name)

    # Look for "URL:" label pattern
    label_match = re.search(r'URL\s*:\s*(\S+)', prompt, re.IGNORECASE)
    if label_match:
        raw = label_match.group(1)
        try:
            parsed = urlparse(raw)
            if parsed.hostname:
                hostname = re.sub(r'^www\.', '', parsed.hostname)
                return _sanitize_dirname(hostname.replace('.', '-'))
        except Exception:
            pass

    # Fallback: use first meaningful words from the prompt
    words = re.findall(r'[A-Za-z][a-z]+', prompt[:200])
    if words:
        slug = '-'.join(words[:3]).lower()
        return _sanitize_dirname(slug)

    return "unnamed-app"


def parse_playwright_output(raw: str) -> ParsedTestOutput:
    """Parse the raw output from a playwright-test-generator run.

    Tries structured JSON extraction first, then falls back to regex parsing.
    """
    # Try structured JSON extraction first
    structured = _try_extract_structured_json(raw)
    if structured is not None:
        return structured

    # Fall back to regex-based extraction
    return _parse_markdown_output(raw)


def _try_extract_structured_json(raw: str) -> ParsedTestOutput | None:
    """Attempt to extract a structured JSON block from the output.

    Looks for a JSON code block containing the expected schema fields
    (files array, summary, etc.) and parses it into a ParsedTestOutput.
    """
    # Look for JSON blocks in the output
    json_block_pattern = re.compile(
        r'```(?:json)?\s*\n(\{.*?\})\s*\n```',
        re.DOTALL,
    )

    for match in json_block_pattern.finditer(raw):
        try:
            data = json.loads(match.group(1))
        except (json.JSONDecodeError, ValueError):
            continue

        # Check if this JSON matches our structured output schema
        if not isinstance(data, dict) or "files" not in data:
            continue

        result = ParsedTestOutput(raw_output=raw)

        # Extract files
        for file_entry in data.get("files", []):
            if not isinstance(file_entry, dict):
                continue
            path = file_entry.get("path", "")
            content = file_entry.get("content", "")
            file_type = file_entry.get("type", "")

            if not path or not content:
                continue

            # Normalize filename
            filename = path.replace('\\', '/').split('/')[-1]

            if file_type in ("page", "component"):
                result.page_objects[filename] = content.strip()
            elif file_type == "fixture":
                result.fixture_files[filename] = content.strip()
            elif file_type == "helper":
                result.helper_files[filename] = content.strip()
            else:
                result.test_files[filename] = content.strip()

        # Extract test results
        for tr in data.get("testResults", []):
            if not isinstance(tr, dict):
                continue
            result.test_results.append({
                "name": tr.get("name", ""),
                "status": tr.get("status", "unknown"),
                "duration": tr.get("duration", ""),
            })

        # Extract app map
        if "appMap" in data and isinstance(data["appMap"], dict):
            result.app_map = data["appMap"]

        # Extract summary
        result.summary = _build_summary(result)

        return result

    return None


def _parse_markdown_output(raw: str) -> ParsedTestOutput:
    """Parse markdown output using regex patterns (legacy fallback).

    Extracts:
    - Named code blocks (```typescript // filename.spec.ts ...)
    - Test result tables or lists
    - App map JSON blocks
    - Summary text
    """
    result = ParsedTestOutput(raw_output=raw)

    # ── Extract app map JSON ─────────────────────────────────────────────
    app_map_pattern = re.compile(
        r'```(?:json)?\s*\n\s*//\s*app-map\.json\s*\n(\{.*?\})\s*\n```',
        re.DOTALL,
    )
    app_map_match = app_map_pattern.search(raw)
    if app_map_match:
        try:
            result.app_map = json.loads(app_map_match.group(1))
        except (json.JSONDecodeError, ValueError):
            pass

    # ── Extract fenced code blocks with filenames ────────────────────────
    # Patterns:
    #   ```typescript  // filename.spec.ts
    #   ```ts filename: login.spec.ts
    #   ### `login.spec.ts`\n```typescript
    code_block_pattern = re.compile(
        r'(?:'
        # Pattern A: heading or bold with filename before code block
        r'(?:^#{1,4}\s+`?|^\*\*)'
        r'(?P<pre_name>[\w./-]+\.(?:spec|page|component)\.ts)'
        r'[`*]*.*?\n'
        r'```(?:typescript|ts|javascript|js)?\s*\n'
        r'(?P<pre_code>.*?)'
        r'\n```'
        r'|'
        # Pattern B: filename comment inside code block
        r'```(?:typescript|ts|javascript|js)\s*'
        r'(?://\s*(?P<in_name>[\w./-]+\.ts)\s*)?'
        r'\n(?P<in_code>.*?)\n```'
        r')',
        re.MULTILINE | re.DOTALL,
    )

    for m in code_block_pattern.finditer(raw):
        filename = m.group('pre_name') or m.group('in_name')
        code = m.group('pre_code') or m.group('in_code') or ''

        if not filename:
            # Try to infer filename from code content
            filename = _infer_filename(code)

        if not filename:
            continue

        code = code.strip()
        if not code:
            continue

        # Normalize path separators
        filename = filename.replace('\\', '/').split('/')[-1]

        if '.page.' in filename or '.component.' in filename:
            result.page_objects[filename] = code
        elif '.fixture.' in filename:
            result.fixture_files[filename] = code
        elif 'helper' in filename.lower() or filename.startswith('utils'):
            result.helper_files[filename] = code
        else:
            result.test_files[filename] = code

    # ── Extract test results ─────────────────────────────────────────────
    # Look for pass/fail indicators in the output
    result_patterns = [
        # ✓ test name (duration) or ✗ test name
        re.compile(r'[✓✔☑✅PASS]\s+(.+?)(?:\s*\((\d+[\d.]*\s*m?s)\))?\s*$', re.MULTILINE),
        re.compile(r'[✗✘☒❌FAIL]\s+(.+?)(?:\s*\((\d+[\d.]*\s*m?s)\))?\s*$', re.MULTILINE),
        # "test name ... ok" or "test name ... FAILED"
        re.compile(r'^\s+(.+?)\s+\.{2,}\s+(ok|passed|PASSED|failed|FAILED)\s*$', re.MULTILINE),
    ]

    for pat in result_patterns:
        for m in pat.finditer(raw):
            name = m.group(1).strip()
            if len(m.groups()) >= 2 and m.group(2):
                status_or_dur = m.group(2)
            else:
                status_or_dur = ""

            status = "passed"
            if any(c in pat.pattern for c in ['✗', '✘', '☒', '❌', 'FAIL', 'failed']):
                status = "failed"
            elif status_or_dur.lower() in ('failed', 'fail'):
                status = "failed"

            result.test_results.append({
                "name": name,
                "status": status,
                "duration": status_or_dur if status_or_dur not in ('ok', 'passed', 'PASSED', 'failed', 'FAILED') else "",
            })

    # ── Build summary ────────────────────────────────────────────────────
    result.summary = _build_summary(result)

    return result


def save_playwright_session(
    raw_output: str,
    prompt: str,
    output_dir: Path,
    timestamp: str,
) -> tuple[Path, list[str]]:
    """Save a playwright-test-generator session with structured output.

    Creates:
        outputs/{app-name}/{timestamp}/
        ├── summary.md              # Concise test results summary
        ├── app-map.json            # Structured application map (if available)
        ├── generated-tests/        # Extracted test files
        │   ├── *.spec.ts
        │   └── *.page.ts
        └── full-output.md          # Complete raw agent output

    Returns:
        (session_dir, list_of_saved_file_paths)
    """
    app_name = extract_app_name(prompt)
    parsed = parse_playwright_output(raw_output)

    session_dir = output_dir / app_name / timestamp
    tests_dir = session_dir / "generated-tests"
    tests_dir.mkdir(parents=True, exist_ok=True)

    saved_files: list[str] = []

    # ── Save summary ─────────────────────────────────────────────────────
    summary_path = session_dir / "summary.md"
    summary_path.write_text(parsed.summary, encoding="utf-8")
    saved_files.append(str(summary_path))

    # ── Save app map ─────────────────────────────────────────────────────
    if parsed.app_map:
        app_map_path = session_dir / "app-map.json"
        app_map_path.write_text(
            json.dumps(parsed.app_map, indent=2), encoding="utf-8"
        )
        saved_files.append(str(app_map_path))

    # ── Save generated test files ────────────────────────────────────────
    for filename, code in parsed.test_files.items():
        fpath = tests_dir / filename
        fpath.write_text(code, encoding="utf-8")
        saved_files.append(str(fpath))

    for filename, code in parsed.page_objects.items():
        fpath = tests_dir / filename
        fpath.write_text(code, encoding="utf-8")
        saved_files.append(str(fpath))

    for filename, code in parsed.fixture_files.items():
        fpath = tests_dir / filename
        fpath.write_text(code, encoding="utf-8")
        saved_files.append(str(fpath))

    for filename, code in parsed.helper_files.items():
        fpath = tests_dir / filename
        fpath.write_text(code, encoding="utf-8")
        saved_files.append(str(fpath))

    # ── Save full raw output ─────────────────────────────────────────────
    full_path = session_dir / "full-output.md"
    full_path.write_text(raw_output, encoding="utf-8")
    saved_files.append(str(full_path))

    return session_dir, saved_files


# ── Private helpers ──────────────────────────────────────────────────────────


def _sanitize_dirname(name: str) -> str:
    """Remove characters unsafe for directory names."""
    name = re.sub(r'[<>:"/\\|?*]', '-', name)
    name = re.sub(r'-+', '-', name).strip('-')
    return name[:80] or "unnamed-app"


def _infer_filename(code: str) -> str | None:
    """Try to infer a .ts filename from code content."""
    # Look for import patterns that hint at test vs page object
    if re.search(r"test\(|test\.describe\(|expect\(", code):
        # It's a test file — try to find a describe block name
        desc = re.search(r"test\.describe\(['\"](.+?)['\"]", code)
        if desc:
            slug = re.sub(r'[^a-zA-Z0-9]+', '-', desc.group(1)).strip('-').lower()
            return f"{slug}.spec.ts"
        return None

    if re.search(r"class\s+\w+Page|export\s+class\s+\w+", code):
        cls = re.search(r"class\s+(\w+)", code)
        if cls:
            # CamelCase -> kebab-case
            name = re.sub(r'(?<!^)(?=[A-Z])', '-', cls.group(1)).lower()
            return f"{name}.page.ts"

    return None


def _build_summary(parsed: ParsedTestOutput) -> str:
    """Build a concise markdown summary of the test session."""
    lines: list[str] = []
    lines.append("# Test Session Summary\n")

    # ── Test files generated ─────────────────────────────────────────────
    total_specs = len(parsed.test_files)
    total_pages = len(parsed.page_objects)
    total_fixtures = len(parsed.fixture_files)
    total_helpers = len(parsed.helper_files)
    lines.append("## Generated Artifacts\n")
    lines.append("| Type | Count |")
    lines.append("|------|-------|")
    lines.append(f"| Test specs (`.spec.ts`) | {total_specs} |")
    lines.append(f"| Page objects (`.page.ts`) | {total_pages} |")
    if total_fixtures:
        lines.append(f"| Fixtures (`.fixture.ts`) | {total_fixtures} |")
    if total_helpers:
        lines.append(f"| Helpers | {total_helpers} |")
    if parsed.app_map:
        page_count = len(parsed.app_map.get("pages", []))
        lines.append(f"| App map pages discovered | {page_count} |")
    lines.append("")

    if parsed.test_files:
        lines.append("### Test Files\n")
        for fname in sorted(parsed.test_files):
            lines.append(f"- `{fname}`")
        lines.append("")

    if parsed.page_objects:
        lines.append("### Page Objects\n")
        for fname in sorted(parsed.page_objects):
            lines.append(f"- `{fname}`")
        lines.append("")

    # ── Test results ─────────────────────────────────────────────────────
    if parsed.test_results:
        passed = sum(1 for r in parsed.test_results if r["status"] == "passed")
        failed = sum(1 for r in parsed.test_results if r["status"] == "failed")
        total = len(parsed.test_results)

        lines.append("## Test Results\n")
        lines.append("| Metric | Value |")
        lines.append("|--------|-------|")
        lines.append(f"| Total  | {total} |")
        lines.append(f"| Passed | {passed} |")
        lines.append(f"| Failed | {failed} |")
        lines.append("")

        lines.append("| # | Test | Status | Duration |")
        lines.append("|---|------|--------|----------|")
        for i, r in enumerate(parsed.test_results, 1):
            icon = "✅" if r["status"] == "passed" else "❌"
            dur = r.get("duration", "")
            lines.append(f"| {i} | {r['name']} | {icon} {r['status']} | {dur} |")
        lines.append("")
    else:
        lines.append("## Test Results\n")
        lines.append("_No test execution results were captured in this session._\n")
        lines.append(
            "> The generated test files in `generated-tests/` can be run with:\n"
            "> ```\n"
            "> npx playwright test generated-tests/\n"
            "> ```\n"
        )

    return "\n".join(lines)
