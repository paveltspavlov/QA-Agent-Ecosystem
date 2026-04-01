"""Bug logger — extracts structured bug entries from test execution output.

Provides deterministic, regex-based extraction of test failures into
structured bug entries (BugEntry, BugLog) that can be saved as JSON and
markdown.  Used by the bug-reporter agent and report_generator module.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path


@dataclass
class BugEntry:
    """A single bug extracted from a test failure."""

    bug_id: str
    title: str
    severity: str          # Critical | High | Medium | Low
    priority: str          # P1 | P2 | P3 | P4
    test_case_id: str
    steps_to_reproduce: list[str]
    expected_result: str
    actual_result: str
    error_message: str
    screenshot_path: str | None
    stack_trace: str
    category: str          # Selector | Assertion | Navigation | Timeout
    status: str = "Open"

    def to_dict(self) -> dict:
        return {
            "bug_id": self.bug_id,
            "title": self.title,
            "severity": self.severity,
            "priority": self.priority,
            "test_case_id": self.test_case_id,
            "steps_to_reproduce": self.steps_to_reproduce,
            "expected_result": self.expected_result,
            "actual_result": self.actual_result,
            "error_message": self.error_message,
            "screenshot_path": self.screenshot_path,
            "stack_trace": self.stack_trace,
            "category": self.category,
            "status": self.status,
        }


@dataclass
class BugLog:
    """Collection of bugs from a test execution run."""

    bugs: list[BugEntry] = field(default_factory=list)
    execution_timestamp: str = ""
    total_tests: int = 0
    passed: int = 0
    failed: int = 0
    skipped: int = 0

    def to_json(self) -> dict:
        return {
            "timestamp": self.execution_timestamp,
            "summary": {
                "total": self.total_tests,
                "passed": self.passed,
                "failed": self.failed,
                "skipped": self.skipped,
            },
            "bugs": [b.to_dict() for b in self.bugs],
        }

    def to_markdown(self) -> str:
        lines: list[str] = []
        lines.append("# Bug Report\n")
        lines.append(f"**Generated:** {self.execution_timestamp}\n")
        lines.append("## Execution Summary\n")
        lines.append(f"| Metric | Count |")
        lines.append(f"|--------|-------|")
        lines.append(f"| Total tests | {self.total_tests} |")
        lines.append(f"| Passed | {self.passed} |")
        lines.append(f"| Failed | {self.failed} |")
        lines.append(f"| Skipped | {self.skipped} |")
        lines.append(f"| Bugs logged | {len(self.bugs)} |")
        lines.append("")

        if not self.bugs:
            lines.append("_No bugs found — all tests passed._\n")
            return "\n".join(lines)

        lines.append("## Bug Details\n")
        for bug in self.bugs:
            lines.append(f"---\n")
            lines.append(f"### {bug.bug_id}: {bug.title}\n")
            lines.append(f"- **Severity:** {bug.severity}")
            lines.append(f"- **Priority:** {bug.priority}")
            lines.append(f"- **Category:** {bug.category}")
            lines.append(f"- **Test Case:** {bug.test_case_id}")
            lines.append(f"- **Status:** {bug.status}")
            if bug.screenshot_path:
                lines.append(f"- **Screenshot:** `{bug.screenshot_path}`")
            lines.append("")
            lines.append("**Steps to Reproduce:**")
            for i, step in enumerate(bug.steps_to_reproduce, 1):
                lines.append(f"{i}. {step}")
            lines.append("")
            lines.append(f"**Expected Result:** {bug.expected_result}")
            lines.append(f"**Actual Result:** {bug.actual_result}")
            lines.append(f"**Error Message:** `{bug.error_message}`")
            if bug.stack_trace:
                lines.append(f"\n<details><summary>Stack Trace</summary>\n")
                lines.append(f"```\n{bug.stack_trace}\n```\n")
                lines.append("</details>\n")
            lines.append("")

        # Summary table
        lines.append("## Bug Summary\n")
        lines.append("| Bug ID | Title | Severity | Priority | Category | Status |")
        lines.append("|--------|-------|----------|----------|----------|--------|")
        for bug in self.bugs:
            lines.append(
                f"| {bug.bug_id} | {bug.title} | {bug.severity} | "
                f"{bug.priority} | {bug.category} | {bug.status} |"
            )
        lines.append("")

        return "\n".join(lines)

    def save(self, output_dir: Path) -> tuple[Path, Path]:
        """Save bug log as JSON and markdown to the given directory."""
        output_dir.mkdir(parents=True, exist_ok=True)
        json_path = output_dir / "bugs.json"
        md_path = output_dir / "bug-report.md"
        json_path.write_text(
            json.dumps(self.to_json(), indent=2), encoding="utf-8"
        )
        md_path.write_text(self.to_markdown(), encoding="utf-8")
        return json_path, md_path


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------

_SEVERITY_MAP = {
    "Selector": "Medium",
    "Assertion": "High",
    "Navigation": "High",
    "Timeout": "Medium",
}

_PRIORITY_MAP = {
    "Critical": "P1",
    "High": "P2",
    "Medium": "P3",
    "Low": "P4",
}


def classify_failure(error_message: str) -> str:
    """Classify a test failure into a category based on the error message."""
    lower = error_message.lower()
    if "timeout" in lower or "exceeded" in lower:
        return "Timeout"
    if "expect" in lower or "assert" in lower or "tobe" in lower or "tohave" in lower:
        return "Assertion"
    if (
        "locator" in lower
        or "selector" in lower
        or "not found" in lower
        or "no element" in lower
        or "getby" in lower
    ):
        return "Selector"
    if "navig" in lower or "url" in lower or "goto" in lower or "page.goto" in lower:
        return "Navigation"
    return "Assertion"


def assign_severity(category: str, is_critical_path: bool = False) -> str:
    """Assign severity based on failure category and criticality."""
    base = _SEVERITY_MAP.get(category, "Medium")
    if is_critical_path and base != "Critical":
        # Upgrade severity for critical path failures
        upgrade = {"Low": "Medium", "Medium": "High", "High": "Critical"}
        return upgrade.get(base, base)
    return base


def parse_execution_failures(raw_output: str) -> BugLog:
    """Parse playwright-executor output and extract structured bug entries.

    Supports two extraction modes:
    1. Structured JSON block (``// bug-data.json``) embedded by the executor
    2. Regex fallback parsing the markdown report tables
    """
    timestamp = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    bug_log = BugLog(execution_timestamp=timestamp)

    # Parse execution summary numbers
    _parse_summary_counts(raw_output, bug_log)

    # Mode 1: Try structured JSON block
    bugs = _try_parse_json_block(raw_output)
    if bugs:
        for i, b in enumerate(bugs, 1):
            category = b.get("category", classify_failure(b.get("error_message", "")))
            severity = b.get("severity", assign_severity(category))
            priority = _PRIORITY_MAP.get(severity, "P3")
            bug_log.bugs.append(BugEntry(
                bug_id=b.get("bug_id", f"BUG-{i:03d}"),
                title=b.get("title", f"Test failure: {b.get('test_case_id', 'unknown')}"),
                severity=severity,
                priority=priority,
                test_case_id=b.get("test_case_id", ""),
                steps_to_reproduce=b.get("steps", []),
                expected_result=b.get("expected", ""),
                actual_result=b.get("actual", ""),
                error_message=b.get("error_message", ""),
                screenshot_path=b.get("screenshot_path"),
                stack_trace=b.get("stack_trace", ""),
                category=category,
            ))
        return bug_log

    # Mode 2: Regex fallback — parse the Results by Test Case table
    bugs_from_table = _parse_results_table(raw_output)
    for i, (tc_id, title, error) in enumerate(bugs_from_table, 1):
        category = classify_failure(error)
        severity = assign_severity(category)
        priority = _PRIORITY_MAP.get(severity, "P3")
        bug_log.bugs.append(BugEntry(
            bug_id=f"BUG-{i:03d}",
            title=f"{title}" if title else f"Test failure in {tc_id}",
            severity=severity,
            priority=priority,
            test_case_id=tc_id,
            steps_to_reproduce=[f"Run test {tc_id}"],
            expected_result="Test passes",
            actual_result=f"Test failed: {error}",
            error_message=error,
            screenshot_path=None,
            stack_trace="",
            category=category,
        ))

    return bug_log


def _parse_summary_counts(raw: str, bug_log: BugLog) -> None:
    """Extract Total/Passed/Failed/Skipped counts from the execution report."""
    # Pattern: "Total: X | Passed: X | Failed: X | Skipped: X"
    m = re.search(
        r'Total:\s*(\d+)\s*\|\s*Passed:\s*(\d+)\s*\|\s*Failed:\s*(\d+)',
        raw,
    )
    if m:
        bug_log.total_tests = int(m.group(1))
        bug_log.passed = int(m.group(2))
        bug_log.failed = int(m.group(3))
        skip_m = re.search(r'Skipped:\s*(\d+)', raw)
        if skip_m:
            bug_log.skipped = int(skip_m.group(1))
        return

    # Fallback: individual patterns
    for label, attr in [("total", "total_tests"), ("passed", "passed"),
                         ("failed", "failed"), ("skipped", "skipped")]:
        m = re.search(rf'{label}\s*[:\|]\s*(\d+)', raw, re.IGNORECASE)
        if m:
            setattr(bug_log, attr, int(m.group(1)))


def _try_parse_json_block(raw: str) -> list[dict] | None:
    """Try to extract the structured bug-data.json block."""
    # Look for // bug-data.json comment inside a JSON code block
    pattern = re.compile(
        r'```(?:json)?\s*\n\s*//\s*bug-data\.json\s*\n(\{.*?\})\s*\n```',
        re.DOTALL,
    )
    for match in pattern.finditer(raw):
        try:
            data = json.loads(match.group(1))
            if isinstance(data, dict) and "bugs" in data:
                return data["bugs"]
        except (json.JSONDecodeError, ValueError):
            continue

    # Also try without the comment — just a JSON block with "bugs" key
    json_pattern = re.compile(r'```(?:json)?\s*\n(\{.*?\})\s*\n```', re.DOTALL)
    for match in json_pattern.finditer(raw):
        try:
            data = json.loads(match.group(1))
            if isinstance(data, dict) and "bugs" in data and isinstance(data["bugs"], list):
                return data["bugs"]
        except (json.JSONDecodeError, ValueError):
            continue

    return None


def _parse_results_table(raw: str) -> list[tuple[str, str, str]]:
    """Parse the Results by Test Case markdown table for FAILED entries.

    Returns list of (test_case_id, title, error_message) for failed tests.
    """
    failures: list[tuple[str, str, str]] = []

    # Match table rows with FAILED status
    # | TC-001 | Title | FAILED | 1.2s | error message |
    row_pattern = re.compile(
        r'\|\s*(TC-\d+|[\w-]+)\s*\|\s*(.*?)\s*\|\s*(?:FAILED|failed|❌)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|',
    )
    for m in row_pattern.finditer(raw):
        tc_id = m.group(1).strip()
        title = m.group(2).strip()
        error = m.group(4).strip() or m.group(3).strip()
        if tc_id and error and error != "-":
            failures.append((tc_id, title, error))

    # Also try simpler patterns
    if not failures:
        # "FAILED test.name — Error message" or similar
        fail_pattern = re.compile(
            r'(?:FAILED|FAIL|❌)\s+[\["]?(TC-\d+|[\w\[\]-]+)["\]]?\s+(.*?)(?:\s*[-—]\s*(.+))?$',
            re.MULTILINE,
        )
        for m in fail_pattern.finditer(raw):
            tc_id = m.group(1).strip()
            title = m.group(2).strip()
            error = m.group(3).strip() if m.group(3) else title
            failures.append((tc_id, title, error))

    return failures
