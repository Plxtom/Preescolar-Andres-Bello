from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session, select
from typing import List

from app.config.database import get_session
from app.dependencias.auth_deps import obtener_usuario_actual, requerir_rol
from app.models import SeccionModel
from app.schemas.esq_secciones import SeccionCreate, SeccionUpdate, SeccionResponse
from app.service.auditoria_service import registrar_log

router = APIRouter(
    prefix="/api/periodos/secciones",
    tags=["Secciones"]
)


@router.get("/todas", response_model=List[SeccionResponse])
def listar_todas_secciones(
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    """Lista todas las secciones activas."""
    secciones = session.exec(
        select(SeccionModel).where(SeccionModel.is_active == True)
    ).all()
    return secciones


@router.get("/{periodo_id}/secciones", response_model=List[SeccionResponse])
def listar_secciones_por_periodo(
    periodo_id: int,
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    """Lista las secciones de un período específico."""
    secciones = session.exec(
        select(SeccionModel).where(
            SeccionModel.periodo_id == periodo_id,
            SeccionModel.is_active == True
        )
    ).all()
    return secciones


@router.post("/", status_code=status.HTTP_201_CREATED)
def crear_seccion(
    request: Request,
    datos: SeccionCreate,
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 3]))
):
    """Crea una nueva sección."""
    try:
        seccion = SeccionModel(**datos.dict())
        session.add(seccion)
        session.commit()
        session.refresh(seccion)

        registrar_log(
            session=session,
            usuario_id=usuario_actual.get("id"),
            accion="CREATE",
            tabla_afectada="secciones",
            registro_id=seccion.id,
            detalles=f"Nueva sección: {seccion.nombre_seccion}",
            ip_address=request.client.host
        )

        return {"mensaje": "Sección creada exitosamente", "id": seccion.id}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=f"Error al crear sección: {str(e)}")


@router.put("/{seccion_id}")
def editar_seccion(
    request: Request,
    seccion_id: int,
    datos: SeccionUpdate,
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 3]))
):
    """Edita una sección existente."""
    seccion = session.get(SeccionModel, seccion_id)
    if not seccion:
        raise HTTPException(status_code=404, detail="Sección no encontrada")

    try:
        if datos.periodo_id is not None:
            seccion.periodo_id = datos.periodo_id
        if datos.grado_id is not None:
            seccion.grado_id = datos.grado_id
        if datos.nombre_seccion is not None:
            seccion.nombre_seccion = datos.nombre_seccion
        if datos.capacidad_maxima is not None:
            seccion.capacidad_maxima = datos.capacidad_maxima
        if datos.docente_encargado is not None:
            seccion.docente_encargado = datos.docente_encargado

        session.commit()
        session.refresh(seccion)

        registrar_log(
            session=session,
            usuario_id=usuario_actual.get("id"),
            accion="UPDATE",
            tabla_afectada="secciones",
            registro_id=seccion_id,
            detalles=f"Sección actualizada: {seccion.nombre_seccion}",
            ip_address=request.client.host
        )

        return {"mensaje": "Sección actualizada exitosamente"}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=f"Error al editar: {str(e)}")


@router.delete("/{seccion_id}")
def eliminar_seccion(
    request: Request,
    seccion_id: int,
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1]))
):
    """Elimina una sección (soft delete)."""
    seccion = session.get(SeccionModel, seccion_id)
    if not seccion:
        raise HTTPException(status_code=404, detail="Sección no encontrada")

    try:
        seccion.is_active = False
        session.commit()

        registrar_log(
            session=session,
            usuario_id=usuario_actual.get("id"),
            accion="DELETE",
            tabla_afectada="secciones",
            registro_id=seccion_id,
            detalles=f"Sección eliminada: {seccion.nombre_seccion}",
            ip_address=request.client.host
        )

        return {"mensaje": "Sección eliminada exitosamente"}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=f"Error al eliminar: {str(e)}")