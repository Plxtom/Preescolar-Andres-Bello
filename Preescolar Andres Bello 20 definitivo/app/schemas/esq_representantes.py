from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List

class RepresentanteBase(BaseModel):
    nombres: str = Field(..., min_length=2, max_length=100)
    apellidos: str = Field(..., min_length=2, max_length=100)
    cedula: str = Field(..., min_length=5, max_length=20)
    telefono: str = Field(..., min_length=7, max_length=20)
    email: EmailStr | None = None
    direccion: str = Field(..., min_length=5)
    lugar_trabajo: str | None = Field(default=None, max_length=150)
    telefono_trabajo: str | None = Field(default=None, max_length=20)

class RepresentanteCreate(RepresentanteBase):
    pass

class RepresentanteReplace(RepresentanteBase):
    pass

class RepresentanteUpdate(BaseModel):
    nombres: str | None = Field(default=None, min_length=2, max_length=100)
    apellidos: str | None = Field(default=None, min_length=2, max_length=100)
    cedula: str | None = Field(default=None, min_length=5, max_length=20)
    telefono: str | None = Field(default=None, min_length=7, max_length=20)
    email: EmailStr | None = None
    direccion: str | None = Field(default=None, min_length=5)
    lugar_trabajo: str | None = Field(default=None, max_length=150)
    telefono_trabajo: str | None = Field(default=None, max_length=20)
    is_active: bool | None = None

class RepresentanteRead(RepresentanteBase):
    id: int
    is_active: bool
    model_config = {"from_attributes": True}