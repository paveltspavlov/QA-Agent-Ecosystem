"""Webhook notifications for workflow completion."""

from __future__ import annotations

import json
import urllib.request
import urllib.error
from datetime import datetime, timezone
from typing import Any

from rich.console import Console

console = Console()


def _is_slack_url(url: str) -> bool:
    """Check if the URL is a Slack incoming webhook."""
    return "hooks.slack.com" in url


def _build_slack_payload(summary: dict[str, Any]) -> dict[str, Any]:
    """Format the summary as a Slack Block Kit message."""
    status_emoji = ":white_check_mark:" if summary.get("status") == "success" else ":x:"
    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": f"{status_emoji} QA Workflow Complete: {summary.get('workflow', 'unknown')}",
            },
        },
        {
            "type": "section",
            "fields": [
                {"type": "mrkdwn", "text": f"*Status:* {summary.get('status', 'unknown')}"},
                {"type": "mrkdwn", "text": f"*Steps:* {summary.get('completed_steps', 0)}/{summary.get('total_steps', 0)}"},
                {"type": "mrkdwn", "text": f"*Duration:* {summary.get('duration_s', 0):.1f}s"},
                {"type": "mrkdwn", "text": f"*Timestamp:* {summary.get('timestamp', '')}"},
            ],
        },
    ]

    # Add step details if present
    steps = summary.get("steps", [])
    if steps:
        step_lines = []
        for step in steps:
            icon = ":white_check_mark:" if step.get("status") == "completed" else ":x:"
            step_lines.append(f"{icon} [{step.get('index', '?')}] {step.get('agent', 'unknown')}")
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "\n".join(step_lines),
            },
        })

    return {"blocks": blocks}


def _build_generic_payload(summary: dict[str, Any]) -> dict[str, Any]:
    """Return the summary dict as-is for generic webhooks."""
    return summary


def send_notification(webhook_url: str, summary: dict[str, Any]) -> bool:
    """POST a summary to the given webhook URL.

    Args:
        webhook_url: The URL to POST to.
        summary: A dict with keys like workflow, status, completed_steps,
                 total_steps, duration_s, timestamp, steps.

    Returns:
        True if the POST succeeded, False otherwise.
    """
    if _is_slack_url(webhook_url):
        payload = _build_slack_payload(summary)
    else:
        payload = _build_generic_payload(summary)

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        webhook_url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            console.print(
                f"[green]Notification sent to webhook (HTTP {resp.status})[/green]"
            )
            return True
    except urllib.error.HTTPError as exc:
        console.print(
            f"[red]Webhook notification failed: HTTP {exc.code} — {exc.reason}[/red]"
        )
        return False
    except urllib.error.URLError as exc:
        console.print(
            f"[red]Webhook notification failed: {exc.reason}[/red]"
        )
        return False


def build_workflow_summary(
    workflow_name: str,
    status: str,
    completed_steps: int,
    total_steps: int,
    duration_s: float,
    steps: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Build a standard summary dict for webhook notifications."""
    return {
        "workflow": workflow_name,
        "status": status,
        "completed_steps": completed_steps,
        "total_steps": total_steps,
        "duration_s": round(duration_s, 2),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "steps": steps or [],
    }
