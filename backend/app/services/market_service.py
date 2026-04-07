"""市场领域的通用校验与计算工具。"""

from __future__ import annotations

import re
import unicodedata

from app.core.exceptions import BadRequestException


def validate_market_item_content(content_type: str, paper_url: str | None) -> None:
    """校验市场条目的内容类型约束。"""
    normalized_type = (content_type or "").strip()
    normalized_url = (paper_url or "").strip()

    if normalized_type == "non_ai_figure" and not normalized_url:
        raise BadRequestException("非 AI 配图必须提供论文链接。")


def compute_market_hot_score(
    *,
    like_count: int,
    favorite_count: int,
    download_count: int,
) -> int:
    """按首期规则计算热度分。"""
    return (like_count * 3) + (favorite_count * 2) + download_count


def slugify_market_term(value: str) -> str:
    """将分类或标签名称规整为 slug。"""
    raw = (value or "").strip()
    if not raw:
        raise BadRequestException("名称不能为空。")

    ascii_value = unicodedata.normalize("NFKD", raw).encode("ascii", "ignore").decode("ascii")
    slug_source = ascii_value or raw.lower()
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", slug_source).strip("-").lower()
    return slug or "item"
