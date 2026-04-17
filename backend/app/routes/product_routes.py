from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.security.dependencies import get_current_user, require_role
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["Products"])


@router.get(
    "/",
    response_model=list[ProductResponse],
    dependencies=[Depends(require_role("administrador", "supervisor", "operario"))]
)
def get_all_products(db: Session = Depends(get_db)):
    service = ProductService(db)
    return service.get_all_products()


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
    dependencies=[Depends(require_role("administrador", "supervisor", "operario"))]
)
def get_product(product_id: int, db: Session = Depends(get_db)):
    service = ProductService(db)
    return service.get_product_by_id(product_id)


@router.post(
    "/",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("administrador", "supervisor"))]
)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    service = ProductService(db)
    return service.create_product(product_data)


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
    dependencies=[Depends(require_role("administrador", "supervisor"))]
)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    service = ProductService(db)
    return service.update_product(product_id, product_data)


@router.delete(
    "/{product_id}",
    dependencies=[Depends(require_role("administrador"))]
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    service = ProductService(db)
    return service.delete_product(product_id)