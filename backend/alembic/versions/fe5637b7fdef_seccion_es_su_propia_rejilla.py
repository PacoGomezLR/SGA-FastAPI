"""seccion pasa a ser su propia rejilla (elimina zonas/pasillo/lado)

Cambio de paradigma: cada Section es ahora una estantería autocontenida con
su propia rejilla de columnas x filas. Se elimina la tabla `zonas`
(pasillo+lado) y Location cuelga directamente de Section. No se migran datos
existentes (se asume entorno de demo, se regenera con el seed).

Revision ID: fe5637b7fdef
Revises: 602dbde01ba0
Create Date: 2026-07-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'fe5637b7fdef'
down_revision: Union[str, Sequence[str], None] = '602dbde01ba0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DELETE FROM stock")
    op.execute("DELETE FROM lineas_recepcion")
    op.execute("DELETE FROM lineas_salida")
    op.execute("DELETE FROM movimientos")
    op.execute("DELETE FROM recepciones")
    op.execute("DELETE FROM salidas")
    op.execute("DELETE FROM ubicaciones")
    op.execute("DELETE FROM zonas")

    op.add_column('secciones', sa.Column('num_columnas', sa.Integer(), nullable=True))
    op.add_column('secciones', sa.Column('num_filas', sa.Integer(), nullable=True))

    op.drop_constraint('uq_ubicacion_zona_codigo', 'ubicaciones', type_='unique')
    op.drop_constraint('ubicaciones_zona_id_fkey', 'ubicaciones', type_='foreignkey')

    op.alter_column('ubicaciones', 'zona_id', new_column_name='seccion_id')
    op.alter_column('ubicaciones', 'eje_x', new_column_name='columna')
    op.alter_column('ubicaciones', 'eje_y', new_column_name='fila')

    op.create_foreign_key(
        'ubicaciones_seccion_id_fkey', 'ubicaciones', 'secciones',
        ['seccion_id'], ['id']
    )
    op.create_unique_constraint(
        'uq_ubicacion_seccion_codigo', 'ubicaciones', ['seccion_id', 'codigo']
    )

    op.drop_table('zonas')


def downgrade() -> None:
    op.create_table(
        'zonas',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('seccion_id', sa.Integer(), sa.ForeignKey('secciones.id'), nullable=False),
        sa.Column('nombre', sa.String(length=100), nullable=False),
        sa.Column('descripcion', sa.String(length=255), nullable=True),
        sa.Column('activo', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('numero_pasillo', sa.Integer(), nullable=True),
        sa.Column('lado', sa.String(length=1), nullable=True),
        sa.Column('limite_filas', sa.Integer(), nullable=True),
        sa.Column('limite_alturas', sa.Integer(), nullable=True),
        sa.UniqueConstraint('seccion_id', 'nombre', name='uq_zona_seccion_nombre'),
    )

    op.drop_constraint('uq_ubicacion_seccion_codigo', 'ubicaciones', type_='unique')
    op.drop_constraint('ubicaciones_seccion_id_fkey', 'ubicaciones', type_='foreignkey')

    op.alter_column('ubicaciones', 'seccion_id', new_column_name='zona_id')
    op.alter_column('ubicaciones', 'columna', new_column_name='eje_x')
    op.alter_column('ubicaciones', 'fila', new_column_name='eje_y')

    op.create_foreign_key(
        'ubicaciones_zona_id_fkey', 'ubicaciones', 'zonas',
        ['zona_id'], ['id']
    )
    op.create_unique_constraint(
        'uq_ubicacion_zona_codigo', 'ubicaciones', ['zona_id', 'codigo']
    )

    op.drop_column('secciones', 'num_filas')
    op.drop_column('secciones', 'num_columnas')
