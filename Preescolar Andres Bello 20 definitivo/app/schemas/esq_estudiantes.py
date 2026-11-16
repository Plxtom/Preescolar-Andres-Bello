from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import date

# Restricciones estrictas para los valores permitidos
GeneroEstudiante = Literal["M", "F"]

# Esquema base con campos comunes para evitar duplicación de código
class EstudianteBase(BaseModel):
    nombres: str = Field(..., min_length=2, max_length=100, description="Nombres del estudiante")
    apellidos: str = Field(..., min_length=2, max_length=100, description="Apellidos del estudiante")
    cedula_escolar: Optional[str] = Field(None, max_length=30, description="Cédula escolar o número de identificación único")
    fecha_nacimiento: date = Field(..., description="Fecha de nacimiento del estudiante")
    genero: GeneroEstudiante = Field(..., description="Género ('M' para Masculino, 'F' para Femenino)")
    lugar_nacimiento: Optional[str] = Field(None, max_length=100, description="Lugar o ciudad de nacimiento")
    alergias_condiciones_medicas: Optional[str] = Field(None, description="Detalle de alergias o condiciones de salud")
    observaciones: Optional[str] = Field(None, description="Notas adicionales relativas al estudiante")

# Esquema utilizado para la creación de un nuevo estudiante (hereda de Base)
class EstudianteCreate(EstudianteBase):
    pass

# Esquema para reemplazos totales (PUT) donde ciertos campos pasan a ser obligatorios
class EstudianteReplace(EstudianteBase):
    cedula_escolar: str
    lugar_nacimiento: str

# Esquema para actualizaciones parciales (PATCH) donde todos los campos son opcionales
class EstudianteUpdate(BaseModel):
    nombres: Optional[str] = Field(None, min_length=2, max_length=100)
    apellidos: Optional[str] = Field(None, min_length=2, max_length=100)
    cedula_escolar: Optional[str] = Field(None, max_length=30)
    fecha_nacimiento: Optional[date] = None
    genero: Optional[GeneroEstudiante] = None
    lugar_nacimiento: Optional[str] = Field(None, max_length=100)
    alergias_condiciones_medicas: Optional[str] = None
    observaciones: Optional[str] = None
    is_active: Optional[bool] = None

# Esquema para lo que la API devuelve al cliente (incluye ID y configuración Pydantic V2)
class EstudianteRead(EstudianteBase):
    id: int
    is_active: bool
    
    # Configuración de Pydantic V2 para lectura directa desde objetos SQLModel
    model_config = {"from_attributes": True}