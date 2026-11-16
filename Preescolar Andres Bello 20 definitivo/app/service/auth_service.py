import os
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from fastapi import HTTPException, status
from sqlmodel import Session, select
import jwt

from app.models.models import UsuarioSistemaModel
from app.schemas.esq_auth import UserCreate, UserLogin

# Carga de variables de entorno para seguridad de la aplicación
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("CRÍTICO: La variable de entorno SECRET_KEY no está configurada.")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Contexto de cifrado utilizando pbkdf2_sha256 (o bcrypt) por motivos de seguridad robusta
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


# --- Funciones de Utilidad (Hashing y JWT) ---

def get_password_hash(password: str) -> str:
    """Genera el hash seguro de una contraseña en texto plano."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si la contraseña ingresada coincide con el hash almacenado en la BD."""
    return pwd_context.verify(plain_password, hashed_password)

def crear_token(data: dict) -> str:
    """Genera un Token de Acceso JWT firmado con expiración configurada."""
    payload = data.copy()
    expiracion = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload.update({"exp": expiracion})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verificar_token(token: str) -> dict:
    """Decodifica y valida la vigencia y firma del token JWT recibido."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="El token ha expirado"
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Token inválido"
        )


# --- Operaciones de Servicio con Base de Datos ---

def registrar_usuario(session: Session, datos: UserCreate) -> UsuarioSistemaModel:
    """Registra un nuevo usuario del sistema aplicando hash a su contraseña."""
    statement = select(UsuarioSistemaModel).where(UsuarioSistemaModel.email == datos.email)
    usuario_existente = session.exec(statement).first()
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado en el sistema"
        )
    
    hash_clave = get_password_hash(datos.password)
    
    nuevo_usuario = UsuarioSistemaModel(
        nombre_completo=datos.nombre_completo,
        email=datos.email,
        password_hash=hash_clave,
        rol_id=datos.rol_id
    )
    
    session.add(nuevo_usuario)
    session.commit()
    session.refresh(nuevo_usuario)
    
    return nuevo_usuario

def iniciar_sesion(session: Session, datos: UserLogin) -> dict:
    """Valida credenciales de acceso y retorna un token JWT si son correctas."""
    statement = select(UsuarioSistemaModel).where(UsuarioSistemaModel.email == datos.correo)
    usuario = session.exec(statement).first()
    
    if not usuario or not verify_password(datos.password, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )
        
    if not usuario.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario se encuentra inactivo"
        )
    
    # Inclusión de claims clave dentro del payload del JWT (coincidiendo con las dependencias)
    token = crear_token({
        "sub": usuario.email,
        "rol_id": usuario.rol_id,
        "id": usuario.id
    })
    
    return {
        "access_token": token,
        "token_type": "bearer"
    }

def listar_usuarios(session: Session):
    """Retorna la lista completa de usuarios registrados en el sistema."""
    statement = select(UsuarioSistemaModel)
    return session.exec(statement).all()