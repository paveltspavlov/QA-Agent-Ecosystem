"""GitHub Copilot SDK execution path — single agent & orchestrator with delegation."""

from __future__ import annotations

import asyncio
from pathlib import Path

from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel

from qa_ecosystem.config import MAX_DELEGATION_DEPTH
from qa_ecosystem.models import ModelProfile, resolve_model

console = Console()

# ---------------------------------------------------------------------------
# Pydantic tool-parameter models — must live at module level so that
# ``typing.get_type_hints()`` (called by the Copilot SDK's ``@define_tool``
# decorator) can resolve the forward references produced by
# ``from __future__ import annotations``.  Python 3.14 made this stricter.
# The try/except keeps the module importable when pydantic is not installed.
# ---------------------------------------------------------------------------
try:
    from pydantic import BaseModel, Field

    class DelegateParams(BaseModel):
        agent_name: str = Field(description="Name of the specialist agent to invoke")
        task_prompt: str = Field(description="The task/prompt to send to the specialist agent")

    class HumanInputParams(BaseModel):
        message: str = Field(description="Message or findings to display to the user before asking for input")

    class PlanStep(BaseModel):
        step: int = Field(description="Step number in the execution sequence (1-based)")
        agent_name: str = Field(description="Name of the specialist agent to invoke")
        description: str = Field(description="What this agent will do and what it produces")
        depends_on: str = Field(default="", description="Step number(s) this depends on, or empty for none")

    class PlanParams(BaseModel):
        objective: str = Field(description="One-line summary of the overall testing goal")
        steps: list[PlanStep] = Field(description="Ordered list of agent execution steps")

except ImportError:
    DelegateParams = None  # type: ignore[assignment,misc]
    HumanInputParams = None  # type: ignore[assignment,misc]
    PlanStep = None  # type: ignore[assignment,misc]
    PlanParams = None  # type: ignore[assignment,misc]

# ---------------------------------------------------------------------------
# Module-level approve-all flag (shared across the session)
# ---------------------------------------------------------------------------
_approve_all: bool = False


def reset_approve_all() -> None:
    """Reset the approve-all flag (called at session start)."""
    global _approve_all
    _approve_all = False


def on_permission_request(request, invocation=None):
    """Prompt the user to approve or deny each Copilot SDK tool action."""
    global _approve_all
    from copilot import PermissionRequestResult

    kind = request.kind.value if hasattr(request.kind, "value") else str(request.kind)

    parts: list[str] = [f"[bold yellow]Permission requested:[/bold yellow] [cyan]{kind}[/cyan]"]
    if getattr(request, "full_command_text", None):
        parts.append(f"  Command : {request.full_command_text}")
    if getattr(request, "file_name", None):
        parts.append(f"  File    : {request.file_name}")
    if getattr(request, "tool_name", None):
        parts.append(f"  Tool    : {request.tool_name}")
    if getattr(request, "url", None):
        parts.append(f"  URL     : {request.url}")
    if getattr(request, "intention", None):
        parts.append(f"  Intent  : {request.intention}")
    if getattr(request, "diff", None):
        diff_preview = request.diff[:500] + ("..." if len(request.diff) > 500 else "")
        parts.append(f"  Diff    :\n{diff_preview}")

    console.print("\n".join(parts))

    if _approve_all:
        console.print("[green]  -> Auto-approved (approve-all mode)[/green]\n")
        return PermissionRequestResult(kind="approved")

    reply = input("  Approve? [Y/n/a(ll)]: ").strip().lower()

    if reply in ("a", "all"):
        _approve_all = True
        console.print("[green]  -> Approved (all future actions will be auto-approved)[/green]\n")
        return PermissionRequestResult(kind="approved")
    elif reply in ("", "y", "yes"):
        console.print("[green]  -> Approved[/green]\n")
        return PermissionRequestResult(kind="approved")
    else:
        console.print("[red]  -> Denied[/red]\n")
        return PermissionRequestResult(kind="denied-interactively-by-user")


