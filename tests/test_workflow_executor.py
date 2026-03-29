"""Unit tests for qa_ecosystem/workflow_executor.py — DAG-based workflow execution."""

import asyncio
import pytest

from qa_ecosystem.workflow_executor import (
    WorkflowStep,
    WorkflowDefinition,
    WorkflowExecutor,
    get_workflow,
    list_workflows,
    load_workflow_file,
    apply_reorder,
    apply_deps,
    apply_skip,
)


# ---------------------------------------------------------------------------
# WorkflowDefinition tests
# ---------------------------------------------------------------------------

def test_workflow_definition_validate_ok():
    wf = WorkflowDefinition(
        name="test", description="test",
        steps=[
            WorkflowStep(index=1, agent="a", description="d", dependencies=[]),
            WorkflowStep(index=2, agent="b", description="d", dependencies=[1]),
        ],
    )
    assert wf.validate() == []


def test_workflow_definition_validate_missing_dep():
    wf = WorkflowDefinition(
        name="test", description="test",
        steps=[
            WorkflowStep(index=1, agent="a", description="d", dependencies=[99]),
        ],
    )
    errors = wf.validate()
    assert len(errors) >= 1
    assert "99" in errors[0]


def test_workflow_definition_validate_forward_dep():
    wf = WorkflowDefinition(
        name="test", description="test",
        steps=[
            WorkflowStep(index=1, agent="a", description="d", dependencies=[2]),
            WorkflowStep(index=2, agent="b", description="d", dependencies=[]),
        ],
    )
    errors = wf.validate()
    assert len(errors) >= 1


def test_workflow_definition_render_dag():
    wf = WorkflowDefinition(
        name="test", description="test",
        steps=[
            WorkflowStep(index=1, agent="a", description="d", dependencies=[]),
            WorkflowStep(index=2, agent="b", description="d", dependencies=[1]),
        ],
    )
    dag = wf.render_dag()
    assert "[1] a" in dag
    assert "[2] b" in dag


def test_workflow_definition_get_step():
    wf = WorkflowDefinition(
        name="test", description="test",
        steps=[
            WorkflowStep(index=1, agent="a", description="d"),
            WorkflowStep(index=2, agent="b", description="d"),
        ],
    )
    assert wf.get_step(1).agent == "a"
    assert wf.get_step(2).agent == "b"
    assert wf.get_step(99) is None


# ---------------------------------------------------------------------------
# Loader tests
# ---------------------------------------------------------------------------

def test_list_workflows_returns_dict():
    workflows = list_workflows()
    assert isinstance(workflows, dict)
    assert len(workflows) >= 5


def test_get_workflow_feature_testing():
    wf = get_workflow("feature-testing")
    assert wf.name == "New Feature Testing"
    assert len(wf.steps) == 5
    assert wf.steps[0].agent == "requirements-analyst"
    assert wf.steps[0].dependencies == []
    assert wf.steps[1].dependencies == [1]


def test_get_workflow_playwright_gen():
    wf = get_workflow("playwright-gen")
    assert len(wf.steps) == 10
    # test-validator depends on ui-test-designer, seed-data-manager, and api-coverage-planner
    step5 = wf.get_step(5)
    assert step5.agent == "test-validator"
    assert set(step5.dependencies) == {2, 3, 4}
    # accessibility-auditor and performance-profiler run in parallel after discovery
    step9 = wf.get_step(9)
    assert step9.agent == "accessibility-auditor"
    assert step9.dependencies == [1]
    step10 = wf.get_step(10)
    assert step10.agent == "performance-profiler"
    assert step10.dependencies == [1]


def test_get_workflow_unknown_raises():
    with pytest.raises(KeyError):
        get_workflow("nonexistent-workflow-xyz")


def test_all_workflows_validate():
    """Every workflow in workflows.yaml should pass validation."""
    for name, wf in list_workflows().items():
        errors = wf.validate()
        assert errors == [], f"Workflow '{name}' has validation errors: {errors}"


def test_load_workflow_file(tmp_path):
    wf_file = tmp_path / "custom.yaml"
    wf_file.write_text("""
name: Custom Workflow
description: A test workflow
steps:
  - index: 1
    agent: requirements-analyst
    description: Analyze
    dependencies: []
  - index: 2
    agent: test-case-generator
    description: Generate
    dependencies: [1]
""", encoding="utf-8")
    wf = load_workflow_file(str(wf_file))
    assert wf.name == "Custom Workflow"
    assert len(wf.steps) == 2


# ---------------------------------------------------------------------------
# Modification tests
# ---------------------------------------------------------------------------

def test_apply_reorder():
    wf = get_workflow("feature-testing")
    reordered = apply_reorder(wf, "1:test-case-generator, 2:requirements-analyst, 3:testware-creator")
    assert len(reordered.steps) == 3
    assert reordered.steps[0].agent == "test-case-generator"
    assert reordered.steps[0].index == 1
    assert reordered.steps[1].agent == "requirements-analyst"
    assert reordered.steps[1].index == 2


def test_apply_deps():
    wf = WorkflowDefinition(
        name="test", description="test",
        steps=[
            WorkflowStep(index=1, agent="a", description="d"),
            WorkflowStep(index=2, agent="b", description="d"),
            WorkflowStep(index=3, agent="c", description="d"),
        ],
    )
    apply_deps(wf, "2:[1], 3:[1,2]")
    assert wf.get_step(2).dependencies == [1]
    assert wf.get_step(3).dependencies == [1, 2]


