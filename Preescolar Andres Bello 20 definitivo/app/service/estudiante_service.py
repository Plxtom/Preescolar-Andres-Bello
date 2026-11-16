from typing import List, Optional
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload

from app.service.base_service import (
    crear_registro, 
    obtener_por_id, 
    obtener_todos_activos, 
    actualizar_registro, 
    eliminar_logico
)
from app.models.models import EstudianteModel
from app.schemas.esq_estudiantes import EstudianteCreate, EstudianteUpdate, EstudianteReplace

def crear_estudiante(session: Session, estudiante_in: EstudianteCreate) -> EstudianteModel:
    return crear_registro(db=session, modelo=EstudianteModel, datos_in=estudiante_in)

def listar_estudiantes(session: Session) -> List[EstudianteModel]:
    return obtener_todos_activos(db=session, modelo=EstudianteModel)

def obtener_estudiante_por_id(session: Session, id: int) -> Optional[EstudianteModel]:
    return obtener_por_id(db=session, modelo=EstudianteModel, id=id)

def obtener_estudiante_con_relaciones(session: Session, id: int) -> Optional[EstudianteModel]:
    """Carga el estudiante junto con su representante y sus matrículas."""
    statement = (
        select(EstudianteModel)
        .where(EstudianteModel.id == id, EstudianteModel.is_active == True)
        .options(
            selectinload(EstudianteModel.representante), 
            selectinload(EstudianteModel.matriculas)
        )
    )
    return session.exec(statement).first()

def actualizar_estudiante(session: Session, db_estudiante: EstudianteModel, datos: EstudianteUpdate) -> EstudianteModel:
    return actualizar_registro(db=session, db_obj=db_estudiante, datos_in=datos, parcial=True)

def reemplazar_estudiante(session: Session, db_estudiante: EstudianteModel, datos: EstudianteReplace) -> EstudianteModel:
    return actualizar_registro(db=session, db_obj=db_estudiante, datos_in=datos, parcial=False)

def eliminar_estudiante(session: Session, db_estudiante: EstudianteModel) -> None:
    eliminar_logico(db=session, db_obj=db_estudiante)