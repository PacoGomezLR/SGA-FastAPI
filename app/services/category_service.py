from app.models.category import Category
from app.repositories.category_repository import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryUpdate


class CategoryService:
    def __init__(self, repository: CategoryRepository):
        self.repository = repository

    def get_categories(self):
        return self.repository.get_all()

    def get_category(self, category_id: int):
        category = self.repository.get_by_id(category_id)
        if not category:
            raise ValueError("Categoría no encontrada")
        return category

    def create_category(self, data: CategoryCreate):
        existing_category = self.repository.get_by_name(data.nombre)
        if existing_category:
            raise ValueError("Ya existe una categoría con ese nombre")

        new_category = Category(
            nombre=data.nombre,
            descripcion=data.descripcion,
            activo=data.activo,
        )
        return self.repository.create(new_category)

    def update_category(self, category_id: int, data: CategoryUpdate):
        category = self.repository.get_by_id(category_id)
        if not category:
            raise ValueError("Categoría no encontrada")

        if data.nombre is not None:
            existing_category = self.repository.get_by_name(data.nombre)
            if existing_category and existing_category.id != category_id:
                raise ValueError("Ya existe una categoría con ese nombre")
            category.nombre = data.nombre

        if data.descripcion is not None:
            category.descripcion = data.descripcion

        if data.activo is not None:
            category.activo = data.activo

        return self.repository.update(category)

    def delete_category(self, category_id: int):
        category = self.repository.get_by_id(category_id)
        if not category:
            raise ValueError("Categoría no encontrada")

        self.repository.delete(category)