from pydantic import BaseModel, Field
from typing import Optional

class BaseRoles(BaseModel):
    nombre: Optional[str] = Field(None, max_length=50, min_length=1, description="Nombre del rol (ej. Director, Secretario, Admin)")
    descripcion: Optional[str] = Field(None, description="Descripción opcional de las funciones del rol")

class RolesCreate(BaseRoles):
    nombre: str = Field(..., max_length=50, min_length=1, description="El nombre es obligatorio al crear")

class RolesResponsive(BaseRoles):
    id: int
    nombre: str
    is_active: bool
    model_config = {"from_attributes": True}

class RolesUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=50, min_length=1)
    descripcion: Optional[str] = None
    is_active: Optional[bool] = None