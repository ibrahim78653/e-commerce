from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from database import init_db
from routers import auth, products, orders, admin, excel_import, bulk_image_import, wishlist, reviews, promos, addresses, newsletter
from config import settings
import os

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB (creates async indexes)
    try:
        await init_db()
    except Exception as e:
        print(f"Database initialization skipped or failed: {e}")
    yield

app = FastAPI(title="Burhani Collection API", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip Compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Security & Caching Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    # Add caching for static files
    if request.url.path.startswith("/static/"):
        response.headers["Cache-Control"] = "public, max-age=31536000"
    return response

# Static files
try:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
except Exception as e:
    print(f"Static directory creation skipped or failed: {e}")

app.mount("/static", StaticFiles(directory="static"), name="static")

# Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(admin.router)
app.include_router(excel_import.router)
app.include_router(bulk_image_import.router)
app.include_router(wishlist.router)
app.include_router(reviews.router)
app.include_router(promos.router)
app.include_router(addresses.router)
app.include_router(newsletter.router)

@app.get("/")
def root():
    return {"message": "Welcome to Burhani Collection API"}
