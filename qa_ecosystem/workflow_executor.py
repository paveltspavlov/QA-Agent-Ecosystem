"""Workflow executor — DAG-based agent orchestration with dependency management.

Loads workflow definitions from workflows.yaml and executes agents respecting
index ordering and dependencies.  Steps with all dependencies satisfied can
run in parallel via asyncio.gather().
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from pathlib import Path
from typing import Awaitable, Callable, Literal

import yaml
from rich.console import Console

from qa_ecosystem.checkpoint import CheckpointWriter

console = Console()

StepStatus = Literal["pending", "running", "completed", "failed", "skipped"]

# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------


@dataclass
class WorkflowStep:
    """A single step in a workflow."""
    index: int
    agent: str
    description: str
    dependencies: list[int] = field(default_factory=list)
    status: StepStatus = "pending"
    result: str | None = None


@dataclass
class WorkflowDefinition:
    """A named workflow with ordered, dependency-aware steps."""
    name: str
    description: str
    steps: list[WorkflowStep] = field(default_factory=list)

    def get_step(self, index: int) -> WorkflowStep | None:
        for step in self.steps:
            if step.index == index:
                return step
        return None

    def validate(self) -> list[str]:
        """Check for configuration errors. Returns list of error messages."""
        errors = []
        indices = {s.index for s in self.steps}
        for step in self.steps:
            for dep in step.dependencies:
                if dep not in indices:
                    errors.append(
                        f"Step {step.index} ({step.agent}) depends on index {dep} "
                        f"which does not exist"
                    )
                if dep >= step.index:
                    errors.append(
                        f"Step {step.index} ({step.agent}) depends on index {dep} "
                        f"which is >= its own index (would cause deadlock)"
                    )
        if len(indices) != len(self.steps):
            errors.append("Duplicate step indices found")
        return errors

    def render_dag(self) -> str:
        """Return a simple text representation of the dependency graph."""
        lines = []
        for step in sorted(self.steps, key=lambda s: s.index):
            deps = ", ".join(str(d) for d in step.dependencies) if step.dependencies else "none"
            lines.append(f"  [{step.index}] {step.agent} (deps: {deps})")
        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Workflow loader
# ---------------------------------------------------------------------------

_WORKFLOWS_PATH = Path(__file__).parent / "workflows.yaml"
_cache: dict[str, WorkflowDefinition] | None = None


def _ensure_loaded() -> dict[str, WorkflowDefinition]:
    global _cache
    if _cache is not None:
        return _cache
    _cache = {}
    if not _WORKFLOWS_PATH.exists():
        return _cache
    with open(_WORKFLOWS_PATH, encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    for key, wf_data in data.get("workflows", {}).items():
        steps = []
        for s in wf_data.get("steps", []):
            steps.append(WorkflowStep(
                index=s["index"],
                agent=s["agent"],
                description=s.get("description", ""),
                dependencies=s.get("dependencies", []),
            ))
        _cache[key] = WorkflowDefinition(
            name=wf_data.get("name", key),
            description=wf_data.get("description", ""),
            steps=steps,
        )
    return _cache


def get_workflow(name: str) -> WorkflowDefinition:
    """Load a named workflow from workflows.yaml."""
    workflows = _ensure_loaded()
    if name not in workflows:
        available = ", ".join(sorted(workflows))
        raise KeyError(f"Unknown workflow {name!r}. Available: {available}")
    return workflows[name]


def list_workflows() -> dict[str, WorkflowDefinition]:
    """Return all defined workflows."""
    return dict(_ensure_loaded())


def load_workflow_file(path: str) -> WorkflowDefinition:
    """Load a workflow definition from a custom YAML file."""
    with open(path, encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}

    # Support both top-level and nested format
    if "workflows" in data:
        # Take the first workflow in the file
        key, wf_data = next(iter(data["workflows"].items()))
    elif "steps" in data:
        wf_data = data
    else:
        raise ValueError(f"Invalid workflow file format in {path}")

    steps = []
    for s in wf_data.get("steps", []):
        steps.append(WorkflowStep(
            index=s["index"],
            agent=s["agent"],
            description=s.get("description", ""),
            dependencies=s.get("dependencies", []),
        ))
    return WorkflowDefinition(
        name=wf_data.get("name", Path(path).stem),
        description=wf_data.get("description", ""),
        steps=steps,
    )


# ---------------------------------------------------------------------------
# Workflow modification helpers
# ---------------------------------------------------------------------------

def apply_reorder(workflow: WorkflowDefinition, reorder_spec: str) -> WorkflowDefinition:
    """Apply a reorder specification: "1:agent-a, 2:agent-b, 3:agent-c".

    Creates a new workflow with agents assigned to the given indices.
    Dependencies are NOT auto-adjusted — use apply_deps() for that.
    """
    pairs = [p.strip() for p in reorder_spec.split(",")]
    new_steps = []
    for pair in pairs:
        idx_str, agent = pair.split(":", 1)
        idx = int(idx_str.strip())
        agent = agent.strip()
        # Find original step to carry over description
        original = next((s for s in workflow.steps if s.agent == agent), None)
        desc = original.description if original else ""
        # Carry over dependencies from original if they exist
        deps = original.dependencies if original else []
        new_steps.append(WorkflowStep(
            index=idx,
            agent=agent,
            description=desc,
            dependencies=deps,
        ))
    return WorkflowDefinition(
        name=workflow.name,
        description=workflow.description,
        steps=new_steps,
    )


def apply_deps(workflow: WorkflowDefinition, deps_spec: str) -> WorkflowDefinition:
    """Apply a dependency specification: "2:[1], 3:[1,2], 4:[3]".

    Modifies dependencies on the given workflow steps.
    """
    # Parse "2:[1], 3:[1,2]" format
    import re
    for match in re.finditer(r'(\d+):\[([^\]]*)\]', deps_spec):
        idx = int(match.group(1))
        dep_str = match.group(2).strip()
        deps = [int(d.strip()) for d in dep_str.split(",") if d.strip()] if dep_str else []
        step = workflow.get_step(idx)
        if step:
            step.dependencies = deps
    return workflow


def apply_skip(workflow: WorkflowDefinition, skip_agents: list[str]) -> WorkflowDefinition:
    """Remove agents from the workflow and update dependencies."""
    skipped_indices = set()
    remaining_steps = []
    for step in workflow.steps:
        if step.agent in skip_agents:
            skipped_indices.add(step.index)
        else:
            remaining_steps.append(step)
    # Remove skipped indices from remaining steps' dependencies
    for step in remaining_steps:
        step.dependencies = [d for d in step.dependencies if d not in skipped_indices]
    return WorkflowDefinition(
        name=workflow.name,
        description=workflow.description,
        steps=remaining_steps,
    )


# ---------------------------------------------------------------------------
# Executor
# ---------------------------------------------------------------------------

# Type for the delegate function: (agent_name, task_prompt) -> result
DelegateFn = Callable[[str, str], Awaitable[str]]


class WorkflowExecutor:
    """Executes workflow steps respecting index ordering and dependencies.

    Steps whose dependencies are all complete can run in parallel.
    """

    def __init__(
        self,
        workflow: WorkflowDefinition,
        checkpoint: CheckpointWriter | None = None,
    ):
        self.workflow = workflow
        self.checkpoint = checkpoint or CheckpointWriter(workflow_name=workflow.name)
        self._completed: dict[int, str] = {}  # index → result

        # Restore completed steps from checkpoint
        for step in self.workflow.steps:
            if self.checkpoint:
                done, cached = self.checkpoint.is_completed(step.agent)
                if done:
                    step.status = "completed"
                    step.result = cached
                    self._completed[step.index] = cached

    def get_ready_steps(self) -> list[WorkflowStep]:
        """Return steps whose dependencies are all completed and status is pending.

        Steps whose dependencies have failed are automatically skipped.
        """
        failed_indices = {
            s.index for s in self.workflow.steps if s.status == "failed"
        }

        ready = []
        for step in self.workflow.steps:
            if step.status != "pending":
                continue
            # If any dependency failed, skip this step entirely
            if any(dep in failed_indices for dep in step.dependencies):
                step.status = "skipped"
                step.result = "(skipped — dependency failed)"
                console.print(
                    f"[yellow]Skipping step [{step.index}] {step.agent} — "
                    f"dependency produced no output.[/yellow]\n"
                )
                continue
            if all(dep in self._completed for dep in step.dependencies):
                ready.append(step)
        return ready

    async def execute(self, delegate_fn: DelegateFn, user_prompt: str = "") -> dict[int, str]:
        """Run all steps, respecting dependencies. Parallel when possible.

        Args:
            delegate_fn: Async function (agent_name, task_prompt) -> result_string
            user_prompt: The original user input to include in each agent's context

        Returns:
            dict mapping step index to result string
        """
        errors = self.workflow.validate()
        if errors:
            raise ValueError(f"Invalid workflow: {'; '.join(errors)}")

        while any(s.status == "pending" for s in self.workflow.steps):
            ready = self.get_ready_steps()
            if not ready:
                pending = [s for s in self.workflow.steps if s.status == "pending"]
                raise RuntimeError(
                    f"Deadlock: {len(pending)} pending steps but none ready. "
                    f"Pending: {[(s.index, s.agent) for s in pending]}"
                )

            if len(ready) == 1:
                # Sequential — single step
                step = ready[0]
                await self._run_step(step, delegate_fn, user_prompt)
            else:
                # Parallel — multiple steps ready simultaneously
                console.print(
                    f"[bold green]Running {len(ready)} steps in parallel: "
                    f"{', '.join(s.agent for s in ready)}[/bold green]\n"
                )
                tasks = [
                    self._run_step(step, delegate_fn, user_prompt)
                    for step in ready
                ]
                await asyncio.gather(*tasks, return_exceptions=True)

                # Check for failures after parallel batch
                for step in ready:
                    if step.status == "failed":
                        console.print(
                            f"[yellow]Warning: {step.agent} (step {step.index}) failed. "
                            f"Dependent steps may be affected.[/yellow]\n"
                        )

        return dict(self._completed)

    async def _run_step(
        self,
        step: WorkflowStep,
        delegate_fn: DelegateFn,
        user_prompt: str,
    ) -> None:
        """Execute a single workflow step."""
        step.status = "running"
        context = self._build_context(step, user_prompt)

        console.print(
            f"[dim]▶ Step [{step.index}] {step.agent}: {step.description}[/dim]"
        )

        try:
            result = await delegate_fn(step.agent, context)

            # Detect empty results — treat as failure to prevent cascading
            # empty outputs through downstream agents
            if not result or not result.strip():
                step.status = "failed"
                step.result = "(empty output)"
                console.print(
                    f"[red]Step [{step.index}] {step.agent} produced empty output — "
                    f"marking as failed. Downstream steps depending on this will be "
                    f"skipped.[/red]\n"
                )
                if self.checkpoint:
                    self.checkpoint.append_step(
                        agent_name=step.agent,
                        prompt=context,
                        result="(empty output)",
                        status="failed",
                    )
                return

            step.status = "completed"
            step.result = result
            self._completed[step.index] = result

            if self.checkpoint:
                self.checkpoint.append_step(
                    agent_name=step.agent,
                    prompt=context,
                    result=result,
                    status="completed",
                )
        except Exception as exc:
            step.status = "failed"
            step.result = str(exc)
            console.print(f"[red]Step [{step.index}] {step.agent} failed: {exc}[/red]\n")

            if self.checkpoint:
                self.checkpoint.append_step(
                    agent_name=step.agent,
                    prompt=context,
                    result=str(exc),
                    status="failed",
                )

    def _build_context(self, step: WorkflowStep, user_prompt: str) -> str:
        """Build prompt context from dependency results and user input."""
        parts = []

        if user_prompt:
            parts.append(f"## Original User Input\n\n{user_prompt}")

        # Provide a clear, directive task instruction
        parts.append(f"\n## Your Task\n\n{step.description}")
        parts.append(
            f"You are step [{step.index}] in a {len(self.workflow.steps)}-step workflow: "
            f"**{self.workflow.name}**."
        )

        if not step.dependencies:
            parts.append(
                "\nYou are the FIRST step. Use the user input above as your primary "
                "input and produce detailed, structured output that downstream agents "
                "can consume."
            )

        if step.dependencies:
            parts.append("\n## Context from Previous Steps\n")
            parts.append(
                "Use the output below from previous agents as your primary input. "
                "Build upon their work — do NOT repeat discovery they already performed."
            )
            for dep_idx in step.dependencies:
                dep_step = self.workflow.get_step(dep_idx)
                if dep_step and dep_idx in self._completed:
                    parts.append(
                        f"\n### Output from [{dep_idx}] {dep_step.agent}:\n"
                        f"{self._completed[dep_idx]}"
                    )

        return "\n".join(parts)
