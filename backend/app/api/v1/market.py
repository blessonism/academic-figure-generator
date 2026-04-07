"""科研配图市场公开与登录态接口。"""

from __future__ import annotations

from datetime import UTC, datetime
import mimetypes
from urllib.parse import quote
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.images import (
    _ensure_nanobanana_key_available,
    _get_image_price_cny_for_resolution,
)
from app.api.v1.projects import _get_owned_project
from app.core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.dependencies import (
    get_current_active_user,
    get_current_admin_user,
    get_db,
    get_optional_current_user,
    get_storage_service,
)
from app.models.image import Image
from app.models.market import (
    MarketCategory,
    MarketItem,
    MarketItemFavorite,
    MarketItemLike,
    MarketItemTag,
    MarketTag,
    ProjectReferenceAsset,
)
from app.models.project import Project
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.image import ImageStatusResponse
from app.schemas.market import (
    MarketAdminItemUpdateRequest,
    MarketCategoryPayload,
    MarketCategoryResponse,
    MarketImportToProjectRequest,
    MarketItemActionResponse,
    MarketItemCreateFromImageRequest,
    MarketItemDetailResponse,
    MarketItemListResponse,
    MarketItemSummaryResponse,
    MarketMyItemUpdateRequest,
    MarketReferenceGenerateRequest,
    MarketTagPayload,
    MarketTagResponse,
)
from app.services.market_service import (
    compute_market_hot_score,
    slugify_market_term,
    validate_market_item_content,
)
from app.tasks.celery_app import celery_app

router = APIRouter(prefix="/market", tags=["Market"])
admin_router = APIRouter(prefix="/admin/market", tags=["Market Admin"])


def _build_market_cover_url(item_id: UUID) -> str:
    return f"/api/v1/market/items/{item_id}/cover"


def _build_reference_asset_download_url(project_id: UUID, asset_id: UUID) -> str:
    return f"/api/v1/projects/{project_id}/reference-assets/{asset_id}/download"


