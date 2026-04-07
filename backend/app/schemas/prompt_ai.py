"""Schemas for Prompt AI model discovery and effective config preview."""

from typing import Literal

from pydantic import BaseModel, field_validator


class PromptAIModelsProbeRequest(BaseModel):
    """临时 Prompt AI 探测配置。"""

    prompt_ai_provider: Literal["anthropic", "openai-compatible"] | None = None
    prompt_ai_api_key: str | None = None
    prompt_ai_api_base_url: str | None = None

    @field_validator("prompt_ai_api_key", "prompt_ai_api_base_url", mode="before")
    @classmethod
    def blank_to_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class PromptAIModelOptionResponse(BaseModel):
    """单个模型选项。"""

    id: str
    display_name: str


class PromptAIModelsResponse(BaseModel):
    """统一模型列表响应。"""

    provider: Literal["anthropic", "openai-compatible"]
    models: list[PromptAIModelOptionResponse]


PromptAIConfigSource = Literal[
    "user",
    "system",
    "env",
    "provider_default",
    "service_default",
    "missing",
]


class PromptAIEffectiveSourcesResponse(BaseModel):
    provider: PromptAIConfigSource
    api_key: PromptAIConfigSource
    api_base_url: PromptAIConfigSource
    model: PromptAIConfigSource
    max_tokens: PromptAIConfigSource


class PromptAIEffectiveConfigResponse(BaseModel):
    provider: Literal["anthropic", "openai-compatible"]
    api_base_url: str
    model: str
    max_tokens: int
    api_key_available: bool
    sources: PromptAIEffectiveSourcesResponse
    validation_status: Literal["valid", "unknown", "invalid"]
    validation_message: str | None = None


class PromptAIResolvePreviewRequest(BaseModel):
    prompt_ai_provider: Literal["anthropic", "openai-compatible"] | None = None
    prompt_ai_api_key: str | None = None
    prompt_ai_api_base_url: str | None = None
    prompt_ai_model: str | None = None

    @field_validator(
        "prompt_ai_api_key",
        "prompt_ai_api_base_url",
        "prompt_ai_model",
        mode="before",
    )
    @classmethod
    def blank_to_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None
