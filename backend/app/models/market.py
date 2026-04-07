from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .image import Image
    from .project import Project
    from .user import User


class MarketCategory(Base, TimestampMixin):
    __tablename__ = "market_categories"

    __table_args__ = (
        UniqueConstraint("slug", name="uq_market_categories_slug"),
        UniqueConstraint("name", name="uq_market_categories_name"),
    )

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default="gen_random_uuid()",
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), nullable=False, index=True)

    items: Mapped[list["MarketItem"]] = relationship("MarketItem", back_populates="category")


class MarketTag(Base, TimestampMixin):
    __tablename__ = "market_tags"

    __table_args__ = (
        UniqueConstraint("slug", name="uq_market_tags_slug"),
        UniqueConstraint("name", name="uq_market_tags_name"),
    )

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default="gen_random_uuid()",
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), nullable=False, index=True)

    market_item_tags: Mapped[list["MarketItemTag"]] = relationship(
        "MarketItemTag",
        back_populates="tag",
        cascade="all, delete-orphan",
    )


class MarketItem(Base, TimestampMixin):
    __tablename__ = "market_items"

    __table_args__ = (
        Index("ix_market_items_status", "status"),
        Index("ix_market_items_category_id", "category_id"),
        Index("ix_market_items_published_at", "published_at"),
        Index("ix_market_items_created_by", "created_by"),
    )

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default="gen_random_uuid()",
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cover_storage_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    source_type: Mapped[str] = mapped_column(String(30), nullable=False)
    content_type: Mapped[str] = mapped_column(String(30), nullable=False, default="ai_generated")
    origin_image_id: Mapped[Optional[UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("images.id", ondelete="SET NULL"),
        nullable=True,
    )
    category_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("market_categories.id", ondelete="RESTRICT"),
        nullable=False,
    )
    paper_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)
    like_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    favorite_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    download_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    updated_by: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    category: Mapped["MarketCategory"] = relationship("MarketCategory", back_populates="items")
    origin_image: Mapped[Optional["Image"]] = relationship("Image", back_populates="market_items")
    creator: Mapped["User"] = relationship("User", foreign_keys=[created_by], back_populates="created_market_items")
    updater: Mapped["User"] = relationship("User", foreign_keys=[updated_by], back_populates="updated_market_items")
    market_item_tags: Mapped[list["MarketItemTag"]] = relationship(
        "MarketItemTag",
        back_populates="market_item",
        cascade="all, delete-orphan",
    )
    likes: Mapped[list["MarketItemLike"]] = relationship(
        "MarketItemLike",
        back_populates="market_item",
        cascade="all, delete-orphan",
    )
    favorites: Mapped[list["MarketItemFavorite"]] = relationship(
        "MarketItemFavorite",
        back_populates="market_item",
        cascade="all, delete-orphan",
    )
    reference_assets: Mapped[list["ProjectReferenceAsset"]] = relationship(
        "ProjectReferenceAsset",
        back_populates="market_item",
    )


class MarketItemTag(Base):
    __tablename__ = "market_item_tags"

    market_item_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("market_items.id", ondelete="CASCADE"),
        primary_key=True,
    )
    tag_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("market_tags.id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    market_item: Mapped["MarketItem"] = relationship("MarketItem", back_populates="market_item_tags")
    tag: Mapped["MarketTag"] = relationship("MarketTag", back_populates="market_item_tags")


class MarketItemLike(Base, TimestampMixin):
    __tablename__ = "market_item_likes"

    __table_args__ = (
        UniqueConstraint("market_item_id", "user_id", name="uq_market_item_likes_item_user"),
    )

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default="gen_random_uuid()",
    )
    market_item_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("market_items.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    market_item: Mapped["MarketItem"] = relationship("MarketItem", back_populates="likes")
    user: Mapped["User"] = relationship("User", back_populates="market_item_likes")


class MarketItemFavorite(Base, TimestampMixin):
    __tablename__ = "market_item_favorites"

    __table_args__ = (
        UniqueConstraint("market_item_id", "user_id", name="uq_market_item_favorites_item_user"),
    )

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default="gen_random_uuid()",
    )
    market_item_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("market_items.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    market_item: Mapped["MarketItem"] = relationship("MarketItem", back_populates="favorites")
    user: Mapped["User"] = relationship("User", back_populates="market_item_favorites")


class ProjectReferenceAsset(Base, TimestampMixin):
    __tablename__ = "project_reference_assets"

    __table_args__ = (
        Index("ix_project_reference_assets_project_id", "project_id"),
        Index("ix_project_reference_assets_user_id", "user_id"),
        Index("ix_project_reference_assets_market_item_id", "market_item_id"),
    )

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default="gen_random_uuid()",
    )
    project_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    market_item_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("market_items.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    source_type: Mapped[str] = mapped_column(String(30), nullable=False, default="market_item")
    storage_path: Mapped[str] = mapped_column(String(1000), nullable=False)

    project: Mapped["Project"] = relationship("Project", back_populates="reference_assets")
    user: Mapped["User"] = relationship("User", back_populates="project_reference_assets")
    market_item: Mapped["MarketItem"] = relationship("MarketItem", back_populates="reference_assets")
