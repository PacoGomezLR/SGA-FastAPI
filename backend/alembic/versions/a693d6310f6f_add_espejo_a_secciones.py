"""add_espejo_a_secciones

Revision ID: a693d6310f6f
Revises: 5ef82d7e7706
Create Date: 2026-07-23 19:42:05.092162

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a693d6310f6f'
down_revision: Union[str, Sequence[str], None] = '5ef82d7e7706'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "secciones",
        sa.Column("espejo", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.alter_column("secciones", "espejo", server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("secciones", "espejo")
