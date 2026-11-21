import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, X, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { listarPeriodos, crearPeriodo, editarPeriodo, eliminarPeriodo } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

export default function Periodos() {
  const { tienePermiso } = useAuth();
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(false);
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
      const data = await listarPeriodos();
      // ✅ BLINDAJE: Aseguramos que siempre sea un array, incluso si el backend falla
      setPeriodos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar períodos:', error);
      toast.error('Error al cargar los períodos');
      setPeriodos([]); // Fallback a array vacío para evitar el crash
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editando) {
        await editarPeriodo(editando.id, formData);
        toast.success('¡Período actualizado!');
      } else {
        await crearPeriodo(formData);
        toast.success('¡Período creado exitosamente!');
      }
      setModalAbierto(false);
      setEditando(null);
      setFormData({ nombre: '', fecha_inicio: '', fecha_fin: '', activo: false });
      cargarPeriodos();
    } catch (error) {
      console.error('❌ Error:', error);
      toast.error(error.message || 'Error al guardar el período');
    } finally {
      setLoading(false);
    }
  };

  const abrirEditar = (periodo) => {
    setEditando(periodo);
    setFormData({
      nombre: periodo.nombre || '',
      fecha_inicio: periodo.fecha_inicio ? periodo.fecha_inicio.split('T')[0] : '',
      fecha_fin: periodo.fecha_fin ? periodo.fecha_fin.split('T')[0] : '',
      activo: periodo.activo || false
    });
    setModalAbierto(true);
  };

  const handleEliminar = async (id, nombre) => {
    const result = await Swal.fire({
      title: '¿Desactivar período?',
      text: `Se marcará como inactivo el período "${nombre}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await eliminarPeriodo(id);
        toast.success('Período desactivado');
        cargarPeriodos();
      } catch (error) {
        toast.error(error.message || 'Error al desactivar');
      }
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Calendar className="text-blue-600" size={32} />
            Períodos Académicos
          </h2>
          <p className="text-gray-500 mt-1">Gestiona los años y ciclos escolares</p>
        </div>
        {tienePermiso(['admin', 'directora']) && (
          <button 
            onClick={() => { 
              setEditando(null); 
              setFormData({ nombre: '', fecha_inicio: '', fecha_fin: '', activo: false }); 
              setModalAbierto(true); 
            }} 
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={18} /> Nuevo Período
          </button>
        )}
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Fecha Inicio</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Fecha Fin</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* ✅ BLINDAJE: Verificamos que sea un array antes de hacer .map() */}
              {!Array.isArray(periodos) || periodos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-500">No hay períodos registrados</td>
                </tr>
              ) : (
                periodos.map((per) => (
                  <tr key={per.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Calendar size={18} className="text-purple-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{per.nombre}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {per.fecha_inicio ? new Date(per.fecha_inicio).toLocaleDateString('es-VE') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {per.fecha_fin ? new Date(per.fecha_fin).toLocaleDateString('es-VE') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {per.activo ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                          <CheckCircle size={12} /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
                          <XCircle size={12} /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {tienePermiso(['admin', 'directora']) && (
                          <button 
                            onClick={() => abrirEditar(per)} 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {tienePermiso(['admin']) && (
                          <button 
                            onClick={() => handleEliminar(per.id, per.nombre)} 
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                            title="Desactivar"
                          >
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
      </div>

      {/* MODAL CREAR/EDITAR */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-xl font-bold text-gray-800">
                {editando ? 'Editar Período' : 'Nuevo Período'}
              </h3>
              <button onClick={() => { setModalAbierto(false); setEditando(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nombre del Período</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Ej: 2026-2027"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Fecha de Inicio</label>
                  <input
                    type="date"
                    name="fecha_inicio"
                    value={formData.fecha_inicio}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Fecha de Fin</label>
                  <input
                    type="date"
                    name="fecha_fin"
                    value={formData.fecha_fin}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  name="activo"
                  id="activo"
                  checked={formData.activo}
                  onChange={handleChange}
                  className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="activo" className="text-sm font-bold text-gray-700 cursor-pointer">
                  Marcar como período activo actual
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setModalAbierto(false); setEditando(null); }}
                  className="px-6 py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Calendar size={18} />}
                  {editando ? 'Actualizar Período' : 'Crear Período'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}