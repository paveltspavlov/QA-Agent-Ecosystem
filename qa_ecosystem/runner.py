"""Core execution logic — multi-provider execution engine.

Execution paths
───────────────
• **Copilot SDK provider** → ``providers.copilot`` with full tool & subagent support.
• **Claude Agent SDK provider** → ``providers.claude`` with Agent tool delegation.
• **Anthropic API provider** → ``providers.anthropic_api`` streaming messages
  with multi-turn conversation support (no tool use).
• **OpenAI / OpenAI-compatible provider** → ``providers.openai`` chat completions
  with multi-turn conversation support (no tool use).
"""

from __future__ import annotations

import asyncio
import json
import sys
import time
from datetime import datetime
from pathlib import Path

from rich.console import Console
from rich.panel import Panel

from qa_ecosystem.config import MAX_TURNS_ORCHESTRATED, MAX_TURNS_SINGLE
from qa_ecosystem.metrics import start_run, record_agent, finish_run
from qa_ecosystem.models import ModelProfile, resolve_model

console = Console()

OUTPUTS_DIR = Path(__file__).resolve().parent.parent / "outputs"

# ---------------------------------------------------------------------------
# Module-level runtime flags (set by CLI via --verbose / --log-file)
# ---------------------------------------------------------------------------
VERBOSE: bool = False
LOG_FILE: Path | None = None


def _log(event: str, **kwargs) -> None:
    """Write a structured JSON log entry if LOG_FILE is configured."""
    if LOG_FILE is None:
        return
    entry = {"timestamp": datetime.now().isoformat(), "event": event, **kwargs}
    with LOG_FILE.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry) + "\n")


def _save_agent_result(
    agent_name: str,
    result: str,
    output_format: str = "markdown",
    prompt: str = "",
) -> Path:
    """Save an agent result to outputs/{agent_name}/{timestamp}.md or .json.

    For playwright-test-generator the result is parsed into structured output
    with separate test files, a concise summary, and the full raw output —
    all stored under ``outputs/{app-name}/{timestamp}/``.
    """
    import json as _json
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

    # ── Playwright agents get structured output ─────────────────────────
    if agent_name == "playwright-test-generator":
        return _save_playwright_result(result, prompt, timestamp)

    agent_dir = OUTPUTS_DIR / agent_name
    agent_dir.mkdir(parents=True, exist_ok=True)
    if output_format == "json":
        out_file = agent_dir / f"{timestamp}.json"
        payload = {"agent": agent_name, "timestamp": timestamp, "result": result}
        out_file.write_text(_json.dumps(payload, indent=2), encoding="utf-8")
    else:
        out_file = agent_dir / f"{timestamp}.md"
        out_file.write_text(result, encoding="utf-8")
    console.print(f"[dim]Result saved → {out_file}[/dim]\n")
    return out_file


def _save_playwright_result(result: str, prompt: str, timestamp: str) -> Path:
    """Parse and save playwright-test-generator output into structured folders.

    Creates::

        outputs/{app-name}/{timestamp}/
        ├── summary.md              # Short test-results overview
        ├── generated-tests/        # Extracted .spec.ts and .page.ts files
        │   ├── *.spec.ts
        │   └── *.page.ts
        └── full-output.md          # Complete raw agent output
    """
    from qa_ecosystem.output_parser import save_playwright_session, parse_playwright_output

    session_dir, saved_files = save_playwright_session(
        raw_output=result,
        prompt=prompt,
        output_dir=OUTPUTS_DIR,
        timestamp=timestamp,
    )

    # ── Print a concise session recap to the console ────────────────────
    parsed = parse_playwright_output(result)
    n_specs = len(parsed.test_files)
    n_pages = len(parsed.page_objects)
    n_fixtures = len(parsed.fixture_files)
    n_helpers = len(parsed.helper_files)
    n_results = len(parsed.test_results)

    console.print()
    recap_lines: list[str] = [
        f"[bold green]Test session saved → {session_dir}[/bold green]",
        "",
        f"  [cyan]Specs generated :[/cyan] {n_specs}",
        f"  [cyan]Page objects    :[/cyan] {n_pages}",
    ]
    if n_fixtures:
        recap_lines.append(f"  [cyan]Fixtures        :[/cyan] {n_fixtures}")
    if n_helpers:
        recap_lines.append(f"  [cyan]Helpers         :[/cyan] {n_helpers}")

    if parsed.app_map:
        app_pages = len(parsed.app_map.get("pages", []))
        recap_lines.append(f"  [cyan]App map pages  :[/cyan] {app_pages}")

    if parsed.test_results:
        passed = sum(1 for r in parsed.test_results if r["status"] == "passed")
        failed = sum(1 for r in parsed.test_results if r["status"] == "failed")
        recap_lines.append(f"  [cyan]Tests executed  :[/cyan] {n_results}  "
                           f"([green]{passed} passed[/green], [red]{failed} failed[/red])")
    else:
        recap_lines.append(f"  [cyan]Tests executed  :[/cyan] (not captured — run tests with "
                           f"[bold]npx playwright test[/bold])")

    recap_lines.append("")
    recap_lines.append(f"  [dim]Summary       → {session_dir / 'summary.md'}[/dim]")
    if parsed.app_map:
        recap_lines.append(f"  [dim]App map       → {session_dir / 'app-map.json'}[/dim]")
    recap_lines.append(f"  [dim]Test files    → {session_dir / 'generated-tests/'}[/dim]")
    recap_lines.append(f"  [dim]Full output   → {session_dir / 'full-output.md'}[/dim]")

    console.print(Panel(
        "\n".join(recap_lines),
        title="[bold blue]Playwright Session Results[/bold blue]",
        border_style="blue",
        expand=False,
    ))
    console.print()

    return session_dir


