"""add_system_paddleocr_settings

Revision ID: c7d8e9f0a1b2
Revises: a8b9c0d1e2f3
Create Date: 2026-04-07 01:30:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "c7d8e9f0a1b2"
down_revision = "a8b9c0d1e2f3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "system_settings",
        sa.Column(
            "paddleocr_server_url",
            sa.String(length=500),
            nullable=True,
            comment="System PaddleOCR API base URL",
        ),
    )
    op.add_column(
        "system_settings",
        sa.Column(
            "paddleocr_api_key_enc",
            sa.Text(),
            nullable=True,
            comment="AES-256 encrypted system PaddleOCR access token",
        ),
    )


def downgrade() -> None:
    op.drop_column("system_settings", "paddleocr_api_key_enc")
    op.drop_column("system_settings", "paddleocr_server_url")
