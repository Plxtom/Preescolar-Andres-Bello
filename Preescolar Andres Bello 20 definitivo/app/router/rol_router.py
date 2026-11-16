from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from typing import List

from app.models.models import RolModel
from app.schemas.esq_roles import RolesCreate, RolesResponsive, RolesUpdate
from app.config.database import get_session
from app.dependencias.auth_deps import requerir_rol

router = APIRouter(prefix="/api/roles", tags=["Roles"])

@router.post("/", response_model=RolesResponsive)
def crear_rol(
    rol_in: RolesCreate, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1])) # Exclusivo para Administradores
):
    existente = session.exec(select(RolModel).where(RolModel.nombre == rol_in.nombre)).first()
    if existente:
        raise HTTPException(status_code=400, detail="El rol ya existe")
    
    db_rol = RolModel.model_validate(rol_in)
    session.add(db_rol)
    session.commit()
    session.refresh(db_rol)
    return db_rol

@router.get("/", response_model=List[RolesResponsive])
def listar_roles(
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1]))
):
    statement = select(RolModel).where(RolModel.is_active == True)
    return session.exec(statement).all()

@router.get("/{id}", response_model=RolesResponsive)
def obtener_rol(
    id: int, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1]))
):
    rol = session.get(RolModel, id)
    if not rol or not rol.is_active:
        raise HTTPException(status_code=404, detail="El rol no existe o está inactivo")
    return rol

@router.patch("/{id}", response_model=RolesResponsive)
def actualizar_rol_parcial(
    id: int, 
    rol_in: RolesUpdate, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1]))
):
    db_rol = session.get(RolModel, id)
    if not db_rol or not db_rol.is_active:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    
    for llave, valor in rol_in.model_dump(exclude_unset=True).items():
        setattr(db_rol, llave, valor)
        
    session.add(db_rol)
    session.commit()
    session.refresh(db_rol)
    return db_rol

@router.put("/{id}", response_model=RolesResponsive)
def reemplazar_rol(
    id: int, 
    rol_in: RolesCreate, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1]))
):
    db_rol = session.get(RolModel, id)
    if not db_rol or not db_rol.is_active:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    
    for llave, valor in rol_in.model_dump().items():
        setattr(db_rol, llave, valor)
        
    session.add(db_rol)
    session.commit()
    session.refresh(db_rol)
    return db_rol

@router.delete("/{id}")
def eliminar_rol(
    id: int, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1]))
):
    db_rol = session.get(RolModel, id)
    if not db_rol or not db_rol.is_active:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
        
    db_rol.is_active = False
    session.add(db_rol)
    session.commit()
    return {"message": "Rol dado de baja correctamente"}