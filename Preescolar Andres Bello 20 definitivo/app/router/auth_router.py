from fastapi import APIRouter, Depends, status, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from passlib.context import CryptContext

from app.config.database import get_session
from app.schemas.esq_auth import UserCreate, UserResponse, UserLogin, UserUpdate
from app.service import auth_service
from app.dependencias.auth_deps import requerir_rol, obtener_usuario_actual
from app.models.models import UsuarioSistemaModel, RolModel, AuditoriaLogModel

router = APIRouter(
    prefix="/api/auth",
    tags=["Autenticación y Usuarios"]
)

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(datos: UserCreate, session: Session = Depends(get_session)):
    """Cualquier usuario autorizado puede registrar un nuevo usuario en el sistema."""
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
    
    #  Registrar el inicio de sesión en auditoría (sin romper el login si falla)
    try:
        from app.service.auditoria_service import registrar_log
        from datetime import datetime, timezone
        
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
    """Retorna la lista de usuarios del sistema (Ruta protegida para Admins)."""
    return auth_service.listar_usuarios(session)


@router.get("/perfil")
def obtener_perfil(
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    """
    Ruta protegida que exige el token JWT en el encabezado 
    Authorization: Bearer <token>
    """
    return {
        "mensaje": "Acceso permitido",
        "usuario_correo": usuario_actual.get("sub"),
        "rol_id": usuario_actual.get("rol_id"),
        "id_usuario": usuario_actual.get("id")
    }


# ==========================================
# NUEVOS ENDPOINTS: EDITAR Y ELIMINAR USUARIO
# ==========================================

@router.patch("/usuarios/{usuario_id}")
def actualizar_usuario_parcial(
    request: Request,
    usuario_id: int,
    datos: UserUpdate,
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1]))  # Solo Admin
):
    """
    Actualiza parcialmente los datos de un usuario (Solo Admin).
    Permite cambiar nombre, email, contraseña o rol de forma independiente.
    """
    usuario = session.get(UsuarioSistemaModel, usuario_id)
    
    if not usuario or not usuario.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Usuario no encontrado o inactivo"
        )
    
    # Seguridad: No permitir que un usuario cambie su propio rol
    if usuario.id == usuario_actual.get("id") and datos.rol_id is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="No puedes cambiar tu propio rol"
        )
    
    try:
        if datos.nombre_completo is not None:
            usuario.nombre_completo = datos.nombre_completo
            
        if datos.email is not None:
            # Verificar que el email no esté en uso por otro usuario
            existe_email = session.exec(
                select(UsuarioSistemaModel).where(
                    UsuarioSistemaModel.email == datos.email,
                    UsuarioSistemaModel.id != usuario_id
                )
            ).first()
            if existe_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="El correo electrónico ya está en uso por otro usuario"
                )
            usuario.email = datos.email
            
        if datos.password is not None:
            # Hashear la nueva contraseña
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            usuario.password_hash = pwd_context.hash(datos.password)
            
        if datos.rol_id is not None:
            # Verificar que el rol exista
            rol = session.get(RolModel, datos.rol_id)
            if not rol:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="El rol especificado no existe"
                )
            usuario.rol_id = datos.rol_id
            
        if datos.is_active is not None:
            usuario.is_active = datos.is_active
            
        session.add(usuario)
        session.commit()
        session.refresh(usuario)
        
        return {
            "mensaje": "Usuario actualizado exitosamente",
            "id": usuario.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Error al actualizar: {str(e)}"
        )


@router.delete("/usuarios/{usuario_id}")
def eliminar_usuario(
    request: Request,
    usuario_id: int,
    session: Session = Depends(get_session),
    usuario_actual: dict = Depends(requerir_rol([1]))  # Solo Admin
):
    """
    Elimina (desactiva) un usuario del sistema usando soft delete (Solo Admin).
    No permite que el admin se elimine a sí mismo.
    """
    usuario = session.get(UsuarioSistemaModel, usuario_id)
    
    if not usuario or not usuario.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Usuario no encontrado o ya inactivo"
        )
    
    # Seguridad: No permitir que el admin se elimine a sí mismo
    if usuario.id == usuario_actual.get("id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="No puedes eliminar tu propia cuenta"
        )
    
    try:
        # Soft delete: marcar como inactivo en lugar de borrar físicamente
        usuario.is_active = False
        session.add(usuario)
        session.commit()
        
        return {
            "mensaje": "Usuario eliminado exitosamente",
            "id": usuario_id
        }
        
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Error al eliminar: {str(e)}"
        )
