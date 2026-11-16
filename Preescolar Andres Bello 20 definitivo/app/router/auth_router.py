from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPBearer, OAuth2PasswordRequestForm
from sqlmodel import Session

from app.config.database import get_session
from app.schemas.esq_auth import UserCreate, UserResponse, UserLogin
from app.service import auth_service
from app.dependencias.auth_deps import requerir_rol, obtener_usuario_actual

router = APIRouter(
    prefix="/api/auth",
    tags=["Autenticación y Usuarios"]
)

security = HTTPBearer()  # Instancia de seguridad para manejar tokens JWT

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(datos: UserCreate, session: Session = Depends(get_session)):
    """Cualquier usuario autorizado puede registrar un nuevo usuario en el sistema."""
    return auth_service.registrar_usuario(session, datos)

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    """
    Integra OAuth2PasswordRequestForm para que el botón 'Authorize' en Swagger UI 
    funcione perfectamente pidiendo correo (en username) y contraseña.
    """
    datos_login = UserLogin(correo=form_data.username, password=form_data.password)
    return auth_service.iniciar_sesion(session, datos_login)

@router.get("/usuarios", response_model=list[UserResponse])
def get_users(
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1]))  # Solo el Administrador (Rol 1) puede listar usuarios
):
    """Retorna la lista de usuarios del sistema (Ruta protegida para Admins)."""
    return auth_service.listar_usuarios(session)

@router.get("/perfil")
def obtener_perfil(
    usuario_actual: dict = Depends(obtener_usuario_actual)  # Protegido automáticamente con el token JWT
):
    """
    Ruta protegida que exige el token JWT en el encabezado 
    Authorization: Bearer <token>
    """
    return {
        "mensaje": "Acceso permitido a la ruta protegida del C.E.I. Andrés Bello",
        "usuario_correo": usuario_actual.get("sub"),
        "rol_id": usuario_actual.get("rol_id"),
        "id_usuario": usuario_actual.get("id")
    }