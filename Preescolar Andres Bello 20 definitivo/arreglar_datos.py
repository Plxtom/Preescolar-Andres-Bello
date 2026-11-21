from sqlmodel import Session, select
from datetime import datetime, timezone
from app.config.database import engine
from app.models import (
    EstudianteModel,
    MatriculaModel,
    EstudianteRepresentanteModel,
    RepresentanteModel,
    PeriodoAcademicoModel,
    SeccionModel
)

def arreglar():
    with Session(engine) as session:
        print("="*50)
        print("VERIFICANDO QUÉ FALTA")
        print("="*50)

        # Verificar período y sección disponibles
        periodo = session.exec(select(PeriodoAcademicoModel)).first()
        seccion = session.exec(select(SeccionModel)).first()

        if not periodo:
            print("❌ No hay períodos académicos. Debes crear uno primero.")
            return
        if not seccion:
            print("❌ No hay secciones. Debes crear una primero.")
            return

        print(f"✅ Período usado: {periodo.id} - {periodo.nombre}")
        print(f"✅ Sección usada: {seccion.id} - {seccion.nombre_seccion}")

        # 1. Vincular Lucas (ID 1) con María (ID 1)
        rel_lucas = session.exec(
            select(EstudianteRepresentanteModel).where(
                EstudianteRepresentanteModel.estudiante_id == 1
            )
        ).first()

        if not rel_lucas:
            nueva_rel = EstudianteRepresentanteModel(
                estudiante_id=1,
                representante_id=1,
                parentesco="Madre",
                es_representante_legal=True,
                autorizado_retirar=True
            )
            session.add(nueva_rel)
            print("✅ Lucas vinculado con su madre María")
        else:
            print("⚠️  Lucas ya tenía representante vinculado")

        # 2. Crear matrícula para Juanito (ID 2)
        mat_juanito = session.exec(
            select(MatriculaModel).where(
                MatriculaModel.estudiante_id == 2
            )
        ).first()

        if not mat_juanito:
            nueva_mat = MatriculaModel(
                estudiante_id=2,
                periodo_id=periodo.id,
                seccion_id=seccion.id,
                registrado_por_usuario_id=1,
                fecha_matricula=datetime.now(timezone.utc),  # ✅ CORREGIDO
                estatus="ACTIVO",
                is_active=True
            )
            session.add(nueva_mat)
            print("✅ Matrícula creada para Juanito")
        else:
            print("⚠️  Juanito ya tenía matrícula")

        # 3. Vincular Juanito (ID 2) con María (ID 1)
        rel_juanito = session.exec(
            select(EstudianteRepresentanteModel).where(
                EstudianteRepresentanteModel.estudiante_id == 2
            )
        ).first()

        if not rel_juanito:
            nueva_rel2 = EstudianteRepresentanteModel(
                estudiante_id=2,
                representante_id=1,
                parentesco="Madre",
                es_representante_legal=True,
                autorizado_retirar=True
            )
            session.add(nueva_rel2)
            print("✅ Juanito vinculado con su madre María")
        else:
            print("⚠️  Juanito ya tenía representante vinculado")

        session.commit()
        print("="*50)
        print("🎉 TODO LISTO. Recarga tu frontend.")
        print("="*50)

if __name__ == "__main__":
    arreglar()