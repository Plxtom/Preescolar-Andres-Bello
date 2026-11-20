from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlmodel import Session, select, func

from app.config.database import get_session
from app.dependencias.auth_deps import requerir_rol


from app.models import AuditoriaLogModel

router = APIRouter(
    prefix="/api/auditoria",
    tags=["Auditoría"]
)


@router.get("/logs")
def listar_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    accion: str = Query(None),
    usuario_id: int = Query(None),
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 3]))
):
    """Lista los logs de auditoría con paginación y filtros."""
    try:
        query = select(AuditoriaLogModel)
        count_query = select(func.count(AuditoriaLogModel.id))

        if accion:
            query = query.where(AuditoriaLogModel.accion == accion.upper())
            count_query = count_query.where(AuditoriaLogModel.accion == accion.upper())
        if usuario_id:
            query = query.where(AuditoriaLogModel.usuario_id == usuario_id)
            count_query = count_query.where(AuditoriaLogModel.usuario_id == usuario_id)

        total = session.exec(count_query).one()

        offset = (page - 1) * limit
        logs = session.exec(
            query.order_by(AuditoriaLogModel.fecha_hora.desc())
            .offset(offset)
            .limit(limit)
        ).all()

        return {
            "total": total,
            "pagina": page,
            "limite": limit,
            "total_paginas": (total + limit - 1) // limit,
            "logs": [
                {
                    "id": log.id,
                    "usuario_id": log.usuario_id,
                    "usuario": log.usuario.nombre_completo if log.usuario else "Sistema",
                    "accion": log.accion,
                    "tabla": log.tabla_afectada,
                    "detalles": log.detalles,
                    "fecha": log.fecha_hora.isoformat() if log.fecha_hora else None
                }
                for log in logs
            ]
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener logs: {str(e)}"
        )


@router.get("/acciones-disponibles")
def obtener_acciones_disponibles(
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 3]))
):
    """Devuelve la lista de acciones únicas registradas."""
    acciones = session.exec(
        select(AuditoriaLogModel.accion).distinct()
    ).all()
    return list(acciones)