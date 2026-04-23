"""Pydantic schemas for validating structured agent output.

Agents declare an ``output_schema`` (JSON Schema) on their ``AgentDefinition``;
this module mirrors those schemas as pydantic models so the parser can validate
LLM responses before turning them into ``ParsedTestOutput`` and friends.

Validation failures are converted to ``SchemaValidationError`` so callers can
log a warning and fall back to the regex parser instead of crashing.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError


class SchemaValidationError(Exception):
    """Raised when an agent's structured output fails schema validation."""

    def __init__(self, message: str, errors: list[dict[str, Any]] | None = None):
        super().__init__(message)
        self.errors = errors or []


# ── Playwright test generator -----------------------------------------------

class GeneratedFile(BaseModel):
    model_config = ConfigDict(extra="allow")
    path: str = Field(min_length=1)
    type: Literal["spec", "page", "component", "fixture", "helper"]
    content: str = Field(min_length=1)


class TestResult(BaseModel):
    model_config = ConfigDict(extra="allow")
    name: str
    status: Literal["passed", "failed", "skipped"]
    duration: str = ""
    error: str | None = None


class ApiEndpoint(BaseModel):
    model_config = ConfigDict(extra="allow")
    method: str = ""
    path: str = ""
    description: str = ""


class AppMapPage(BaseModel):
    model_config = ConfigDict(extra="allow")
    path: str = ""
    title: str = ""
    forms: list[Any] = Field(default_factory=list)
    buttons: list[str] = Field(default_factory=list)
    links: list[str] = Field(default_factory=list)
    interactiveElements: list[str] = Field(default_factory=list)


class AppMap(BaseModel):
    model_config = ConfigDict(extra="allow")
    baseUrl: str = ""
    pages: list[AppMapPage] = Field(default_factory=list)
    navigation: dict[str, Any] = Field(default_factory=dict)
    auth: dict[str, Any] = Field(default_factory=dict)
    apiEndpoints: list[ApiEndpoint] = Field(default_factory=list)


class PlaywrightAgentOutput(BaseModel):
    """Schema for ``playwright-test-generator`` structured JSON output."""

    model_config = ConfigDict(extra="allow")
    files: list[GeneratedFile]
    summary: str
    appMap: AppMap | None = None
    testResults: list[TestResult] = Field(default_factory=list)
    coverageNotes: str = ""


def validate_playwright_output(data: dict[str, Any]) -> PlaywrightAgentOutput:
    """Validate a parsed JSON dict against the playwright agent schema.

    Raises ``SchemaValidationError`` on failure with a structured error list.
    """
    try:
        return PlaywrightAgentOutput.model_validate(data)
    except ValidationError as e:
        raise SchemaValidationError(
            f"Playwright agent output failed validation: {len(e.errors())} error(s).",
            errors=[{"loc": err["loc"], "msg": err["msg"], "type": err["type"]} for err in e.errors()],
        ) from e
