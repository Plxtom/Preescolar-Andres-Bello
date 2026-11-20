from sqlmodel import Session
from datetime import datetime


from app.models import AuditoriaLogModel


def registrar_log(
    session: Session,
    usuario_id: int,
    accion: str,
    tabla_afectada: str,
    registro_id: int,
    detalles: str = None,
    ip_address: str = None
):
    """Registra una acción en el log de auditoría."""
    try:
        log = AuditoriaLogModel(
            usuario_id=usuario_id,
            accion=accion.upper(),
            tabla_afectada=tabla_afectada,
            registro_id=registro_id,
            detalles=detalles,
            fecha_hora=datetime.utcnow()
        )
        session.add(log)
        session.commit()
    except Exception as e:
        # Si falla la auditoría, no debe romper la operación principal
        session.rollback()
        print(f"Error al registrar auditoría: {str(e)}")