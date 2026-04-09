"""add manual to origen_movimiento_enum

Revision ID: d68b69f4be06
Revises: 7da03e2471e4
Create Date: 2026-04-08 21:10:48.749199

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'd68b69f4be06'
down_revision: Union[str, Sequence[str], None] = '7da03e2471e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE origen_movimiento_enum ADD VALUE IF NOT EXISTS 'manual';")


def downgrade() -> None:
    """Downgrade schema."""
    pass