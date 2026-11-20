from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func
from datetime import datetime

from app.config.database import get_session
from app.dependencias.auth_deps import requerir_rol

# IMPORT CORREGIDO
from app.models import (
    EstudianteModel,
    SeccionModel,
    MatriculaModel,
    RepresentanteModel,
    NivelGradoModel
)

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analítica"]
)


@router.get("/dashboard")
def obtener_dashboard(
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 3]))
):
    """Devuelve todos los datos para el Dashboard."""
    try:
        # Total de estudiantes activos
        total_estudiantes = session.exec(
            select(func.count(EstudianteModel.id)).where(EstudianteModel.is_active == True)
        ).one()

        # Total de secciones activas
        total_secciones = session.exec(
            select(func.count(SeccionModel.id)).where(SeccionModel.is_active == True)
        ).one()

        # Total de representantes
        total_representantes = session.exec(
            select(func.count(RepresentanteModel.id)).where(RepresentanteModel.is_active == True)
        ).one()

        # Total de matrículas activas
        total_matriculas = session.exec(
            select(func.count(MatriculaModel.id)).where(
                MatriculaModel.is_active == True,
                MatriculaModel.estatus == "ACTIVO"
            )
        ).one()

        # Ocupación por sección
        ocupacion_por_seccion = session.exec(
            select(
                SeccionModel.nombre_seccion,
                func.count(MatriculaModel.id).label("inscritos"),
                SeccionModel.capacidad_maxima
            )
            .outerjoin(
                MatriculaModel, 
                (MatriculaModel.seccion_id == SeccionModel.id) & 
                (MatriculaModel.is_active == True)
            )
            .where(SeccionModel.is_active == True)
            .group_by(SeccionModel.id, SeccionModel.nombre_seccion, SeccionModel.capacidad_maxima)
        ).all()

        data_secciones = [
            {
                "nombre": row[0],
                "inscritos": row[1],
                "capacidad": row[2]
            }
            for row in ocupacion_por_seccion
        ]

        # Porcentaje de ocupación promedio
        if data_secciones:
            total_inscritos = sum(s["inscritos"] for s in data_secciones)
            total_capacidad = sum(s["capacidad"] for s in data_secciones)
            ocupacion_promedio = round((total_inscritos / total_capacidad * 100), 1) if total_capacidad > 0 else 0
        else:
            ocupacion_promedio = 0

        # Distribución por género
        distribucion_genero = session.exec(
            select(
                EstudianteModel.genero,
                func.count(EstudianteModel.id)
            ).where(EstudianteModel.is_active == True)
            .group_by(EstudianteModel.genero)
        ).all()

        data_genero = [
            {"name": "Niños" if row[0] == "M" else "Niñas", "value": row[1]}
            for row in distribucion_genero if row[0]
        ]

        # Distribución por edad
        current_year = datetime.now().year
        edades = session.exec(
            select(
                func.extract('year', EstudianteModel.fecha_nacimiento).label("anio_nac"),
                func.count(EstudianteModel.id)
            ).where(EstudianteModel.is_active == True)
            .group_by("anio_nac")
        ).all()

        data_edades = [
            {
                "edad": current_year - int(row[0]),
                "cantidad": row[1]
            }
            for row in edades if row[0] is not None
        ]
        data_edades.sort(key=lambda x: x["edad"])

        return {
            "total_estudiantes": total_estudiantes,
            "total_secciones": total_secciones,
            "total_representantes": total_representantes,
            "total_matriculas": total_matriculas,
            "ocupacion_promedio": ocupacion_promedio,
            "secciones": data_secciones,
            "genero": data_genero,
            "edades": data_edades
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar analítica: {str(e)}"
        )