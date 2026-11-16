from pydantic import BaseModel, Field
from typing import Literal, Optional

class SeccionBase(BaseModel):
    periodo_id: int = Field(..., description="ID del periodo académico")
    grado_id: int = Field(..., description="ID del nivel o grado del preescolar")
    nombre_seccion: str = Field(..., min_length=1, max_length=20, description="Ej: Sección A, Sección B")
    capacidad_maxima: int = Field(default=20, ge=1, description="Capacidad máxima de niños en el aula")
    docente_encargado: Optional[str] = Field(None, max_length=150, description="Nombre del docente asignado")

class SeccionCreate(SeccionBase):
    pass

class SeccionReplace(SeccionBase):
    docente_encargado: str

class SeccionUpdate(BaseModel):
    periodo_id: Optional[int] = None
    grado_id: Optional[int] = None
    nombre_seccion: Optional[str] = Field(None, min_length=1, max_length=20)
    capacidad_maxima: Optional[int] = Field(None, ge=1)
    docente_encargado: Optional[str] = Field(None, max_length=150)
    is_active: Optional[bool] = None

class SeccionRead(SeccionBase):
    id: int
    is_active: bool
    model_config = {"from_attributes": True}