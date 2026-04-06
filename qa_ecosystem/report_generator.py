"""Report generator — produces HTML and markdown test execution reports.

Deterministic report generation from structured data (no LLM needed).
Can consume Playwright JSON reporter output and bug log data.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path


@dataclass
class TestCaseResult:
    """Result of a single test case execution."""

    name: str
    status: str            # passed | failed | skipped | flaky
    duration_ms: float = 0
    error_message: str = ""
    test_case_id: str = ""
    file_path: str = ""
    retry_count: int = 0


@dataclass
class GeneratedFileEntry:
    """A file produced during the test pipeline."""

    path: str          # relative path from project root
    category: str      # test-spec | page-object | fixture | helper | test-result | bug-report | report | other
    size_bytes: int = 0


@dataclass
class ExecutionSummary:
    """Aggregate execution metrics."""

    total: int = 0
    passed: int = 0
    failed: int = 0
    skipped: int = 0
    flaky: int = 0
    duration_s: float = 0


@dataclass
class TestExecutionReport:
    """Full test execution report with results, bugs, and metrics."""

    project_name: str = "QA Test Suite"
    timestamp: str = ""
    environment: dict = field(default_factory=lambda: {
        "browser": "chromium",
        "os": "",
        "base_url": "",
    })
    summary: ExecutionSummary = field(default_factory=ExecutionSummary)
    test_results: list[TestCaseResult] = field(default_factory=list)
    bugs: list[dict] = field(default_factory=list)
    coverage_metrics: dict | None = None
    recommendations: list[str] = field(default_factory=list)
    generated_files: list[GeneratedFileEntry] = field(default_factory=list)

    def to_markdown(self) -> str:
        lines: list[str] = []
        lines.append(f"# Test Execution Report: {self.project_name}\n")
        lines.append(f"**Generated:** {self.timestamp}  ")
        if self.environment.get("browser"):
            lines.append(f"**Browser:** {self.environment['browser']}  ")
        if self.environment.get("base_url"):
            lines.append(f"**Base URL:** {self.environment['base_url']}  ")
        lines.append("")

        # Executive summary
        lines.append("## Executive Summary\n")
        s = self.summary
        pass_rate = (s.passed / s.total * 100) if s.total else 0
        lines.append("| Metric | Value |")
        lines.append("|--------|-------|")
        lines.append(f"| Total Tests | {s.total} |")
        lines.append(f"| Passed | {s.passed} |")
        lines.append(f"| Failed | {s.failed} |")
        lines.append(f"| Skipped | {s.skipped} |")
        lines.append(f"| Flaky | {s.flaky} |")
        lines.append(f"| Pass Rate | {pass_rate:.1f}% |")
        lines.append(f"| Duration | {s.duration_s:.1f}s |")
        lines.append("")

        # Test results table
        lines.append("## Test Results\n")
        lines.append("| # | Test Case | Status | Duration | Error |")
        lines.append("|---|-----------|--------|----------|-------|")
        for i, r in enumerate(self.test_results, 1):
            status_icon = {"passed": "PASS", "failed": "FAIL", "skipped": "SKIP", "flaky": "FLAKY"}.get(r.status, r.status)
            dur = f"{r.duration_ms:.0f}ms" if r.duration_ms else "-"
            err = r.error_message[:80] + "..." if len(r.error_message) > 80 else r.error_message
            err = err.replace("|", "\\|") or "-"
            lines.append(f"| {i} | {r.name} | {status_icon} | {dur} | {err} |")
        lines.append("")

        # Bug summary
        if self.bugs:
            lines.append("## Bugs Found\n")
            lines.append("| Bug ID | Title | Severity | Priority | Category |")
            lines.append("|--------|-------|----------|----------|----------|")
            for bug in self.bugs:
                lines.append(
                    f"| {bug.get('bug_id', '-')} | {bug.get('title', '-')} | "
                    f"{bug.get('severity', '-')} | {bug.get('priority', '-')} | "
                    f"{bug.get('category', '-')} |"
                )
            lines.append("")

        # Generated files
        if self.generated_files:
            lines.append("## Generated Files\n")
            lines.append("| # | File | Category | Size |")
            lines.append("|---|------|----------|------|")
            total_size = 0
            for i, f in enumerate(self.generated_files, 1):
                label = _CATEGORY_LABELS.get(f.category, f.category)
                lines.append(f"| {i} | `{f.path}` | {label} | {_format_size(f.size_bytes)} |")
                total_size += f.size_bytes
            lines.append("")
            lines.append(f"**Total: {len(self.generated_files)} files ({_format_size(total_size)})**\n")

        # Recommendations
        if self.recommendations:
            lines.append("## Recommendations\n")
            for rec in self.recommendations:
                lines.append(f"- {rec}")
            lines.append("")

        return "\n".join(lines)

    def to_html(self) -> str:
        s = self.summary
        pass_rate = (s.passed / s.total * 100) if s.total else 0

        # Build test rows
        test_rows = ""
        for i, r in enumerate(self.test_results, 1):
            status_class = {"passed": "pass", "failed": "fail", "skipped": "skip", "flaky": "flaky"}.get(r.status, "")
            status_label = {"passed": "PASS", "failed": "FAIL", "skipped": "SKIP", "flaky": "FLAKY"}.get(r.status, r.status)
            dur = f"{r.duration_ms:.0f}ms" if r.duration_ms else "-"
            err = _html_escape(r.error_message[:120]) if r.error_message else "-"
            test_rows += f"""<tr>
              <td>{i}</td>
              <td>{_html_escape(r.name)}</td>
              <td class="{status_class}">{status_label}</td>
              <td>{dur}</td>
              <td class="error">{err}</td>
            </tr>\n"""

        # Build bug rows
        bug_rows = ""
        for bug in self.bugs:
            sev = bug.get("severity", "-")
            sev_class = sev.lower() if sev in ("Critical", "High", "Medium", "Low") else ""
            bug_rows += f"""<tr>
              <td>{_html_escape(bug.get('bug_id', '-'))}</td>
              <td>{_html_escape(bug.get('title', '-'))}</td>
              <td class="{sev_class}">{sev}</td>
              <td>{bug.get('priority', '-')}</td>
              <td>{bug.get('category', '-')}</td>
            </tr>\n"""

        # SVG donut chart
        passed_pct = s.passed / s.total * 100 if s.total else 0
        failed_pct = s.failed / s.total * 100 if s.total else 0
        passed_dash = passed_pct * 2.51327
        failed_dash = failed_pct * 2.51327
        passed_offset = 0
        failed_offset = passed_dash

        # Build generated files rows
        files_html = ""
        if self.generated_files:
            file_rows = ""
            total_size = 0
            for i, f in enumerate(self.generated_files, 1):
                label = _CATEGORY_LABELS.get(f.category, f.category)
                file_rows += f"""<tr>
              <td>{i}</td>
              <td><code>{_html_escape(f.path)}</code></td>
              <td><span class="category">{label}</span></td>
              <td>{_format_size(f.size_bytes)}</td>
            </tr>\n"""
                total_size += f.size_bytes
            files_html = f"""<h2>Generated Files</h2>
