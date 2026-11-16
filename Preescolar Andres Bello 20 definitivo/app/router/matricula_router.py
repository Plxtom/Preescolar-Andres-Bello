from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from typing import List

from app.models.models import MatriculaModel, EstudianteModel, SeccionModel, PeriodoAcademicoModel
from app.schemas.esq_matriculas import MatriculaCreate, MatriculaRead, MatriculaUpdate
from app.config.database import get_session
from app.dependencias.auth_deps import requerir_rol, obtener_usuario_actual

router = APIRouter(prefix="/api/matriculas", tags=["Matrículas e Inscripciones"])

@router.post("/", response_model=MatriculaRead)
def crear_matricula(
    matricula_in: MatriculaCreate, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 3])) # Permitido a Administradores (1) y Secretaria (3)
):
    if not session.get(EstudianteModel, matricula_in.estudiante_id):
        raise HTTPException(status_code=404, detail="El estudiante especificado no existe")
    if not session.get(SeccionModel, matricula_in.seccion_id):
        raise HTTPException(status_code=404, detail="La sección especificada no existe")
    if not session.get(PeriodoAcademicoModel, matricula_in.periodo_id):
        raise HTTPException(status_code=404, detail="El periodo académico especificado no existe")

    # 2. Convertimos el payload a diccionario para inyectar el ID del usuario del token
    datos_matricula = matricula_in.model_dump()
    
    # Inyectamos el ID del usuario autenticado de forma automática
    datos_matricula["registrado_por_usuario_id"] = usuario_actual.get("id") # O usuario_actual.id si es un objeto

    # 3. Creamos la matrícula validando el DICCIONARIO completo (con el usuario ya inyectado)
    db_matricula = MatriculaModel.model_validate(datos_matricula)
    
    session.add(db_matricula)
    session.commit()
    session.refresh(db_matricula)
    return db_matricula 

@router.get("/", response_model=List[MatriculaRead])
def listar_matriculas(
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2])) # Administradores y Directora pueden listar todas las matrículas
):
    statement = select(MatriculaModel).where(MatriculaModel.is_active == True)
    return session.exec(statement).all()

@router.get("/{id}", response_model=MatriculaRead)
def obtener_matricula(
    id: int, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2, 3])) # Todos los roles autenticados pueden ver detalles
):
    matricula = session.get(MatriculaModel, id)
    if not matricula or not matricula.is_active:
        raise HTTPException(status_code=404, detail="Matrícula no encontrada")
    return matricula

@router.get("/{id}/detalle", response_model=MatriculaRead)
def obtener_matricula_con_relaciones(
    id: int, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2, 3]))
):
    statement = (
        select(MatriculaModel)
        .where(MatriculaModel.id == id, MatriculaModel.is_active == True)
        .options(
            selectinload(MatriculaModel.estudiante),
            selectinload(MatriculaModel.seccion),
            selectinload(MatriculaModel.periodo)
        )
    )
    matricula = session.exec(statement).first()
    if not matricula:
        raise HTTPException(status_code=404, detail="Matrícula no encontrada")
    return matricula

@router.patch("/{id}", response_model=MatriculaRead)
def actualizar_matricula_parcial(
    id: int, 
    matricula_in: MatriculaUpdate, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2])) # Admin y Directora pueden actualizar estados de matrículas
):
    db_matricula = session.get(MatriculaModel, id)
    if not db_matricula or not db_matricula.is_active:
        raise HTTPException(status_code=404, detail="Matrícula no encontrada")
        
    for llave, valor in matricula_in.model_dump(exclude_unset=True).items():
        setattr(db_matricula, llave, valor)
        
    session.add(db_matricula)
    session.commit()
    session.refresh(db_matricula)
    return db_matricula

@router.put("/{id}", response_model=MatriculaRead)
def reemplazar_matricula(
    id: int, 
    matricula_in: MatriculaCreate, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1])) # Reemplazos totales exclusivos del Administrador
):
    db_matricula = session.get(MatriculaModel, id)
    if not db_matricula or not db_matricula.is_active:
        raise HTTPException(status_code=404, detail="Matrícula no encontrada")
        
    if not session.get(EstudianteModel, matricula_in.estudiante_id):
        raise HTTPException(status_code=404, detail="El estudiante especificado no existe")
    if not session.get(SeccionModel, matricula_in.seccion_id):
        raise HTTPException(status_code=404, detail="La sección especificada no existe")
    if not session.get(PeriodoAcademicoModel, matricula_in.periodo_id):
        raise HTTPException(status_code=404, detail="El periodo académico especificado no existe")
        
    for llave, valor in matricula_in.model_dump().items():
        setattr(db_matricula, llave, valor)
        
    session.add(db_matricula)
    session.commit()
    session.refresh(db_matricula)
    return db_matricula

@router.delete("/{id}")
def eliminar_matricula(
    id: int, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 3])) # Admin (1) o la Secretaria (3) pueden cancelar la matrícula
):
    db_matricula = session.get(MatriculaModel, id)
    if not db_matricula or not db_matricula.is_active:
        raise HTTPException(status_code=404, detail="Matrícula no encontrada")
        
    db_matricula.is_active = False
    session.add(db_matricula)
    session.commit()
    return {"message": "Matrícula cancelada correctamente"}