async def run_single(agent_def, prompt, profile: ModelProfile, cwd, max_turns) -> str:
    """Execute a single agent via the GitHub Copilot SDK."""
    try:
        from copilot import CopilotClient
    except ImportError:
        console.print(
            "[red]The 'github-copilot-sdk' package is required for copilot models.\n"
            "Install it with:  pip install github-copilot-sdk[/red]"
        )
        raise SystemExit(1)

    client = CopilotClient()
    await client.start()

    try:
        session = await client.create_session(
            model=profile.model_id,
            tools=[],
            on_permission_request=on_permission_request,
            system_message={"mode": "replace", "content": agent_def.prompt},
            streaming=True,
        )

        collected: list[str] = []
        done = asyncio.Event()

        def on_event(event):
            etype = getattr(event, "type", None)
            etype_val = etype.value if hasattr(etype, "value") else str(etype)
            if etype_val == "assistant.message_delta":
                delta = getattr(event.data, "delta_content", "") or ""
                if delta:
                    collected.append(delta)
                    console.print(delta, end="")
            elif etype_val == "assistant.message":
                content = getattr(event.data, "content", "")
                if content and not collected:
                    collected.append(content)
                    console.print(Markdown(content))
            elif etype_val in ("session.idle", "session.end"):
                done.set()

        session.on(on_event)
        await session.send(prompt)

        all_turns: list[str] = []

        while True:
            try:
                await asyncio.wait_for(done.wait(), timeout=600)
            except asyncio.TimeoutError:
                console.print("\n[yellow]Session timed out after 10 minutes.[/yellow]")
                # Save any partial content collected before timeout
                partial = "".join(collected)
                if partial.strip():
                    all_turns.append(partial)
                    console.print(
                        f"\n[dim]Partial output saved ({len(partial)} chars).[/dim]"
                    )
                break

            turn_text = "".join(collected)
            all_turns.append(turn_text)

            if not _has_question(turn_text):
                break

            user_reply = await _prompt_user()
            if user_reply is None:
                break

            # Reset for the next turn
            collected.clear()
            done.clear()
            await session.send(user_reply)

        await session.disconnect()
    finally:
        await client.stop()

    console.print()
    result = "\n\n".join(all_turns)

    if not result.strip():
        console.print(
            "[yellow]Warning: Agent produced empty output. This may indicate "
            "the model did not generate a response or the session ended "
            "prematurely.[/yellow]"
        )

    return result


async def run_orchestrator(manager, prompt, profile: ModelProfile, cwd, max_turns, resume_from=None, log_fn=None, save_workflow_fn=None) -> str:
    """Execute the orchestrator via the GitHub Copilot SDK with delegation support."""
    try:
        from copilot import CopilotClient, define_tool
    except ImportError:
        console.print(
            "[red]The 'github-copilot-sdk' package is required for copilot models.\n"
            "Install it with:  pip install github-copilot-sdk[/red]"
        )
        raise SystemExit(1)

    client = CopilotClient()
    await client.start()

    try:
        plan_approval_tool, plan_state = build_plan_approval_tool()
        delegate_tool = build_delegate_tool(
            client, profile, resume_from=resume_from,
            plan_state=plan_state, log_fn=log_fn, save_workflow_fn=save_workflow_fn,
        )
        human_input_tool = build_human_input_tool()

        tools = _resolve_tools(manager.tools or [])
        tools.append(plan_approval_tool)
        tools.append(delegate_tool)
        tools.append(human_input_tool)

        session = await client.create_session(
            model=profile.model_id,
            tools=[],
            on_permission_request=on_permission_request,
            system_message={"mode": "replace", "content": manager.prompt},
            streaming=True,
        )

        collected: list[str] = []
        done = asyncio.Event()

        def on_event(event):
            etype = getattr(event, "type", None)
            etype_val = etype.value if hasattr(etype, "value") else str(etype)
            if etype_val == "assistant.message_delta":
                delta = getattr(event.data, "delta_content", "") or ""
                if delta:
                    collected.append(delta)
                    console.print(delta, end="")
            elif etype_val == "assistant.message":
                content = getattr(event.data, "content", "")
                if content and not collected:
                    collected.append(content)
                    console.print(Markdown(content))
            elif etype_val in ("session.idle", "session.end"):
                done.set()

        session.on(on_event)
        await session.send(prompt)

        try:
            await asyncio.wait_for(done.wait(), timeout=600)
        except asyncio.TimeoutError:
            console.print("\n[yellow]Orchestrator session timed out after 10 minutes.[/yellow]")

        await session.disconnect()
    finally:
        await client.stop()

    console.print()
    return "".join(collected)


# ---------------------------------------------------------------------------
# Tool builders
# ---------------------------------------------------------------------------

