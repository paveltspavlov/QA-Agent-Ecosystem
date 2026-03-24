"""Workflow checkpoint system — saves delegation steps and enables resume."""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

# OUTPUTS_DIR is defined in runner.py, not config.py — use a safe fallback
try:
    from qa_ecosystem.runner import OUTPUTS_DIR as _BASE
except ImportError:
    _BASE = Path("outputs")

CHECKPOINTS_DIR = _BASE / "checkpoints"


@dataclass
class CheckpointWriter:
    """Writes one JSON checkpoint file per orchestration session."""

    session_id: str = field(default_factory=lambda: uuid.uuid4().hex[:8])
    steps: list[dict] = field(default_factory=list)

    @property
    def path(self) -> Path:
        return CHECKPOINTS_DIR / f"{self.session_id}.json"

    def append_step(self, agent_name: str, prompt: str, result: str) -> None:
        self.steps.append({
            "step": len(self.steps) + 1,
            "agent_name": agent_name,
            "prompt": prompt,
            "result": result,
            "timestamp": datetime.now().isoformat(),
        })
        self._flush()

    def _flush(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(
            json.dumps({"session_id": self.session_id, "steps": self.steps}, indent=2),
            encoding="utf-8",
        )

    def is_completed(self, agent_name: str) -> tuple[bool, str]:
        """Return (True, cached_result) if agent already ran, else (False, '')."""
        for step in self.steps:
            if step["agent_name"] == agent_name:
                return True, step["result"]
        return False, ""


def load_checkpoint(path: str) -> CheckpointWriter:
    """Load an existing checkpoint file and return a CheckpointWriter."""
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    writer = CheckpointWriter(session_id=data.get("session_id", "resumed"))
    writer.steps = data.get("steps", [])
    return writer
