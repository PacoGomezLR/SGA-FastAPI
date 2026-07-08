from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.repositories.category_repository import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.security.dependencies import get_current_user, require_role
from app.services.category_service import CategoryService

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get(
    "/",
    response_model=list[CategoryResponse],
    dependencies=[Depends(require_role("administrador", "supervisor", "operario"))]
)
def get_categories(db: Session = Depends(get_db)):
    repository = CategoryRepository(db)
    service = CategoryService(repository)
    return service.get_categories()


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
    dependencies=[Depends(require_role("administrador", "supervisor", "operario"))]
)
def get_category(category_id: int, db: Session = Depends(get_db)):
    repository = CategoryRepository(db)
    service = CategoryService(repository)
    return service.get_category(category_id)


@router.post(
    "/",
    response_model=CategoryResponse,
    status_code=201,
    dependencies=[Depends(require_role("administrador"))]
)
def create_category(data: CategoryCreate, db: Session = Depends(get_db)):
    repository = CategoryRepository(db)
    service = CategoryService(repository)
    return service.create_category(data)


@router.put(
    "/{category_id}",
    response_model=CategoryResponse,
    dependencies=[Depends(require_role("administrador"))]
)
def update_category(category_id: int, data: CategoryUpdate, db: Session = Depends(get_db)):
    repository = CategoryRepository(db)
    service = CategoryService(repository)
    return service.update_category(category_id, data)


@router.delete(
    "/{category_id}",
    status_code=204,
    dependencies=[Depends(require_role("administrador"))]
)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    repository = CategoryRepository(db)
    service = CategoryService(repository)
    service.delete_category(category_id)