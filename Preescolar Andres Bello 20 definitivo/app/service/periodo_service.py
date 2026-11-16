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
from app.models.models import PeriodoAcademicoModel
from app.schemas.esq_periodos import PeriodoAcademicoCreate, PeriodoAcademicoUpdate, PeriodoAcademicoReplace

def crear_periodo(session: Session, periodo_in: PeriodoAcademicoCreate) -> PeriodoAcademicoModel:
    return crear_registro(db=session, modelo=PeriodoAcademicoModel, datos_in=periodo_in)

def listar_periodos(session: Session) -> List[PeriodoAcademicoModel]:
    return obtener_todos_activos(db=session, modelo=PeriodoAcademicoModel)

def obtener_periodo_por_id(session: Session, id: int) -> Optional[PeriodoAcademicoModel]:
    return obtener_por_id(db=session, modelo=PeriodoAcademicoModel, id=id)

def obtener_periodo_con_relaciones(session: Session, id: int) -> Optional[PeriodoAcademicoModel]:
    statement = (
        select(PeriodoAcademicoModel)
        .where(PeriodoAcademicoModel.id == id, PeriodoAcademicoModel.is_active == True)
        .options(selectinload(PeriodoAcademicoModel.matriculas))
    )
    return session.exec(statement).first()

def actualizar_periodo(session: Session, db_periodo: PeriodoAcademicoModel, datos: PeriodoAcademicoUpdate) -> PeriodoAcademicoModel:
    return actualizar_registro(db=session, db_obj=db_periodo, datos_in=datos, parcial=True)

def reemplazar_periodo(session: Session, db_periodo: PeriodoAcademicoModel, datos: PeriodoAcademicoReplace) -> PeriodoAcademicoModel:
    return actualizar_registro(db=session, db_obj=db_periodo, datos_in=datos, parcial=False)

def eliminar_periodo(session: Session, db_periodo: PeriodoAcademicoModel) -> None:
    eliminar_logico(db=session, db_obj=db_periodo)