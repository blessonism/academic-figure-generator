from __future__ import annotations

import os
from types import SimpleNamespace

import pytest

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-task-status")
os.environ.setdefault("POSTGRES_PASSWORD", "test-postgres-password")
os.environ.setdefault("MINIO_SECRET_KEY", "test-minio-secret")
os.environ.setdefault(
    "ENCRYPTION_MASTER_KEY",
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
)

from app.api.v1 import tasks as tasks_api


class FakeWrappedJsonDecodeError:
    exc_args = ("Expecting value: line 1 column 1 (char 0)",)

    def __str__(self) -> str:
        return "<class 'json.decoder.JSONDecodeError'>(['Expecting value: line 1 column 1 (char 0)'])"


@pytest.mark.asyncio
async def test_get_task_status_returns_failure_detail(monkeypatch: pytest.MonkeyPatch) -> None:
    fake_result = SimpleNamespace(status="FAILURE", result=RuntimeError("SSL EOF"))

    monkeypatch.setattr(tasks_api.celery_app, "AsyncResult", lambda task_id: fake_result)

    response = await tasks_api.get_task_status("task-1", user=object())

    assert response.task_id == "task-1"
    assert response.status == "FAILURE"
    assert "SSL EOF" in response.detail


@pytest.mark.asyncio
async def test_get_task_status_extracts_readable_detail_from_wrapped_json_decode_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_result = SimpleNamespace(status="FAILURE", result=FakeWrappedJsonDecodeError())

    monkeypatch.setattr(tasks_api.celery_app, "AsyncResult", lambda task_id: fake_result)

    response = await tasks_api.get_task_status("task-1", user=object())

    assert response.task_id == "task-1"
    assert response.status == "FAILURE"
    assert response.detail == "Expecting value: line 1 column 1 (char 0)"
