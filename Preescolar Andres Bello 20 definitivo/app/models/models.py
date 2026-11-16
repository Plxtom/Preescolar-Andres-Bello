from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Text
from datetime import date, datetime, timezone
from typing import List, Optional

# --- MODELO DE ROLES ---
class RolModel(SQLModel, table=True):
    __tablename__ = "roles"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(nullable=False, sa_column_kwargs={"unique": True}, max_length=50)
    descripcion: Optional[str] = Field(default=None, sa_type=Text)
    is_active: bool = Field(default=True, nullable=False)
    
    # Relación uno a muchos con usuarios
    usuarios: List["UsuarioSistemaModel"] = Relationship(back_populates="rol")


# --- MODELO DE USUARIOS DEL SISTEMA ---
class UsuarioSistemaModel(SQLModel, table=True):
    __tablename__ = "usuarios_sistema" 

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre_completo: str = Field(nullable=False, max_length=150)
    email: str = Field(nullable=False, sa_column_kwargs={"unique": True}, max_length=100)
    password_hash: str = Field(nullable=False, max_length=255)
    rol_id: int = Field(foreign_key="roles.id", nullable=False)
    is_active: bool = Field(default=True, nullable=False)
    
    # Relación con la tabla Rol
    rol: Optional[RolModel] = Relationship(back_populates="usuarios")
    # Relación con matrículas registradas por este usuario
    matriculas_registradas: List["MatriculaModel"] = Relationship(back_populates="usuario_registrador")
    # Relación con auditorías
    auditorias: List["AuditoriaLogModel"] = Relationship(back_populates="usuario")


# --- MODELO DE REPRESENTANTES ---
class RepresentanteModel(SQLModel, table=True):
    __tablename__ = "representantes"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombres: str = Field(nullable=False, max_length=100)
    apellidos: str = Field(nullable=False, max_length=100)
    cedula: str = Field(nullable=False, sa_column_kwargs={"unique": True}, max_length=20)
    telefono: str = Field(nullable=False, max_length=20)
    email: Optional[str] = Field(default=None, max_length=100)
    direccion: str = Field(nullable=False, sa_type=Text)
    lugar_trabajo: Optional[str] = Field(default=None, max_length=150)
    telefono_trabajo: Optional[str] = Field(default=None, max_length=20)
    is_active: bool = Field(default=True, nullable=False)

    # Relación muchos a muchos con estudiantes a través de la tabla puente
    estudiantes_relacion: List["EstudianteRepresentanteModel"] = Relationship(back_populates="representante")


# --- MODELO DE ESTUDIANTES ---
class EstudianteModel(SQLModel, table=True):
    __tablename__ = "estudiantes"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombres: str = Field(nullable=False, max_length=100)
    apellidos: str = Field(nullable=False, max_length=100)
    cedula_escolar: Optional[str] = Field(default=None, sa_column_kwargs={"unique": True}, max_length=30)
    fecha_nacimiento: date = Field(nullable=False)
    genero: Optional[str] = Field(default=None, max_length=1)
    lugar_nacimiento: Optional[str] = Field(default=None, max_length=100)
    alergias_condiciones_medicas: Optional[str] = Field(default=None, sa_type=Text)
    observaciones: Optional[str] = Field(default=None, sa_type=Text)
    is_active: bool = Field(default=True, nullable=False)

    # Relaciones
    representantes_relacion: List["EstudianteRepresentanteModel"] = Relationship(back_populates="estudiante")
    matriculas: List["MatriculaModel"] = Relationship(back_populates="estudiante")


# --- TABLA PUENTE: ESTUDIANTE - REPRESENTANTE ---
class EstudianteRepresentanteModel(SQLModel, table=True):
    __tablename__ = "estudiante_representante"

    id: Optional[int] = Field(default=None, primary_key=True)
    estudiante_id: int = Field(foreign_key="estudiantes.id", nullable=False, ondelete="CASCADE")
    representante_id: int = Field(foreign_key="representantes.id", nullable=False, ondelete="RESTRICT")
    parentesco: str = Field(nullable=False, max_length=50)
    es_representante_legal: bool = Field(default=False, nullable=False)
    autorizado_retirar: bool = Field(default=True, nullable=False)

    # Relaciones de la tabla puente
    estudiante: Optional[EstudianteModel] = Relationship(back_populates="representantes_relacion")
    representante: Optional[RepresentanteModel] = Relationship(back_populates="estudiantes_relacion")


