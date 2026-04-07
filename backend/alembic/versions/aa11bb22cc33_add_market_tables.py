"""add_market_tables

Revision ID: aa11bb22cc33
Revises: c7d8e9f0a1b2
Create Date: 2026-04-07 03:10:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "aa11bb22cc33"
down_revision = "c7d8e9f0a1b2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "market_categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_market_categories_name"),
        sa.UniqueConstraint("slug", name="uq_market_categories_slug"),
    )
    op.create_index("ix_market_categories_slug", "market_categories", ["slug"], unique=False)

    op.create_table(
        "market_tags",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_market_tags_name"),
        sa.UniqueConstraint("slug", name="uq_market_tags_slug"),
    )
    op.create_index("ix_market_tags_slug", "market_tags", ["slug"], unique=False)

    op.create_table(
        "market_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("cover_storage_path", sa.String(length=1000), nullable=False),
        sa.Column("source_type", sa.String(length=30), nullable=False),
        sa.Column("content_type", sa.String(length=30), nullable=False),
        sa.Column("origin_image_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("paper_url", sa.String(length=1000), nullable=True),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("status", sa.String(length=20), nullable=False, server_default=sa.text("'draft'")),
        sa.Column("like_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("favorite_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("download_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["origin_image_id"], ["images.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["category_id"], ["market_categories.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_market_items_status", "market_items", ["status"], unique=False)
    op.create_index("ix_market_items_category_id", "market_items", ["category_id"], unique=False)
    op.create_index("ix_market_items_published_at", "market_items", ["published_at"], unique=False)
    op.create_index("ix_market_items_created_by", "market_items", ["created_by"], unique=False)

    op.create_table(
        "market_item_tags",
        sa.Column("market_item_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tag_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["market_item_id"], ["market_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tag_id"], ["market_tags.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("market_item_id", "tag_id"),
    )

    op.create_table(
        "market_item_likes",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("market_item_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["market_item_id"], ["market_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("market_item_id", "user_id", name="uq_market_item_likes_item_user"),
    )

    op.create_table(
        "market_item_favorites",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("market_item_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["market_item_id"], ["market_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("market_item_id", "user_id", name="uq_market_item_favorites_item_user"),
    )

    op.create_table(
        "project_reference_assets",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("market_item_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("source_type", sa.String(length=30), nullable=False, server_default=sa.text("'market_item'")),
        sa.Column("storage_path", sa.String(length=1000), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["market_item_id"], ["market_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_project_reference_assets_project_id", "project_reference_assets", ["project_id"], unique=False)
    op.create_index("ix_project_reference_assets_user_id", "project_reference_assets", ["user_id"], unique=False)
    op.create_index("ix_project_reference_assets_market_item_id", "project_reference_assets", ["market_item_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_project_reference_assets_market_item_id", table_name="project_reference_assets")
    op.drop_index("ix_project_reference_assets_user_id", table_name="project_reference_assets")
    op.drop_index("ix_project_reference_assets_project_id", table_name="project_reference_assets")
    op.drop_table("project_reference_assets")

    op.drop_table("market_item_favorites")
    op.drop_table("market_item_likes")
    op.drop_table("market_item_tags")

    op.drop_index("ix_market_items_created_by", table_name="market_items")
    op.drop_index("ix_market_items_published_at", table_name="market_items")
    op.drop_index("ix_market_items_category_id", table_name="market_items")
    op.drop_index("ix_market_items_status", table_name="market_items")
    op.drop_table("market_items")

    op.drop_index("ix_market_tags_slug", table_name="market_tags")
    op.drop_table("market_tags")

    op.drop_index("ix_market_categories_slug", table_name="market_categories")
    op.drop_table("market_categories")
