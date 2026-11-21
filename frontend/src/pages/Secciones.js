import { useState, useEffect } from 'react';
import { GraduationCap, Plus, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export default function Secciones() {
  const { tienePermiso } = useAuth();
  const [secciones, setSecciones] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    periodo_id: '',
    grado_id: '',
    nombre_seccion: '',
    capacidad_maxima: 20,
    docente_encargado: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [secRes, perRes, nivRes] = await Promise.all([
        fetch(`${API_BASE_URL}/periodos/secciones/todas`, { headers }),
        fetch(`${API_BASE_URL}/periodos/`, { headers }),
        fetch(`${API_BASE_URL}/periodos/niveles/`, { headers })
      ]);
      
      setSecciones(await secRes.json());
      setPeriodos(await perRes.json());
      setNiveles(await nivRes.json());
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/periodos/secciones/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          periodo_id: parseInt(formData.periodo_id),
          grado_id: parseInt(formData.grado_id),
          capacidad_maxima: parseInt(formData.capacidad_maxima)
        })
      });
      if (!response.ok) throw new Error('Error al guardar');
      toast.success('Sección creada');
      setModalAbierto(false);
      setFormData({ periodo_id: '', grado_id: '', nombre_seccion: '', capacidad_maxima: 20, docente_encargado: '' });
      cargarDatos();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEliminar = async (id, nombre) => {
    const result = await Swal.fire({
      title: '¿Eliminar sección?',
      text: `Se desactivará "${nombre}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'Sí, eliminar'
    });
    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('access_token');
        await fetch(`${API_BASE_URL}/secciones/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Sección eliminada');
        cargarDatos();
      } catch (error) {
        toast.error('Error al eliminar');
      }
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Secciones</h2>
          <p className="text-gray-500">{secciones.length} secciones registradas</p>
        </div>
        {tienePermiso(['admin', 'directora']) && (
          <button onClick={() => setModalAbierto(true)} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2">
            <Plus size={18} />
            Nueva Sección
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
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Período</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Capacidad</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Docente</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {secciones.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-12 text-gray-500">No hay secciones</td></tr>
              ) : (
                secciones.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-800">{s.nombre}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{s.periodo_nombre}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{s.capacidad_maxima} estudiantes</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{s.docente_encargado || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {tienePermiso(['admin']) && (
                          <button onClick={() => handleEliminar(s.id, s.nombre)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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
              <h3 className="text-xl font-bold">Nueva Sección</h3>
              <button onClick={() => setModalAbierto(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Período Académico</label>
                <select value={formData.periodo_id} onChange={(e) => setFormData({...formData, periodo_id: e.target.value})} required className="w-full px-4 py-2 rounded-xl border border-gray-200">
                  <option value="">Seleccione...</option>
                  {periodos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nivel / Grado</label>
                <select value={formData.grado_id} onChange={(e) => setFormData({...formData, grado_id: e.target.value})} required className="w-full px-4 py-2 rounded-xl border border-gray-200">
                  <option value="">Seleccione...</option>
                  {niveles.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre de la Sección</label>
                <input type="text" value={formData.nombre_seccion} onChange={(e) => setFormData({...formData, nombre_seccion: e.target.value})} placeholder="Ej. A, B, Única" required className="w-full px-4 py-2 rounded-xl border border-gray-200" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Capacidad Máxima</label>
                <input type="number" value={formData.capacidad_maxima} onChange={(e) => setFormData({...formData, capacidad_maxima: e.target.value})} min="1" required className="w-full px-4 py-2 rounded-xl border border-gray-200" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Docente Encargado</label>
                <input type="text" value={formData.docente_encargado} onChange={(e) => setFormData({...formData, docente_encargado: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-200" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setModalAbierto(false)} className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700">Crear Sección</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}