def _save_manager_instructions(instructions: str) -> Path:
    """Append the test manager's delegation instructions to outputs/manager_instructions.md."""
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
    out_file = OUTPUTS_DIR / "manager_instructions.md"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    separator = f"\n\n---\n## Session: {timestamp}\n\n"
    with out_file.open("a", encoding="utf-8") as f:
        f.write(separator + instructions)
    console.print(f"[dim]Manager instructions saved → {out_file}[/dim]\n")
    return out_file


def _save_workflow_context(steps: list[dict]) -> Path:
    """Save all delegation steps from an orchestration run to a JSON context file."""
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    ctx_file = OUTPUTS_DIR / f"workflow_context_{timestamp}.json"
    ctx_file.write_text(json.dumps({"steps": steps}, indent=2), encoding="utf-8")
    console.print(f"[dim]Workflow context → {ctx_file}[/dim]\n")
    return ctx_file


def _print_model_banner(profile: ModelProfile, agent_label: str) -> None:
    """Print a short banner showing which model will be used."""
    provider_tag = {
        "copilot": "GitHub Copilot",
        "claude": "Anthropic Claude (Agent SDK)",
        "anthropic-api": "Anthropic API (direct)",
        "openai": "OpenAI",
        "openai-compatible": "Local / Compatible",
    }.get(profile.provider, profile.provider)

    info = (
        f"[bold]{agent_label}[/bold]\n"
        f"Provider : {provider_tag}\n"
        f"Model    : {profile.model_id}\n"
        f"Profile  : {profile.name}"
    )
    if profile.api_base:
        info += f"\nEndpoint : {profile.api_base}"

    console.print(Panel(info, title="Model Config", border_style="blue", expand=False))
    console.print()

    if VERBOSE:
        console.print(
            f"[dim]VERBOSE — Full profile: provider={profile.provider}, "
            f"model_id={profile.model_id}, temperature={profile.temperature}, "
            f"max_tokens={profile.max_tokens}, api_base={profile.api_base}, "
            f"api_key_env={profile.api_key_env}[/dim]\n"
        )


# ═══════════════════════════════════════════════════════════════════════════════
# Public API
# ═══════════════════════════════════════════════════════════════════════════════

