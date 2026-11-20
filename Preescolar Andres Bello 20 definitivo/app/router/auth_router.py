from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session

from app.config.database import get_session
from app.schemas.esq_auth import UserCreate, UserResponse, UserLogin
from app.service import auth_service
from app.dependencias.auth_deps import requerir_rol, obtener_usuario_actual

router = APIRouter(
    prefix="/api/auth",
    tags=["Autenticación y Usuarios"]
)

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(datos: UserCreate, session: Session = Depends(get_session)):
    return auth_service.registrar_usuario(session, datos)

@router.post("/login")
def login(
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