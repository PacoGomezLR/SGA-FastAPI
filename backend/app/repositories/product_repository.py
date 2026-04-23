from sqlalchemy.orm import Session, joinedload

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


class ProductRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self):
        return (
            self.db.query(Product)
            .options(joinedload(Product.categoria))
            .all()
        )

    def get_by_id(self, product_id: int):
        return (
            self.db.query(Product)
            .options(joinedload(Product.categoria))
            .filter(Product.id == product_id)
            .first()
        )

    def get_by_sku(self, sku: str):
        return self.db.query(Product).filter(Product.sku == sku).first()

    def create(self, product_data: ProductCreate):
        new_product = Product(**product_data.model_dump())
        self.db.add(new_product)
        self.db.commit()
        self.db.refresh(new_product)
        return new_product

    def update(self, product: Product, product_data: ProductUpdate):
        update_data = product_data.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(product, key, value)

        self.db.commit()
        self.db.refresh(product)
        return product

    def delete(self, product: Product):
        self.db.delete(product)
        self.db.commit()