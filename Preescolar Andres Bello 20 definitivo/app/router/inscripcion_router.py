from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session, select
from typing import List

from app.config.database import get_session
from app.dependencias.auth_deps import obtener_usuario_actual, requerir_rol

from app.models import (
    EstudianteModel,
    RepresentanteModel,
    EstudianteRepresentanteModel,
    MatriculaModel,
    SeccionModel,
    PeriodoAcademicoModel,
    NivelGradoModel
)

from app.schemas.esq_inscripcion import InscripcionCreate, InscripcionResponse, MatriculaUpdate, InscripcionUpdate
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
    """Lista todas las inscripciones con datos COMPLETOS."""
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
        
        grado_nombre = ""
        if seccion and seccion.grado_id:
            grado = session.get(NivelGradoModel, seccion.grado_id)
            grado_nombre = grado.nombre if grado else ""
        
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
            "estudiante_fecha_nacimiento": estudiante.fecha_nacimiento.isoformat() if estudiante and estudiante.fecha_nacimiento else None,
            "estudiante_genero": estudiante.genero if estudiante else None,
            "estudiante_lugar_nacimiento": estudiante.lugar_nacimiento if estudiante else None,
            "estudiante_alergias": estudiante.alergias_condiciones_medicas if estudiante else None,
            "estudiante_observaciones": estudiante.observaciones if estudiante else None,
            "representante_id": representante.id if representante else None,
            "representante_nombres": representante.nombres if representante else "",
            "representante_apellidos": representante.apellidos if representante else "",
            "representante_cedula": representante.cedula if representante else "",
            "representante_telefono": representante.telefono if representante else "",
            "representante_email": representante.email if representante else None,
            "representante_direccion": representante.direccion if representante else None,
            "representante_lugar_trabajo": representante.lugar_trabajo if representante else None,
            "representante_telefono_trabajo": representante.telefono_trabajo if representante else None,
            "periodo_id": periodo.id if periodo else None,
            "periodo_nombre": periodo.nombre if periodo else "",
            "seccion_id": seccion.id if seccion else None,
            "seccion_nombre": f"{grado_nombre} - {seccion.nombre_seccion}" if seccion else "",
            "parentesco": relacion.parentesco if relacion else "",
            "es_representante_legal": relacion.es_representante_legal if relacion else False,
            "autorizado_retirar": relacion.autorizado_retirar if relacion else False,
            "estatus": mat.estatus,
            "observaciones_inscripcion": mat.observaciones_inscripcion,
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
        representante = RepresentanteModel(**datos.representante.dict())
        session.add(representante)
        session.commit()
        session.refresh(representante)

        estudiante = EstudianteModel(**datos.estudiante.dict())
        session.add(estudiante)
        session.commit()
        session.refresh(estudiante)

        relacion = EstudianteRepresentanteModel(
            estudiante_id=estudiante.id,
            representante_id=representante.id,
            parentesco=datos.matricula.parentesco,
            es_representante_legal=datos.matricula.es_representante_legal,
            autorizado_retirar=datos.matricula.autorizado_retirar
        )
        session.add(relacion)
        session.commit()

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
def editar_inscripcion_completa(
    request: Request,
    inscripcion_id: int,
    datos: InscripcionUpdate,
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2]))
):
    """Edita una inscripción completa (PUT) - Actualiza representante, estudiante y matrícula."""
    mat = session.get(MatriculaModel, inscripcion_id)
    if not mat:
        raise HTTPException(status_code=404, detail="Matrícula no encontrada")

    try:
        # 1. Actualizar representante si viene en los datos
        if datos.representante:
            relacion = session.exec(
                select(EstudianteRepresentanteModel).where(
                    EstudianteRepresentanteModel.estudiante_id == mat.estudiante_id
                )
            ).first()
            
            if relacion:
                representante = session.get(RepresentanteModel, relacion.representante_id)
                if representante:
                    representante.nombres = datos.representante.nombres
                    representante.apellidos = datos.representante.apellidos
                    representante.cedula = datos.representante.cedula
                    representante.telefono = datos.representante.telefono
                    representante.email = datos.representante.email
                    representante.direccion = datos.representante.direccion
                    representante.lugar_trabajo = datos.representante.lugar_trabajo
                    representante.telefono_trabajo = datos.representante.telefono_trabajo
                    session.add(representante)

        # 2. Actualizar estudiante si viene en los datos
        if datos.estudiante:
            estudiante = session.get(EstudianteModel, mat.estudiante_id)
            if estudiante:
                estudiante.nombres = datos.estudiante.nombres
                estudiante.apellidos = datos.estudiante.apellidos
                estudiante.cedula_escolar = datos.estudiante.cedula_escolar
                estudiante.fecha_nacimiento = datos.estudiante.fecha_nacimiento
                estudiante.genero = datos.estudiante.genero
                estudiante.lugar_nacimiento = datos.estudiante.lugar_nacimiento
                estudiante.alergias_condiciones_medicas = datos.estudiante.alergias_condiciones_medicas
                estudiante.observaciones = datos.estudiante.observaciones
                session.add(estudiante)

        # 3. Actualizar matrícula si viene en los datos
        if datos.matricula:
            if datos.matricula.periodo_id is not None:
                mat.periodo_id = datos.matricula.periodo_id
            if datos.matricula.seccion_id is not None:
                mat.seccion_id = datos.matricula.seccion_id
            if datos.matricula.estatus is not None:
                mat.estatus = datos.matricula.estatus
            if datos.matricula.observaciones_inscripcion is not None:
                mat.observaciones_inscripcion = datos.matricula.observaciones_inscripcion

        session.commit()
        session.refresh(mat)

        registrar_log(
            session=session,
            usuario_id=usuario_actual.get("id"),
            accion="UPDATE",
            tabla_afectada="matriculas",
            registro_id=inscripcion_id,
            detalles=f"Editada inscripción completa ID {inscripcion_id}",
            ip_address=request.client.host
        )

        return {"mensaje": "Inscripción actualizada completamente", "id": mat.id}

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=f"Error al editar: {str(e)}")



@router.patch("/{inscripcion_id}")
def actualizar_inscripcion_parcial(
    request: Request,
    inscripcion_id: int,
    datos: MatriculaUpdate,
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1, 2]))
):
    """Actualización parcial de una matrícula (PATCH). Ideal para cambios rápidos como solo el estatus."""
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
        session.refresh(mat)

        registrar_log(
            session=session,
            usuario_id=usuario_actual.get("id"),
            accion="PATCH",
            tabla_afectada="matriculas",
            registro_id=inscripcion_id,
            detalles=f"Actualización parcial: estatus cambiado a {mat.estatus}",
            ip_address=request.client.host
        )

        return {"mensaje": "Matrícula actualizada parcialmente", "id": mat.id}

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=f"Error al actualizar parcialmente: {str(e)}")


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