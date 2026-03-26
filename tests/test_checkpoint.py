"""Unit tests for qa_ecosystem/checkpoint.py — checkpoint write/read/resume cycle."""

import json
import pytest

from qa_ecosystem.checkpoint import CheckpointWriter, load_checkpoint, list_checkpoints, clean_checkpoints


@pytest.fixture
def tmp_checkpoint(tmp_path, monkeypatch):
    """Patch CHECKPOINTS_DIR to use a temp directory."""
    import qa_ecosystem.checkpoint as cp
    monkeypatch.setattr(cp, "CHECKPOINTS_DIR", tmp_path)
    return tmp_path


def test_checkpoint_creates_file(tmp_checkpoint):
    writer = CheckpointWriter()
    writer.append_step("requirements-analyst", "Analyze this", "Found 3 gaps")
    assert writer.path.exists()


def test_checkpoint_session_id_format():
    writer = CheckpointWriter()
    assert len(writer.session_id) == 8
    assert writer.session_id.isalnum()


def test_checkpoint_append_step(tmp_checkpoint):
    writer = CheckpointWriter()
    writer.append_step("agent-1", "prompt-1", "result-1")
    writer.append_step("agent-2", "prompt-2", "result-2")
    assert len(writer.steps) == 2
    assert writer.steps[0]["agent_name"] == "agent-1"
    assert writer.steps[1]["agent_name"] == "agent-2"
    assert writer.steps[0]["step"] == 1
    assert writer.steps[1]["step"] == 2


def test_checkpoint_step_has_timestamp(tmp_checkpoint):
    writer = CheckpointWriter()
    writer.append_step("agent-1", "prompt-1", "result-1")
    assert "timestamp" in writer.steps[0]


def test_checkpoint_step_has_status(tmp_checkpoint):
    writer = CheckpointWriter()
    writer.append_step("agent-1", "prompt-1", "result-1")
    assert writer.steps[0]["status"] == "completed"


def test_checkpoint_step_custom_status(tmp_checkpoint):
    writer = CheckpointWriter()
    writer.append_step("agent-1", "prompt-1", "result-1", status="failed")
    assert writer.steps[0]["status"] == "failed"


def test_checkpoint_json_structure(tmp_checkpoint):
    writer = CheckpointWriter()
    writer.append_step("agent-1", "prompt-1", "result-1")
    data = json.loads(writer.path.read_text(encoding="utf-8"))
    assert "session_id" in data
    assert "steps" in data
    assert "created_at" in data
    assert "updated_at" in data
    assert "total_steps" in data
    assert "completed_steps" in data
    assert data["session_id"] == writer.session_id
    assert data["total_steps"] == 1
    assert data["completed_steps"] == 1


def test_checkpoint_workflow_name(tmp_checkpoint):
    writer = CheckpointWriter(workflow_name="feature-testing")
    writer.append_step("agent-1", "prompt-1", "result-1")
    data = json.loads(writer.path.read_text(encoding="utf-8"))
    assert data["workflow_name"] == "feature-testing"


def test_is_completed_found(tmp_checkpoint):
    writer = CheckpointWriter()
    writer.append_step("agent-1", "prompt-1", "result-1")
    found, result = writer.is_completed("agent-1")
    assert found is True
    assert result == "result-1"


def test_is_completed_not_found(tmp_checkpoint):
    writer = CheckpointWriter()
    writer.append_step("agent-1", "prompt-1", "result-1")
    found, result = writer.is_completed("agent-2")
    assert found is False
    assert result == ""


def test_is_completed_skips_failed(tmp_checkpoint):
    """Failed steps should not count as completed."""
    writer = CheckpointWriter()
    writer.append_step("agent-1", "prompt-1", "error", status="failed")
    found, result = writer.is_completed("agent-1")
    assert found is False


def test_update_step_status(tmp_checkpoint):
    writer = CheckpointWriter()
    writer.append_step("agent-1", "prompt-1", "result-1", status="running")
    assert writer.steps[0]["status"] == "running"
    writer.update_step_status(1, "completed")
    assert writer.steps[0]["status"] == "completed"


def test_load_checkpoint_round_trip(tmp_checkpoint):
    writer = CheckpointWriter(workflow_name="test-workflow")
    writer.append_step("agent-1", "prompt-1", "result-1")
    writer.append_step("agent-2", "prompt-2", "result-2")

    loaded = load_checkpoint(str(writer.path))
    assert loaded.session_id == writer.session_id
    assert loaded.workflow_name == "test-workflow"
    assert len(loaded.steps) == 2

    found, result = loaded.is_completed("agent-1")
    assert found is True
    assert result == "result-1"


def test_checkpoint_incremental_flush(tmp_checkpoint):
    """Each append_step should flush to disk immediately."""
    writer = CheckpointWriter()
    writer.append_step("agent-1", "prompt-1", "result-1")
    data1 = json.loads(writer.path.read_text(encoding="utf-8"))
    assert data1["total_steps"] == 1

    writer.append_step("agent-2", "prompt-2", "result-2")
    data2 = json.loads(writer.path.read_text(encoding="utf-8"))
    assert data2["total_steps"] == 2


def test_multiple_checkpoints_different_sessions(tmp_checkpoint):
    w1 = CheckpointWriter()
    w2 = CheckpointWriter()
    assert w1.session_id != w2.session_id
    w1.append_step("a", "p", "r")
    w2.append_step("b", "p", "r")
    assert w1.path != w2.path
    assert w1.path.exists()
    assert w2.path.exists()


def test_summary(tmp_checkpoint):
    writer = CheckpointWriter(workflow_name="test-wf")
    writer.append_step("agent-1", "p", "r")
    writer.append_step("agent-2", "p", "error", status="failed")
    summary = writer.summary()
    assert summary["session_id"] == writer.session_id
    assert summary["workflow_name"] == "test-wf"
    assert summary["total_steps"] == 2
    assert summary["completed"] == 1
    assert summary["failed"] == 1
    assert summary["agents"] == ["agent-1", "agent-2"]


def test_list_checkpoints(tmp_checkpoint):
    w1 = CheckpointWriter()
    w1.append_step("agent-1", "p", "r")
    w2 = CheckpointWriter()
    w2.append_step("agent-2", "p", "r")

    results = list_checkpoints()
    assert len(results) == 2
    session_ids = {r["session_id"] for r in results}
    assert w1.session_id in session_ids
    assert w2.session_id in session_ids


def test_list_checkpoints_empty(tmp_checkpoint):
    results = list_checkpoints()
    assert results == []


def test_clean_checkpoints(tmp_checkpoint):
    for i in range(7):
        w = CheckpointWriter()
        w.append_step(f"agent-{i}", "p", "r")

    assert len(list_checkpoints()) == 7
    removed = clean_checkpoints(keep_last=3)
    assert removed == 4
    assert len(list_checkpoints()) == 3
