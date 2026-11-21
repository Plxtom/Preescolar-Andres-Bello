from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserCreate(BaseModel):
    nombre_completo: str = Field(..., min_length=2, max_length=150, description="Nombre completo del usuario del sistema")
    email: EmailStr = Field(..., max_length=100, min_length=5, description="Correo electrónico institucional")
    password: str = Field(..., min_length=8, max_length=255, description="Contraseña de acceso")
    rol_id: int = Field(..., description="ID del rol asignado (ej. Director, Secretario, Admin)")

class UserLogin(BaseModel):
    correo: EmailStr = Field(..., max_length=100, min_length=5)
    password: str = Field(..., min_length=8, max_length=255)

class UserUpdate(BaseModel):
    nombre_completo: Optional[str] = Field(None, min_length=2, max_length=150)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(default=None, max_length=255)  # ✅ Sin min_length para permitir vacío
    rol_id: Optional[int] = None
    is_active: Optional[bool] = None

class UserResponse(BaseModel):
    id: int
    nombre_completo: str 
    email: EmailStr
    rol_id: int
    is_active: bool
    
    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    correo: Optional[str] = None
    rol: Optional[str] = None