from fastapi import FastAPI
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import SessionLocal
from app.routes.category_routes import router as category_router
from app.routes.product_routes import router as product_router
from app.routes.warehouse_routes import router as warehouse_router
from app.routes.zone_routes import router as zone_router
from app.routes.location_routes import router as location_router
from app.routes.stock_routes import router as stock_router
from app.routes.reception_routes import router as reception_router
from app.routes.movement_routes import router as movement_router
from app.routes.shipment_routes import router as shipment_router
from app.routes.inventory_routes import router as inventory_router
from app.routes.audit_routes import router as audit_router
from app.routes import auth_routes

app = FastAPI(title="SGA API")

# 🔐 CORS (temporalmente abierto, restringir en producción)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://sga-fastapi.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(category_router)
app.include_router(product_router)
app.include_router(warehouse_router)
app.include_router(zone_router)
app.include_router(location_router)
app.include_router(stock_router)
app.include_router(reception_router)
app.include_router(movement_router)
app.include_router(shipment_router)
app.include_router(inventory_router)
app.include_router(audit_router)
app.include_router(auth_routes.router)


@app.get("/")
def root():
    return {"message": "SGA funcionando correctamente"}


@app.get("/health/db")
def health_db():
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    finally:
        db.close()