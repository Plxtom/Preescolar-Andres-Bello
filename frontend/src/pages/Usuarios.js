import { useState, useEffect } from 'react';
import { Settings, UserPlus, Edit2, Trash2, X, Loader2, Shield } from 'lucide-react';
import { crearUsuario, listarUsuarios, editarUsuario, eliminarUsuario } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

export default function Usuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    password: '',
    rol_id: 2
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

  const handleCrear = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await crearUsuario(formData);
      toast.success('Usuario creado exitosamente');
      setModalCrear(false);
      setFormData({ nombre_completo: '', email: '', password: '', rol_id: 2 });
      cargarUsuarios();
    } catch (error) {
      let mensajeError = 'Error al crear usuario';
      if (error.message) {
        mensajeError = error.message;
      } else if (error.detail) {
        mensajeError = typeof error.detail === 'string' 
          ? error.detail 
          : JSON.stringify(error.detail);
      } else if (typeof error === 'object') {
        mensajeError = error.detail?.msg || error.detail?.message || JSON.stringify(error);
      }
      toast.error(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await editarUsuario(usuarioSeleccionado.id, formData);
      toast.success('Usuario actualizado');
      setModalEditar(false);
      setUsuarioSeleccionado(null);
      setFormData({ nombre_completo: '', email: '', password: '', rol_id: 2 });
      cargarUsuarios();
    } catch (error) {
      let mensajeError = 'Error al actualizar';
      if (error.message) {
        mensajeError = error.message;
      } else if (typeof error === 'object' && error.detail) {
        mensajeError = typeof error.detail === 'string' 
          ? error.detail 
          : JSON.stringify(error.detail);
      }
      toast.error(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id, nombre) => {
    const result = await Swal.fire({
      title: '¿Eliminar usuario?',
      text: `Se eliminará al usuario "${nombre}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await eliminarUsuario(id);
        toast.success('Usuario eliminado');
        cargarUsuarios();
      } catch (error) {
        let mensajeError = 'Error al eliminar';
        if (error.message) {
          mensajeError = error.message;
        }
        toast.error(mensajeError);
      }
    }
  };

  const abrirEditar = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setFormData({
      nombre_completo: usuario.nombre_completo,
      email: usuario.email,
      password: '',
      rol_id: usuario.rol_id
    });
    setModalEditar(true);
  };

  const colorRol = (rolId) => {
    const colores = { 1: 'bg-red-100 text-red-700', 2: 'bg-blue-100 text-blue-700', 3: 'bg-purple-100 text-purple-700' };
    return colores[rolId] || 'bg-gray-100 text-gray-700';
  };

  const nombreRol = (rolId) => {
    const nombres = { 1: 'Administrador', 2: 'Secretaria', 3: 'Directora' };
    return nombres[rolId] || 'Desconocido';
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h2>
          <p className="text-gray-500">Administrar cuentas del sistema</p>
        </div>
        <button onClick={() => setModalCrear(true)} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2">
          <UserPlus size={18} />
          Nuevo Usuario
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Rol</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-semibold text-gray-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-xs">{u.nombre_completo?.charAt(0).toUpperCase()}</span>
                  </div>
                  {u.nombre_completo}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${colorRol(u.rol_id)}`}>
                    {nombreRol(u.rol_id)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => abrirEditar(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar">
                      <Edit2 size={16} />
                    </button>
                    {u.id !== user?.id && (
                      <button onClick={() => handleEliminar(u.id, u.nombre_completo)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalCrear && (
        <ModalUsuario 
          titulo="Crear Nuevo Usuario" 
          formData={formData} 
          setFormData={setFormData} 
          onSubmit={handleCrear} 
          onClose={() => setModalCrear(false)} 
          loading={loading} 
          esEditar={false} 
        />
      )}

      {modalEditar && (
        <ModalUsuario 
          titulo="Editar Usuario" 
          formData={formData} 
          setFormData={setFormData} 
          onSubmit={handleEditar} 
          onClose={() => setModalEditar(false)} 
          loading={loading} 
          esEditar={true} 
        />
      )}
    </div>
  );
}

function ModalUsuario({ titulo, formData, setFormData, onSubmit, onClose, loading, esEditar }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold">{titulo}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
            <input 
              type="text" 
              value={formData.nombre_completo} 
              onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} 
              required 
              className="w-full px-4 py-2 rounded-xl border border-gray-200" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
              required 
              className="w-full px-4 py-2 rounded-xl border border-gray-200" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Contraseña {esEditar && <span className="text-xs font-normal text-gray-500">(Dejar vacío para no cambiar)</span>}
            </label>
            <input 
              type="password" 
              value={formData.password} 
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
              required={!esEditar} 
              minLength={8}
              placeholder={esEditar ? "Mínimo 8 caracteres (opcional)" : "Mínimo 8 caracteres"}
              className="w-full px-4 py-2 rounded-xl border border-gray-200" 
            />
            <p className="text-xs text-gray-500 mt-1">
              {esEditar ? 'Dejar vacío para mantener la contraseña actual' : 'Mínimo 8 caracteres'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Rol</label>
            <select 
              value={formData.rol_id} 
              onChange={(e) => setFormData({...formData, rol_id: parseInt(e.target.value)})} 
              className="w-full px-4 py-2 rounded-xl border border-gray-200"
            >
              <option value={1}>Administrador</option>
              <option value={2}>Secretaria</option>
              <option value={3}>Directora</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Shield size={16} />}
              {esEditar ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}