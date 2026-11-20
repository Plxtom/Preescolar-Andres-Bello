from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date


class RepresentanteCreate(BaseModel):
    nombres: str = Field(max_length=100)
    apellidos: str = Field(max_length=100)
    cedula: str = Field(max_length=20)
    telefono: str = Field(max_length=20)
    email: Optional[EmailStr] = None
    direccion: str
    lugar_trabajo: Optional[str] = Field(default=None, max_length=150)
    telefono_trabajo: Optional[str] = Field(default=None, max_length=20)


class EstudianteCreate(BaseModel):
    nombres: str = Field(max_length=100)
    apellidos: str = Field(max_length=100)
    cedula_escolar: Optional[str] = Field(default=None, max_length=30)
    fecha_nacimiento: date
    genero: Optional[str] = Field(default=None, max_length=1)
    lugar_nacimiento: Optional[str] = Field(default=None, max_length=100)
    alergias_condiciones_medicas: Optional[str] = None
    observaciones: Optional[str] = None


class MatriculaCreate(BaseModel):
    periodo_id: int
    seccion_id: int
    parentesco: str = Field(max_length=50)
    es_representante_legal: bool = False
    autorizado_retirar: bool = True
    observaciones_inscripcion: Optional[str] = None


class InscripcionCreate(BaseModel):
    representante: RepresentanteCreate
    estudiante: EstudianteCreate
    matricula: MatriculaCreate


class InscripcionResponse(BaseModel):
    id: int
    estudiante_id: int
    estudiante_nombres: str
    estudiante_apellidos: str
    estudiante_cedula: Optional[str]
    representante_id: Optional[int]
    representante_nombres: str
    representante_apellidos: str
    representante_cedula: str
    representante_telefono: str
    periodo_id: int
    periodo_nombre: str
    seccion_id: int
    seccion_nombre: str
    parentesco: str
    es_representante_legal: bool
    autorizado_retirar: bool
    estatus: str
    fecha: str


class MatriculaUpdate(BaseModel):
    periodo_id: Optional[int] = None
    seccion_id: Optional[int] = None
    estatus: Optional[str] = None
    observaciones_inscripcion: Optional[str] = None