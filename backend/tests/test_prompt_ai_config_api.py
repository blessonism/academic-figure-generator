from __future__ import annotations

import os
from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import uuid4

import pytest

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-prompt-ai-config")
os.environ.setdefault("POSTGRES_PASSWORD", "test-postgres-password")
os.environ.setdefault("MINIO_SECRET_KEY", "test-minio-secret")
os.environ.setdefault(
    "ENCRYPTION_MASTER_KEY",
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
)

from app.api.v1 import admin as admin_api
from app.api.v1 import auth as auth_api
from app.core.exceptions import BadRequestException
from app.schemas.auth import UserUpdate
from app.schemas.prompt_ai import PromptAIResolvePreviewRequest
from app.schemas.system_settings import SystemSettingsUpdate
from app.services.prompt_ai_service import PromptAIEffectiveConfig, PromptAIResolvedSources


class _FakeAsyncDb:
    def __init__(self) -> None:
        self.added: list[object] = []
        self.flushed = False
        self.refreshed = False

    def add(self, value: object) -> None:
        self.added.append(value)

    async def flush(self) -> None:
        self.flushed = True

    async def refresh(self, _value: object) -> None:
        self.refreshed = True

    async def execute(self, *_args: object, **_kwargs: object) -> object:
        return _FakeExecuteResult(None)


class _FakeExecuteResult:
    def __init__(self, value: object | None) -> None:
        self._value = value

    def scalar_one_or_none(self) -> object | None:
        return self._value


def _effective_config(
    *,
    provider: str = "openai-compatible",
    api_base_url: str = "https://wzw.pp.ua",
    model: str = "grok-4.1-expert",
    api_key_available: bool = True,
    validation_status: str = "valid",
    validation_message: str | None = None,
) -> PromptAIEffectiveConfig:
    return PromptAIEffectiveConfig(
        provider=provider,
        api_base_url=api_base_url,
        model=model,
        max_tokens=8192,
        api_key_available=api_key_available,
        sources=PromptAIResolvedSources(
            provider="system",
            api_key="system" if api_key_available else "missing",
            api_base_url="system",
            model="system" if model else "missing",
            max_tokens="service_default",
        ),
        validation_status=validation_status,  # type: ignore[arg-type]
        validation_message=validation_message,
    )


@pytest.mark.asyncio
async def test_get_me_includes_effective_prompt_ai_config(monkeypatch: pytest.MonkeyPatch) -> None:
    user = SimpleNamespace(
        id=uuid4(),
        email="test@example.com",
        display_name="测试用户",
        is_active=True,
        is_admin=False,
        default_color_scheme="okabe-ito",
        default_resolution="2K",
        default_aspect_ratio="16:9",
        prompt_ai_provider="openai-compatible",
        prompt_ai_api_key_enc=None,
        prompt_ai_api_base_url=None,
        prompt_ai_model=None,
        nanobanana_api_key_enc=None,
        prompt_ai_tokens_quota=0,
        nanobanana_images_quota=0,
        linuxdo_id=None,
        linuxdo_username=None,
        linuxdo_avatar_url=None,
        created_at=datetime.now(UTC),
    )

    async def _fake_effective(**_kwargs: object) -> PromptAIEffectiveConfig:
        return _effective_config(validation_status="unknown", validation_message="尚未验证模型可用性。")

    monkeypatch.setattr(auth_api, "_resolve_my_prompt_ai_effective_config", _fake_effective)
    db = _FakeAsyncDb()

    response = await auth_api._user_to_response(user, db=db)

    assert response.prompt_ai_effective_config is not None
    assert response.prompt_ai_effective_config.model == "grok-4.1-expert"
    assert response.prompt_ai_effective_config.sources.model == "system"
    assert response.prompt_ai_effective_config.validation_status == "unknown"


@pytest.mark.asyncio
async def test_update_me_rejects_invalid_prompt_ai_model(monkeypatch: pytest.MonkeyPatch) -> None:
    user = SimpleNamespace(
        prompt_ai_api_key_enc=None,
        prompt_ai_provider="openai-compatible",
        prompt_ai_api_base_url=None,
        prompt_ai_model=None,
    )
    db = _FakeAsyncDb()

    async def _fake_effective(**_kwargs: object) -> PromptAIEffectiveConfig:
        return _effective_config(
            model="unknown-model",
            validation_status="invalid",
            validation_message="当前模型 unknown-model 不在已探测到的可用模型列表中。",
        )

    monkeypatch.setattr(auth_api, "_resolve_my_prompt_ai_effective_config", _fake_effective)

    with pytest.raises(BadRequestException, match="unknown-model"):
        await auth_api.update_me(
            UserUpdate(prompt_ai_provider="openai-compatible", prompt_ai_model="unknown-model"),
            user=user,
            db=db,
        )


