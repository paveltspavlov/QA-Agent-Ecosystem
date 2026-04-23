"""Per-command modules for the qa-agent CLI.

Each module exposes:
- ``register(sub)`` — attach this group's subparsers to the argparse subparser action.
- ``COMMANDS`` — dict mapping command name → handler function.

``cli.py`` discovers modules from this package and stitches them together into
a single parser + dispatch table.
"""

from __future__ import annotations

from . import (  # noqa: F401  (re-exported for explicit ordering)
    info,
    setup,
    run,
    orchestrate,
    chain,
    playwright,
    sessions,
    checkpoints,
)

# Order matters for help output ordering only.
ALL_MODULES = [info, setup, run, orchestrate, chain, playwright, sessions, checkpoints]
