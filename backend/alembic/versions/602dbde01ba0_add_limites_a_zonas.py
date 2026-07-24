"""add limite_filas y limite_alturas a zonas

Revision ID: 602dbde01ba0
Revises: a1b2c3d4e5f6
Create Date: 2026-07-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '602dbde01ba0'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('zonas', sa.Column('limite_filas', sa.Integer(), nullable=True))
    op.add_column('zonas', sa.Column('limite_alturas', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('zonas', 'limite_alturas')
    op.drop_column('zonas', 'limite_filas')
