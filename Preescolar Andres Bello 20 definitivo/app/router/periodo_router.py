from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.models.models import (
    PeriodoAcademicoModel,
    SeccionModel,
    NivelGradoModel,
    MatriculaModel
)
from app.schemas.esq_periodos import PeriodoAcademicoCreate, PeriodoAcademicoRead, PeriodoAcademicoUpdate
from app.config.database import get_session
from app.dependencias.auth_deps import requerir_rol, obtener_usuario_actual

router = APIRouter(prefix="/api/periodos", tags=["Periodos Académicos"])


# ============ PERÍODOS ACADÉMICOS ============

@router.post("/", response_model=PeriodoAcademicoRead)
def crear_periodo(
    periodo_in: PeriodoAcademicoCreate, 
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2]))
):
    db_periodo = PeriodoAcademicoModel.model_validate(periodo_in)
    session.add(db_periodo)
    session.commit()
    session.refresh(db_periodo)
    return db_periodo


@router.get("/", response_model=List[PeriodoAcademicoRead])
def listar_periodos(
    solo_activos: Optional[bool] = False,
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2, 3]))
):
    """
    Lista todos los períodos académicos.
    Si solo_activos=True, devuelve solo los períodos marcados como activos.
    """
    statement = select(PeriodoAcademicoModel).where(PeriodoAcademicoModel.is_active == True)
    
    if solo_activos:
        statement = statement.where(PeriodoAcademicoModel.activo == True)
    
    statement = statement.order_by(PeriodoAcademicoModel.fecha_inicio.desc())
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
    usuario_actual: dict = Depends(requerir_rol([1, 2]))
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
    usuario_actual: dict = Depends(requerir_rol([1]))
):
    db_periodo = session.get(PeriodoAcademicoModel, id)
    if not db_periodo or not db_periodo.is_active:
        raise HTTPException(status_code=404, detail="Periodo académico no encontrado")
        
    db_periodo.is_active = False
    session.add(db_periodo)
    session.commit()
    return {"message": "Periodo académico dado de baja correctamente"}


# ============ SECCIONES POR PERÍODO (NUEVO) ============

@router.get("/{periodo_id}/secciones")
def listar_secciones_por_periodo(
    periodo_id: int,
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    """
    Lista las secciones de un período específico.
    Usado en el formulario de inscripción para filtrar secciones por período.
    """
    # Verificar que el período existe
    periodo = session.get(PeriodoAcademicoModel, periodo_id)
    if not periodo or not periodo.is_active:
        raise HTTPException(status_code=404, detail="Período no encontrado")
    
    # Obtener secciones del período
    secciones = session.exec(
        select(SeccionModel)
        .where(
            SeccionModel.periodo_id == periodo_id,
            SeccionModel.is_active == True
        )
        .order_by(SeccionModel.id)
    ).all()
    
    resultado = []
    for s in secciones:
        grado = session.get(NivelGradoModel, s.grado_id) if s.grado_id else None
        
        # Contar matrículas activas en esta sección
        matriculas_activas = session.exec(
            select(MatriculaModel).where(
                MatriculaModel.seccion_id == s.id,
                MatriculaModel.is_active == True,
                MatriculaModel.estatus == "ACTIVO"
            )
        ).all()
        
        resultado.append({
            "id": s.id,
            "nombre": f"{grado.nombre if grado else ''} - {s.nombre_seccion}".strip(" -"),
            "nombre_seccion": s.nombre_seccion,
            "grado_nombre": grado.nombre if grado else "",
            "grado_id": s.grado_id,
            "capacidad_maxima": s.capacidad_maxima,
            "docente_encargado": s.docente_encargado,
            "inscritos": len(matriculas_activas),
            "disponibles": s.capacidad_maxima - len(matriculas_activas),
            "periodo_id": s.periodo_id
        })
    
    return resultado


# ============ TODAS LAS SECCIONES (NUEVO) ============

@router.get("/secciones/todas")
def listar_todas_secciones(
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    """Lista todas las secciones de todos los períodos."""
    secciones = session.exec(
        select(SeccionModel).where(SeccionModel.is_active == True)
    ).all()
    
    resultado = []
    for s in secciones:
        grado = session.get(NivelGradoModel, s.grado_id) if s.grado_id else None
        periodo = session.get(PeriodoAcademicoModel, s.periodo_id) if s.periodo_id else None
        
        resultado.append({
            "id": s.id,
            "nombre": f"{grado.nombre if grado else ''} - {s.nombre_seccion}".strip(" -"),
            "nombre_seccion": s.nombre_seccion,
            "grado_nombre": grado.nombre if grado else "",
            "periodo_id": s.periodo_id,
            "periodo_nombre": periodo.nombre if periodo else "",
            "capacidad_maxima": s.capacidad_maxima,
            "docente_encargado": s.docente_encargado
        })
    
    return resultado


# ============ NIVELES / GRADOS (NUEVO) ============

@router.get("/niveles/")
def listar_niveles(
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    """Lista todos los niveles/grados disponibles."""
    niveles = session.exec(
        select(NivelGradoModel).where(NivelGradoModel.is_active == True)
    ).all()
    
    return [
        {
            "id": n.id,
            "nombre": n.nombre,
            "edad_minima_meses": n.edad_minima_meses,
            "descripcion": n.descripcion
        }
        for n in niveles
    ]