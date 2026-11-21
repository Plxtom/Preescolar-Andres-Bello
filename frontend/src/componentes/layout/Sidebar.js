import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  Baby, 
  Calendar, 
  BookOpen 
} from 'lucide-react';

// Definición del menú con sus roles permitidos
const menuItems = [
  { 
    name: 'Dashboard', 
    path: '/', 
    icon: LayoutDashboard, 
    roles: ['admin', 'directora'] 
  },
  { 
    name: 'Inscripciones', 
    path: '/inscripciones', 
    icon: Users, 
    roles: ['admin', 'directora', 'secretaria'] 
  },
  { 
    name: 'Matrículas', 
    path: '/matriculas', 
    icon: GraduationCap, 
    roles: ['admin', 'directora', 'secretaria'] 
  },
  { 
    name: 'Períodos', 
    path: '/periodos', 
    icon: Calendar, 
    roles: ['admin', 'directora'] 
  },
  { 
    name: 'Secciones', 
    path: '/secciones', 
    icon: BookOpen, 
    roles: ['admin', 'directora', 'secretaria'] 
  },
  { 
    name: 'Auditoría', 
    path: '/auditoria', 
    icon: ShieldCheck, 
    roles: ['admin', 'directora'] 
  },
  { 
    name: 'Usuarios', 
    path: '/usuarios', 
    icon: Settings, 
    roles: ['admin'] 
  },
];

export default function Sidebar() {
  const { user, logout, tienePermiso } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Colores según el rol del usuario
  const colorRol = {
    admin: 'bg-red-100 text-red-700',
    directora: 'bg-purple-100 text-purple-700',
    secretaria: 'bg-blue-100 text-blue-700',
  };

  return (
    <aside className="w-64 bg-white h-screen shadow-xl flex flex-col sticky top-0">
      {/* Header del Sidebar */}
      <div className="p-6 text-center border-b border-gray-100">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Baby className="text-blue-600" size={32} />
          <h1 className="text-xl font-extrabold text-blue-600">
            C.E.I. Andrés Bello
          </h1>
        </div>
        <p className="text-xs text-gray-500">San Cristóbal, Táchira</p>
        <span className={`inline-block mt-3 px-3 py-1 text-xs font-bold rounded-full uppercase ${colorRol[user?.rol]}`}>
          {user?.rol}
        </span>
      </div>

      {/* Menú de navegación */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          // Ocultar opción si el usuario no tiene el rol permitido
          if (!tienePermiso(item.roles)) return null;

          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
              }`}
            >
              <item.icon size={20} />
              <span className="font-semibold">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer con información del usuario y logout */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-bold">
              {user?.nombre?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">
              {user?.nombre}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 w-full text-red-500 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut size={18} />
          <span className="font-semibold text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}