"""``qa-agent orchestrate`` and the ``qa-agent workflow`` shorthand."""

from __future__ import annotations

import argparse

from rich.panel import Panel

from ._shared import add_model_arg, console, read_input, read_task_input


def _run_workflow_mode(args: argparse.Namespace, raw_input: str) -> None:
    """Execute a predefined or custom workflow with index-based ordering."""
    from qa_ecosystem.runner import run_single_agent, run_sync
    from qa_ecosystem.metrics import start_run, finish_run
    from qa_ecosystem.checkpoint import CheckpointWriter, load_checkpoint
    from qa_ecosystem.workflow_executor import (
        WorkflowExecutor,
        get_workflow,
        load_workflow_file,
        apply_reorder,
        apply_deps,
        apply_skip,
    )

    workflow_file = getattr(args, "workflow_file", None)
    workflow_name = getattr(args, "workflow", None)

    if workflow_file:
        workflow = load_workflow_file(workflow_file)
    else:
        workflow = get_workflow(workflow_name)

    reorder = getattr(args, "reorder", None)
    if reorder:
        workflow = apply_reorder(workflow, reorder)

    deps = getattr(args, "deps", None)
    if deps:
        workflow = apply_deps(workflow, deps)

    skip = getattr(args, "skip", None)
    if skip:
        workflow = apply_skip(workflow, skip)

    errors = workflow.validate()
    if errors:
        console.print("[red]Workflow validation errors:[/red]")
        for err in errors:
            console.print(f"  [red]• {err}[/red]")
        return

    console.print(Panel(
        f"[bold]{workflow.name}[/bold]\n{workflow.description}\n\n{workflow.render_dag()}",
        title="Workflow Execution Plan",
        border_style="blue",
    ))

    if getattr(args, "dry_run", False):
        console.print("[bold yellow]Dry run — would execute the workflow above.[/bold yellow]")
        return

    resume_path = getattr(args, "resume", None)
    if resume_path:
        checkpoint = load_checkpoint(resume_path)
        console.print(f"[dim]Resuming from checkpoint ({len(checkpoint.steps)} completed steps)[/dim]\n")
    else:
        checkpoint = CheckpointWriter(workflow_name=workflow.name)

    model_override = getattr(args, "model", None)
    cwd = getattr(args, "cwd", ".")

    async def delegate(agent_name: str, task_prompt: str) -> str:
        return await run_single_agent(
            agent_name=agent_name,
            prompt=task_prompt,
            cwd=cwd,
            model_override=model_override,
        )

    effective_input = raw_input
    if raw_input.strip().startswith(("http://", "https://")):
        target_url = raw_input.strip()
        effective_input = (
            f"TARGET URL: {target_url}\n\n"
            f"Perform exploratory testing on the web application at {target_url}.\n"
            f"Navigate the site, discover all pages, forms, and interactive elements, "
            f"and generate comprehensive test cases with detailed steps."
        )

    start_run()

    async def _run():
        executor = WorkflowExecutor(workflow, checkpoint=checkpoint)
        return await executor.execute(delegate, effective_input)

    results = run_sync(_run())

    finish_run()
    console.print(
        f"\n[bold green]Workflow '{workflow.name}' completed — "
        f"{len(results)} steps executed.[/bold green]\n"
        f"[dim]Checkpoint: {checkpoint.path}[/dim]"
    )


def cmd_orchestrate(args: argparse.Namespace) -> None:
    """Run the Test Manager orchestrator."""
    from qa_ecosystem.runner import run_orchestrator, run_sync
    from qa_ecosystem.metrics import start_run, finish_run
    from qa_ecosystem.session import init_session
    from qa_ecosystem.templates import fill_template

    raw_input, frontmatter_project = read_task_input(args.input)

    # Precedence: CLI flag > markdown frontmatter > auto-detect from prompt.
    project_name = getattr(args, "project_name", None) or frontmatter_project
    session_dir = init_session(raw_input, project_name=project_name)
    console.print(f"[dim]Session: {session_dir}[/dim]")

    workflow_name = getattr(args, "workflow", None)
    workflow_file = getattr(args, "workflow_file", None)

    if workflow_name or workflow_file:
        _run_workflow_mode(args, raw_input)
        return

    if getattr(args, "dry_run", False):
        console.print(
            f"[bold yellow]Dry run — would execute orchestrator[/bold yellow]\n"
            f"[dim]Input length: {len(raw_input)} chars[/dim]\n"
            f"[dim]Template: {args.template}[/dim]\n"
            f"[dim]Model override: {args.model or 'none'}[/dim]"
        )
        return

    try:
        prompt = fill_template(
            "test-manager",
            args.template,
            project_context=raw_input,
            scope=raw_input,
        )
    except (KeyError, FileNotFoundError):
        prompt = raw_input

    resume_from = None
    resume_path = getattr(args, "resume", None)
    if resume_path:
        from qa_ecosystem.checkpoint import load_checkpoint
        resume_from = load_checkpoint(resume_path)
        console.print(
            f"[dim]Resuming from checkpoint: {resume_path} "
            f"({len(resume_from.steps)} completed steps)[/dim]\n"
        )

    start_run()
    run_sync(run_orchestrator(
        prompt=prompt,
        cwd=args.cwd,
        model_override=args.model,
        resume_from=resume_from,
    ))
    finish_run()


