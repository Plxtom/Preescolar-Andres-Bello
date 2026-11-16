from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from app.config.database import engine
from app.router.auth_router import router as auth_router
from app.router.rol_router import router as rol_router
from app.router.representante_router import router as representante_router
from app.router.estudiante_router import router as estudiante_router
from app.router.periodo_router import router as periodo_router
from app.router.seccion_router import router as seccion_router
from app.router.matricula_router import router as matricula_router

app = FastAPI(
    title="C.E.I. Andrés Bello - Sistema de Inscripción y Control API",
    description="API REST modular construida con FastAPI, SQLModel y PostgreSQL para la gestión del preescolar.",
    version="1.0.0"
)

# Configuración de CORS para permitir conexiones externas (frontend, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de todos los Routers de la aplicación
app.include_router(auth_router)
app.include_router(rol_router)
app.include_router(representante_router)
app.include_router(estudiante_router)
app.include_router(periodo_router)
app.include_router(seccion_router)
app.include_router(matricula_router)

@app.on_event("startup")
def on_startup():
    """Crea automáticamente las tablas en la base de datos PostgreSQL al iniciar el servidor."""
    SQLModel.metadata.create_all(engine)

@app.get("/", tags=["Raíz"])
def root():
    return {
        "mensaje": "La API del C.E.I. Andrés Bello está funcionando al 100% correctamente",
        "documentacion": "/docs",
        "estado": "En línea"
    }