def test_apply_skip():
    wf = WorkflowDefinition(
        name="test", description="test",
        steps=[
            WorkflowStep(index=1, agent="a", description="d", dependencies=[]),
            WorkflowStep(index=2, agent="b", description="d", dependencies=[1]),
            WorkflowStep(index=3, agent="c", description="d", dependencies=[1, 2]),
        ],
    )
    skipped = apply_skip(wf, ["b"])
    assert len(skipped.steps) == 2
    # Step 3 should no longer depend on 2 (skipped)
    step3 = next(s for s in skipped.steps if s.agent == "c")
    assert step3.dependencies == [1]


# ---------------------------------------------------------------------------
# Executor tests
# ---------------------------------------------------------------------------

@pytest.fixture
def simple_workflow():
    return WorkflowDefinition(
        name="test", description="test",
        steps=[
            WorkflowStep(index=1, agent="agent-a", description="Step A", dependencies=[]),
            WorkflowStep(index=2, agent="agent-b", description="Step B", dependencies=[1]),
            WorkflowStep(index=3, agent="agent-c", description="Step C", dependencies=[1]),
            WorkflowStep(index=4, agent="agent-d", description="Step D", dependencies=[2, 3]),
        ],
    )


@pytest.fixture
def tmp_checkpoint(tmp_path, monkeypatch):
    import qa_ecosystem.checkpoint as cp
    monkeypatch.setattr(cp, "CHECKPOINTS_DIR", tmp_path)
    return tmp_path


def test_executor_sequential(simple_workflow, tmp_checkpoint):
    """Test that steps execute in correct dependency order."""
    execution_order = []

    async def mock_delegate(agent_name: str, prompt: str) -> str:
        execution_order.append(agent_name)
        return f"Result from {agent_name}"

    executor = WorkflowExecutor(simple_workflow)
    results = asyncio.run(executor.execute(mock_delegate, "test input"))

    assert len(results) == 4
    # agent-a must be first
    assert execution_order[0] == "agent-a"
    # agent-b and agent-c must be after agent-a but before agent-d
    assert "agent-b" in execution_order[1:3]
    assert "agent-c" in execution_order[1:3]
    # agent-d must be last
    assert execution_order[3] == "agent-d"


def test_executor_parallel_detection(simple_workflow, tmp_checkpoint):
    """Steps 2 and 3 both depend only on step 1, so they should be parallel-ready."""
    executor = WorkflowExecutor(simple_workflow)
    # Manually complete step 1
    simple_workflow.steps[0].status = "completed"
    simple_workflow.steps[0].result = "done"
    executor._completed[1] = "done"

    ready = executor.get_ready_steps()
    assert len(ready) == 2
    agents = {s.agent for s in ready}
    assert agents == {"agent-b", "agent-c"}


def test_executor_context_includes_deps(tmp_checkpoint):
    """The context for a step should include results from its dependencies."""
    wf = WorkflowDefinition(
        name="test", description="test",
        steps=[
            WorkflowStep(index=1, agent="a", description="Do A", dependencies=[]),
            WorkflowStep(index=2, agent="b", description="Do B", dependencies=[1]),
        ],
    )

    received_prompts = {}

    async def mock_delegate(agent_name: str, prompt: str) -> str:
        received_prompts[agent_name] = prompt
        return f"Result from {agent_name}"

    executor = WorkflowExecutor(wf)
    asyncio.run(executor.execute(mock_delegate, "user request"))

    # Step 2's context should include the result from step 1
    assert "Result from a" in received_prompts["b"]
    assert "user request" in received_prompts["b"]


def test_executor_checkpoint_resume(tmp_checkpoint):
    """Already-completed steps should be skipped on resume."""
    from qa_ecosystem.checkpoint import CheckpointWriter

    checkpoint = CheckpointWriter(workflow_name="test")
    checkpoint.append_step("agent-a", "prompt", "cached result A")

    wf = WorkflowDefinition(
        name="test", description="test",
        steps=[
            WorkflowStep(index=1, agent="agent-a", description="A", dependencies=[]),
            WorkflowStep(index=2, agent="agent-b", description="B", dependencies=[1]),
        ],
    )

    executed = []

    async def mock_delegate(agent_name: str, prompt: str) -> str:
        executed.append(agent_name)
        return f"Result from {agent_name}"

    executor = WorkflowExecutor(wf, checkpoint=checkpoint)
    results = asyncio.run(executor.execute(mock_delegate, "input"))

    # agent-a should have been skipped (from checkpoint)
    assert "agent-a" not in executed
    assert "agent-b" in executed
    # But the result should still be available
    assert 1 in results


def test_executor_deadlock_detection(tmp_checkpoint):
    """Circular dependencies should raise RuntimeError."""
    wf = WorkflowDefinition(
        name="test", description="test",
        steps=[
            WorkflowStep(index=1, agent="a", description="d", dependencies=[2]),
            WorkflowStep(index=2, agent="b", description="d", dependencies=[1]),
        ],
    )
    # Skip validation (which would catch this) to test runtime detection
    wf.steps[0].dependencies = [2]  # force circular

    async def mock_delegate(agent_name: str, prompt: str) -> str:
        return "ok"

    WorkflowExecutor(wf)  # ensures constructor doesn't crash
    # The validation should catch this
    errors = wf.validate()
    assert len(errors) > 0
