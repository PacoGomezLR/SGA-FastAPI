from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.product_repository import ProductRepository
from app.schemas.product import ProductCreate, ProductUpdate


class ProductService:
    def __init__(self, db: Session):
        self.repository = ProductRepository(db)

    def get_all_products(self):
        return self.repository.get_all()

    def get_product_by_id(self, product_id: int):
        product = self.repository.get_by_id(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Producto no encontrado"
            )
        return product

    def create_product(self, product_data: ProductCreate):
        existing_product = self.repository.get_by_sku(product_data.sku)
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un producto con ese SKU"
            )
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