<table>
  <thead><tr><th>#</th><th>File</th><th>Category</th><th>Size</th></tr></thead>
  <tbody>{file_rows}</tbody>
</table>
<p class="meta"><strong>Total: {len(self.generated_files)} files ({_format_size(total_size)})</strong></p>"""

        recs_html = ""
        if self.recommendations:
            items = "".join(f"<li>{_html_escape(r)}</li>" for r in self.recommendations)
            recs_html = f"<h2>Recommendations</h2><ul>{items}</ul>"

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Test Report — {_html_escape(self.project_name)}</title>
<style>
  :root {{ --pass: #22c55e; --fail: #ef4444; --skip: #f59e0b; --flaky: #a855f7; }}
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
         background: #f8fafc; color: #1e293b; line-height: 1.6; padding: 2rem; max-width: 1200px; margin: 0 auto; }}
  h1 {{ font-size: 1.75rem; margin-bottom: 0.25rem; }}
  h2 {{ font-size: 1.25rem; margin: 2rem 0 1rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }}
  .meta {{ color: #64748b; font-size: 0.875rem; margin-bottom: 2rem; }}
  .summary {{ display: flex; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 2rem; }}
  .card {{ background: white; border-radius: 8px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
           min-width: 120px; text-align: center; }}
  .card .value {{ font-size: 2rem; font-weight: 700; }}
  .card .label {{ font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }}
  .card.pass .value {{ color: var(--pass); }}
  .card.fail .value {{ color: var(--fail); }}
  .card.skip .value {{ color: var(--skip); }}
  .card.flaky .value {{ color: var(--flaky); }}
  table {{ width: 100%; border-collapse: collapse; background: white; border-radius: 8px;
           box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; margin-bottom: 2rem; }}
  th {{ background: #f1f5f9; text-align: left; padding: 0.75rem 1rem; font-size: 0.8rem;
       text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }}
  td {{ padding: 0.625rem 1rem; border-top: 1px solid #e2e8f0; font-size: 0.875rem; }}
  tr:hover {{ background: #f8fafc; }}
  .pass {{ color: var(--pass); font-weight: 600; }}
  .fail {{ color: var(--fail); font-weight: 600; }}
  .skip {{ color: var(--skip); font-weight: 600; }}
  .flaky {{ color: var(--flaky); font-weight: 600; }}
  .critical {{ color: #dc2626; font-weight: 700; }}
  .high {{ color: var(--fail); font-weight: 600; }}
  .medium {{ color: var(--skip); }}
  .low {{ color: #64748b; }}
  .error {{ font-family: monospace; font-size: 0.75rem; color: #64748b; max-width: 300px;
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }}
  .chart {{ display: flex; align-items: center; gap: 1rem; }}
  svg {{ transform: rotate(-90deg); }}
  .category {{ display:inline-block; padding:0.125rem 0.5rem; border-radius:4px;
              background:#f1f5f9; font-size:0.75rem; color:#475569; }}
  ul {{ padding-left: 1.5rem; }}
  li {{ margin-bottom: 0.5rem; }}
</style>
</head>
<body>
<h1>Test Execution Report</h1>
<p class="meta">{_html_escape(self.project_name)} &mdash; {_html_escape(self.timestamp)}</p>

<div class="summary">
  <div class="card"><div class="value">{s.total}</div><div class="label">Total</div></div>
  <div class="card pass"><div class="value">{s.passed}</div><div class="label">Passed</div></div>
  <div class="card fail"><div class="value">{s.failed}</div><div class="label">Failed</div></div>
  <div class="card skip"><div class="value">{s.skipped}</div><div class="label">Skipped</div></div>
  <div class="card flaky"><div class="value">{s.flaky}</div><div class="label">Flaky</div></div>
  <div class="card"><div class="value">{pass_rate:.0f}%</div><div class="label">Pass Rate</div></div>
  <div class="card"><div class="value">{s.duration_s:.1f}s</div><div class="label">Duration</div></div>
</div>

<div class="chart">
  <svg width="80" height="80" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" stroke-width="12"/>
    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--pass)" stroke-width="12"
      stroke-dasharray="{passed_dash} {251.327 - passed_dash}" stroke-dashoffset="-{passed_offset}"/>
    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--fail)" stroke-width="12"
      stroke-dasharray="{failed_dash} {251.327 - failed_dash}" stroke-dashoffset="-{failed_offset}"/>
  </svg>
</div>

<h2>Test Results</h2>
<table>
  <thead><tr><th>#</th><th>Test Case</th><th>Status</th><th>Duration</th><th>Error</th></tr></thead>
  <tbody>{test_rows}</tbody>
</table>

{"<h2>Bugs Found</h2><table><thead><tr><th>Bug ID</th><th>Title</th><th>Severity</th><th>Priority</th><th>Category</th></tr></thead><tbody>" + bug_rows + "</tbody></table>" if bug_rows else ""}

{files_html}

{recs_html}

<p class="meta" style="margin-top:3rem;">Generated by QA Agent Ecosystem</p>
</body>
</html>"""

    def save(self, output_dir: Path) -> dict[str, Path]:
        """Save report as HTML and markdown."""
        output_dir.mkdir(parents=True, exist_ok=True)
        paths: dict[str, Path] = {}

        md_path = output_dir / "report.md"
        md_path.write_text(self.to_markdown(), encoding="utf-8")
        paths["markdown"] = md_path

        html_path = output_dir / "report.html"
        html_path.write_text(self.to_html(), encoding="utf-8")
        paths["html"] = html_path

        return paths


