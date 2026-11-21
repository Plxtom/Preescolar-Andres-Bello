import { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, Trash2, X, Loader2, Users, Calendar, GraduationCap } from 'lucide-react';
import { 
  listarTodasSecciones, 
  listarPeriodos, 
  crearSeccion, 
  editarSeccion, 
  eliminarSeccion 
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

export default function Secciones() {
  const { tienePermiso } = useAuth();
  const [secciones, setSecciones] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);

  const [formData, setFormData] = useState({
    periodo_id: '',
    grado_id: '',
    nombre_seccion: '',
    capacidad_maxima: 20,
    docente_encargado: ''
  });

  // ✅ IDs numéricos que el backend espera
  const grados = [
    { id: 1, nombre: 'Maternal' },
    { id: 2, nombre: 'Pre-Jardín' },
    { id: 3, nombre: 'Jardín' },
    { id: 4, nombre: 'Pre-Escolar' }
  ];

  useEffect(() => {
    cargarPeriodos();
    cargarSecciones();
  }, []);

  const cargarPeriodos = async () => {
    try { setPeriodos(await listarPeriodos()); } catch (e) { console.error(e); }
  };

  const cargarSecciones = async () => {
    try { setSecciones(await listarTodasSecciones()); } catch (e) { toast.error('Error al cargar secciones'); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // ✅ Convertimos a números enteros antes de enviar
      const datosEnviar = {
        periodo_id: parseInt(formData.periodo_id),
        grado_id: parseInt(formData.grado_id),
        nombre_seccion: formData.nombre_seccion.trim(),
        capacidad_maxima: parseInt(formData.capacidad_maxima),
        docente_encargado: formData.docente_encargado.trim() || null
      };

      console.log('📤 Enviando datos:', datosEnviar);

      if (editando) {
        await editarSeccion(editando.id, datosEnviar);
        toast.success('¡Sección actualizada!');
      } else {
        await crearSeccion(datosEnviar);
        toast.success('¡Sección creada exitosamente!');
      }
      setModalAbierto(false);
      setEditando(null);
      setFormData({ periodo_id: '', grado_id: '', nombre_seccion: '', capacidad_maxima: 20, docente_encargado: '' });
      cargarSecciones();
    } catch (error) {
      console.error('❌ Error detallado:', error);
      toast.error(error.message || 'Error al guardar la sección');
    } finally {
      setLoading(false);
    }
  };

  const abrirEditar = (seccion) => {
    setEditando(seccion);
    setFormData({
      periodo_id: seccion.periodo_id || '',
      grado_id: seccion.grado_id || '',
      nombre_seccion: seccion.nombre_seccion || '',
      capacidad_maxima: seccion.capacidad_maxima || 20,
      docente_encargado: seccion.docente_encargado || ''
    });
    setModalAbierto(true);
  };

  const handleEliminar = async (id, nombre) => {
    const result = await Swal.fire({
      title: '¿Eliminar sección?',
      text: `Se eliminará la sección "${nombre}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await eliminarSeccion(id);
        toast.success('Sección eliminada');
        cargarSecciones();
      } catch (error) {
        toast.error(error.message || 'Error al eliminar');
      }
    }
  };

  const getNombreGrado = (gradoId) => {
    const grado = grados.find(g => g.id === gradoId);
    return grado ? grado.nombre : 'N/A';
  };

  const getNombrePeriodo = (periodoId) => {
    const periodo = periodos.find(p => p.id === periodoId);
    return periodo ? periodo.nombre : 'N/A';
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <BookOpen className="text-blue-600" size={32} />
            Secciones
          </h2>
          <p className="text-gray-500 mt-1">{secciones.length} secciones registradas</p>
        </div>
        {tienePermiso(['admin', 'directora']) && (
          <button 
            onClick={() => { 
              setEditando(null); 
              setFormData({ periodo_id: '', grado_id: '', nombre_seccion: '', capacidad_maxima: 20, docente_encargado: '' }); 
              setModalAbierto(true); 
            }} 
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={18} /> Nueva Sección
          </button>
        )}
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Período</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Capacidad</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Docente</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!Array.isArray(secciones) || secciones.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-500">No hay secciones registradas</td>
                </tr>
              ) : (
                secciones.map((sec) => (
                  <tr key={sec.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <BookOpen size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {getNombreGrado(sec.grado_id)} - {sec.nombre_seccion}
                          </p>
                          <p className="text-xs text-gray-500">ID: {sec.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                        {getNombrePeriodo(sec.periodo_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 flex items-center gap-2">
                      <Users size={14} className="text-gray-400" />
                      {sec.capacidad_maxima} estudiantes
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{sec.docente_encargado || 'Sin asignar'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {tienePermiso(['admin', 'directora']) && (
                          <button 
                            onClick={() => abrirEditar(sec)} 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {tienePermiso(['admin']) && (
                          <button 
                            onClick={() => handleEliminar(sec.id, `${getNombreGrado(sec.grado_id)} - ${sec.nombre_seccion}`)} 
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                            title="Eliminar"
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

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-xl font-bold text-gray-800">
                {editando ? 'Editar Sección' : 'Nueva Sección'}
              </h3>
              <button onClick={() => { setModalAbierto(false); setEditando(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="flex text-sm font-bold text-gray-700 mb-2 items-center gap-2">
                  <Calendar size={16} className="text-purple-600" />
                  Período Académico
                </label>
                <select
                  name="periodo_id"
                  value={formData.periodo_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Seleccione un período...</option>
                  {Array.isArray(periodos) && periodos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} {p.activo ? '(Actual)' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex text-sm font-bold text-gray-700 mb-2 items-center gap-2">
                  <GraduationCap size={16} className="text-blue-600" />
                  Nivel / Grado
                </label>
                <select
                  name="grado_id"
                  value={formData.grado_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Seleccione un grado...</option>
                  {grados.map(g => (
                    <option key={g.id} value={g.id}>{g.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nombre de la Sección</label>
                <input
                  type="text"
                  name="nombre_seccion"
                  value={formData.nombre_seccion}
                  onChange={handleChange}
                  required
                  placeholder="Ej: A, B, C, 1, 2..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="flex text-sm font-bold text-gray-700 mb-2 items-center gap-2">
                  <Users size={16} className="text-emerald-600" />
                  Capacidad Máxima
                </label>
                <input
                  type="number"
                  name="capacidad_maxima"
                  value={formData.capacidad_maxima}
                  onChange={handleChange}
                  required
                  min="1"
                  max="50"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Docente Encargado</label>
                <input
                  type="text"
                  name="docente_encargado"
                  value={formData.docente_encargado}
                  onChange={handleChange}
                  placeholder="Ej: Profe. María Rodríguez"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
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
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <BookOpen size={18} />}
                  {editando ? 'Actualizar Sección' : 'Crear Sección'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}