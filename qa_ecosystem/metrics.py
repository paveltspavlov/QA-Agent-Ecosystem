"""Token usage and cost tracking for QA Agent Ecosystem runs.

Captures input/output token counts, latency, and estimated cost per provider call.
Prints a summary table at the end of each run.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field

from rich.console import Console
from rich.table import Table

console = Console()

# ---------------------------------------------------------------------------
# Per-model pricing (USD per 1M tokens) — updated periodically
# ---------------------------------------------------------------------------
# Format: {model_id_prefix: (input_cost_per_1M, output_cost_per_1M)}
PRICING: dict[str, tuple[float, float]] = {
    # Anthropic
    "claude-opus": (15.00, 75.00),
    "claude-sonnet": (3.00, 15.00),
    "claude-haiku": (0.25, 1.25),
    # OpenAI
    "gpt-4o": (2.50, 10.00),
    "gpt-4o-mini": (0.15, 0.60),
    "o3-mini": (1.10, 4.40),
    # Local / free
    "llama": (0.0, 0.0),
    "qwen": (0.0, 0.0),
    "deepseek": (0.0, 0.0),
    "default": (0.0, 0.0),
    "gemini": (0.0, 0.0),
}


def _lookup_pricing(model_id: str) -> tuple[float, float]:
    """Find the best matching pricing for a model ID."""
    model_lower = model_id.lower()
    for prefix, pricing in PRICING.items():
        if prefix in model_lower:
            return pricing
    return (0.0, 0.0)


@dataclass
class TokenUsage:
    """Token usage data returned by a provider call."""
    input_tokens: int = 0
    output_tokens: int = 0
    is_estimated: bool = True


@dataclass
class AgentMetrics:
    """Metrics for a single agent execution."""
    agent_name: str
    model_id: str
    provider: str
    input_tokens: int = 0
    output_tokens: int = 0
    latency_ms: float = 0.0
    estimated_cost_usd: float = 0.0
    is_estimated: bool = True

    def compute_cost(self) -> None:
        """Compute estimated cost based on token counts and model pricing."""
        input_price, output_price = _lookup_pricing(self.model_id)
        self.estimated_cost_usd = (
            (self.input_tokens / 1_000_000) * input_price +
            (self.output_tokens / 1_000_000) * output_price
        )


@dataclass
class RunMetrics:
    """Aggregated metrics for an entire orchestration run."""
    agents: list[AgentMetrics] = field(default_factory=list)
    _start_time: float = field(default_factory=time.monotonic, repr=False)

    def add(self, metrics: AgentMetrics) -> None:
        self.agents.append(metrics)

    @property
    def total_input_tokens(self) -> int:
        return sum(a.input_tokens for a in self.agents)

    @property
    def total_output_tokens(self) -> int:
        return sum(a.output_tokens for a in self.agents)

    @property
    def total_cost_usd(self) -> float:
        return sum(a.estimated_cost_usd for a in self.agents)

    @property
    def total_latency_ms(self) -> float:
        return sum(a.latency_ms for a in self.agents)

    @property
    def wall_clock_ms(self) -> float:
        return (time.monotonic() - self._start_time) * 1000

    def print_summary(self) -> None:
        """Print a formatted summary table to the console."""
        if not self.agents:
            return

        table = Table(title="Run Metrics Summary", show_footer=True)
        table.add_column("Agent", style="cyan", footer_style="bold cyan")
        table.add_column("Model", style="dim")
        table.add_column("Input Tokens", style="green", justify="right")
        table.add_column("Output Tokens", style="green", justify="right")
        table.add_column("Source", style="dim", justify="center")
        table.add_column("Latency", style="yellow", justify="right")
        table.add_column("Est. Cost", style="magenta", justify="right")

        for a in self.agents:
            source_label = "est." if a.is_estimated else "API"
            table.add_row(
                a.agent_name,
                a.model_id,
                f"{a.input_tokens:,}",
                f"{a.output_tokens:,}",
                source_label,
                f"{a.latency_ms / 1000:.1f}s",
                f"${a.estimated_cost_usd:.4f}",
            )

        # Footer totals
        table.columns[0].footer = "TOTAL"
        table.columns[2].footer = f"{self.total_input_tokens:,}"
        table.columns[3].footer = f"{self.total_output_tokens:,}"
        table.columns[4].footer = ""
        table.columns[5].footer = f"{self.total_latency_ms / 1000:.1f}s"
        table.columns[6].footer = f"${self.total_cost_usd:.4f}"

        console.print()
        console.print(table)
        if any(a.is_estimated for a in self.agents):
            console.print("[dim]est. = estimated (~4 chars/token) | API = real usage from provider[/dim]")
        console.print(f"[dim]Wall-clock time: {self.wall_clock_ms / 1000:.1f}s[/dim]\n")


# ---------------------------------------------------------------------------
# Global run metrics instance (reset per run)
# ---------------------------------------------------------------------------
_current_run: RunMetrics | None = None


def start_run() -> RunMetrics:
    """Start tracking metrics for a new run."""
    global _current_run
    _current_run = RunMetrics()
    return _current_run


def get_current_run() -> RunMetrics | None:
    """Get the current run metrics, or None if not tracking."""
    return _current_run


def record_agent(
    agent_name: str,
    model_id: str,
    provider: str,
    input_tokens: int = 0,
    output_tokens: int = 0,
    latency_ms: float = 0.0,
    is_estimated: bool = True,
) -> AgentMetrics:
    """Record metrics for an agent execution and add to current run."""
    metrics = AgentMetrics(
        agent_name=agent_name,
        model_id=model_id,
        provider=provider,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        latency_ms=latency_ms,
        is_estimated=is_estimated,
    )
    metrics.compute_cost()
    if _current_run is not None:
        _current_run.add(metrics)
    return metrics


def finish_run() -> None:
    """Print summary and reset the current run."""
    global _current_run
    if _current_run is not None:
        _current_run.print_summary()
        _current_run = None