@pytest.mark.asyncio
async def test_resolve_my_prompt_ai_preview_returns_effective_config(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _fake_effective(**_kwargs: object) -> PromptAIEffectiveConfig:
        return _effective_config(validation_status="unknown", validation_message="尚未验证模型可用性。")

    monkeypatch.setattr(auth_api, "_resolve_my_prompt_ai_effective_config", _fake_effective)

    response = await auth_api.resolve_my_prompt_ai_preview(
        PromptAIResolvePreviewRequest(prompt_ai_provider="openai-compatible"),
        user=SimpleNamespace(
            prompt_ai_provider="openai-compatible",
            prompt_ai_api_key_enc=None,
            prompt_ai_api_base_url=None,
            prompt_ai_model=None,
        ),
        db=SimpleNamespace(),
    )

    assert response.model == "grok-4.1-expert"
    assert response.sources.api_base_url == "system"


@pytest.mark.asyncio
async def test_get_system_settings_includes_effective_prompt_ai_config(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _fake_get_settings(_db: object) -> object:
        return SimpleNamespace(
            prompt_ai_provider="openai-compatible",
            prompt_ai_api_key_enc=None,
            prompt_ai_api_base_url=None,
            prompt_ai_model=None,
            nanobanana_api_key_enc=None,
            nanobanana_api_base_url=None,
            nanobanana_model=None,
            paddleocr_server_url=None,
            paddleocr_api_key_enc=None,
            image_price_cny=1.5,
            image_price_cny_1k=1.5,
            image_price_cny_2k=1.5,
            image_price_cny_4k=1.5,
            usd_cny_rate=7.2,
            prompt_ai_input_usd_per_million=3,
            prompt_ai_output_usd_per_million=15,
            linuxdo_client_id=None,
            linuxdo_client_secret_enc=None,
            linuxdo_redirect_uri=None,
            epay_pid=None,
            epay_key_enc=None,
            linuxdo_credits_per_cny=1,
        )

    async def _fake_effective(**_kwargs: object) -> PromptAIEffectiveConfig:
        return _effective_config(validation_status="unknown", validation_message="尚未验证模型可用性。")

    monkeypatch.setattr(admin_api, "_get_or_create_settings", _fake_get_settings)
    monkeypatch.setattr(admin_api, "_resolve_system_prompt_ai_effective_config", _fake_effective)

    response = await admin_api.get_system_settings(_admin=object(), db=SimpleNamespace())

    assert response.prompt_ai_effective_config is not None
    assert response.prompt_ai_effective_config.sources.provider == "system"


@pytest.mark.asyncio
async def test_update_system_settings_rejects_invalid_prompt_ai_model(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = SimpleNamespace(
        prompt_ai_provider="openai-compatible",
        prompt_ai_api_key_enc=None,
        prompt_ai_api_base_url=None,
        prompt_ai_model=None,
        nanobanana_api_key_enc=None,
        paddleocr_api_key_enc=None,
        linuxdo_client_secret_enc=None,
        epay_key_enc=None,
    )
    db = _FakeAsyncDb()

    async def _fake_get_or_create_settings(_db: object) -> object:
        return settings

    monkeypatch.setattr(admin_api, "_get_or_create_settings", _fake_get_or_create_settings)
    async def _fake_effective(**_kwargs: object) -> PromptAIEffectiveConfig:
        return _effective_config(
            model="invalid-model",
            validation_status="invalid",
            validation_message="当前模型 invalid-model 不在已探测到的可用模型列表中。",
        )

    monkeypatch.setattr(admin_api, "_resolve_system_prompt_ai_effective_config", _fake_effective)

    with pytest.raises(BadRequestException, match="invalid-model"):
        await admin_api.update_system_settings(
            SystemSettingsUpdate(prompt_ai_provider="openai-compatible", prompt_ai_model="invalid-model"),
            _admin=object(),
            db=db,
        )


@pytest.mark.asyncio
async def test_resolve_system_prompt_ai_preview_returns_effective_config(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _fake_get_or_create_settings(_db: object) -> object:
        return SimpleNamespace(
            prompt_ai_provider="openai-compatible",
            prompt_ai_api_key_enc=None,
            prompt_ai_api_base_url=None,
            prompt_ai_model=None,
        )

    monkeypatch.setattr(admin_api, "_get_or_create_settings", _fake_get_or_create_settings)
    async def _fake_effective(**_kwargs: object) -> PromptAIEffectiveConfig:
        return _effective_config()

    monkeypatch.setattr(admin_api, "_resolve_system_prompt_ai_effective_config", _fake_effective)

    response = await admin_api.resolve_system_prompt_ai_preview(
        PromptAIResolvePreviewRequest(prompt_ai_provider="openai-compatible"),
        _admin=object(),
        db=SimpleNamespace(),
    )

    assert response.provider == "openai-compatible"
    assert response.sources.model == "system"
