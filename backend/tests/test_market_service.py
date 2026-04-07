from app.core.exceptions import BadRequestException
from app.services.market_service import compute_market_hot_score, validate_market_item_content


def test_non_ai_market_item_requires_paper_url() -> None:
    try:
        validate_market_item_content(content_type="non_ai_figure", paper_url=None)
    except BadRequestException as exc:
        assert "论文链接" in exc.detail
    else:
        raise AssertionError("缺少论文链接时应抛出 BadRequestException")


def test_ai_market_item_allows_missing_paper_url() -> None:
    validate_market_item_content(content_type="ai_generated", paper_url=None)


def test_compute_market_hot_score_uses_weighted_formula() -> None:
    score = compute_market_hot_score(like_count=4, favorite_count=3, download_count=2)

    assert score == 20
