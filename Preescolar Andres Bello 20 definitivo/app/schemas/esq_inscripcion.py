from pydantic import BaseModel, EmailStr, Field
from typing import Optional


# ============================================
# SCHEMAS PARA CREAR (POST)
# ============================================

class RepresentanteCreate(BaseModel):
    nombres: str = Field(..., min_length=2, max_length=100)
    apellidos: str = Field(..., min_length=2, max_length=100)
    cedula: str = Field(..., min_length=5, max_length=20)
    telefono: str = Field(..., min_length=10, max_length=20)
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None
    lugar_trabajo: Optional[str] = None
    telefono_trabajo: Optional[str] = None


class EstudianteCreate(BaseModel):
    nombres: str = Field(..., min_length=2, max_length=100)
    apellidos: str = Field(..., min_length=2, max_length=100)
    cedula_escolar: Optional[str] = None
    fecha_nacimiento: str  # Formato YYYY-MM-DD
    genero: str = Field(..., pattern="^(M|F)$")
    lugar_nacimiento: Optional[str] = None
    alergias_condiciones_medicas: Optional[str] = None
    observaciones: Optional[str] = None


class MatriculaCreate(BaseModel):
    periodo_id: int
    seccion_id: int
    parentesco: str = Field(..., min_length=2, max_length=50)
    es_representante_legal: bool = True
    autorizado_retirar: bool = True
    observaciones_inscripcion: Optional[str] = None


class InscripcionCreate(BaseModel):
    """Schema para crear una inscripción completa (POST)."""
    representante: RepresentanteCreate
    estudiante: EstudianteCreate
    matricula: MatriculaCreate


# ============================================
# SCHEMAS PARA ACTUALIZAR COMPLETO (PUT)
# ============================================

class MatriculaUpdateFull(BaseModel):
    """Schema para actualizar matrícula en PUT (incluye estatus)."""
    periodo_id: Optional[int] = None
    seccion_id: Optional[int] = None
    parentesco: Optional[str] = None
    es_representante_legal: Optional[bool] = None
    autorizado_retirar: Optional[bool] = None
    observaciones_inscripcion: Optional[str] = None
    estatus: Optional[str] = None


class InscripcionUpdate(BaseModel):
    """Schema para actualización completa (PUT)."""
    representante: Optional[RepresentanteCreate] = None
    estudiante: Optional[EstudianteCreate] = None
    matricula: Optional[MatriculaUpdateFull] = None


# ============================================
# SCHEMAS PARA ACTUALIZACIÓN PARCIAL (PATCH)
# ============================================

class MatriculaUpdate(BaseModel):
    """Schema para actualización parcial (PATCH) - solo campos de matrícula."""
    periodo_id: Optional[int] = None
    seccion_id: Optional[int] = None
    estatus: Optional[str] = None
    observaciones_inscripcion: Optional[str] = None


# ============================================
# SCHEMA DE RESPUESTA
# ============================================

class InscripcionResponse(BaseModel):
    id: int
    estudiante_id: Optional[int] = None
    estudiante_nombres: str
    estudiante_apellidos: str
    estudiante_cedula: Optional[str] = None
    estudiante_fecha_nacimiento: Optional[str] = None
    estudiante_genero: Optional[str] = None
    estudiante_lugar_nacimiento: Optional[str] = None
    estudiante_alergias: Optional[str] = None
    estudiante_observaciones: Optional[str] = None

    representante_id: Optional[int] = None
    representante_nombres: str
    representante_apellidos: str
    representante_cedula: str
    representante_telefono: str
    representante_email: Optional[str] = None
    representante_direccion: Optional[str] = None
    representante_lugar_trabajo: Optional[str] = None
    representante_telefono_trabajo: Optional[str] = None

    periodo_id: Optional[int] = None
    periodo_nombre: str
    seccion_id: Optional[int] = None
    seccion_nombre: str
    parentesco: str
    es_representante_legal: bool
    autorizado_retirar: bool
    estatus: str
    observaciones_inscripcion: Optional[str] = None
    fecha: Optional[str] = None

    model_config = {"from_attributes": True}