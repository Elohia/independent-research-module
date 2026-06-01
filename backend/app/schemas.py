from __future__ import annotations

from typing import Any, Literal
from pydantic import BaseModel, Field


class SearchConfigInput(BaseModel):
    max_threads: int = Field(default=4, ge=1, le=16)
    max_iterations: int = Field(default=3, ge=1, le=8)
    coverage_threshold: float = Field(default=0.85, ge=0.1, le=1.0)
    timeout_seconds: int = Field(default=8, ge=2, le=60)
    providers: list[str] = Field(default_factory=lambda: ["policy", "industry", "risk"])
    expansion_modes: list[str] = Field(default_factory=lambda: ["政策", "产业链", "风险", "执行"])


class ResearchQuestionPayload(BaseModel):
    title: str = Field(min_length=3)
    problem_statement: str = Field(min_length=10)
    objectives: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    exclusions: list[str] = Field(default_factory=list)
    expected_output: str = Field(default="结构化调研报告")
    search_config: SearchConfigInput = Field(default_factory=SearchConfigInput)


class TaskProgress(BaseModel):
    current_stage: str = "queued"
    iteration: int = 0
    coverage_score: float = 0.0
    source_count: int = 0
    result_count: int = 0
    warnings: list[str] = Field(default_factory=list)


class ResearchTask(BaseModel):
    id: str
    status: Literal["queued", "running", "completed", "failed", "cancelled"]
    created_at: str
    updated_at: str
    question: ResearchQuestionPayload
    progress: TaskProgress
    analysis: dict[str, Any] = Field(default_factory=dict)


class EvidenceItem(BaseModel):
    title: str
    source: str
    url: str | None = None
    snippet: str | None = None
    score: float = 0.0
    tags: list[str] = Field(default_factory=list)
    dimension: str = "概览"
    provider: str = "local"


class ReportSection(BaseModel):
    key: str
    title: str
    content: str


class ResearchReport(BaseModel):
    task_id: str
    summary: str
    sections: list[ReportSection]
    evidence: list[EvidenceItem]
    generated_at: str


class SearchProviderConfig(BaseModel):
    enabled: bool = True
    priority: int = 100
    max_results: int = 5
    mode: Literal["fallback", "local", "web"] = "fallback"


class SearchSettings(BaseModel):
    request_timeout_seconds: int = Field(default=8, ge=2, le=30)
    providers: dict[str, SearchProviderConfig] = Field(
        default_factory=lambda: {
            "policy": SearchProviderConfig(priority=100, mode="local"),
            "industry": SearchProviderConfig(priority=90, mode="local"),
            "risk": SearchProviderConfig(priority=80, mode="local"),
        }
    )


class AiSettings(BaseModel):
    mode: Literal["local", "openai_compatible"] = "local"
    base_url: str = ""
    api_key: str = ""
    model: str = ""
    temperature: float = 0.2
    request_timeout_seconds: int = Field(default=12, ge=5, le=60)


class HealthResponse(BaseModel):
    status: str
    active_tasks: int
    database: str
    providers: list[str]
