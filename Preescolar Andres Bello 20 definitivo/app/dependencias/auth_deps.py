from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt.exceptions import InvalidTokenError
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "clave_secreta_temporal_preescolar")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Ruta de donde FastAPI obtendrá el token en Swagger UI
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def obtener_usuario_actual(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Valida el token JWT, lo decodifica y devuelve el payload con la información del usuario.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        correo = payload.get("sub")
        rol_id = payload.get("rol_id")
        
        if correo is None or rol_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: faltan datos de usuario o rol"
            )
            
        return payload
        
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudo validar el token o ha expirado"
        )

def requerir_rol(roles_permitidos: list[int]):
    """
    Valida que el usuario autenticado posea al menos uno de los IDs de rol permitidos.
    Ejemplo de uso en un endpoint: @router.get("/", dependencies=[Depends(requerir_rol([1, 2]))])
    """
    def rol_checker(current_user: dict = Depends(obtener_usuario_actual)):
        rol_usuario = current_user.get("rol_id")
        
        if rol_usuario not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos suficientes para realizar esta acción"
            )
        return current_user
    return rol_checker