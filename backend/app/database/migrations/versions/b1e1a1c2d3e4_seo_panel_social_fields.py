"""SEO panel social fields

Revision ID: b1e1a1c2d3e4
Revises: 8dbc4d5ae88c
Create Date: 2026-07-25
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b1e1a1c2d3e4"
down_revision: Union[str, None] = "8dbc4d5ae88c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("seo_meta", sa.Column("focus_keyword", sa.String(length=255), nullable=True))
    op.add_column("seo_meta", sa.Column("twitter_title", sa.String(length=255), nullable=True))
    op.add_column("seo_meta", sa.Column("twitter_description", sa.String(length=500), nullable=True))
    op.add_column("seo_meta", sa.Column("twitter_image_media_id", sa.UUID(), nullable=True))


def downgrade() -> None:
    op.drop_column("seo_meta", "twitter_image_media_id")
    op.drop_column("seo_meta", "twitter_description")
    op.drop_column("seo_meta", "twitter_title")
    op.drop_column("seo_meta", "focus_keyword")
