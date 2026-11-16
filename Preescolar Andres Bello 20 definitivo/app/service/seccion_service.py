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
from app.models.models import SeccionModel
from app.schemas.esq_secciones import SeccionCreate, SeccionUpdate, SeccionReplace

def crear_seccion(session: Session, seccion_in: SeccionCreate) -> SeccionModel:
    return crear_registro(db=session, modelo=SeccionModel, datos_in=seccion_in)

def listar_secciones(session: Session) -> List[SeccionModel]:
    return obtener_todos_activos(db=session, modelo=SeccionModel)

def obtener_seccion_por_id(session: Session, id: int) -> Optional[SeccionModel]:
    return obtener_por_id(db=session, modelo=SeccionModel, id=id)

def obtener_seccion_con_relaciones(session: Session, id: int) -> Optional[SeccionModel]:
    statement = (
        select(SeccionModel)
        .where(SeccionModel.id == id, SeccionModel.is_active == True)
        .options(selectinload(SeccionModel.matriculas))
    )
    return session.exec(statement).first()

def actualizar_seccion(session: Session, db_seccion: SeccionModel, datos: SeccionUpdate) -> SeccionModel:
    return actualizar_registro(db=session, db_obj=db_seccion, datos_in=datos, parcial=True)

def reemplazar_seccion(session: Session, db_seccion: SeccionModel, datos: SeccionReplace) -> SeccionModel:
    return actualizar_registro(db=session, db_obj=db_seccion, datos_in=datos, parcial=False)

def eliminar_seccion(session: Session, db_seccion: SeccionModel) -> None:
    eliminar_logico(db=session, db_obj=db_seccion)