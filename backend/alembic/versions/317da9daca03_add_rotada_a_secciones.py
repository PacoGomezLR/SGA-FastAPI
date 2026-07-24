"""add_rotada_a_secciones

Revision ID: 317da9daca03
Revises: a693d6310f6f
Create Date: 2026-07-24 12:38:35.657177

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '317da9daca03'
down_revision: Union[str, Sequence[str], None] = 'a693d6310f6f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "secciones",
        sa.Column("rotada", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.alter_column("secciones", "rotada", server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("secciones", "rotada")
