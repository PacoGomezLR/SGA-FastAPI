from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.repositories.category_repository import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.services.category_service import CategoryService

router = APIRouter(prefix="/categories", tags=["Categories"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=list[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    repository = CategoryRepository(db)
    service = CategoryService(repository)
    return service.get_categories()


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    repository = CategoryRepository(db)
    service = CategoryService(repository)

    try:
        return service.get_category(category_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/", response_model=CategoryResponse, status_code=201)
def create_category(data: CategoryCreate, db: Session = Depends(get_db)):
    repository = CategoryRepository(db)
    service = CategoryService(repository)

    try:
        return service.create_category(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(category_id: int, data: CategoryUpdate, db: Session = Depends(get_db)):
    repository = CategoryRepository(db)
    service = CategoryService(repository)

    try:
        return service.update_category(category_id, data)
    except ValueError as e:
        if str(e) == "Categoría no encontrada":
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{category_id}", status_code=204)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    repository = CategoryRepository(db)
    service = CategoryService(repository)

    try:
        service.delete_category(category_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))