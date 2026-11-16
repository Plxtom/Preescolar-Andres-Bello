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
from app.models.models import RolModel
from app.schemas.esq_roles import RolesCreate, RolesUpdate

def crear_rol(session: Session, rol_in: RolesCreate) -> RolModel:
    return crear_registro(db=session, modelo=RolModel, datos_in=rol_in)

def listar_roles(session: Session) -> List[RolModel]:
    return obtener_todos_activos(db=session, modelo=RolModel)

def obtener_rol_por_id(session: Session, id: int) -> Optional[RolModel]:
    return obtener_por_id(db=session, modelo=RolModel, id=id)

def obtener_rol_con_usuarios(session: Session, id: int) -> Optional[RolModel]:
    statement = (
        select(RolModel)
        .where(RolModel.id == id, RolModel.is_active == True)
        .options(selectinload(RolModel.usuarios))
    )
    return session.exec(statement).first()

def actualizar_rol(session: Session, db_rol: RolModel, datos: RolesUpdate) -> RolModel:
    return actualizar_registro(db=session, db_obj=db_rol, datos_in=datos, parcial=True)

def eliminar_rol(session: Session, db_rol: RolModel) -> None:
    eliminar_logico(db=session, db_obj=db_rol)