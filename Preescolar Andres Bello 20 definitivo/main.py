from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel
from app.config.database import engine

# Importar todos los routers
from app.router.auth_router import router as auth_router
from app.router.rol_router import router as rol_router
from app.router.representante_router import router as representante_router
from app.router.estudiante_router import router as estudiante_router
from app.router.periodo_router import router as periodo_router
from app.router.seccion_router import router as seccion_router
from app.router.matricula_router import router as matricula_router
from app.router.inscripcion_router import router as inscripcion_router
from app.router.analytics_router import router as analytics_router
from app.router.auditoria_router import router as auditoria_router

app = FastAPI(
    title="C.E.I. Andrés Bello - Sistema de Inscripción y Control API",
    description="API REST para la gestión del Preescolar C.E.I. Andrés Bello.",
    version="2.0.0"
)

# Configuración de CORS (DEBE IR ANTES DE LOS ROUTERS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3002",
        "http://127.0.0.1:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de routers
app.include_router(auth_router)
app.include_router(rol_router)
app.include_router(representante_router)
app.include_router(estudiante_router)
app.include_router(periodo_router)
app.include_router(seccion_router)
app.include_router(matricula_router)
app.include_router(inscripcion_router)
app.include_router(analytics_router)
app.include_router(auditoria_router)

@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

@app.get("/")
def root():
    return {
        "mensaje": "API del C.E.I. Andrés Bello funcionando correctamente",
        "documentacion": "/docs",
        "estado": "En línea"
    }