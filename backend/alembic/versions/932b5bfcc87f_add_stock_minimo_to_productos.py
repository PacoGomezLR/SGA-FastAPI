"""add stock_minimo to productos

Revision ID: 932b5bfcc87f
Revises: d68b69f4be06
Create Date: 2026-04-17 09:08:54.808101

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '932b5bfcc87f'
down_revision: Union[str, Sequence[str], None] = 'd68b69f4be06'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "productos",
        sa.Column("stock_minimo", sa.Integer(), nullable=False, server_default="0")
    )
    op.alter_column("productos", "stock_minimo", server_default=None)


def downgrade() -> None:
    op.drop_column("productos", "stock_minimo")