def cmd_workflow(args: argparse.Namespace) -> None:
    """Run a predefined workflow by key — shorthand for ``orchestrate --workflow``."""
    args.workflow = args.workflow_name
    args.workflow_file = None
    args.template = getattr(args, "template", "default") or "default"
    args.reorder = None
    args.deps = None
    args.skip = getattr(args, "skip", None)
    args.notify = getattr(args, "notify", None)
    args.resume = getattr(args, "resume", None)
    cmd_orchestrate(args)


def register(sub) -> None:
    orch = sub.add_parser("orchestrate", help="Run the Test Manager orchestrator")
    orch.add_argument("--input", "-i", required=True,
                      help="Input text or path to a file (markdown supported; "
                           "frontmatter `project_name:` overrides auto-detection)")
    orch.add_argument("--project-name", default=None, metavar="NAME",
                      help="Override the project slug used for outputs/<project>/<ts>/. "
                           "Beats markdown frontmatter and URL auto-detection.")
    orch.add_argument("--template", "-t", default="default",
                      help="Prompt template name (default: 'default')")
    orch.add_argument("--cwd", default=".",
                      help="Working directory for the orchestrator")
    orch.add_argument("--dry-run", action="store_true", default=False,
                      help="Print what would be executed without running the orchestrator")
    orch.add_argument("--resume", default=None, metavar="CHECKPOINT_FILE",
                      help="Resume from a checkpoint file (outputs/checkpoints/<id>.json)")
    orch.add_argument("--workflow", "-w", default=None,
                      help="Use a predefined workflow from workflows.yaml")
    orch.add_argument("--workflow-file", default=None, metavar="PATH",
                      help="Use a custom workflow YAML file")
    orch.add_argument("--reorder", default=None,
                      help='Reassign agent indices: "1:agent-a, 2:agent-b, 3:agent-c"')
    orch.add_argument("--deps", default=None,
                      help='Override dependencies: "2:[1], 3:[1,2]"')
    orch.add_argument("--skip", nargs="*", default=None,
                      help="Skip specific agents from the workflow")
    orch.add_argument("--notify", default=None, metavar="WEBHOOK_URL",
                      help="POST a summary JSON to this webhook URL on completion")
    add_model_arg(orch)

    wf = sub.add_parser(
        "workflow",
        help="Run a predefined workflow by key (shorthand for orchestrate --workflow)",
    )
    wf.add_argument(
        "workflow_name",
        metavar="WORKFLOW",
        help=(
            "Workflow key from workflows.yaml "
            "(e.g. feature-testing, playwright-gen, pbi-to-report). "
            "Run 'qa-agent list-workflows' to see all available keys."
        ),
    )
    wf.add_argument("--input", "-i", required=True,
                    help="Input text, file path, or URL — the instructions for the workflow")
    wf.add_argument("--cwd", default=".",
                    help="Working directory for the agents")
    wf.add_argument("--dry-run", action="store_true", default=False,
                    help="Show execution plan without running")
    wf.add_argument("--skip", nargs="*", default=None,
                    help="Skip specific agents from the workflow")
    wf.add_argument("--resume", default=None, metavar="CHECKPOINT_FILE",
                    help="Resume from a checkpoint file")
    wf.add_argument("--notify", default=None, metavar="WEBHOOK_URL",
                    help="POST a summary to this webhook URL on completion")
    add_model_arg(wf)


COMMANDS = {
    "orchestrate": cmd_orchestrate,
    "workflow": cmd_workflow,
}
