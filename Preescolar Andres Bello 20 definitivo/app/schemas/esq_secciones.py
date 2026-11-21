from pydantic import BaseModel, Field
from typing import Optional


class SeccionCreate(BaseModel):
    periodo_id: int
    grado_id: int
    nombre_seccion: str = Field(..., min_length=1, max_length=20)
    capacidad_maxima: int = Field(default=20, ge=1, le=50)
    docente_encargado: Optional[str] = Field(default=None, max_length=150)


class SeccionUpdate(BaseModel):
    periodo_id: Optional[int] = None
    grado_id: Optional[int] = None
    nombre_seccion: Optional[str] = Field(None, min_length=1, max_length=20)
    capacidad_maxima: Optional[int] = Field(None, ge=1, le=50)
    docente_encargado: Optional[str] = Field(None, max_length=150)


class SeccionResponse(BaseModel):
    id: int
    periodo_id: int
    grado_id: int
    nombre_seccion: str
    capacidad_maxima: int
    docente_encargado: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}



SeccionRead = SeccionResponse