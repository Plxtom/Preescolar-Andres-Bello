from sqlmodel import Session, select
from app.config.database import engine
from app.models import EstudianteModel, MatriculaModel, EstudianteRepresentanteModel, RepresentanteModel

def verificar():
    with Session(engine) as session:
        print("="*40)
        print("1. ESTUDIANTES REGISTRADOS")
        print("="*40)
        estudiantes = session.exec(select(EstudianteModel)).all()
        for e in estudiantes:
            print(f"👤 ID: {e.id} | {e.nombres} {e.apellidos} | Activo: {e.is_active}")

        print("\n" + "="*40)
        print("2. MATRÍCULAS ACTIVAS")
        print("="*40)
        matriculas = session.exec(select(MatriculaModel)).all()
        for m in matriculas:
            print(f"📄 Matrícula ID: {m.id} | Estudiante ID: {m.estudiante_id} | Estatus: {m.estatus} | Activo: {m.is_active}")

        print("\n" + "="*40)
        print("3. RELACIONES ESTUDIANTE - REPRESENTANTE")
        print("="*40)
        relaciones = session.exec(select(EstudianteRepresentanteModel)).all()
        for r in relaciones:
            print(f"🔗 Estudiante ID: {r.estudiante_id}  --->  Representante ID: {r.representante_id} | Es Legal: {r.es_representante_legal}")
            
        print("\n" + "="*40)
        print("4. REPRESENTANTES")
        print("="*40)
        representantes = session.exec(select(RepresentanteModel)).all()
        for rep in representantes:
            print(f"👩/👨 ID: {rep.id} | {rep.nombres} {rep.apellidos} | Cédula: {rep.cedula}")

if __name__ == "__main__":
    verificar()