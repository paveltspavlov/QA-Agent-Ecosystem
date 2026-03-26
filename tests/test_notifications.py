"""Unit tests for qa_ecosystem/notifications.py — webhook notifications."""

import json
from unittest.mock import patch, MagicMock

from qa_ecosystem.notifications import (
    _is_slack_url,
    _build_slack_payload,
    _build_generic_payload,
    build_workflow_summary,
    send_notification,
)


def _sample_summary():
    return build_workflow_summary(
        workflow_name="feature-testing",
        status="success",
        completed_steps=5,
        total_steps=5,
        duration_s=42.5,
        steps=[
            {"index": 1, "agent": "requirements-analyst", "status": "completed"},
            {"index": 2, "agent": "test-case-generator", "status": "completed"},
        ],
    )


def test_is_slack_url_true():
    assert _is_slack_url("https://hooks.slack.com/services/T00/B00/xxx")


def test_is_slack_url_false():
    assert not _is_slack_url("https://example.com/webhook")


def test_build_workflow_summary_fields():
    summary = _sample_summary()
    assert summary["workflow"] == "feature-testing"
    assert summary["status"] == "success"
    assert summary["completed_steps"] == 5
    assert summary["total_steps"] == 5
    assert summary["duration_s"] == 42.5
    assert "timestamp" in summary
    assert len(summary["steps"]) == 2


def test_build_workflow_summary_defaults():
    summary = build_workflow_summary("test", "error", 0, 3, 1.0)
    assert summary["steps"] == []


def test_build_generic_payload_is_passthrough():
    summary = _sample_summary()
    payload = _build_generic_payload(summary)
    assert payload is summary


def test_build_slack_payload_has_blocks():
    summary = _sample_summary()
    payload = _build_slack_payload(summary)
    assert "blocks" in payload
    assert len(payload["blocks"]) >= 2
    # Header block
    assert payload["blocks"][0]["type"] == "header"
    assert "feature-testing" in payload["blocks"][0]["text"]["text"]
    # Section block with fields
    assert payload["blocks"][1]["type"] == "section"


def test_build_slack_payload_error_status():
    summary = build_workflow_summary("test", "error", 2, 5, 10.0)
    payload = _build_slack_payload(summary)
    assert ":x:" in payload["blocks"][0]["text"]["text"]


def test_build_slack_payload_step_details():
    summary = _sample_summary()
    payload = _build_slack_payload(summary)
    # Third block should contain step lines
    assert len(payload["blocks"]) == 3
    step_text = payload["blocks"][2]["text"]["text"]
    assert "requirements-analyst" in step_text
    assert "test-case-generator" in step_text


@patch("qa_ecosystem.notifications.urllib.request.urlopen")
def test_send_notification_success(mock_urlopen):
    mock_resp = MagicMock()
    mock_resp.status = 200
    mock_resp.__enter__ = lambda s: s
    mock_resp.__exit__ = MagicMock(return_value=False)
    mock_urlopen.return_value = mock_resp

    result = send_notification("https://example.com/hook", _sample_summary())
    assert result is True
    mock_urlopen.assert_called_once()


@patch("qa_ecosystem.notifications.urllib.request.urlopen")
def test_send_notification_http_error(mock_urlopen):
    import urllib.error
    mock_urlopen.side_effect = urllib.error.HTTPError(
        url="https://example.com/hook", code=500, msg="Internal Server Error",
        hdrs=None, fp=None
    )

    result = send_notification("https://example.com/hook", _sample_summary())
    assert result is False


@patch("qa_ecosystem.notifications.urllib.request.urlopen")
def test_send_notification_url_error(mock_urlopen):
    import urllib.error
    mock_urlopen.side_effect = urllib.error.URLError("Connection refused")

    result = send_notification("https://example.com/hook", _sample_summary())
    assert result is False


@patch("qa_ecosystem.notifications.urllib.request.urlopen")
def test_send_notification_slack_format(mock_urlopen):
    mock_resp = MagicMock()
    mock_resp.status = 200
    mock_resp.__enter__ = lambda s: s
    mock_resp.__exit__ = MagicMock(return_value=False)
    mock_urlopen.return_value = mock_resp

    result = send_notification(
        "https://hooks.slack.com/services/T00/B00/xxx",
        _sample_summary(),
    )
    assert result is True
    # Verify the payload sent was Slack Block Kit format
    call_args = mock_urlopen.call_args
    req = call_args[0][0]
    payload = json.loads(req.data)
    assert "blocks" in payload
