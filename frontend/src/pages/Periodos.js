import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export default function Periodos() {
  const { tienePermiso } = useAuth();
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    fecha_inicio: '',
    fecha_fin: '',
    activo: false
  });

  useEffect(() => {
    cargarPeriodos();
  }, []);

  const cargarPeriodos = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/periodos/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setPeriodos(data);
    } catch (error) {
      toast.error('Error al cargar períodos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const url = editando ? `${API_BASE_URL}/periodos/${editando.id}` : `${API_BASE_URL}/periodos/`;
      const method = editando ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Error al guardar');
      
      toast.success(editando ? 'Período actualizado' : 'Período creado');
      setModalAbierto(false);
      setFormData({ nombre: '', fecha_inicio: '', fecha_fin: '', activo: false });
      setEditando(null);
      cargarPeriodos();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEliminar = async (id, nombre) => {
    const result = await Swal.fire({
      title: '¿Eliminar período?',
      text: `Se desactivará el período "${nombre}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'Sí, eliminar'
    });
    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('access_token');
        await fetch(`${API_BASE_URL}/periodos/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Período eliminado');
        cargarPeriodos();
      } catch (error) {
        toast.error('Error al eliminar');
      }
    }
  };

  const handleActivar = async (id, nombre) => {
    const result = await Swal.fire({
      title: '¿Activar período?',
      text: `Se activará "${nombre}" y se desactivarán los demás.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      confirmButtonText: 'Sí, activar'
    });
    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('access_token');
        await fetch(`${API_BASE_URL}/periodos/${id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ activo: true })
        });
        toast.success('Período activado');
        cargarPeriodos();
      } catch (error) {
        toast.error('Error al activar');
      }
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Períodos Académicos</h2>
          <p className="text-gray-500">Gestión de años y períodos escolares</p>
        </div>
        {tienePermiso(['admin', 'directora']) && (
          <button onClick={() => { setEditando(null); setFormData({ nombre: '', fecha_inicio: '', fecha_fin: '', activo: false }); setModalAbierto(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2">
            <Plus size={18} />
            Nuevo Período
          </button>
        )}
      </header>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Inicio</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Fin</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {periodos.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-12 text-gray-500">No hay períodos registrados</td></tr>
              ) : (
                periodos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-800">{p.nombre}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(p.fecha_inicio).toLocaleDateString('es-VE')}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(p.fecha_fin).toLocaleDateString('es-VE')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${p.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {p.activo ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {tienePermiso(['admin', 'directora']) && (
                          <>
                            <button onClick={() => { setEditando(p); setFormData({ nombre: p.nombre, fecha_inicio: p.fecha_inicio, fecha_fin: p.fecha_fin, activo: p.activo }); setModalAbierto(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                              <Edit2 size={16} />
                            </button>
                            {!p.activo && (
                              <button onClick={() => handleActivar(p.id, p.nombre)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Activar">
                                <Calendar size={16} />
                              </button>
                            )}
                          </>
                        )}
                        {tienePermiso(['admin']) && (
                          <button onClick={() => handleEliminar(p.id, p.nombre)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">{editando ? 'Editar Período' : 'Nuevo Período'}</h3>
              <button onClick={() => setModalAbierto(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Período</label>
                <input type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} placeholder="Ej. 2025-2026" required className="w-full px-4 py-2 rounded-xl border border-gray-200" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Fecha de Inicio</label>
                <input type="date" value={formData.fecha_inicio} onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})} required className="w-full px-4 py-2 rounded-xl border border-gray-200" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Fecha de Fin</label>
                <input type="date" value={formData.fecha_fin} onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})} required className="w-full px-4 py-2 rounded-xl border border-gray-200" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.activo} onChange={(e) => setFormData({...formData, activo: e.target.checked})} className="w-5 h-5 rounded" />
                <span className="text-sm font-semibold">Período activo</span>
              </label>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setModalAbierto(false)} className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700">
                  {editando ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}