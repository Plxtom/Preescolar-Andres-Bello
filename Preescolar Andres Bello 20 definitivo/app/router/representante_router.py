from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from typing import List

from app.models.models import RepresentanteModel
from app.schemas.esq_representantes import RepresentanteCreate, RepresentanteRead, RepresentanteUpdate, RepresentanteReplace
from app.config.database import get_session
from app.dependencias.auth_deps import requerir_rol, obtener_usuario_actual

router = APIRouter(prefix="/api/representantes", tags=["Representantes"])

@router.post("/", response_model=RepresentanteRead)
def crear_representante(
    representante_in: RepresentanteCreate, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2, 3])) # Administradores, Directora y Secretaria pueden crear representantes
):
    # Validar si ya existe un representante con la misma cédula
    existente = session.exec(select(RepresentanteModel).where(RepresentanteModel.cedula == representante_in.cedula)).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe un representante registrado con esta cédula")
    
    db_representante = RepresentanteModel.model_validate(representante_in)
    session.add(db_representante)
    session.commit()
    session.refresh(db_representante)
    return db_representante

@router.get("/", response_model=List[RepresentanteRead])
def listar_representantes(
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2, 3])) # Roles autenticados pueden ver la lista
):
    statement = select(RepresentanteModel).where(RepresentanteModel.is_active == True)
    return session.exec(statement).all()

@router.get("/{id}", response_model=RepresentanteRead)
def obtener_representante(
    id: int, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2, 3]))
):
    representante = session.get(RepresentanteModel, id)
    if not representante or not representante.is_active:
        raise HTTPException(status_code=404, detail="Representante no encontrado")
    return representante

@router.get("/{id}/detalle", response_model=RepresentanteRead)
def obtener_representante_con_estudiantes(
    id: int, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2, 3]))
):
    statement = (
        select(RepresentanteModel)
        .where(RepresentanteModel.id == id, RepresentanteModel.is_active == True)
        .options(
            selectinload(RepresentanteModel.estudiantes)
        )
    )
    representante = session.exec(statement).first()
    if not representante:
        raise HTTPException(status_code=404, detail="Representante no encontrado o inactivo")
    return representante

@router.patch("/{id}", response_model=RepresentanteRead)
def actualizar_representante_parcial(
    id: int, 
    representante_in: RepresentanteUpdate, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1])) # Exclusivo para Administradores
):
    db_representante = session.get(RepresentanteModel, id)
    if not db_representante or not db_representante.is_active:
        raise HTTPException(status_code=404, detail="Representante no encontrado")
    
    for llave, valor in representante_in.model_dump(exclude_unset=True).items():
        setattr(db_representante, llave, valor)
        
    session.add(db_representante)
    session.commit()
    session.refresh(db_representante)
    return db_representante

@router.put("/{id}", response_model=RepresentanteRead)
def reemplazar_representante(
    id: int, 
    representante_in: RepresentanteReplace, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1])) # Exclusivo para Administradores
):
    db_representante = session.get(RepresentanteModel, id)
    if not db_representante or not db_representante.is_active:
        raise HTTPException(status_code=404, detail="Representante no encontrado")
    
    for llave, valor in representante_in.model_dump().items():
        setattr(db_representante, llave, valor)
        
    session.add(db_representante)
    session.commit()
    session.refresh(db_representante)
    return db_representante

@router.delete("/{id}")
def eliminar_representante(
    id: int, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1])) # Exclusivo para Administradores
):
    db_representante = session.get(RepresentanteModel, id)
    if not db_representante or not db_representante.is_active:
        raise HTTPException(status_code=404, detail="Representante no encontrado")
            
    db_representante.is_active = False
    session.add(db_representante)
    session.commit()
    return {"message": "Representante dado de baja correctamente"}