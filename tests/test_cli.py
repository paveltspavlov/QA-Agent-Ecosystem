"""Unit tests for qa_ecosystem/cli.py argument parsing."""
import sys
import pytest


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
