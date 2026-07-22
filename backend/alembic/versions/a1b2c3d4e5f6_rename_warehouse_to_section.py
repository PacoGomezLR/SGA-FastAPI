"""rename warehouse (almacen) to section (seccion)

Revision ID: a1b2c3d4e5f6
Revises: 9342dcf162ff
Create Date: 2026-07-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '9342dcf162ff'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Renombrar tabla principal
    op.rename_table('almacenes', 'secciones')
    op.execute('ALTER INDEX ix_almacenes_id RENAME TO ix_secciones_id')
    op.execute('ALTER TABLE secciones RENAME CONSTRAINT almacenes_pkey TO secciones_pkey')
    op.execute('ALTER TABLE secciones RENAME CONSTRAINT almacenes_nombre_key TO secciones_nombre_key')

    # zonas
    op.alter_column('zonas', 'almacen_id', new_column_name='seccion_id')
    op.execute('ALTER TABLE zonas RENAME CONSTRAINT zonas_almacen_id_fkey TO zonas_seccion_id_fkey')
    op.execute('ALTER TABLE zonas RENAME CONSTRAINT uq_zona_almacen_nombre TO uq_zona_seccion_nombre')

    # inventarios
    op.alter_column('inventarios', 'almacen_id', new_column_name='seccion_id')
    op.execute('ALTER TABLE inventarios RENAME CONSTRAINT inventarios_almacen_id_fkey TO inventarios_seccion_id_fkey')

    # recepciones
    op.alter_column('recepciones', 'almacen_id', new_column_name='seccion_id')
    op.execute('ALTER TABLE recepciones RENAME CONSTRAINT recepciones_almacen_id_fkey TO recepciones_seccion_id_fkey')

    # salidas
    op.alter_column('salidas', 'almacen_id', new_column_name='seccion_id')
    op.execute('ALTER TABLE salidas RENAME CONSTRAINT salidas_almacen_id_fkey TO salidas_seccion_id_fkey')


def downgrade() -> None:
    """Downgrade schema."""
    op.execute('ALTER TABLE salidas RENAME CONSTRAINT salidas_seccion_id_fkey TO salidas_almacen_id_fkey')
    op.alter_column('salidas', 'seccion_id', new_column_name='almacen_id')

    op.execute('ALTER TABLE recepciones RENAME CONSTRAINT recepciones_seccion_id_fkey TO recepciones_almacen_id_fkey')
    op.alter_column('recepciones', 'seccion_id', new_column_name='almacen_id')

    op.execute('ALTER TABLE inventarios RENAME CONSTRAINT inventarios_seccion_id_fkey TO inventarios_almacen_id_fkey')
    op.alter_column('inventarios', 'seccion_id', new_column_name='almacen_id')

    op.execute('ALTER TABLE zonas RENAME CONSTRAINT uq_zona_seccion_nombre TO uq_zona_almacen_nombre')
    op.execute('ALTER TABLE zonas RENAME CONSTRAINT zonas_seccion_id_fkey TO zonas_almacen_id_fkey')
    op.alter_column('zonas', 'seccion_id', new_column_name='almacen_id')

    op.execute('ALTER TABLE secciones RENAME CONSTRAINT secciones_nombre_key TO almacenes_nombre_key')
    op.execute('ALTER TABLE secciones RENAME CONSTRAINT secciones_pkey TO almacenes_pkey')
    op.execute('ALTER INDEX ix_secciones_id RENAME TO ix_almacenes_id')
    op.rename_table('secciones', 'almacenes')
