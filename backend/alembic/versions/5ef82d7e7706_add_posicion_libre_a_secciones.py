"""add pos_x/pos_y a secciones para el mapa 2D con disposicion libre

Revision ID: 5ef82d7e7706
Revises: fe5637b7fdef
Create Date: 2026-07-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '5ef82d7e7706'
down_revision: Union[str, Sequence[str], None] = 'fe5637b7fdef'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('secciones', sa.Column('pos_x', sa.Integer(), nullable=True))
    op.add_column('secciones', sa.Column('pos_y', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('secciones', 'pos_y')
    op.drop_column('secciones', 'pos_x')