def from_playwright_json(json_path: Path) -> TestExecutionReport:
    """Build a TestExecutionReport from Playwright's JSON reporter output."""
    data = json.loads(json_path.read_text(encoding="utf-8"))
    report = TestExecutionReport(
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )

    config = data.get("config", {})
    report.project_name = config.get("rootDir", "").split("/")[-1] or "Playwright Tests"

    suites = data.get("suites", [])
    _walk_suites(suites, report)

    # Compute summary
    s = report.summary
    s.total = len(report.test_results)
    s.passed = sum(1 for r in report.test_results if r.status == "passed")
    s.failed = sum(1 for r in report.test_results if r.status == "failed")
    s.skipped = sum(1 for r in report.test_results if r.status == "skipped")
    s.flaky = sum(1 for r in report.test_results if r.status == "flaky")
    s.duration_s = sum(r.duration_ms for r in report.test_results) / 1000

    # Auto-discover generated files from the project directory
    project_root = json_path.parent.parent  # playwright/test-results.json -> project root
    if project_root.is_dir():
        report.generated_files = discover_generated_files(project_root)

    return report


def from_agent_output(raw_output: str, bug_log_data: dict | None = None, output_dir: Path | None = None) -> TestExecutionReport:
    """Build a TestExecutionReport from agent execution output and optional bug log."""
    from qa_ecosystem.bug_logger import parse_execution_failures

    bug_log = parse_execution_failures(raw_output)
    report = TestExecutionReport(
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )

    report.summary = ExecutionSummary(
        total=bug_log.total_tests,
        passed=bug_log.passed,
        failed=bug_log.failed,
        skipped=bug_log.skipped,
    )

    if bug_log_data and "bugs" in bug_log_data:
        report.bugs = bug_log_data["bugs"]
    else:
        report.bugs = [b.to_dict() for b in bug_log.bugs]

    if output_dir and output_dir.is_dir():
        report.generated_files = discover_generated_files(output_dir)

    return report


