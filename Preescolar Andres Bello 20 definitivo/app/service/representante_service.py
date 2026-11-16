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
from app.models.models import RepresentanteModel
from app.schemas.esq_representantes import RepresentanteCreate, RepresentanteUpdate, RepresentanteReplace

# --- SERVICIOS CRUD ---
def crear_representante(session: Session, representante_in: RepresentanteCreate) -> RepresentanteModel:
    return crear_registro(db=session, modelo=RepresentanteModel, datos_in=representante_in)

def listar_representantes(session: Session) -> List[RepresentanteModel]:
    return obtener_todos_activos(db=session, modelo=RepresentanteModel)

def obtener_representante_por_id(session: Session, id: int) -> Optional[RepresentanteModel]:
    return obtener_por_id(db=session, modelo=RepresentanteModel, id=id)

def obtener_representante_con_estudiantes(session: Session, id: int) -> Optional[RepresentanteModel]:
    """Carga el representante junto con la lista de estudiantes a su cargo."""
    statement = (
        select(RepresentanteModel)
        .where(RepresentanteModel.id == id, RepresentanteModel.is_active == True)
        .options(selectinload(RepresentanteModel.estudiantes))
    )
    return session.exec(statement).first()

def actualizar_representante(session: Session, db_representante: RepresentanteModel, datos: RepresentanteUpdate) -> RepresentanteModel:
    return actualizar_registro(db=session, db_obj=db_representante, datos_in=datos, parcial=True)

def reemplazar_representante(session: Session, db_representante: RepresentanteModel, datos: RepresentanteReplace) -> RepresentanteModel:
    return actualizar_registro(db=session, db_obj=db_representante, datos_in=datos, parcial=False)

def eliminar_representante(session: Session, db_representante: RepresentanteModel) -> None:
    eliminar_logico(db=session, db_obj=db_representante)