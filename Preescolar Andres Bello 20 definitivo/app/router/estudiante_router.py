from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from typing import List

from app.models.models import EstudianteModel
from app.schemas.esq_estudiantes import EstudianteCreate, EstudianteRead, EstudianteUpdate
from app.config.database import get_session
from app.dependencias.auth_deps import requerir_rol, obtener_usuario_actual

router = APIRouter(prefix="/api/estudiantes", tags=["Estudiantes"])

@router.post("/", response_model=EstudianteRead)
def crear_estudiante(
    estudiante_in: EstudianteCreate, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2, 3])) # Administradores, Directora y Secretaria pueden crear estudiantes
):
    if estudiante_in.cedula_escolar:
        existente = session.exec(select(EstudianteModel).where(EstudianteModel.cedula_escolar == estudiante_in.cedula_escolar)).first()
        if existente:
            raise HTTPException(status_code=400, detail="La cédula escolar ya está registrada en el sistema")
        
    db_estudiante = EstudianteModel.model_validate(estudiante_in)
    session.add(db_estudiante)
    session.commit()
    session.refresh(db_estudiante)
    return db_estudiante

@router.get("/", response_model=List[EstudianteRead])
def listar_estudiantes(
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2, 3])) # Listado accesible para roles autorizados
):
    statement = select(EstudianteModel).where(EstudianteModel.is_active == True)
    return session.exec(statement).all()

@router.get("/{id}", response_model=EstudianteRead)
def obtener_estudiante(
    id: int, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2, 3]))
):
    estudiante = session.get(EstudianteModel, id)
    if not estudiante or not estudiante.is_active:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    return estudiante

@router.get("/{id}/detalle", response_model=EstudianteRead)
def obtener_estudiante_con_relaciones(
    id: int, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2]))
):
    statement = (
        select(EstudianteModel)
        .where(EstudianteModel.id == id, EstudianteModel.is_active == True)
        .options(
            selectinload(EstudianteModel.representante),
            selectinload(EstudianteModel.matriculas)
        )
    )
    estudiante = session.exec(statement).first()
    if not estudiante:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado o inactivo")
    return estudiante

@router.patch("/{id}", response_model=EstudianteRead)
def actualizar_estudiante_parcial(
    id: int, 
    estudiante_in: EstudianteUpdate, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1])) # Exclusivo para Administradores
):
    db_estudiante = session.get(EstudianteModel, id)
    if not db_estudiante or not db_estudiante.is_active:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
        
    for llave, valor in estudiante_in.model_dump(exclude_unset=True).items():
        setattr(db_estudiante, llave, valor)
        
    session.add(db_estudiante)
    session.commit()
    session.refresh(db_estudiante)
    return db_estudiante

@router.put("/{id}", response_model=EstudianteRead)
def reemplazar_estudiante(
    id: int, 
    estudiante_in: EstudianteCreate, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1])) # Exclusivo para Administradores
):
    db_estudiante = session.get(EstudianteModel, id)
    if not db_estudiante or not db_estudiante.is_active:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
        
    for llave, valor in estudiante_in.model_dump().items():
        setattr(db_estudiante, llave, valor)
        
    session.add(db_estudiante)
    session.commit()
    session.refresh(db_estudiante)
    return db_estudiante

@router.delete("/{id}")
def eliminar_estudiante(
    id: int, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1])) # Borrado lógico exclusivo del Administrador
):
    db_estudiante = session.get(EstudianteModel, id)
    if not db_estudiante or not db_estudiante.is_active:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
        
    db_estudiante.is_active = False
    session.add(db_estudiante)
    session.commit()
    return {"message": "Estudiante dado de baja correctamente"}