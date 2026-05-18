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
from qa_ecosystem.metrics import record_agent
from qa_ecosystem.models import ModelProfile, resolve_model
from qa_ecosystem.session import (
    OUTPUTS_ROOT,
    get_session_dir,
    init_session,
)

console = Console()

OUTPUTS_DIR = OUTPUTS_ROOT


def _inject_session_paths(prompt: str) -> str:
    """Replace ``{session_dir}`` and related placeholders with absolute paths.

    Done before sending the prompt to the LLM so agents that hardcoded
    ``outputs/bugs`` or ``outputs/reports`` paths still write under the
    current session.
    """
    session_dir = get_session_dir()
    posix = session_dir.as_posix()
    bugs_dir = (session_dir / "bugs").as_posix()
    reports_dir = (session_dir / "reports").as_posix()

    result = (
        prompt
        .replace("{session_dir}", posix)
        .replace("{bugs_dir}", bugs_dir)
        .replace("{reports_dir}", reports_dir)
        # Back-compat: legacy hardcoded paths in agent prompts
        .replace("outputs/bugs", bugs_dir)
        .replace("outputs/reports", reports_dir)
    )

    # Lazy substitution for the orchestrator's agent catalogue. Doing this here
    # (not at agent import time) avoids the circular import that would occur if
    # test_manager.py tried to call list_agents() while the registry was still
    # being populated.
    if "{agent_catalogue}" in result:
        from qa_ecosystem.agents import list_agents
        lines = []
        for name, defn in sorted(list_agents().items()):
            if name == "test-manager":
                continue
            desc = (defn.description or "").strip().replace("\n", " ")
            lines.append(f"- {name} — {desc}")
        result = result.replace("{agent_catalogue}", "\n".join(lines))

    return result


def _agent_with_session_paths(agent_def):
    """Return a copy of the agent definition with session paths injected."""
    from dataclasses import replace as _dc_replace
    return _dc_replace(agent_def, prompt=_inject_session_paths(agent_def.prompt))

# ---------------------------------------------------------------------------
# Module-level runtime flags (set by CLI via --verbose / --log-file)
# ---------------------------------------------------------------------------
VERBOSE: bool = False
LOG_FILE: Path | None = None


def _log(event: str, **kwargs) -> None:
    """Write a structured JSON log entry to the active session (or LOG_FILE override)."""
    target = LOG_FILE
    if target is None:
        try:
            from qa_ecosystem import session as _session
            if _session._session_dir is not None:
                target = _session.get_session_dir() / "run.log"
        except Exception:
            target = None
    if target is None:
        return
    entry = {"timestamp": datetime.now().isoformat(), "event": event, **kwargs}
    with target.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry) + "\n")