def build_delegate_tool(client, profile: ModelProfile, resume_from=None, plan_state=None, log_fn=None, save_workflow_fn=None):
    """Build a custom tool that delegates tasks to specialist agents."""
    try:
        from copilot import define_tool
    except ImportError:
        return None

    if DelegateParams is None:
        return None

    from qa_ecosystem.checkpoint import CheckpointWriter
    checkpoint_writer = resume_from if resume_from is not None else CheckpointWriter()

    depth_counter: list[int] = [0]
    workflow_steps: list[dict] = []

    _log = log_fn or (lambda *a, **kw: None)
    _save_wf = save_workflow_fn or (lambda *a, **kw: None)

    @define_tool(
        description=(
            "Delegate a task to a specialist QA agent. IMPORTANT: You must call "
            "submit_execution_plan first and receive approval before using this tool. "
            "Available agents: "
            "test-case-generator, requirements-analyst, bug-pattern-analyst, "
            "regression-optimizer, ai-test-architect, synthetic-data-designer, "
            "test-oracle-creator, test-results-analyst, testware-creator, "
            "playwright-test-generator, ui-test-designer, api-coverage-planner, "
            "pr-hygiene-checker, security-scout, coverage-hunter, flake-triage, "
            "seed-data-manager"
        )
    )
    async def delegate_to_agent(params: DelegateParams) -> str:
        if plan_state is not None and not plan_state.get("approved", False):
            return (
                "[Delegation blocked] You must call submit_execution_plan and "
                "receive user approval before delegating to any agent."
            )

        if depth_counter[0] >= MAX_DELEGATION_DEPTH:
            return (
                f"[Delegation refused: MAX_DELEGATION_DEPTH={MAX_DELEGATION_DEPTH} reached. "
                f"Cannot delegate to '{params.agent_name}'.]"
            )

        already_done, cached_result = checkpoint_writer.is_completed(params.agent_name)
        if already_done:
            console.print(
                f"[dim]⟳  Skipping '{params.agent_name}' — already completed in checkpoint.[/dim]\n"
            )
            return cached_result

        depth_counter[0] += 1
        _log("delegation", agent=params.agent_name, depth=depth_counter[0])

        try:
            from qa_ecosystem.agents import get_agent

            agent_def = get_agent(params.agent_name)
            _category_role = {
                "execution": "playwright",
                "planning": "default",
            }
            sub_role = _category_role.get(agent_def.category, "default")
            sub_profile = resolve_model(agent_role=sub_role)

            console.print(
                f"\n[dim]-> Delegating to {params.agent_name} "
                f"(model: {sub_profile.model_id})...[/dim]\n"
            )

            MAX_RETRIES = 3
            last_exc: Exception | None = None
            result = ""

            for attempt in range(MAX_RETRIES):
                try:
                    child_done: asyncio.Event = asyncio.Event()
                    child_collected: list[str] = []

                    child_session = await client.create_session(
                        model=sub_profile.model_id,
                        tools=[],
                        on_permission_request=on_permission_request,
                        system_message={"mode": "replace", "content": agent_def.prompt},
                        streaming=True,
                    )

                    def on_child_event(event):
                        etype = getattr(event, "type", None)
                        etype_val = etype.value if hasattr(etype, "value") else str(etype)
                        if etype_val == "assistant.message_delta":
                            delta = getattr(event.data, "delta_content", "") or ""
                            if delta:
                                child_collected.append(delta)
                        elif etype_val == "assistant.message":
                            content = getattr(event.data, "content", "")
                            if content:
                                child_collected.append(content)
                        elif etype_val in ("session.idle", "session.end"):
                            child_done.set()

                    child_session.on(on_child_event)
                    await child_session.send(params.task_prompt)

                    try:
                        await asyncio.wait_for(child_done.wait(), timeout=300)
                    except asyncio.TimeoutError:
                        child_collected.append("\n[Subagent timed out after 5 minutes]")

                    await child_session.disconnect()
                    result = "".join(child_collected)
                    break

                except (asyncio.TimeoutError, Exception) as exc:
                    last_exc = exc
                    if attempt == MAX_RETRIES - 1:
                        raise
                    delay = 2 ** attempt
                    console.print(
                        f"[yellow]⟳  Retry {attempt + 1}/{MAX_RETRIES} for "
                        f"'{params.agent_name}' in {delay}s ({exc})[/yellow]"
                    )
                    _log("retry_attempt", agent=params.agent_name, attempt=attempt + 1, error=str(exc))
                    await asyncio.sleep(delay)

            console.print(f"[dim]<- {params.agent_name} returned {len(result)} chars[/dim]\n")

            checkpoint_writer.append_step(
                agent_name=params.agent_name,
                prompt=params.task_prompt,
                result=result,
            )

            workflow_steps.append({
                "agent_name": params.agent_name,
                "prompt": params.task_prompt,
                "result": result,
            })
            if len(workflow_steps) >= 2:
                _save_wf(workflow_steps)

            return result

        finally:
            depth_counter[0] -= 1

    return delegate_to_agent


