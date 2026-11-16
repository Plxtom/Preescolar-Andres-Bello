from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from typing import List

from app.models.models import SeccionModel
from app.schemas.esq_secciones import SeccionCreate, SeccionRead, SeccionUpdate
from app.config.database import get_session
from app.dependencias.auth_deps import requerir_rol, obtener_usuario_actual

router = APIRouter(prefix="/api/secciones", tags=["Secciones"])

@router.post("/", response_model=SeccionRead)
def crear_seccion(
    seccion_in: SeccionCreate, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2])) # Admin y Directora
):
    db_seccion = SeccionModel.model_validate(seccion_in)
    session.add(db_seccion)
    session.commit()
    session.refresh(db_seccion)
    return db_seccion

@router.get("/", response_model=List[SeccionRead])
def listar_secciones(
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2, 3])) # Todos los roles
):
    statement = select(SeccionModel).where(SeccionModel.is_active == True)
    return session.exec(statement).all()

@router.get("/{id}", response_model=SeccionRead)
def obtener_seccion(
    id: int, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2, 3]))
):
    seccion = session.get(SeccionModel, id)
    if not seccion or not seccion.is_active:
        raise HTTPException(status_code=404, detail="Sección no encontrada")
    return seccion

@router.get("/{id}/detalle", response_model=SeccionRead)
def obtener_seccion_con_relaciones(
    id: int, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2, 3]))
):
    statement = (
        select(SeccionModel)
        .where(SeccionModel.id == id, SeccionModel.is_active == True)
        .options(selectinload(SeccionModel.matriculas))
    )
    seccion = session.exec(statement).first()
    if not seccion:
        raise HTTPException(status_code=404, detail="Sección no encontrada")
    return seccion

@router.patch("/{id}", response_model=SeccionRead)
def actualizar_seccion_parcial(
    id: int, 
    seccion_in: SeccionUpdate, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2])) # Admin y Directora
):
    db_seccion = session.get(SeccionModel, id)
    if not db_seccion or not db_seccion.is_active:
        raise HTTPException(status_code=404, detail="Sección no encontrada")
        
    for llave, valor in seccion_in.model_dump(exclude_unset=True).items():
        setattr(db_seccion, llave, valor)
        
    session.add(db_seccion)
    session.commit()
    session.refresh(db_seccion)
    return db_seccion

@router.delete("/{id}")
def eliminar_seccion(
    id: int, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1])) # Exclusivo Administrador
):
    db_seccion = session.get(SeccionModel, id)
    if not db_seccion or not db_seccion.is_active:
        raise HTTPException(status_code=404, detail="Sección no encontrada")
        
    db_seccion.is_active = False
    session.add(db_seccion)
    session.commit()
    return {"message": "Sección dada de baja correctamente"}