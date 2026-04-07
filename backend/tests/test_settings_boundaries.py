from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.schemas.auth import UserUpdate
from app.schemas.system_settings import SystemSettingsUpdate


def test_user_update_rejects_platform_service_configuration_fields() -> None:
    with pytest.raises(ValidationError):
        UserUpdate(
            prompt_ai_api_key="sk-user",
            nanobanana_api_key="sk-image",
            paddleocr_api_key="ocr-token",
        )


def test_user_update_accepts_profile_and_preference_fields() -> None:
    payload = UserUpdate(
        display_name="测试用户",
        default_color_scheme="okabe-ito",
        default_resolution="4K",
        default_aspect_ratio="4:3",
    )

    assert payload.model_dump(exclude_unset=True) == {
        "display_name": "测试用户",
        "default_color_scheme": "okabe-ito",
        "default_resolution": "4K",
        "default_aspect_ratio": "4:3",
    }


def test_user_update_accepts_personal_ai_fields() -> None:
    payload = UserUpdate(
        prompt_ai_provider="openai-compatible",
        prompt_ai_api_key="  sk-user-key  ",
        prompt_ai_api_base_url=" https://wzw.pp.ua/ ",
        prompt_ai_model=" grok-4.1-expert ",
    )

    assert payload.model_dump(exclude_unset=True) == {
        "prompt_ai_provider": "openai-compatible",
        "prompt_ai_api_key": "sk-user-key",
        "prompt_ai_api_base_url": "https://wzw.pp.ua/",
        "prompt_ai_model": "grok-4.1-expert",
    }


def test_system_settings_update_accepts_platform_ocr_configuration() -> None:
    payload = SystemSettingsUpdate(
        paddleocr_server_url="https://ocr.example.com",
        paddleocr_api_key="ocr-secret-token",
    )

    assert payload.model_dump(exclude_unset=True) == {
        "paddleocr_server_url": "https://ocr.example.com",
        "paddleocr_api_key": "ocr-secret-token",
    }
