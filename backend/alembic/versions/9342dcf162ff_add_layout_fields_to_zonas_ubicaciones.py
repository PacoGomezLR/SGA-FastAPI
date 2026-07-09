"""add layout fields to zonas and ubicaciones

Revision ID: 9342dcf162ff
Revises: d68b69f4be06
Create Date: 2026-07-09 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = '9342dcf162ff'
down_revision: Union[str, Sequence[str], None] = '932b5bfcc87f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("zonas", sa.Column("numero_pasillo", sa.Integer(), nullable=True))
    op.add_column("zonas", sa.Column("lado", sa.String(length=1), nullable=True))

    op.add_column("ubicaciones", sa.Column("eje_y", sa.Integer(), nullable=True))
    op.add_column("ubicaciones", sa.Column("eje_x", sa.Integer(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("ubicaciones", "eje_x")
    op.drop_column("ubicaciones", "eje_y")

    op.drop_column("zonas", "lado")
    op.drop_column("zonas", "numero_pasillo")
