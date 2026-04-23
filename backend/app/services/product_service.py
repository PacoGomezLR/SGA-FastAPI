import re

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.category import Category
from app.repositories.product_repository import ProductRepository
from app.schemas.product import ProductCreate, ProductUpdate


class ProductService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = ProductRepository(db)

    def get_all_products(self):
        products = self.repository.get_all()

        return [
            {
                "id": p.id,
                "nombre": p.nombre,
                "descripcion": p.descripcion,
                "sku": p.sku,
                "categoria_id": p.categoria_id,
                "categoria_nombre": p.categoria.nombre if p.categoria else None,
                "unidad_medida": p.unidad_medida,
                "activo": p.activo,
                "stock_minimo": p.stock_minimo
            }
            for p in products
        ]

    def get_product_by_id(self, product_id: int):
        p = self.repository.get_by_id(product_id)
        if not p:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Producto no encontrado"
            )

        return {
            "id": p.id,
            "nombre": p.nombre,
            "descripcion": p.descripcion,
            "sku": p.sku,
            "categoria_id": p.categoria_id,
            "categoria_nombre": p.categoria.nombre if p.categoria else None,
            "unidad_medida": p.unidad_medida,
            "activo": p.activo,
            "stock_minimo": p.stock_minimo
        }

    def create_product(self, product_data: ProductCreate):
        sku = (product_data.sku or "").strip()

        if not sku:
            sku = self._generate_sku()

        existing_product = self.repository.get_by_sku(sku)
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un producto con ese SKU"
            )

        categoria = self.db.query(Category).filter(
            Category.id == product_data.categoria_id
        ).first()
        if not categoria:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="La categoría no existe"
            )

        product_data = product_data.model_copy(update={"sku": sku})

        return self.repository.create(product_data)

    def update_product(self, product_id: int, product_data: ProductUpdate):
        product = self.repository.get_by_id(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Producto no encontrado"
            )

        if product_data.sku:
            existing_product = self.repository.get_by_sku(product_data.sku)
            if existing_product and existing_product.id != product_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe otro producto con ese SKU"
                )

        if product_data.categoria_id is not None:
            categoria = self.db.query(Category).filter(
                Category.id == product_data.categoria_id
            ).first()
            if not categoria:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="La categoría no existe"
                )

        return self.repository.update(product, product_data)

    def delete_product(self, product_id: int):
        product = self.repository.get_by_id(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Producto no encontrado"
            )

        self.repository.delete(product)
        return {"message": "Producto eliminado correctamente"}

    def _generate_sku(self):
        products = self.repository.get_all()
        pattern = re.compile(r"^PROD-(\d{4})$")

        max_number = 0

        for product in products:
            if not product.sku:
                continue

            match = pattern.match(product.sku)
            if match:
                number = int(match.group(1))
                if number > max_number:
                    max_number = number

        next_number = max_number + 1
        return f"PROD-{next_number:04d}"