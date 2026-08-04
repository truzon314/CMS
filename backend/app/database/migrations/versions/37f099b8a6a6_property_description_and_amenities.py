"""property description and amenities

Revision ID: 37f099b8a6a6
Revises: c2f3a4b5d6e7
Create Date: 2026-07-28 13:29:23.240762

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '37f099b8a6a6'
down_revision: Union[str, None] = 'c2f3a4b5d6e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Note: autogenerate also detected a pre-existing, unrelated drift (a
    # 'redirect_rules_from_path_key' unique constraint present in the DB but
    # not in the SQLAlchemy model) — deliberately left out of this migration
    # since it's unrelated to property description/amenities and dropping a
    # unique constraint isn't something to bundle in silently.
    op.add_column('property', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('property', sa.Column('amenities', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('property', 'amenities')
    op.drop_column('property', 'description')
