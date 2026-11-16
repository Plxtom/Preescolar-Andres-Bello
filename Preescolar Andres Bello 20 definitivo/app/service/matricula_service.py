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
from app.models.models import MatriculaModel
from app.schemas.esq_matriculas import MatriculaCreate, MatriculaUpdate, MatriculaReplace

def crear_matricula(session: Session, matricula_in: MatriculaCreate) -> MatriculaModel:
    return crear_registro(db=session, modelo=MatriculaModel, datos_in=matricula_in)

def listar_matriculas(session: Session) -> List[MatriculaModel]:
    return obtener_todos_activos(db=session, modelo=MatriculaModel)

def obtener_matricula_por_id(session: Session, id: int) -> Optional[MatriculaModel]:
    return obtener_por_id(db=session, modelo=MatriculaModel, id=id)

def obtener_matricula_con_relaciones(session: Session, id: int) -> Optional[MatriculaModel]:
    """Carga la matrícula junto con su estudiante, sección y periodo académico."""
    statement = (
        select(MatriculaModel)
        .where(MatriculaModel.id == id, MatriculaModel.is_active == True)
        .options(
            selectinload(MatriculaModel.estudiante), 
            selectinload(MatriculaModel.seccion), 
            selectinload(MatriculaModel.periodo)
        )
    )
    return session.exec(statement).first()

def actualizar_matricula(session: Session, db_matricula: MatriculaModel, datos: MatriculaUpdate) -> MatriculaModel:
    return actualizar_registro(db=session, db_obj=db_matricula, datos_in=datos, parcial=True)

def reemplazar_matricula(session: Session, db_matricula: MatriculaModel, datos: MatriculaReplace) -> MatriculaModel:
    return actualizar_registro(db=session, db_obj=db_matricula, datos_in=datos, parcial=False)

def eliminar_matricula(session: Session, db_matricula: MatriculaModel) -> None:
    eliminar_logico(db=session, db_obj=db_matricula)