def build_human_input_tool():
    """Build a tool that pauses the orchestrator and prompts the user for input."""
    try:
        from copilot import define_tool
    except ImportError:
        return None

    if HumanInputParams is None:
        return None

    @define_tool(
        description=(
            "Pause the workflow and present findings or questions to the human operator, "
            "then wait for their reply before continuing. Use this after requirements-analyst "
            "returns its ambiguity report so the user can provide updated or clarified requirements."
        )
    )
    async def request_human_input(params: HumanInputParams) -> str:
        console.print(
            Panel(
                params.message,
                title="[bold yellow]Agent is asking for input[/bold yellow]",
                border_style="yellow",
            )
        )
        reply = await _prompt_user()
        return reply or "(no reply provided)"

    return request_human_input


def build_plan_approval_tool():
    """Build a tool that presents the execution plan for user approval."""
    try:
        from copilot import define_tool
    except ImportError:
        return None, {}

    if PlanParams is None:
        return None, {}

    plan_state: dict = {"approved": False, "plan": []}

    @define_tool(
        description=(
            "REQUIRED FIRST STEP: Submit your execution plan for human approval BEFORE "
            "calling delegate_to_agent. Present the ordered list of agents you intend to "
            "invoke, what each will do, and their dependencies. The user can approve the "
            "plan as-is, edit it (reorder, add, or remove agents), or reject it entirely. "
            "You MUST call this tool and receive approval before any delegation."
        )
    )
    async def submit_execution_plan(params: PlanParams) -> str:
        plan_lines = [f"[bold]Objective:[/bold] {params.objective}\n"]
        plan_lines.append("[bold]Execution Plan:[/bold]\n")
        for s in params.steps:
            dep = f" (after step {s.depends_on})" if s.depends_on else ""
            plan_lines.append(f"  {s.step}. [cyan]{s.agent_name}[/cyan]{dep}")
            plan_lines.append(f"     {s.description}")

        console.print(
            Panel(
                "\n".join(plan_lines),
                title="[bold blue]Proposed Execution Plan[/bold blue]",
                border_style="blue",
            )
        )
        console.print(
            "[bold yellow]Options:[/bold yellow]\n"
            "  [green]y[/green] / Enter  — Approve and start execution\n"
            "  [cyan]edit[/cyan]         — Open plan as a markdown file for editing\n"
            "  [red]n[/red]              — Reject the plan\n"
            "  Or type modifications directly (e.g. 'remove step 3', 'swap steps 2 and 4', "
            "'add security-scout after step 5')\n"
        )
        reply = await _prompt_user_plan()

        if reply is None or reply in ("y", "yes", ""):
            plan_state["approved"] = True
            plan_state["plan"] = [
                {"step": s.step, "agent": s.agent_name, "description": s.description}
                for s in params.steps
            ]
            return (
                "APPROVED. Proceed with delegation in the approved order. "
                "Call delegate_to_agent for each step now."
            )

        if reply in ("n", "no"):
            plan_state["approved"] = False
            return (
                "REJECTED by user. Do NOT proceed with delegation. "
                "Ask the user what they would like instead."
            )

        if reply == "edit":
            from qa_ecosystem.providers._plan_file import save_plan_to_file
            plan_md = save_plan_to_file(params)
            return (
                f"Plan saved to {plan_md} for editing. "
                "The user will edit the file and re-run the orchestrator with the updated input. "
                "Do NOT proceed with delegation now — the session will end."
            )

        plan_state["approved"] = False
        return (
            f"User requested changes: {reply}\n"
            "Revise your plan according to these instructions and call submit_execution_plan "
            "again with the updated plan."
        )

    return submit_execution_plan, plan_state


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _resolve_tools(tool_names: list[str]) -> list:
    """Map abstract tool-set names to Copilot SDK tool identifiers."""
    return [t for t in tool_names if t != "Agent"]


def _has_question(text: str) -> bool:
    """Return True if the agent's response ends with a question."""
    lines = [l.strip() for l in text.strip().splitlines() if l.strip()]
    if not lines:
        return False
    return lines[-1].endswith("?")


async def _prompt_user() -> str | None:
    """Prompt the user for a reply in the terminal."""
    console.print("\n[bold yellow]Agent is asking a question. Type your reply (or press Enter to skip):[/bold yellow]")
    loop = asyncio.get_event_loop()
    reply = await loop.run_in_executor(None, lambda: input("> ").strip())
    if not reply:
        console.print("[dim]No reply given — continuing without response.[/dim]\n")
        return None
    console.print()
    return reply


async def _prompt_user_plan() -> str | None:
    """Prompt the user for plan approval."""
    loop = asyncio.get_event_loop()
    reply = await loop.run_in_executor(None, lambda: input("> ").strip())
    if not reply:
        return None
    return reply.lower()
