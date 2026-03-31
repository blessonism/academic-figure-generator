from __future__ import annotations

from datetime import UTC, datetime, timedelta

# 分辨率桶 → (soft_limit_s, hard_limit_s)
IMAGE_GENERATION_TIMEOUTS: dict[str, tuple[int, int]] = {
    "1k": (360, 420),
    "2k": (600, 660),
    "4k": (1140, 1200),
    "1K": (360, 420),
    "2K": (600, 660),
    "4K": (1140, 1200),
}

STALE_IMAGE_GRACE_SECONDS = 120
DEFAULT_HARD_TIMEOUT_SECONDS = 1200


def get_image_generation_hard_timeout_seconds(resolution: str | None) -> int:
    if resolution is None:
        return DEFAULT_HARD_TIMEOUT_SECONDS
    return IMAGE_GENERATION_TIMEOUTS.get(resolution, (1140, DEFAULT_HARD_TIMEOUT_SECONDS))[1]


def is_image_generation_stale(
    *,
    status: str,
    updated_at: datetime | None,
    resolution: str | None,
    now: datetime | None = None,
) -> bool:
    if status != "processing" or updated_at is None:
        return False

    current_time = now or datetime.now(UTC)
    hard_timeout = get_image_generation_hard_timeout_seconds(resolution)
    stale_after = timedelta(seconds=hard_timeout + STALE_IMAGE_GRACE_SECONDS)
    return current_time - updated_at > stale_after


def build_stale_image_generation_error(resolution: str | None) -> str:
    hard_timeout = get_image_generation_hard_timeout_seconds(resolution)
    timeout_minutes = max(1, round(hard_timeout / 60))
    return (
        f"图片生成任务超过 {timeout_minutes} 分钟仍未完成，"
        "可能因 worker 重启或上游中断而丢失，请重新生成。"
    )
