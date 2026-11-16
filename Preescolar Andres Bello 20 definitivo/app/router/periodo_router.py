from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from typing import List

from app.models.models import PeriodoAcademicoModel
from app.schemas.esq_periodos import PeriodoAcademicoCreate, PeriodoAcademicoRead, PeriodoAcademicoUpdate
from app.config.database import get_session
from app.dependencias.auth_deps import requerir_rol, obtener_usuario_actual

router = APIRouter(prefix="/api/periodos", tags=["Periodos Académicos"])

@router.post("/", response_model=PeriodoAcademicoRead)
def crear_periodo(
    periodo_in: PeriodoAcademicoCreate, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2])) # Administradores y Directora pueden crear periodos
):
    db_periodo = PeriodoAcademicoModel.model_validate(periodo_in)
    session.add(db_periodo)
    session.commit()
    session.refresh(db_periodo)
    return db_periodo

@router.get("/", response_model=List[PeriodoAcademicoRead])
def listar_periodos(
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2, 3])) # Todos los roles pueden listar
):
    statement = select(PeriodoAcademicoModel).where(PeriodoAcademicoModel.is_active == True)
    return session.exec(statement).all()

@router.get("/{id}", response_model=PeriodoAcademicoRead)
def obtener_periodo(
    id: int, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2, 3]))
):
    periodo = session.get(PeriodoAcademicoModel, id)
    if not periodo or not periodo.is_active:
        raise HTTPException(status_code=404, detail="Periodo académico no encontrado")
    return periodo

@router.get("/{id}/detalle", response_model=PeriodoAcademicoRead)
def obtener_periodo_con_relaciones(
    id: int, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2, 3]))
):
    statement = (
        select(PeriodoAcademicoModel)
        .where(PeriodoAcademicoModel.id == id, PeriodoAcademicoModel.is_active == True)
        .options(selectinload(PeriodoAcademicoModel.matriculas))
    )
    periodo = session.exec(statement).first()
    if not periodo:
        raise HTTPException(status_code=404, detail="Periodo académico no encontrado")
    return periodo

@router.patch("/{id}", response_model=PeriodoAcademicoRead)
def actualizar_periodo_parcial(
    id: int, 
    periodo_in: PeriodoAcademicoUpdate, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2])) # Admin y Directora
):
    db_periodo = session.get(PeriodoAcademicoModel, id)
    if not db_periodo or not db_periodo.is_active:
        raise HTTPException(status_code=404, detail="Periodo académico no encontrado")
        
    for llave, valor in periodo_in.model_dump(exclude_unset=True).items():
        setattr(db_periodo, llave, valor)
        
    session.add(db_periodo)
    session.commit()
    session.refresh(db_periodo)
    return db_periodo

@router.delete("/{id}")
def eliminar_periodo(
    id: int, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1])) # Exclusivo Administrador
):
    db_periodo = session.get(PeriodoAcademicoModel, id)
    if not db_periodo or not db_periodo.is_active:
        raise HTTPException(status_code=404, detail="Periodo académico no encontrado")
        
    db_periodo.is_active = False
    session.add(db_periodo)
    session.commit()
    return {"message": "Periodo académico dado de baja correctamente"}