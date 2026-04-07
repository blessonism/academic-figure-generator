from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


def _strip_or_none(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


class MarketCategoryPayload(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str | None = Field(default=None, max_length=120)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return value.strip()

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: str | None) -> str | None:
        return _strip_or_none(value)


class MarketTagPayload(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str | None = Field(default=None, max_length=120)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return value.strip()

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: str | None) -> str | None:
        return _strip_or_none(value)


class MarketCategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    created_at: datetime


class MarketTagResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    created_at: datetime


class MarketItemCreateFromImageRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    summary: str | None = Field(default=None, max_length=2000)
    category_id: UUID
    tag_ids: list[UUID] = Field(default_factory=list)
    content_type: str = "ai_generated"
    paper_url: str | None = Field(default=None, max_length=1000)

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        return value.strip()

    @field_validator("summary", "paper_url")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        return _strip_or_none(value)

    @model_validator(mode="after")
    def validate_paper_url(self) -> "MarketItemCreateFromImageRequest":
        if self.content_type == "non_ai_figure" and not self.paper_url:
            raise ValueError("非 AI 配图必须填写论文链接")
        return self


class MarketMyItemUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    summary: str | None = Field(default=None, max_length=2000)
    category_id: UUID | None = None
    tag_ids: list[UUID] | None = None
    content_type: str | None = None
    paper_url: str | None = Field(default=None, max_length=1000)
    status: str | None = None

    @field_validator("title", "summary", "paper_url")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        return _strip_or_none(value)


class MarketAdminItemUpdateRequest(MarketMyItemUpdateRequest):
    is_featured: bool | None = None


class MarketItemActionResponse(BaseModel):
    id: UUID
    like_count: int
    favorite_count: int
    download_count: int
    viewer_has_liked: bool = False
    viewer_has_favorited: bool = False


class MarketReferenceGenerateRequest(BaseModel):
    edit_instruction: str = Field(min_length=1, max_length=4000)
    resolution: str = "2K"
    aspect_ratio: str = "16:9"
    color_scheme: str = "okabe-ito"
    project_id: UUID | None = None

    @field_validator("edit_instruction")
    @classmethod
    def normalize_instruction(cls, value: str) -> str:
        return value.strip()


class MarketImportToProjectRequest(BaseModel):
    project_id: UUID


class ProjectReferenceAssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    market_item_id: UUID
    title: str
    source_type: str
    storage_path: str
    download_url: str | None
    created_at: datetime


class MarketItemSummaryResponse(BaseModel):
    id: UUID
    title: str
    summary: str | None
    source_type: str
    content_type: str
    paper_url: str | None
    is_featured: bool
    status: str
    like_count: int
    favorite_count: int
    download_count: int
    cover_download_url: str
    published_at: datetime | None
    created_at: datetime
    creator_name: str | None
    category: MarketCategoryResponse
    tags: list[MarketTagResponse]


class MarketItemDetailResponse(MarketItemSummaryResponse):
    origin_image_id: UUID | None
    viewer_has_liked: bool = False
    viewer_has_favorited: bool = False


class MarketItemListResponse(BaseModel):
    items: list[MarketItemSummaryResponse]
    total: int
    page: int
    page_size: int
