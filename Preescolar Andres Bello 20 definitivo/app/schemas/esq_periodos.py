from pydantic import BaseModel, Field
from datetime import date
from typing import Optional

class PeriodoAcademicoBase(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=50, description="Nombre del periodo (ej. Periodo 2026-2027)")
    fecha_inicio: date = Field(..., description="Fecha de inicio del año escolar")
    fecha_fin: date = Field(..., description="Fecha de culminación del año escolar")
    activo: bool = Field(default=False, description="Indica si es el periodo académico actualmente en curso")

class PeriodoAcademicoCreate(PeriodoAcademicoBase):
    pass

class PeriodoAcademicoReplace(PeriodoAcademicoBase):
    pass

class PeriodoAcademicoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=3, max_length=50)
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    activo: Optional[bool] = None
    is_active: Optional[bool] = None

class PeriodoAcademicoRead(PeriodoAcademicoBase):
    id: int
    is_active: bool
    model_config = {"from_attributes": True}