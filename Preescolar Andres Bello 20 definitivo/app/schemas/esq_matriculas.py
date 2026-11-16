from pydantic import BaseModel, Field
from datetime import datetime
from typing import Literal, Optional

from app.schemas.esq_estudiantes import EstudianteRead
from app.schemas.esq_periodos import PeriodoAcademicoRead
from app.schemas.esq_secciones import SeccionRead

EstatusMatricula = Literal["ACTIVO", "RETIRADO", "EGRESADO", "PENDIENTE"]

class MatriculaBase(BaseModel):
    estudiante_id: int = Field(..., description="ID del estudiante a matricular")
    periodo_id: int = Field(..., description="ID del periodo académico")
    seccion_id: int = Field(..., description="ID de la sección asignada")
    estatus: EstatusMatricula = Field(default="ACTIVO", description="Estatus actual de la matrícula")
    observaciones_inscripcion: Optional[str] = Field(None, description="Observaciones especiales del proceso")
    registrado_por_usuario_id: Optional[int] = None

class MatriculaCreate(MatriculaBase):
    pass

class MatriculaReplace(MatriculaBase):
    observaciones_inscripcion: str

class MatriculaUpdate(BaseModel):
    estudiante_id: Optional[int] = None
    periodo_id: Optional[int] = None
    seccion_id: Optional[int] = None
    estatus: Optional[EstatusMatricula] = None
    observaciones_inscripcion: Optional[str] = None
    is_active: Optional[bool] = None

class MatriculaRead(MatriculaBase):
    id: int
    registrado_por_usuario_id: int
    fecha_matricula: datetime
    is_active: bool
    model_config = {"from_attributes": True}

# Esquema avanzado para consultas detalladas (igual que tu CitaDetailRead)
class MatriculaDetailRead(MatriculaRead):
    estudiante: Optional[EstudianteRead] = None
    periodo: Optional[PeriodoAcademicoRead] = None
    seccion: Optional[SeccionRead] = None