# --- MODELO DE PERIODOS ACADÉMICOS ---
class PeriodoAcademicoModel(SQLModel, table=True):
    __tablename__ = "periodos_academicos"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(nullable=False, max_length=50)
    fecha_inicio: date = Field(nullable=False)
    fecha_fin: date = Field(nullable=False)
    activo: bool = Field(default=False, nullable=False)
    is_active: bool = Field(default=True, nullable=False)

    secciones: List["SeccionModel"] = Relationship(back_populates="periodo")
    matriculas: List["MatriculaModel"] = Relationship(back_populates="periodo")


# --- MODELO DE NIVELES / GRADOS ---
class NivelGradoModel(SQLModel, table=True):
    __tablename__ = "niveles_grados"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(nullable=False, max_length=50)
    edad_minima_meses: Optional[int] = Field(default=None)
    descripcion: Optional[str] = Field(default=None, sa_type=Text)
    is_active: bool = Field(default=True, nullable=False)

    secciones: List["SeccionModel"] = Relationship(back_populates="grado")


# --- MODELO DE SECCIONES ---
class SeccionModel(SQLModel, table=True):
    __tablename__ = "secciones"

    id: Optional[int] = Field(default=None, primary_key=True)
    periodo_id: int = Field(foreign_key="periodos_academicos.id", nullable=False, ondelete="CASCADE")
    grado_id: int = Field(foreign_key="niveles_grados.id", nullable=False, ondelete="RESTRICT")
    nombre_seccion: str = Field(nullable=False, max_length=20)
    capacidad_maxima: int = Field(default=20, nullable=False)
    docente_encargado: Optional[str] = Field(default=None, max_length=150)
    is_active: bool = Field(default=True, nullable=False)

    periodo: Optional[PeriodoAcademicoModel] = Relationship(back_populates="secciones")
    grado: Optional[NivelGradoModel] = Relationship(back_populates="secciones")
    matriculas: List["MatriculaModel"] = Relationship(back_populates="seccion")


# --- MODELO DE MATRÍCULAS ---
class MatriculaModel(SQLModel, table=True):
    __tablename__ = "matriculas"

    id: Optional[int] = Field(default=None, primary_key=True)
    estudiante_id: int = Field(foreign_key="estudiantes.id", nullable=False, ondelete="RESTRICT")
    periodo_id: int = Field(foreign_key="periodos_academicos.id", nullable=False, ondelete="RESTRICT")
    seccion_id: int = Field(foreign_key="secciones.id", nullable=False, ondelete="RESTRICT")
    registrado_por_usuario_id: Optional[int] = Field(default=None, foreign_key="usuarios_sistema.id", nullable=True, ondelete="RESTRICT")
    fecha_matricula: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    estatus: str = Field(default="ACTIVO", nullable=False, max_length=30)
    observaciones_inscripcion: Optional[str] = Field(default=None, sa_type=Text)
    is_active: bool = Field(default=True, nullable=False)

    estudiante: Optional[EstudianteModel] = Relationship(back_populates="matriculas")
    periodo: Optional[PeriodoAcademicoModel] = Relationship(back_populates="matriculas")
    seccion: Optional[SeccionModel] = Relationship(back_populates="matriculas")
    usuario_registrador: Optional[UsuarioSistemaModel] = Relationship(back_populates="matriculas_registradas")


# --- MODELO DE AUDITORÍA ---
class AuditoriaLogModel(SQLModel, table=True):
    __tablename__ = "auditoria_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: Optional[int] = Field(default=None, foreign_key="usuarios_sistema.id", ondelete="SET NULL")
    accion: str = Field(nullable=False, max_length=50)
    tabla_afectada: str = Field(nullable=False, max_length=50)
    registro_id: int = Field(nullable=False)
    detalles: Optional[str] = Field(default=None, sa_type=Text)
    fecha_hora: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    usuario: Optional[UsuarioSistemaModel] = Relationship(back_populates="auditorias")