def _save_agent_result(
    agent_name: str,
    result: str,
    output_format: str = "markdown",
    prompt: str = "",
) -> Path:
    """Save an agent result under the active session dir.

    All artifacts for one CLI invocation land in
    ``outputs/{app_name}/{timestamp}/`` so each test execution is isolated
    and easy to archive.
    """
    import json as _json

    # ── Playwright agents get structured output ─────────────────────────
    if agent_name == "playwright-test-generator":
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        return _save_playwright_result(result, prompt, timestamp)

    session_dir = get_session_dir()
    agent_dir = session_dir / "agents" / agent_name
    agent_dir.mkdir(parents=True, exist_ok=True)
    if output_format == "json":
        out_file = agent_dir / "result.json"
        payload = {"agent": agent_name, "result": result}
        out_file.write_text(_json.dumps(payload, indent=2), encoding="utf-8")
    else:
        out_file = agent_dir / "result.md"
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

    # Reuse the active session dir so playwright artifacts land alongside
    # the rest of the run (bug reports, manager instructions, etc.).
    active = get_session_dir()
    session_dir, saved_files = save_playwright_session(
        raw_output=result,
        prompt=prompt,
        output_dir=active.parent.parent,   # outputs/
        timestamp=active.name,             # reuse current timestamp folder
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
        recap_lines.append("  [cyan]Tests executed  :[/cyan] (not captured — run tests with "
                           "[bold]npx playwright test[/bold])")

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
    """Save the test manager's delegation instructions inside the session dir."""
    session_dir = get_session_dir()
    out_file = session_dir / "manager_instructions.md"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    separator = f"\n\n---\n## Run: {timestamp}\n\n"
    with out_file.open("a", encoding="utf-8") as f:
        f.write(separator + instructions)
    console.print(f"[dim]Manager instructions saved → {out_file}[/dim]\n")
    return out_file


def _save_workflow_context(steps: list[dict]) -> Path:
    """Save all delegation steps from an orchestration run inside the session dir."""
    session_dir = get_session_dir()
    ctx_file = session_dir / "workflow_context.json"
    ctx_file.write_text(json.dumps({"steps": steps}, indent=2), encoding="utf-8")
    console.print(f"[dim]Workflow context → {ctx_file}[/dim]\n")
    return ctx_file


def _check_credentials_or_exit(profile: ModelProfile) -> None:
    """Print an actionable hint and exit if the profile's credentials are missing.

    Copilot and Claude (CLI) profiles bring their own auth. Anthropic-API,
    OpenAI, and OpenAI-compatible profiles need an env-var key — fail fast
    with a fix instead of letting the provider raise a stack trace.
    """
    if profile.is_copilot or profile.is_claude:
        return
    if profile.resolve_api_key():
        return

    env_var = profile.api_key_env or (
        "ANTHROPIC_API_KEY" if profile.is_anthropic_api else "OPENAI_API_KEY"
    )
    console.print()
    console.print(Panel(
        f"[bold red]No API key for profile [/bold red][bold]{profile.name}[/bold] "
        f"[bold red](provider: {profile.provider}).[/bold red]\n\n"
        f"Set [bold]{env_var}[/bold] in your environment or in a [bold].env[/bold] file, then re-run.\n\n"
        f"Quickest fix: [bold cyan]qa-agent setup[/bold cyan] — interactive bootstrap.\n"
        f"Or pick a different profile, e.g.:\n"
        f"  [bold]qa-agent ... -m copilot-claude-haiku[/bold]   (uses GitHub Copilot, no API key needed)",
        title="Missing credentials", border_style="red", expand=False,
    ))
    sys.exit(2)


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
    _check_credentials_or_exit(profile)

    init_session(prompt)
    prompt = _inject_session_paths(prompt)
    agent_def = _agent_with_session_paths(agent_def)

    _print_model_banner(profile, agent_name)
    console.print(f"[dim]Session dir → {get_session_dir()}[/dim]\n")

    if VERBOSE:
        console.print(f"[dim]--- VERBOSE: Full prompt for {agent_name} ---[/dim]")
        console.print(prompt)
        console.print("[dim]--- END prompt ---[/dim]\n")

    _log("agent_start", agent=agent_name, model=profile.model_id, provider=profile.provider)

    t0 = time.monotonic()

    if profile.is_copilot:
        from qa_ecosystem.providers.copilot import run_single, reset_approve_all
        reset_approve_all()
        result, token_usage = await run_single(agent_def, prompt, profile, cwd, max_turns)
    elif profile.is_claude:
        from qa_ecosystem.providers.claude import run_single
        result, token_usage = await run_single(agent_def, prompt, profile, cwd, max_turns)
    elif profile.is_anthropic_api:
        from qa_ecosystem.providers.anthropic_api import run
        result, token_usage = await run(agent_def.prompt, prompt, profile)
    else:
        from qa_ecosystem.providers.openai import run
        result, token_usage = await run(agent_def.prompt, prompt, profile)

    latency_ms = (time.monotonic() - t0) * 1000

    record_agent(
        agent_name=agent_name,
        model_id=profile.model_id,
        provider=profile.provider,
        input_tokens=token_usage.input_tokens,
        output_tokens=token_usage.output_tokens,
        latency_ms=latency_ms,
        is_estimated=token_usage.is_estimated,
    )

    if VERBOSE:
        console.print(f"[dim]--- VERBOSE: Full result from {agent_name} ---[/dim]")
        console.print(result)
        console.print("[dim]--- END result ---[/dim]\n")

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
    _check_credentials_or_exit(profile)

    init_session(prompt)
    prompt = _inject_session_paths(prompt)
    manager = _agent_with_session_paths(manager)

    _print_model_banner(profile, "test-manager (orchestrator)")
    console.print(f"[dim]Session dir → {get_session_dir()}[/dim]\n")

    t0 = time.monotonic()

    if profile.is_copilot:
        from qa_ecosystem.providers.copilot import run_orchestrator, reset_approve_all
        reset_approve_all()
        result, token_usage = await run_orchestrator(
            manager, prompt, profile, cwd, max_turns,
            resume_from=resume_from,
            log_fn=_log,
            save_workflow_fn=_save_workflow_context,
        )
    elif profile.is_claude:
        from qa_ecosystem.providers.claude import run_orchestrator
        result, token_usage = await run_orchestrator(manager, prompt, profile, cwd, max_turns)
    elif profile.is_anthropic_api:
        console.print(
            "[yellow]Note: anthropic-api provider runs without tool use or subagent delegation. "
            "The Test Manager will produce a plan only.[/yellow]\n"
        )
        from qa_ecosystem.providers.anthropic_api import run
        result, token_usage = await run(manager.prompt, prompt, profile)
    else:
        console.print(
            "[yellow]Note: Non-agentic model selected — running orchestrator without "
            "tool use or subagent delegation. The Test Manager will produce a "
            "plan but cannot invoke specialist agents.[/yellow]\n"
        )
        from qa_ecosystem.providers.openai import run
        result, token_usage = await run(manager.prompt, prompt, profile)

    latency_ms = (time.monotonic() - t0) * 1000
    record_agent(
        agent_name="test-manager",
        model_id=profile.model_id,
        provider=profile.provider,
        input_tokens=token_usage.input_tokens,
        output_tokens=token_usage.output_tokens,
        latency_ms=latency_ms,
        is_estimated=token_usage.is_estimated,
    )

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
