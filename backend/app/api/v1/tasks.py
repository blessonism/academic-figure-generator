"""Celery 任务状态查询接口。"""

from __future__ import annotations

import re
from typing import Any

from fastapi import APIRouter, Depends

from app.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.common import TaskResultResponse
from app.tasks.celery_app import celery_app

router = APIRouter(prefix="", tags=["Tasks"])


def _extract_task_detail_from_sequence(values: Any) -> str | None:
    if not isinstance(values, (list, tuple)):
        return None

    for item in values:
        detail = _stringify_task_detail(item)
        if detail:
            return detail

    return None


def _stringify_task_detail(value: Any) -> str | None:
    if value is None:
        return None

    if isinstance(value, str):
        text = value.strip()
        return text or None

    extracted_detail = _extract_task_detail_from_sequence(getattr(value, "exc_args", None))
    if extracted_detail:
        return extracted_detail

    extracted_detail = _extract_task_detail_from_sequence(getattr(value, "args", None))
    if extracted_detail:
        return extracted_detail

    if isinstance(value, (list, tuple)):
        return _extract_task_detail_from_sequence(value)

    text = str(value).strip()
    if not text:
        return None

    wrapped_match = re.search(r"\[\s*['\"](?P<detail>.+?)['\"]\s*\]", text)
    if wrapped_match:
        return wrapped_match.group("detail").strip() or None

    return text or None


@router.get("/tasks/{task_id}", response_model=TaskResultResponse)
async def get_task_status(
    task_id: str,
    user: User = Depends(get_current_active_user),
):
    """返回 Celery 任务当前状态与可展示的错误详情。"""
    _ = user
    task_result = celery_app.AsyncResult(task_id)
    detail: str | None = None

    if task_result.status in {"FAILURE", "RETRY"}:
        detail = _stringify_task_detail(getattr(task_result, "result", None))
        if detail is None:
            detail = _stringify_task_detail(getattr(task_result, "info", None))

    return TaskResultResponse(
        task_id=task_id,
        status=task_result.status,
        detail=detail,
    )
