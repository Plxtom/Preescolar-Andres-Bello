import { useState, useEffect } from 'react';
import { Search, Edit2, Loader2, X, Save, GraduationCap, User, Calendar, BookOpen } from 'lucide-react';
import { 
  listarInscripciones, 
  actualizarInscripcionParcial, 
  listarPeriodos, 
  listarSeccionesPorPeriodo 
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Matriculas() {
  const { tienePermiso } = useAuth();
  const [matriculas, setMatriculas] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [modalEditar, setModalEditar] = useState(false);
  const [matriculaSeleccionada, setMatriculaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    periodo_id: '',
    seccion_id: '',
    estatus: 'ACTIVO',
    observaciones_inscripcion: ''
  });

  useEffect(() => {
    cargarPeriodos();
    cargarMatriculas();
  }, []);

  const cargarPeriodos = async () => {
    try { setPeriodos(await listarPeriodos()); } catch (e) { console.error(e); }
  };

  const cargarSecciones = async (periodoId) => {
    if (!periodoId) { setSecciones([]); return; }
    try { setSecciones(await listarSeccionesPorPeriodo(periodoId)); } catch (e) { toast.error('Error al cargar secciones'); }
  };

  const cargarMatriculas = async () => {
    try { setMatriculas(await listarInscripciones()); } catch (e) { toast.error('Error al cargar matrículas'); }
  };

  const abrirEditar = (mat) => {
    setMatriculaSeleccionada(mat);
    setFormData({
      periodo_id: mat.periodo_id || '',
      seccion_id: mat.seccion_id || '',
      estatus: mat.estatus || 'ACTIVO',
      observaciones_inscripcion: mat.observaciones_inscripcion || ''
    });
    if (mat.periodo_id) cargarSecciones(mat.periodo_id);
    setModalEditar(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'periodo_id') {
      cargarSecciones(value);
      setFormData(prev => ({ ...prev, seccion_id: '' }));
    }
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await actualizarInscripcionParcial(matriculaSeleccionada.id, formData);
      toast.success('¡Matrícula actualizada!');
      setModalEditar(false);
      setMatriculaSeleccionada(null);
      cargarMatriculas();
    } catch (error) {
      console.error('❌ Error:', error);
      toast.error(error.message || 'Error al actualizar la matrícula');
    } finally {
      setLoading(false);
    }
  };

  const handleCambioRapido = async (id, nuevoEstatus, nombre) => {
    if (!window.confirm(`¿Cambiar el estatus de ${nombre} a "${nuevoEstatus}"?`)) return;
    try {
      await actualizarInscripcionParcial(id, { estatus: nuevoEstatus });
      toast.success(`Estatus cambiado a ${nuevoEstatus}`);
      cargarMatriculas();
    } catch (error) {
      toast.error(error.message || 'Error al cambiar estatus');
    }
  };

  const matriculasFiltradas = matriculas.filter(m => {
    const textoBusqueda = `${m.estudiante_nombres} ${m.estudiante_apellidos} ${m.representante_nombres} ${m.representante_apellidos}`.toLowerCase();
    const coincideBusqueda = textoBusqueda.includes(busqueda.toLowerCase());
    const coincidePeriodo = !filtroPeriodo || String(m.periodo_id) === String(filtroPeriodo);
    const coincideEstatus = !filtroEstatus || m.estatus === filtroEstatus;
    return coincideBusqueda && coincidePeriodo && coincideEstatus;
  });

  const colorEstatus = (estatus) => {
    const colores = {
      ACTIVO: 'bg-emerald-100 text-emerald-700',
      INACTIVO: 'bg-amber-100 text-amber-700',
      RETIRADO: 'bg-red-100 text-red-700',
      TRANSFERIDO: 'bg-purple-100 text-purple-700',
      ELIMINADO: 'bg-gray-100 text-gray-700'
    };
    return colores[estatus] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <GraduationCap className="text-blue-600" size={32} />
          Gestión de Matrículas
        </h2>
        <p className="text-gray-500 mt-1">Administra las asignaciones académicas y estatus de los estudiantes</p>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por estudiante o representante..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <select
          value={filtroPeriodo}
          onChange={(e) => setFiltroPeriodo(e.target.value)}
          className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Todos los períodos</option>
          {periodos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <select
          value={filtroEstatus}
          onChange={(e) => setFiltroEstatus(e.target.value)}
          className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Todos los estatus</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
          <option value="RETIRADO">Retirado</option>
          <option value="TRANSFERIDO">Transferido</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Estudiante</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Representante</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Período</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Sección</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Estatus</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {matriculasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-500">No hay matrículas que coincidan con los filtros</td>
                </tr>
              ) : (
                matriculasFiltradas.map((mat) => (
                  <tr key={mat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <User size={18} className="text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {mat.estudiante_nombres} {mat.estudiante_apellidos}
                          </p>
                          <p className="text-xs text-gray-500">
                            Cédula: {mat.estudiante_cedula || 'Sin cédula'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {mat.representante_nombres} {mat.representante_apellidos}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                        {mat.periodo_nombre}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{mat.seccion_nombre}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${colorEstatus(mat.estatus)}`}>
                        {mat.estatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {tienePermiso(['admin', 'directora', 'secretaria']) && (
                          <button
                            onClick={() => abrirEditar(mat)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar matrícula"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {tienePermiso(['admin', 'directora']) && mat.estatus === 'ACTIVO' && (
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleCambioRapido(mat.id, e.target.value, `${mat.estudiante_nombres} ${mat.estudiante_apellidos}`);
                                e.target.value = '';
                              }
                            }}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:bg-gray-50"
                            defaultValue=""
                          >
                            <option value="" disabled>Cambiar a...</option>
                            <option value="RETIRADO">Retirar</option>
                            <option value="TRANSFERIDO">Transferir</option>
                            <option value="INACTIVO">Inactivar</option>
                          </select>
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

      {modalEditar && matriculaSeleccionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Editar Matrícula</h3>
              <button onClick={() => setModalEditar(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                <p className="text-xs font-bold text-blue-600 uppercase mb-1">Estudiante</p>
                <p className="text-lg font-bold text-gray-800">
                  {matriculaSeleccionada.estudiante_nombres} {matriculaSeleccionada.estudiante_apellidos}
                </p>
                <p className="text-sm text-gray-600">
                  Representante: {matriculaSeleccionada.representante_nombres} {matriculaSeleccionada.representante_apellidos}
                </p>
              </div>

              <form onSubmit={handleGuardar} className="space-y-5">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
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
                    {periodos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} {p.activo ? '(Actual)' : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <BookOpen size={16} className="text-blue-600" />
                    Sección
                  </label>
                  <select
                    name="seccion_id"
                    value={formData.seccion_id}
                    onChange={handleChange}
                    required
                    disabled={!formData.periodo_id}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Seleccione una sección...</option>
                    {secciones.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre} ({s.inscritos}/{s.capacidad_maxima})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Estatus</label>
                  <select
                    name="estatus"
                    value={formData.estatus}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                    <option value="RETIRADO">Retirado</option>
                    <option value="TRANSFERIDO">Transferido</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Observaciones de la Matrícula</label>
                  <textarea
                    name="observaciones_inscripcion"
                    value={formData.observaciones_inscripcion}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Notas administrativas sobre la matrícula..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setModalEditar(false)}
                    className="px-6 py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}