from pydantic import BaseModel, ConfigDict


class CategoryBase(BaseModel):
    nombre: str
    descripcion: str | None = None
    activo: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None
    activo: bool | None = None


class CategoryResponse(CategoryBase):
    id: int

    model_config = ConfigDict(from_attributes=True)