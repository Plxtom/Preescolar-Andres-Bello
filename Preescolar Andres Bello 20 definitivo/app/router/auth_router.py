from fastapi import APIRouter, Depends, status, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session
from datetime import datetime, timezone

from app.config.database import get_session
from app.schemas.esq_auth import UserCreate, UserResponse, UserLogin
from app.service import auth_service
from app.dependencias.auth_deps import requerir_rol, obtener_usuario_actual
from app.models import UsuarioSistemaModel, RolModel, AuditoriaLogModel  

router = APIRouter(
    prefix="/api/auth",
    tags=["Autenticación y Usuarios"]
)

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(datos: UserCreate, session: Session = Depends(get_session)):
    return auth_service.registrar_usuario(session, datos)

@router.post("/login")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(), 
    session: Session = Depends(get_session)
):
    datos_login = UserLogin(correo=form_data.username, password=form_data.password)
    token_data = auth_service.iniciar_sesion(session, datos_login)
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Registrar el inicio de sesión en auditoría
    try:
        usuario_id = token_data.get("id") if isinstance(token_data, dict) else getattr(token_data, "id", None)
        
        log = AuditoriaLogModel(
            usuario_id=usuario_id,
            accion="LOGIN",
            tabla_afectada="usuarios_sistema",
            registro_id=usuario_id,
            detalles=f"Inicio de sesión exitoso: {form_data.username}",
            fecha_hora=datetime.now(timezone.utc)
        )
        session.add(log)
        session.commit()
        print(f"✅ Log de auditoría registrado: LOGIN de {form_data.username}")
    except Exception as e:
        session.rollback()
        print(f"⚠️ No se pudo registrar el log de auditoría: {str(e)}")
    
    return token_data

@router.get("/usuarios", response_model=list[UserResponse])
def get_users(
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1]))
):
    return auth_service.listar_usuarios(session)

@router.get("/perfil")
def obtener_perfil(
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    return {
        "mensaje": "Acceso permitido",
        "usuario_correo": usuario_actual.get("sub"),
        "rol_id": usuario_actual.get("rol_id"),
        "id_usuario": usuario_actual.get("id")
    }