async def run_single_agent(
    agent_name: str,
    prompt: str,
    cwd: str | None = None,
    max_turns: int = MAX_TURNS_SINGLE,
    model_override: str | None = None,
    output_format: str = "markdown",
) -> str:
    """Run a single QA agent.

    Parameters
    ----------
    model_override:
        Name of a profile in models.yaml.  When supplied it takes precedence
        over the agent's default model and the role mapping.
    output_format:
        "markdown" (default) or "json" — controls how the result is saved.
    """
    from qa_ecosystem.agents import get_agent

    agent_def = get_agent(agent_name)
    profile = resolve_model(cli_override=model_override, agent_role="default")

    _print_model_banner(profile, agent_name)

    if VERBOSE:
        console.print(f"[dim]--- VERBOSE: Full prompt for {agent_name} ---[/dim]")
        console.print(prompt)
        console.print(f"[dim]--- END prompt ---[/dim]\n")

    _log("agent_start", agent=agent_name, model=profile.model_id, provider=profile.provider)

    t0 = time.monotonic()

    if profile.is_copilot:
        from qa_ecosystem.providers.copilot import run_single, reset_approve_all
        reset_approve_all()
        result = await run_single(agent_def, prompt, profile, cwd, max_turns)
    elif profile.is_claude:
        from qa_ecosystem.providers.claude import run_single
        result = await run_single(agent_def, prompt, profile, cwd, max_turns)
    elif profile.is_anthropic_api:
        from qa_ecosystem.providers.anthropic_api import run
        result = await run(agent_def.prompt, prompt, profile)
    else:
        from qa_ecosystem.providers.openai import run
        result = await run(agent_def.prompt, prompt, profile)

    latency_ms = (time.monotonic() - t0) * 1000

    # Record approximate metrics (exact token counts depend on provider response)
    # For text-only responses, estimate ~4 chars per token as a rough approximation
    est_input_tokens = len(prompt) // 4
    est_output_tokens = len(result) // 4
    record_agent(
        agent_name=agent_name,
        model_id=profile.model_id,
        provider=profile.provider,
        input_tokens=est_input_tokens,
        output_tokens=est_output_tokens,
        latency_ms=latency_ms,
    )

    if VERBOSE:
        console.print(f"[dim]--- VERBOSE: Full result from {agent_name} ---[/dim]")
        console.print(result)
        console.print(f"[dim]--- END result ---[/dim]\n")

    _log("agent_complete", agent=agent_name, result_length=len(result))
    _save_agent_result(agent_name, result, output_format=output_format, prompt=prompt)
    return result


async def run_orchestrator(
    prompt: str,
    cwd: str | None = None,
    max_turns: int = MAX_TURNS_ORCHESTRATED,
    model_override: str | None = None,
    resume_from=None,
) -> str:
    """Run the Test Manager orchestrator.

    When the resolved model is a Copilot or Claude profile the full subagent
    delegation pipeline is used.  For other profiles the orchestrator runs as
    a simple chat completion (no tool use / subagent delegation).

    Parameters
    ----------
    resume_from:
        Optional CheckpointWriter loaded from a previous checkpoint file.
        When provided, already-completed delegation steps are skipped.
    """
    from qa_ecosystem.agents import get_agent

    manager = get_agent("test-manager")
    profile = resolve_model(cli_override=model_override, agent_role="orchestrator")

    _print_model_banner(profile, "test-manager (orchestrator)")

    if profile.is_copilot:
        from qa_ecosystem.providers.copilot import run_orchestrator, reset_approve_all
        reset_approve_all()
        result = await run_orchestrator(
            manager, prompt, profile, cwd, max_turns,
            resume_from=resume_from,
            log_fn=_log,
            save_workflow_fn=_save_workflow_context,
        )
    elif profile.is_claude:
        from qa_ecosystem.providers.claude import run_orchestrator
        result = await run_orchestrator(manager, prompt, profile, cwd, max_turns)
    elif profile.is_anthropic_api:
        console.print(
            "[yellow]Note: anthropic-api provider runs without tool use or subagent delegation. "
            "The Test Manager will produce a plan only.[/yellow]\n"
        )
        from qa_ecosystem.providers.anthropic_api import run
        result = await run(manager.prompt, prompt, profile)
    else:
        console.print(
            "[yellow]Note: Non-agentic model selected — running orchestrator without "
            "tool use or subagent delegation. The Test Manager will produce a "
            "plan but cannot invoke specialist agents.[/yellow]\n"
        )
        from qa_ecosystem.providers.openai import run
        result = await run(manager.prompt, prompt, profile)

    _save_manager_instructions(result)
    _save_agent_result("test-manager", result)
    return result


async def run_chain(
    agents: list[str],
    initial_input: str,
    cwd: str | None = None,
    model_override: str | None = None,
    output_format: str = "markdown",
) -> list[str]:
    """Execute a linear agent sequence, piping each output as input to the next."""
    current_input = initial_input
    results: list[str] = []
    for agent_name in agents:
        console.print(f"\n[bold blue]Chain step: {agent_name}[/bold blue]\n")
        result = await run_single_agent(
            agent_name=agent_name,
            prompt=current_input,
            cwd=cwd,
            model_override=model_override,
            output_format=output_format,
        )
        results.append(result)
        current_input = result
    return results


def run_sync(coro):
    """Run an async coroutine synchronously (entry point for CLI)."""
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    return asyncio.run(coro)
