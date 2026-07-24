"""rotada_bool_a_rotacion_int

Revision ID: cb33f6e69632
Revises: 317da9daca03
Create Date: 2026-07-24 13:19:54.261270

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cb33f6e69632'
down_revision: Union[str, Sequence[str], None] = '317da9daca03'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "secciones",
        sa.Column("rotacion", sa.Integer(), nullable=False, server_default="0"),
    )
    op.execute("UPDATE secciones SET rotacion = 1 WHERE rotada = true")
    op.alter_column("secciones", "rotacion", server_default=None)
    op.drop_column("secciones", "rotada")


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column(
        "secciones",
        sa.Column("rotada", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.execute("UPDATE secciones SET rotada = true WHERE rotacion != 0")
    op.alter_column("secciones", "rotada", server_default=None)
    op.drop_column("secciones", "rotacion")
