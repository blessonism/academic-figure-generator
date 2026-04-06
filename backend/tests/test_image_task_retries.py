from __future__ import annotations

import os
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import Mock

import httpx
import pytest

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-image-retries")
os.environ.setdefault("POSTGRES_PASSWORD", "test-postgres-password")
os.environ.setdefault("MINIO_SECRET_KEY", "test-minio-secret")
os.environ.setdefault(
    "ENCRYPTION_MASTER_KEY",
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
)

from app.tasks import image_tasks


def test_http_503_marks_image_failed_when_retries_are_exhausted(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    db = Mock()
    task = image_tasks.generate_image_task._get_current_object()
    http_error = httpx.HTTPStatusError(
        "503 from upstream",
        request=httpx.Request("POST", "http://example.test/v1beta/models/generateContent"),
        response=httpx.Response(503, request=httpx.Request("POST", "http://example.test/v1beta/models/generateContent")),
    )
    mark_failed = Mock()

    monkeypatch.setattr(image_tasks, "_get_session", lambda: db)
    monkeypatch.setattr(
        image_tasks,
        "_get_user_nanobanana_settings",
        lambda _db, _user_id: ("enc-key", None, None),
    )
    monkeypatch.setattr(
        image_tasks,
        "_get_system_nanobanana_settings",
        lambda _db: (None, None, None),
    )
    monkeypatch.setattr(image_tasks, "decrypt_api_key", lambda _value: "api-key")
    monkeypatch.setattr(
        image_tasks,
        "resolve_nanobanana_settings",
        lambda **_kwargs: SimpleNamespace(
            api_key="api-key",
            api_base_url="http://example.test",
            model="gemini-3-pro-image-preview",
        ),
    )
    monkeypatch.setattr(
        image_tasks,
        "_build_generation_payload",
        lambda **_kwargs: {"mock": True},
    )
    monkeypatch.setattr(
        image_tasks,
        "_call_nanobanana_api",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(http_error),
    )
    monkeypatch.setattr(image_tasks, "_log_failed_usage", Mock())
    monkeypatch.setattr(image_tasks, "_mark_image_failed", mark_failed)
    monkeypatch.setattr(type(task), "request", property(lambda self: SimpleNamespace(retries=3)))
    monkeypatch.setattr(task, "retry", Mock(side_effect=http_error))

    with pytest.raises(httpx.HTTPStatusError):
        task.run(
            image_id="image-123",
            prompt_text="draw test image",
            user_id="user-123",
            resolution="2K",
            aspect_ratio="16:9",
            color_scheme="paper",
            reference_image_path=None,
            edit_instruction=None,
        )

    mark_failed.assert_called_once()


def test_http_503_persists_retry_message_while_task_is_still_processing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    db = Mock()
    task = image_tasks.generate_image_task._get_current_object()
    http_error = httpx.HTTPStatusError(
        "503 from upstream",
        request=httpx.Request("POST", "http://example.test/v1beta/models/generateContent"),
        response=httpx.Response(503, request=httpx.Request("POST", "http://example.test/v1beta/models/generateContent")),
    )
    retry_signal = RuntimeError("retry scheduled")

    monkeypatch.setattr(image_tasks, "_get_session", lambda: db)
    monkeypatch.setattr(
        image_tasks,
        "_get_user_nanobanana_settings",
        lambda _db, _user_id: ("enc-key", None, None),
    )
    monkeypatch.setattr(
        image_tasks,
        "_get_system_nanobanana_settings",
        lambda _db: (None, None, None),
    )
    monkeypatch.setattr(image_tasks, "decrypt_api_key", lambda _value: "api-key")
    monkeypatch.setattr(
        image_tasks,
        "resolve_nanobanana_settings",
        lambda **_kwargs: SimpleNamespace(
            api_key="api-key",
            api_base_url="http://example.test",
            model="gemini-3-pro-image-preview",
        ),
    )
    monkeypatch.setattr(
        image_tasks,
        "_build_generation_payload",
        lambda **_kwargs: {"mock": True},
    )
    monkeypatch.setattr(
        image_tasks,
        "_call_nanobanana_api",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(http_error),
    )
    monkeypatch.setattr(
        image_tasks,
        "_get_pricing",
        lambda *_args, **_kwargs: (Decimal("7.2"), Decimal("1.5")),
    )
    monkeypatch.setattr(image_tasks, "_log_failed_usage", Mock())
    monkeypatch.setattr(image_tasks, "_mark_image_failed", Mock())
    monkeypatch.setattr(type(task), "request", property(lambda self: SimpleNamespace(retries=1)))
    monkeypatch.setattr(task, "retry", Mock(side_effect=retry_signal))

    with pytest.raises(RuntimeError, match="retry scheduled"):
        task.run(
            image_id="image-456",
            prompt_text="draw test image",
            user_id="user-123",
            resolution="2K",
            aspect_ratio="16:9",
            color_scheme="paper",
            reference_image_path=None,
            edit_instruction=None,
        )

    assert db.execute.call_count >= 2
    sql = str(db.execute.call_args_list[-1].args[0])
    params = db.execute.call_args_list[-1].args[1]
    assert "generation_status = 'processing'" in sql
    assert params["img_id"] == "image-456"
    assert "自动重试" in params["reason"]
    assert "第 2 次" in params["reason"]
    assert "120 秒后" in params["reason"]
    assert db.commit.call_count >= 2
