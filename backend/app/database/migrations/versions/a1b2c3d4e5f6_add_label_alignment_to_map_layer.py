# -*- coding: utf-8 -*-
"""add label_alignment to map_layer

Revision ID: a1b2c3d4e5f6
Revises: 826f944e1e19
Create Date: 2026-08-20 14:34:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '826f944e1e19'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Nullable - existing rows stay NULL, treated as center (original behavior).
    op.add_column(
        'map_layer',
        sa.Column('label_alignment', sa.String(length=10), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('map_layer', 'label_alignment')