def _walk_suites(suites: list[dict], report: TestExecutionReport) -> None:
    """Recursively walk Playwright JSON suites to extract test results."""
    for suite in suites:
        for spec in suite.get("specs", []):
            for test in spec.get("tests", []):
                results = test.get("results", [])
                status = test.get("status", "skipped")
                duration = sum(r.get("duration", 0) for r in results)
                error = ""
                if status == "failed" and results:
                    last = results[-1]
                    err_obj = last.get("error", {})
                    error = err_obj.get("message", "") if isinstance(err_obj, dict) else str(err_obj)

                # Extract TC-xxx from title if present
                title = spec.get("title", test.get("title", ""))
                tc_match = __import__("re").search(r'\[?(TC-\d+)\]?', title)
                tc_id = tc_match.group(1) if tc_match else ""

                report.test_results.append(TestCaseResult(
                    name=title,
                    status=status,
                    duration_ms=duration,
                    error_message=error,
                    test_case_id=tc_id,
                    file_path=suite.get("file", ""),
                    retry_count=max(0, len(results) - 1),
                ))

        # Recurse into nested suites
        if "suites" in suite:
            _walk_suites(suite["suites"], report)


def discover_generated_files(base_dir: Path) -> list[GeneratedFileEntry]:
    """Walk output and test directories to discover all generated pipeline files."""
    entries: list[GeneratedFileEntry] = []
    seen: set[str] = set()

    scan_dirs = [
        base_dir / "outputs",
        base_dir / "playwright" / "tests",
    ]
    # Also check for standalone test-results.json
    standalone_json = base_dir / "playwright" / "test-results.json"
    if standalone_json.is_file():
        rel = standalone_json.relative_to(base_dir).as_posix()
        entries.append(GeneratedFileEntry(
            path=rel,
            category="test-result",
            size_bytes=standalone_json.stat().st_size,
        ))
        seen.add(rel)

    for scan_dir in scan_dirs:
        if not scan_dir.is_dir():
            continue
        for fpath in scan_dir.rglob("*"):
            if not fpath.is_file():
                continue
            rel = fpath.relative_to(base_dir).as_posix()
            if rel in seen:
                continue
            seen.add(rel)
            entries.append(GeneratedFileEntry(
                path=rel,
                category=_classify_file(fpath),
                size_bytes=fpath.stat().st_size,
            ))

    entries.sort(key=lambda e: (e.category, e.path))
    return entries


def _classify_file(fpath: Path) -> str:
    """Classify a file into a pipeline artifact category."""
    name = fpath.name.lower()
    suffix = fpath.suffix.lower()

    if name.endswith(".spec.ts"):
        return "test-spec"
    if name.endswith(".page.ts") or name.endswith(".component.ts"):
        return "page-object"
    if name.endswith(".fixture.ts"):
        return "fixture"
    if "helper" in name or name.startswith("utils"):
        return "helper"
    if name in ("test-results.json",) or "test-results" in str(fpath):
        return "test-result"
    if name in ("bugs.json", "bug-report.md"):
        return "bug-report"
    if name in ("report.md", "report.html"):
        return "report"
    if suffix in (".ts", ".js"):
        return "test-spec"
    if suffix in (".json",):
        return "test-result"
    if suffix in (".md", ".html"):
        return "report"
    return "other"


_CATEGORY_LABELS = {
    "test-spec": "Test Spec",
    "page-object": "Page Object",
    "fixture": "Fixture",
    "helper": "Helper",
    "test-result": "Test Result",
    "bug-report": "Bug Report",
    "report": "Report",
    "other": "Other",
}


def _format_size(size_bytes: int) -> str:
    """Format byte count as human-readable size."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    if size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    return f"{size_bytes / (1024 * 1024):.1f} MB"


def _html_escape(text: str) -> str:
    """Escape HTML special characters."""
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )
