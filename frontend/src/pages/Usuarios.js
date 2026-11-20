import { useState, useEffect } from 'react';
import { Settings, UserPlus, Loader2, Shield } from 'lucide-react';
import { crearUsuario, listarUsuarios } from '../services/api';
import toast from 'react-hot-toast';

// Mapeo inverso: string -> rol_id
const ROLES = [
  { id: 1, nombre: 'Administrador' },
  { id: 2, nombre: 'Secretaria' },
  { id: 3, nombre: 'Directora' },
];

// Mapeo de rol_id a string para mostrar
const MAPEO_ROL = {
  1: 'admin',
  2: 'secretaria',
  3: 'directora',
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    password: '',
    rol_id: 2  // Por defecto Secretaria
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const data = await listarUsuarios();
      setUsuarios(data);
    } catch (error) {
      toast.error('Error al cargar usuarios');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await crearUsuario(formData);
      toast.success('Usuario creado exitosamente');
      setFormData({ nombre_completo: '', email: '', password: '', rol_id: 2 });
      setMostrarForm(false);
      cargarUsuarios();
    } catch (error) {
      toast.error(error.message || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  const colorRol = (rolId) => {
    const rol = MAPEO_ROL[rolId];
    const colores = {
      admin: 'bg-red-100 text-red-700',
      directora: 'bg-purple-100 text-purple-700',
      secretaria: 'bg-blue-100 text-blue-700',
    };
    return colores[rol] || 'bg-gray-100 text-gray-700';
  };

  const nombreRol = (rolId) => {
    return ROLES.find(r => r.id === rolId)?.nombre || 'Desconocido';
  };

  return (
    <div className="p-8 bg-preescolar-background min-h-screen">
      <header className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-preescolar-primary/10 rounded-xl">
            <Settings className="text-preescolar-primary" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-preescolar-text">Gestión de Usuarios</h2>
            <p className="text-gray-500">Crear y administrar cuentas del sistema</p>
          </div>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus size={18} />
          {mostrarForm ? 'Cancelar' : 'Nuevo Usuario'}
        </button>
      </header>

      {mostrarForm && (
        <div className="card mb-6 max-w-2xl">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Crear Nuevo Usuario</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
              <input
                type="text"
                value={formData.nombre_completo}
                onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Rol</label>
              <select
                value={formData.rol_id}
                onChange={(e) => setFormData({ ...formData, rol_id: parseInt(e.target.value) })}
                className="input-field"
              >
                {ROLES.map(rol => (
                  <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
              {loading ? 'Creando...' : 'Crear Usuario'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-8 text-gray-500">
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-preescolar-primary/10 flex items-center justify-center">
                        <span className="text-preescolar-primary font-bold text-xs">
                          {u.nombre_completo?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {u.nombre_completo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${colorRol(u.rol_id)}`}>
                        <Shield size={12} />
                        {nombreRol(u.rol_id)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}