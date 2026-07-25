"""Redirect rules table

Revision ID: c2f3a4b5d6e7
Revises: b1e1a1c2d3e4
Create Date: 2026-07-25
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "c2f3a4b5d6e7"
down_revision: Union[str, None] = "b1e1a1c2d3e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "redirect_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("from_path", sa.String(length=500), nullable=False, unique=True),
        sa.Column("to_path", sa.String(length=500), nullable=False),
        sa.Column("status_code", sa.Integer(), nullable=False, server_default="301"),
        sa.Column("hit_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f("ix_redirect_rules_from_path"), "redirect_rules", ["from_path"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_redirect_rules_from_path"), table_name="redirect_rules")
    op.drop_table("redirect_rules")
