"""Workflow checkpoint system — saves delegation steps and enables resume."""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Literal

# OUTPUTS_DIR is defined in runner.py, not config.py — use a safe fallback
try:
    from qa_ecosystem.runner import OUTPUTS_DIR as _BASE
except ImportError:
    _BASE = Path("outputs")

CHECKPOINTS_DIR = _BASE / "checkpoints"

# Step status type
StepStatus = Literal["pending", "running", "completed", "failed", "skipped"]


@dataclass
class CheckpointWriter:
    """Writes one JSON checkpoint file per orchestration session."""

    session_id: str = field(default_factory=lambda: uuid.uuid4().hex[:8])
    steps: list[dict] = field(default_factory=list)
    workflow_name: str | None = None
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    @property
    def path(self) -> Path:
        return CHECKPOINTS_DIR / f"{self.session_id}.json"

    def append_step(
        self,
        agent_name: str,
        prompt: str,
        result: str,
        status: StepStatus = "completed",
    ) -> None:
        self.steps.append({
            "step": len(self.steps) + 1,
            "agent_name": agent_name,
            "prompt": prompt,
            "result": result,
            "status": status,
            "timestamp": datetime.now().isoformat(),
        })
        self._flush()

    def update_step_status(self, step_number: int, status: StepStatus) -> None:
        """Update the status of an existing step (1-based index)."""
        for step in self.steps:
            if step["step"] == step_number:
                step["status"] = status
                step["timestamp"] = datetime.now().isoformat()
                self._flush()
                return

    def _flush(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "session_id": self.session_id,
            "workflow_name": self.workflow_name,
            "created_at": self.created_at,
            "updated_at": datetime.now().isoformat(),
            "total_steps": len(self.steps),
            "completed_steps": sum(1 for s in self.steps if s.get("status") == "completed"),
            "steps": self.steps,
        }
        self.path.write_text(
            json.dumps(data, indent=2),
            encoding="utf-8",
        )

    def is_completed(self, agent_name: str) -> tuple[bool, str]:
        """Return (True, cached_result) if agent already ran, else (False, '')."""
        for step in self.steps:
            if step["agent_name"] == agent_name and step.get("status") == "completed":
                return True, step["result"]
        return False, ""

    def summary(self) -> dict:
        """Return a summary dict for listing checkpoints."""
        return {
            "session_id": self.session_id,
            "workflow_name": self.workflow_name,
            "created_at": self.created_at,
            "total_steps": len(self.steps),
            "completed": sum(1 for s in self.steps if s.get("status") == "completed"),
            "failed": sum(1 for s in self.steps if s.get("status") == "failed"),
            "agents": [s["agent_name"] for s in self.steps],
        }


def load_checkpoint(path: str) -> CheckpointWriter:
    """Load an existing checkpoint file and return a CheckpointWriter."""
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    writer = CheckpointWriter(
        session_id=data.get("session_id", "resumed"),
        workflow_name=data.get("workflow_name"),
        created_at=data.get("created_at", datetime.now().isoformat()),
    )
    writer.steps = data.get("steps", [])
    return writer


def list_checkpoints() -> list[dict]:
    """Scan the checkpoints directory and return summary dicts for all sessions."""
    if not CHECKPOINTS_DIR.exists():
        return []
    results = []
    for cp_file in sorted(CHECKPOINTS_DIR.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
        try:
            data = json.loads(cp_file.read_text(encoding="utf-8"))
            results.append({
                "session_id": data.get("session_id", cp_file.stem),
                "workflow_name": data.get("workflow_name"),
                "created_at": data.get("created_at", "unknown"),
                "updated_at": data.get("updated_at", "unknown"),
                "total_steps": data.get("total_steps", len(data.get("steps", []))),
                "completed_steps": data.get("completed_steps", 0),
                "file": str(cp_file),
            })
        except (json.JSONDecodeError, OSError):
            continue
    return results


def clean_checkpoints(keep_last: int = 5) -> int:
    """Remove old checkpoint files, keeping the most recent `keep_last` files.

    Returns the number of files removed.
    """
    if not CHECKPOINTS_DIR.exists():
        return 0
    files = sorted(CHECKPOINTS_DIR.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
    removed = 0
    for cp_file in files[keep_last:]:
        cp_file.unlink()
        removed += 1
    return removed
