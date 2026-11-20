from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session, select
from typing import List

from app.config.database import get_session
from app.dependencias.auth_deps import obtener_usuario_actual, requerir_rol

# Todos los modelos desde app.models
from app.models import (
    EstudianteModel,
    RepresentanteModel,
    EstudianteRepresentanteModel,
    MatriculaModel,
    SeccionModel,
    PeriodoAcademicoModel,
    NivelGradoModel
)

from app.schemas.esq_inscripcion import InscripcionCreate, InscripcionResponse, MatriculaUpdate
from app.service.auditoria_service import registrar_log

router = APIRouter(
    prefix="/api/inscripciones",
    tags=["Inscripciones"]
)


@router.get("/", response_model=List[InscripcionResponse])
def listar_inscripciones(
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    """Lista todas las inscripciones con datos completos."""
    matriculas = session.exec(
        select(MatriculaModel)
        .where(MatriculaModel.is_active == True)
        .order_by(MatriculaModel.id.desc())
    ).all()

    resultado = []
    for mat in matriculas:
        estudiante = session.get(EstudianteModel, mat.estudiante_id)
        seccion = session.get(SeccionModel, mat.seccion_id)
        periodo = session.get(PeriodoAcademicoModel, mat.periodo_id)
        
        # Obtener grado de la sección
        grado_nombre = ""
        if seccion and seccion.grado_id:
            grado = session.get(NivelGradoModel, seccion.grado_id)
            grado_nombre = grado.nombre if grado else ""
        
        # Buscar representante legal a través de la tabla puente
        relacion = session.exec(
            select(EstudianteRepresentanteModel).where(
                EstudianteRepresentanteModel.estudiante_id == mat.estudiante_id,
                EstudianteRepresentanteModel.es_representante_legal == True
            )
        ).first()
        
        representante = None
        if relacion:
            representante = session.get(RepresentanteModel, relacion.representante_id)

        resultado.append({
            "id": mat.id,
            "estudiante_id": estudiante.id if estudiante else None,
            "estudiante_nombres": estudiante.nombres if estudiante else "",
            "estudiante_apellidos": estudiante.apellidos if estudiante else "",
            "estudiante_cedula": estudiante.cedula_escolar if estudiante else None,
            "representante_id": representante.id if representante else None,
            "representante_nombres": representante.nombres if representante else "",
            "representante_apellidos": representante.apellidos if representante else "",
            "representante_cedula": representante.cedula if representante else "",
            "representante_telefono": representante.telefono if representante else "",
            "periodo_id": periodo.id if periodo else None,
            "periodo_nombre": periodo.nombre if periodo else "",
            "seccion_id": seccion.id if seccion else None,
            "seccion_nombre": f"{grado_nombre} - {seccion.nombre_seccion}" if seccion else "",
            "parentesco": relacion.parentesco if relacion else "",
            "es_representante_legal": relacion.es_representante_legal if relacion else False,
            "autorizado_retirar": relacion.autorizado_retirar if relacion else False,
            "estatus": mat.estatus,
            "fecha": mat.fecha_matricula.isoformat() if mat.fecha_matricula else None
        })

    return resultado


@router.post("/", status_code=status.HTTP_201_CREATED)
def crear_inscripcion(
    request: Request,
    datos: InscripcionCreate,
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2, 3]))
):
    """Crea una nueva inscripción completa."""
    try:
        # 1. Crear representante
        representante = RepresentanteModel(**datos.representante.dict())
        session.add(representante)
        session.commit()
        session.refresh(representante)

        # 2. Crear estudiante
        estudiante = EstudianteModel(**datos.estudiante.dict())
        session.add(estudiante)
        session.commit()
        session.refresh(estudiante)

        # 3. Crear relación en tabla puente
        relacion = EstudianteRepresentanteModel(
            estudiante_id=estudiante.id,
            representante_id=representante.id,
            parentesco=datos.matricula.parentesco,
            es_representante_legal=datos.matricula.es_representante_legal,
            autorizado_retirar=datos.matricula.autorizado_retirar
        )
        session.add(relacion)
        session.commit()

        # 4. Crear matrícula
        matricula = MatriculaModel(
            estudiante_id=estudiante.id,
            periodo_id=datos.matricula.periodo_id,
            seccion_id=datos.matricula.seccion_id,
            registrado_por_usuario_id=usuario_actual.get("id"),
            observaciones_inscripcion=datos.matricula.observaciones_inscripcion,
            estatus="ACTIVO"
        )
        session.add(matricula)
        session.commit()
        session.refresh(matricula)

        # 5. Registrar auditoría
        registrar_log(
            session=session,
            usuario_id=usuario_actual.get("id"),
            accion="CREATE",
            tabla_afectada="matriculas",
            registro_id=matricula.id,
            detalles=f"Nueva inscripción: {estudiante.nombres} {estudiante.apellidos}",
            ip_address=request.client.host
        )

        return {"mensaje": "Inscripción creada exitosamente", "id": matricula.id}

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=f"Error al crear inscripción: {str(e)}")


@router.put("/{inscripcion_id}")
def editar_inscripcion(
    request: Request,
    inscripcion_id: int,
    datos: MatriculaUpdate,
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2]))
):
    """Edita una matrícula existente."""
    mat = session.get(MatriculaModel, inscripcion_id)
    if not mat:
        raise HTTPException(status_code=404, detail="Matrícula no encontrada")

    try:
        if datos.periodo_id is not None:
            mat.periodo_id = datos.periodo_id
        if datos.seccion_id is not None:
            mat.seccion_id = datos.seccion_id
        if datos.estatus is not None:
            mat.estatus = datos.estatus
        if datos.observaciones_inscripcion is not None:
            mat.observaciones_inscripcion = datos.observaciones_inscripcion

        session.commit()

        registrar_log(
            session=session,
            usuario_id=usuario_actual.get("id"),
            accion="UPDATE",
            tabla_afectada="matriculas",
            registro_id=inscripcion_id,
            detalles=f"Editada matrícula ID {inscripcion_id}",
            ip_address=request.client.host
        )

        return {"mensaje": "Matrícula actualizada exitosamente"}

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=f"Error al editar: {str(e)}")


@router.delete("/{inscripcion_id}")
def eliminar_inscripcion(
    request: Request,
    inscripcion_id: int,
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1]))
):
    """Elimina una inscripción (soft delete)."""
    mat = session.get(MatriculaModel, inscripcion_id)
    if not mat:
        raise HTTPException(status_code=404, detail="Matrícula no encontrada")

    try:
        mat.is_active = False
        mat.estatus = "ELIMINADO"
        session.commit()

        registrar_log(
            session=session,
            usuario_id=usuario_actual.get("id"),
            accion="DELETE",
            tabla_afectada="matriculas",
            registro_id=inscripcion_id,
            detalles=f"Eliminada matrícula ID {inscripcion_id}",
            ip_address=request.client.host
        )

        return {"mensaje": "Inscripción eliminada exitosamente"}

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=f"Error al eliminar: {str(e)}")