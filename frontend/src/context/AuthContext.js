import { createContext, useContext, useState, useEffect } from 'react';
import { obtenerPerfil } from '../services/api';

const AuthContext = createContext();

const MAPEO_ROL = {
  1: 'admin',
  2: 'secretaria',
  3: 'directora',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        localStorage.removeItem('user_data');
        localStorage.removeItem('access_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (token) => {
    localStorage.setItem('access_token', token);
    try {
      const perfil = await obtenerPerfil();
      const userData = {
        id: perfil.id_usuario,
        email: perfil.usuario_correo,
        nombre: perfil.usuario_correo.split('@')[0], // Se puede mejorar si el backend devuelve nombre_completo
        rol_id: perfil.rol_id,
        rol: MAPEO_ROL[perfil.rol_id] || 'desconocido',
      };
      setUser(userData);
      localStorage.setItem('user_data', JSON.stringify(userData));
      return userData;
    } catch (error) {
      localStorage.removeItem('access_token');
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
  };

  const tienePermiso = (roles) => {
    if (!user) return false;
    if (user.rol === 'admin') return true;
    return roles.includes(user.rol);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, tienePermiso }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};