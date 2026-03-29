"""Unit tests for qa_ecosystem/cli.py argument parsing."""


def test_build_parser_run_command():
    from qa_ecosystem.cli import build_parser
    parser = build_parser()
    args = parser.parse_args(["run", "test-case-generator", "--input", "test text"])
    assert args.command == "run"
    assert args.agent == "test-case-generator"
    assert args.input == "test text"


def test_dry_run_flag():
    from qa_ecosystem.cli import build_parser
    parser = build_parser()
    args = parser.parse_args(["run", "test-case-generator", "--input", "x", "--dry-run"])
    assert args.dry_run is True


def test_list_workflows_registered():
    from qa_ecosystem.cli import build_parser
    parser = build_parser()
    # list-workflows should be a valid subcommand — parsing it should not raise
    args = parser.parse_args(["list-workflows"])
    assert args.command == "list-workflows"


def test_verbose_flag():
    from qa_ecosystem.cli import build_parser
    parser = build_parser()
    args = parser.parse_args(["--verbose", "run", "test-case-generator", "--input", "x"])
    assert args.verbose is True


def test_orchestrate_workflow_flag():
    from qa_ecosystem.cli import build_parser
    parser = build_parser()
    args = parser.parse_args([
        "orchestrate", "--input", "test", "--workflow", "feature-testing"
    ])
    assert args.workflow == "feature-testing"


def test_orchestrate_workflow_file_flag():
    from qa_ecosystem.cli import build_parser
    parser = build_parser()
    args = parser.parse_args([
        "orchestrate", "--input", "test", "--workflow-file", "custom.yaml"
    ])
    assert args.workflow_file == "custom.yaml"


def test_orchestrate_reorder_flag():
    from qa_ecosystem.cli import build_parser
    parser = build_parser()
    args = parser.parse_args([
        "orchestrate", "--input", "test",
        "--workflow", "feature-testing",
        "--reorder", "1:test-case-generator, 2:requirements-analyst",
    ])
    assert args.reorder == "1:test-case-generator, 2:requirements-analyst"


def test_orchestrate_deps_flag():
    from qa_ecosystem.cli import build_parser
    parser = build_parser()
    args = parser.parse_args([
        "orchestrate", "--input", "test",
        "--workflow", "feature-testing",
        "--deps", "2:[1], 3:[1,2]",
    ])
    assert args.deps == "2:[1], 3:[1,2]"


def test_orchestrate_skip_flag():
    from qa_ecosystem.cli import build_parser
    parser = build_parser()
    args = parser.parse_args([
        "orchestrate", "--input", "test",
        "--workflow", "feature-testing",
        "--skip", "synthetic-data-designer", "test-oracle-creator",
    ])
    assert args.skip == ["synthetic-data-designer", "test-oracle-creator"]


def test_orchestrate_notify_flag():
    from qa_ecosystem.cli import build_parser
    parser = build_parser()
    args = parser.parse_args([
        "orchestrate", "--input", "test",
        "--workflow", "feature-testing",
        "--notify", "https://hooks.slack.com/services/T00/B00/xxx",
    ])
    assert args.notify == "https://hooks.slack.com/services/T00/B00/xxx"


def test_list_checkpoints_registered():
    from qa_ecosystem.cli import build_parser
    parser = build_parser()
    args = parser.parse_args(["list-checkpoints"])
    assert args.command == "list-checkpoints"


def test_clean_checkpoints_registered():
    from qa_ecosystem.cli import build_parser
    parser = build_parser()
    args = parser.parse_args(["clean-checkpoints", "--keep", "10"])
    assert args.command == "clean-checkpoints"
    assert args.keep == 10
