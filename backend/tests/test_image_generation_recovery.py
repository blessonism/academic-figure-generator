from __future__ import annotations

import os
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

import pytest

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-image-recovery")
os.environ.setdefault("POSTGRES_PASSWORD", "test-postgres-password")
os.environ.setdefault("MINIO_SECRET_KEY", "test-minio-secret")
os.environ.setdefault(
    "ENCRYPTION_MASTER_KEY",
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
)

from app.api.v1.images import _recover_stale_image_if_needed
from app.models.image import Image
from app.services.image_generation_recovery import (
    build_stale_image_generation_error,
    is_image_generation_stale,
)
from app.tasks.celery_app import celery_app


def test_processing_image_is_considered_stale_after_hard_timeout_and_grace() -> None:
    now = datetime(2026, 3, 31, 18, 0, tzinfo=UTC)
    updated_at = now - timedelta(seconds=1200 + 121)

    assert is_image_generation_stale(
        status="processing",
        updated_at=updated_at,
        resolution="4K",
        now=now,
    )


def test_processing_image_is_not_stale_before_hard_timeout_and_grace() -> None:
    now = datetime(2026, 3, 31, 18, 0, tzinfo=UTC)
    updated_at = now - timedelta(seconds=1200 + 119)

    assert not is_image_generation_stale(
        status="processing",
        updated_at=updated_at,
        resolution="4K",
        now=now,
    )


@pytest.mark.asyncio
async def test_recover_stale_image_marks_processing_record_failed() -> None:
    now = datetime(2026, 3, 31, 18, 0, tzinfo=UTC)
    image = Image(
        id=uuid4(),
        project_id=uuid4(),
        user_id=uuid4(),
        resolution="4K",
        aspect_ratio="16:9",
        generation_status="processing",
        generation_task_id="task-123",
    )
    image.updated_at = now - timedelta(seconds=1200 + 121)

    db = AsyncMock()
    db.add = Mock()

    recovered = await _recover_stale_image_if_needed(image, db, now=now)

    assert recovered is image
    assert image.generation_status == "failed"
    assert image.generation_error == build_stale_image_generation_error("4K")
    assert image.updated_at == now
    db.add.assert_called_once_with(image)
    db.flush.assert_awaited_once()
    db.commit.assert_awaited_once()


def test_celery_requeues_task_when_worker_is_lost() -> None:
    assert celery_app.conf.task_reject_on_worker_lost is True