async def _get_market_item(
    item_id: UUID,
    db: AsyncSession,
    *,
    include_hidden_for: User | None = None,
) -> MarketItem:
    result = await db.execute(
        select(MarketItem)
        .options(
            selectinload(MarketItem.category),
            selectinload(MarketItem.market_item_tags).selectinload(MarketItemTag.tag),
            selectinload(MarketItem.creator),
        )
        .where(MarketItem.id == item_id)
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise NotFoundException("市场条目不存在")

    if item.status != "published":
        can_view_hidden = (
            include_hidden_for is not None
            and (include_hidden_for.is_admin or item.created_by == include_hidden_for.id)
        )
        if not can_view_hidden:
            raise NotFoundException("市场条目不存在")

    return item


async def _get_market_item_for_owner(
    item_id: UUID,
    user: User,
    db: AsyncSession,
) -> MarketItem:
    item = await _get_market_item(item_id, db, include_hidden_for=user)
    if item.created_by != user.id and not user.is_admin:
        raise ForbiddenException("无权编辑该市场条目")
    return item


async def _ensure_category_exists(category_id: UUID, db: AsyncSession) -> MarketCategory:
    category = (
        await db.execute(select(MarketCategory).where(MarketCategory.id == category_id))
    ).scalar_one_or_none()
    if category is None:
        raise BadRequestException("所选分类不存在")
    return category


async def _load_tags(tag_ids: list[UUID], db: AsyncSession) -> list[MarketTag]:
    if not tag_ids:
        return []

    result = await db.execute(select(MarketTag).where(MarketTag.id.in_(tag_ids)))
    tags = result.scalars().all()
    if len(tags) != len(set(tag_ids)):
        raise BadRequestException("存在无效标签")
    return tags


async def _sync_market_item_tags(item: MarketItem, tag_ids: list[UUID], db: AsyncSession) -> None:
    tags = await _load_tags(tag_ids, db)
    item.market_item_tags.clear()
    for tag in tags:
        item.market_item_tags.append(MarketItemTag(tag_id=tag.id, tag=tag))


async def _viewer_action_flags(
    item_id: UUID,
    viewer: User | None,
    db: AsyncSession,
) -> tuple[bool, bool]:
    if viewer is None:
        return False, False

    liked = (
        await db.execute(
            select(MarketItemLike.id).where(
                MarketItemLike.market_item_id == item_id,
                MarketItemLike.user_id == viewer.id,
            )
        )
    ).scalar_one_or_none() is not None
    favorited = (
        await db.execute(
            select(MarketItemFavorite.id).where(
                MarketItemFavorite.market_item_id == item_id,
                MarketItemFavorite.user_id == viewer.id,
            )
        )
    ).scalar_one_or_none() is not None
    return liked, favorited


async def _serialize_market_item(
    item: MarketItem,
    db: AsyncSession,
    *,
    viewer: User | None = None,
) -> MarketItemSummaryResponse | MarketItemDetailResponse:
    viewer_has_liked, viewer_has_favorited = await _viewer_action_flags(item.id, viewer, db)
    payload = {
        "id": item.id,
        "title": item.title,
        "summary": item.summary,
        "source_type": item.source_type,
        "content_type": item.content_type,
        "paper_url": item.paper_url,
        "is_featured": item.is_featured,
        "status": item.status,
        "like_count": item.like_count,
        "favorite_count": item.favorite_count,
        "download_count": item.download_count,
        "cover_download_url": _build_market_cover_url(item.id),
        "published_at": item.published_at,
        "created_at": item.created_at,
        "creator_name": item.creator.display_name or item.creator.linuxdo_username or item.creator.email,
        "category": MarketCategoryResponse.model_validate(item.category),
        "tags": [
            MarketTagResponse.model_validate(market_tag.tag)
            for market_tag in item.market_item_tags
        ],
        "viewer_has_liked": viewer_has_liked,
        "viewer_has_favorited": viewer_has_favorited,
    }

    return MarketItemDetailResponse(
        **payload,
        origin_image_id=item.origin_image_id,
    )


def _apply_market_sort(query: Select[tuple[MarketItem]], sort: str) -> Select[tuple[MarketItem]]:
    if sort == "hot":
        return query.order_by(
            (
                (MarketItem.like_count * 3)
                + (MarketItem.favorite_count * 2)
                + MarketItem.download_count
            ).desc(),
            MarketItem.published_at.desc(),
        )

    return query.order_by(MarketItem.published_at.desc(), MarketItem.created_at.desc())


async def _copy_storage_object(
    storage,
    *,
    source_path: str,
    target_path: str,
) -> str:
    object_name = source_path.lstrip("/")
    file_bytes = storage.download_file(object_name)
    guessed_type, _ = mimetypes.guess_type(object_name)
    return storage.upload_file(file_bytes, target_path, guessed_type or "application/octet-stream")


def _normalize_object_name(storage_path: str, bucket: str) -> str:
    normalized = storage_path.lstrip("/")
    prefix = f"{bucket}/"
    if normalized.startswith(prefix):
        return normalized[len(prefix):]
    return normalized


def _stream_storage_file(storage, storage_path: str):
    object_name = _normalize_object_name(storage_path, storage.bucket)
    file_bytes = storage.download_file(object_name)
    guessed_type, _ = mimetypes.guess_type(object_name)
    media_type = guessed_type or "application/octet-stream"
    filename = object_name.split("/")[-1] or "market-item"
    quoted = quote(filename)
    headers = {"Content-Disposition": f"inline; filename*=UTF-8''{quoted}"}
    return StreamingResponse(iter([file_bytes]), media_type=media_type, headers=headers)


@router.get("/categories", response_model=list[MarketCategoryResponse])
async def list_market_categories(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(MarketCategory).order_by(MarketCategory.name.asc()))
    return [MarketCategoryResponse.model_validate(item) for item in result.scalars().all()]


@router.get("/tags", response_model=list[MarketTagResponse])
async def list_market_tags(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(MarketTag).order_by(MarketTag.name.asc()))
    return [MarketTagResponse.model_validate(item) for item in result.scalars().all()]


@router.get("/items", response_model=MarketItemListResponse)
async def list_market_items(
    category_id: UUID | None = Query(default=None),
    tag: str | None = Query(default=None),
    featured: bool | None = Query(default=None),
    sort: str = Query(default="latest"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    base_query = (
        select(MarketItem)
        .options(
            selectinload(MarketItem.category),
            selectinload(MarketItem.market_item_tags).selectinload(MarketItemTag.tag),
            selectinload(MarketItem.creator),
        )
        .where(MarketItem.status == "published")
    )

    if category_id is not None:
        base_query = base_query.where(MarketItem.category_id == category_id)

    if featured is not None:
        base_query = base_query.where(MarketItem.is_featured.is_(featured))

    if tag:
        base_query = base_query.join(MarketItem.market_item_tags).join(MarketItemTag.tag).where(
            MarketTag.slug == tag.strip().lower()
        )

    count_query = select(func.count()).select_from(base_query.subquery())
    total = int((await db.execute(count_query)).scalar_one())

    offset = (page - 1) * page_size
    result = await db.execute(_apply_market_sort(base_query, sort).offset(offset).limit(page_size))
    items = result.scalars().all()

    serialized_items: list[MarketItemSummaryResponse] = []
    for item in items:
        detail = await _serialize_market_item(item, db)
        serialized_items.append(MarketItemSummaryResponse(**detail.model_dump()))

    return MarketItemListResponse(items=serialized_items, total=total, page=page, page_size=page_size)


@router.get("/items/{item_id}", response_model=MarketItemDetailResponse)
async def get_market_item_detail(
    item_id: UUID,
    viewer: User | None = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = await _get_market_item(item_id, db, include_hidden_for=viewer)
    return await _serialize_market_item(item, db, viewer=viewer)


@router.get("/items/{item_id}/cover")
async def download_market_cover(
    item_id: UUID,
    viewer: User | None = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
    storage=Depends(get_storage_service),
):
    item = await _get_market_item(item_id, db, include_hidden_for=viewer)
    return _stream_storage_file(storage, item.cover_storage_path)


@router.post("/items/from-images/{image_id}", response_model=MarketItemDetailResponse, status_code=201)
async def create_market_item_from_image(
    image_id: UUID,
    data: MarketItemCreateFromImageRequest,
    user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    validate_market_item_content(data.content_type, data.paper_url)
    await _ensure_category_exists(data.category_id, db)

    image = (await db.execute(select(Image).where(Image.id == image_id))).scalar_one_or_none()
    if image is None:
        raise NotFoundException("图片不存在")
    if image.user_id != user.id:
        raise ForbiddenException("只能发布自己的图片")
    if image.generation_status != "completed" or not image.storage_path:
        raise BadRequestException("仅支持发布已生成完成的图片")

    item = MarketItem(
        title=data.title,
        summary=data.summary,
        cover_storage_path=image.storage_path,
        source_type="user_image",
        content_type=data.content_type,
        origin_image_id=image.id,
        category_id=data.category_id,
        paper_url=data.paper_url,
        status="published",
        published_at=datetime.now(UTC),
        created_by=user.id,
        updated_by=user.id,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)

    await _sync_market_item_tags(item, data.tag_ids, db)
    await db.flush()

    item = await _get_market_item(item.id, db, include_hidden_for=user)
    return await _serialize_market_item(item, db, viewer=user)


@router.get("/my-items", response_model=MarketItemListResponse)
async def list_my_market_items(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    base_query = (
        select(MarketItem)
        .options(
            selectinload(MarketItem.category),
            selectinload(MarketItem.market_item_tags).selectinload(MarketItemTag.tag),
            selectinload(MarketItem.creator),
        )
        .where(MarketItem.created_by == user.id)
    )
    total = int((await db.execute(select(func.count()).select_from(base_query.subquery()))).scalar_one())
    result = await db.execute(
        base_query.order_by(MarketItem.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    items = result.scalars().all()
    serialized_items = [
        MarketItemSummaryResponse(**(await _serialize_market_item(item, db, viewer=user)).model_dump())
        for item in items
    ]
    return MarketItemListResponse(items=serialized_items, total=total, page=page, page_size=page_size)


@router.put("/my-items/{item_id}", response_model=MarketItemDetailResponse)
async def update_my_market_item(
    item_id: UUID,
    data: MarketMyItemUpdateRequest,
    user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    item = await _get_market_item_for_owner(item_id, user, db)

    updates = data.model_dump(exclude_unset=True)
    next_content_type = updates.get("content_type", item.content_type)
    next_paper_url = updates.get("paper_url", item.paper_url)
    validate_market_item_content(next_content_type, next_paper_url)

    if "category_id" in updates and updates["category_id"] is not None:
        await _ensure_category_exists(updates["category_id"], db)

    if "status" in updates and updates["status"] not in {"published", "hidden"}:
        raise BadRequestException("普通用户只能在 published 与 hidden 间切换")

    tag_ids = updates.pop("tag_ids", None)
    for field, value in updates.items():
        setattr(item, field, value)
    item.updated_by = user.id
    if item.status == "published" and item.published_at is None:
        item.published_at = datetime.now(UTC)

    if tag_ids is not None:
        await _sync_market_item_tags(item, tag_ids, db)

    db.add(item)
    await db.flush()
    refreshed_item = await _get_market_item(item.id, db, include_hidden_for=user)
    return await _serialize_market_item(refreshed_item, db, viewer=user)


@router.put("/items/{item_id}/like", response_model=MarketItemActionResponse)
async def like_market_item(
    item_id: UUID,
    user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    item = await _get_market_item(item_id, db)
    existing = (
        await db.execute(
            select(MarketItemLike).where(
                MarketItemLike.market_item_id == item.id,
                MarketItemLike.user_id == user.id,
            )
        )
    ).scalar_one_or_none()
    if existing is None:
        db.add(MarketItemLike(market_item_id=item.id, user_id=user.id))
        item.like_count += 1
        db.add(item)
        await db.flush()

    return MarketItemActionResponse(
        id=item.id,
        like_count=item.like_count,
        favorite_count=item.favorite_count,
        download_count=item.download_count,
        viewer_has_liked=True,
        viewer_has_favorited=(
            await db.execute(
                select(MarketItemFavorite.id).where(
                    MarketItemFavorite.market_item_id == item.id,
                    MarketItemFavorite.user_id == user.id,
                )
            )
        ).scalar_one_or_none()
        is not None,
    )


@router.delete("/items/{item_id}/like", response_model=MarketItemActionResponse)
async def unlike_market_item(
    item_id: UUID,
    user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    item = await _get_market_item(item_id, db)
    existing = (
        await db.execute(
            select(MarketItemLike).where(
                MarketItemLike.market_item_id == item.id,
                MarketItemLike.user_id == user.id,
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        await db.delete(existing)
        item.like_count = max(0, item.like_count - 1)
        db.add(item)
        await db.flush()

    return MarketItemActionResponse(
        id=item.id,
        like_count=item.like_count,
        favorite_count=item.favorite_count,
        download_count=item.download_count,
        viewer_has_liked=False,
        viewer_has_favorited=(
            await db.execute(
                select(MarketItemFavorite.id).where(
                    MarketItemFavorite.market_item_id == item.id,
                    MarketItemFavorite.user_id == user.id,
                )
            )
        ).scalar_one_or_none()
        is not None,
    )


@router.put("/items/{item_id}/favorite", response_model=MarketItemActionResponse)
async def favorite_market_item(
    item_id: UUID,
    user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    item = await _get_market_item(item_id, db)
    existing = (
        await db.execute(
            select(MarketItemFavorite).where(
                MarketItemFavorite.market_item_id == item.id,
                MarketItemFavorite.user_id == user.id,
            )
        )
    ).scalar_one_or_none()
    if existing is None:
        db.add(MarketItemFavorite(market_item_id=item.id, user_id=user.id))
        item.favorite_count += 1
        db.add(item)
        await db.flush()

    return MarketItemActionResponse(
        id=item.id,
        like_count=item.like_count,
        favorite_count=item.favorite_count,
        download_count=item.download_count,
        viewer_has_liked=(
            await db.execute(
                select(MarketItemLike.id).where(
                    MarketItemLike.market_item_id == item.id,
                    MarketItemLike.user_id == user.id,
                )
            )
        ).scalar_one_or_none()
        is not None,
        viewer_has_favorited=True,
    )


@router.delete("/items/{item_id}/favorite", response_model=MarketItemActionResponse)
async def unfavorite_market_item(
    item_id: UUID,
    user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    item = await _get_market_item(item_id, db)
    existing = (
        await db.execute(
            select(MarketItemFavorite).where(
                MarketItemFavorite.market_item_id == item.id,
                MarketItemFavorite.user_id == user.id,
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        await db.delete(existing)
        item.favorite_count = max(0, item.favorite_count - 1)
        db.add(item)
        await db.flush()

    return MarketItemActionResponse(
        id=item.id,
        like_count=item.like_count,
        favorite_count=item.favorite_count,
        download_count=item.download_count,
        viewer_has_liked=(
            await db.execute(
                select(MarketItemLike.id).where(
                    MarketItemLike.market_item_id == item.id,
                    MarketItemLike.user_id == user.id,
                )
            )
        ).scalar_one_or_none()
        is not None,
        viewer_has_favorited=False,
    )


@router.get("/items/{item_id}/download")
async def download_market_item(
    item_id: UUID,
    user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    storage=Depends(get_storage_service),
):
    _ = user
    item = await _get_market_item(item_id, db)
    item.download_count += 1
    db.add(item)
    await db.flush()
    return _stream_storage_file(storage, item.cover_storage_path)


@router.post("/items/{item_id}/generate-from-reference", response_model=ImageStatusResponse, status_code=202)
async def generate_from_market_reference(
    item_id: UUID,
    data: MarketReferenceGenerateRequest,
    user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    item = await _get_market_item(item_id, db)
    await _ensure_nanobanana_key_available(user, db)

    project_id = data.project_id
    if project_id is None:
        result = await db.execute(
            select(Project).where(
                Project.user_id == user.id,
                Project.name == "直接生成",
                Project.status == "active",
            )
        )
        project = result.scalar_one_or_none()
        if project is None:
            project = Project(
                user_id=user.id,
                name="直接生成",
                description="通过市场垫图模式创建的图片",
            )
            db.add(project)
            await db.flush()
            await db.refresh(project)
        project_id = project.id
    else:
        await _get_owned_project(project_id, user, db)

    image_price_cny = await _get_image_price_cny_for_resolution(db, data.resolution)
    if float(user.balance_cny) < float(image_price_cny):
        raise BadRequestException("余额不足，无法继续基于市场垫图生成。")

    image = Image(
        prompt_id=None,
        project_id=project_id,
        user_id=user.id,
        resolution=data.resolution,
        aspect_ratio=data.aspect_ratio,
        color_scheme=data.color_scheme,
        reference_image_path=item.cover_storage_path,
        edit_instruction=data.edit_instruction,
        generation_status="pending",
        final_prompt_sent=data.edit_instruction,
    )
    db.add(image)
    await db.flush()
    await db.refresh(image)

    task = celery_app.send_task(
        "app.tasks.image_tasks.generate_image_task",
        args=[
            str(image.id),
            data.edit_instruction,
            str(user.id),
            data.resolution,
            data.aspect_ratio,
            data.color_scheme,
            item.cover_storage_path,
            data.edit_instruction,
        ],
        queue="images",
    )
    image.generation_task_id = task.id
    db.add(image)
    await db.flush()

    return ImageStatusResponse(
        id=image.id,
        generation_status=image.generation_status,
        generation_task_id=task.id,
    )


@router.post("/items/{item_id}/import-to-project", response_model=MessageResponse)
async def import_market_item_to_project(
    item_id: UUID,
    data: MarketImportToProjectRequest,
    user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    storage=Depends(get_storage_service),
):
    item = await _get_market_item(item_id, db)
    project = await _get_owned_project(data.project_id, user, db)
    target_path = f"project-references/{user.id}/{project.id}/{item.id}.png"
    stored_path = await _copy_storage_object(
        storage,
        source_path=item.cover_storage_path,
        target_path=target_path,
    )

    reference_asset = ProjectReferenceAsset(
        project_id=project.id,
        user_id=user.id,
        market_item_id=item.id,
        title=item.title,
        source_type="market_item",
        storage_path=stored_path,
    )
    db.add(reference_asset)
    await db.flush()

    return MessageResponse(message="市场图片已导入项目素材库")


@admin_router.get("/items", response_model=MarketItemListResponse)
async def list_admin_market_items(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    base_query = (
        select(MarketItem)
        .options(
            selectinload(MarketItem.category),
            selectinload(MarketItem.market_item_tags).selectinload(MarketItemTag.tag),
            selectinload(MarketItem.creator),
        )
    )
    total = int((await db.execute(select(func.count()).select_from(base_query.subquery()))).scalar_one())
    result = await db.execute(
        base_query.order_by(MarketItem.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    items = result.scalars().all()
    serialized_items = [
        MarketItemSummaryResponse(**(await _serialize_market_item(item, db)).model_dump())
        for item in items
    ]
    return MarketItemListResponse(items=serialized_items, total=total, page=page, page_size=page_size)


@admin_router.post("/categories", response_model=MarketCategoryResponse, status_code=201)
async def create_market_category(
    data: MarketCategoryPayload,
    _admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    slug = data.slug or slugify_market_term(data.name)
    category = MarketCategory(name=data.name, slug=slug)
    db.add(category)
    await db.flush()
    await db.refresh(category)
    return MarketCategoryResponse.model_validate(category)


@admin_router.put("/categories/{category_id}", response_model=MarketCategoryResponse)
async def update_market_category(
    category_id: UUID,
    data: MarketCategoryPayload,
    _admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    category = (
        await db.execute(select(MarketCategory).where(MarketCategory.id == category_id))
    ).scalar_one_or_none()
    if category is None:
        raise NotFoundException("分类不存在")

    category.name = data.name
    category.slug = data.slug or slugify_market_term(data.name)
    db.add(category)
    await db.flush()
    await db.refresh(category)
    return MarketCategoryResponse.model_validate(category)


@admin_router.post("/tags", response_model=MarketTagResponse, status_code=201)
async def create_market_tag(
    data: MarketTagPayload,
    _admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    slug = data.slug or slugify_market_term(data.name)
    tag = MarketTag(name=data.name, slug=slug)
    db.add(tag)
    await db.flush()
    await db.refresh(tag)
    return MarketTagResponse.model_validate(tag)


@admin_router.put("/tags/{tag_id}", response_model=MarketTagResponse)
async def update_market_tag(
    tag_id: UUID,
    data: MarketTagPayload,
    _admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    tag = (await db.execute(select(MarketTag).where(MarketTag.id == tag_id))).scalar_one_or_none()
    if tag is None:
        raise NotFoundException("标签不存在")

    tag.name = data.name
    tag.slug = data.slug or slugify_market_term(data.name)
    db.add(tag)
    await db.flush()
    await db.refresh(tag)
    return MarketTagResponse.model_validate(tag)


@admin_router.post("/items", response_model=MarketItemDetailResponse, status_code=201)
async def create_admin_market_item(
    title: str = Form(...),
    summary: str | None = Form(default=None),
    category_id: UUID = Form(...),
    tag_ids: str = Form(default=""),
    content_type: str = Form(default="non_ai_figure"),
    paper_url: str | None = Form(default=None),
    status: str = Form(default="draft"),
    is_featured: bool = Form(default=False),
    image_file: UploadFile = File(...),
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
    storage=Depends(get_storage_service),
):
    validate_market_item_content(content_type, paper_url)
    await _ensure_category_exists(category_id, db)

    tag_ids_parsed = [UUID(tag_id) for tag_id in tag_ids.split(",") if tag_id.strip()] if tag_ids else []
    file_bytes = await image_file.read()
    object_name = f"market-items/{admin.id}/{datetime.now(UTC).timestamp()}-{image_file.filename or 'cover.png'}"
    stored_path = storage.upload_file(file_bytes, object_name, image_file.content_type or "image/png")

    item = MarketItem(
        title=title.strip(),
        summary=(summary or "").strip() or None,
        cover_storage_path=stored_path,
        source_type="curated_upload",
        content_type=content_type,
        category_id=category_id,
        paper_url=(paper_url or "").strip() or None,
        is_featured=is_featured,
        status=status,
        published_at=datetime.now(UTC) if status == "published" else None,
        created_by=admin.id,
        updated_by=admin.id,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    await _sync_market_item_tags(item, tag_ids_parsed, db)
    await db.flush()

    refreshed_item = await _get_market_item(item.id, db, include_hidden_for=admin)
    return await _serialize_market_item(refreshed_item, db, viewer=admin)


@admin_router.put("/items/{item_id}", response_model=MarketItemDetailResponse)
async def update_admin_market_item(
    item_id: UUID,
    data: MarketAdminItemUpdateRequest,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    item = await _get_market_item(item_id, db, include_hidden_for=admin)
    updates = data.model_dump(exclude_unset=True)
    next_content_type = updates.get("content_type", item.content_type)
    next_paper_url = updates.get("paper_url", item.paper_url)
    validate_market_item_content(next_content_type, next_paper_url)

    if "category_id" in updates and updates["category_id"] is not None:
        await _ensure_category_exists(updates["category_id"], db)

    tag_ids = updates.pop("tag_ids", None)
    for field, value in updates.items():
        setattr(item, field, value)
    item.updated_by = admin.id
    if item.status == "published" and item.published_at is None:
        item.published_at = datetime.now(UTC)

    if tag_ids is not None:
        await _sync_market_item_tags(item, tag_ids, db)

    db.add(item)
    await db.flush()
    refreshed_item = await _get_market_item(item.id, db, include_hidden_for=admin)
    return await _serialize_market_item(refreshed_item, db, viewer=admin)


@admin_router.put("/items/{item_id}/feature", response_model=MarketItemDetailResponse)
async def toggle_market_item_featured(
    item_id: UUID,
    featured: bool = Form(...),
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    item = await _get_market_item(item_id, db, include_hidden_for=admin)
    item.is_featured = featured
    item.updated_by = admin.id
    db.add(item)
    await db.flush()
    refreshed_item = await _get_market_item(item.id, db, include_hidden_for=admin)
    return await _serialize_market_item(refreshed_item, db, viewer=admin)


@admin_router.put("/items/{item_id}/hide", response_model=MarketItemDetailResponse)
async def toggle_market_item_hidden(
    item_id: UUID,
    hidden: bool = Form(...),
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    item = await _get_market_item(item_id, db, include_hidden_for=admin)
    item.status = "hidden" if hidden else "published"
    if item.status == "published" and item.published_at is None:
        item.published_at = datetime.now(UTC)
    item.updated_by = admin.id
    db.add(item)
    await db.flush()
    refreshed_item = await _get_market_item(item.id, db, include_hidden_for=admin)
    return await _serialize_market_item(refreshed_item, db, viewer=admin)
