import { useState, useEffect } from 'react';
import { GraduationCap, Edit2, Search, Filter, Loader2, X, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export default function Matriculas() {
  const { tienePermiso } = useAuth();
  const [matriculas, setMatriculas] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  
  // Filtros
  const [filtroPeriodo, setFiltroPeriodo] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Formulario de edición
  const [formData, setFormData] = useState({
    seccion_id: '',
    estatus: '',
    observaciones_inscripcion: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [matRes, perRes] = await Promise.all([
        fetch(`${API_BASE_URL}/inscripciones/`, { headers }), // Usamos el endpoint de inscripciones que trae todo
        fetch(`${API_BASE_URL}/periodos/`, { headers })
      ]);

      setMatriculas(await matRes.json());
      setPeriodos(await perRes.json());
    } catch (error) {
      toast.error('Error al cargar matrículas');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalEditar = (mat) => {
    setEditando(mat);
    setFormData({
      seccion_id: mat.seccion_id,
      estatus: mat.estatus,
      observaciones_inscripcion: mat.observaciones_inscripcion || ''
    });
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/inscripciones/${editando.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Error al actualizar');
      
      toast.success('Matrícula actualizada correctamente');
      setModalAbierto(false);
      cargarDatos();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCambiarEstatus = async (id, nuevoEstatus, nombre) => {
    const result = await Swal.fire({
      title: 'Cambiar estatus',
      text: `¿Marcar a ${nombre} como "${nuevoEstatus}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, cambiar'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('access_token');
        await fetch(`${API_BASE_URL}/inscripciones/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ estatus: nuevoEstatus })
        });
        toast.success(`Estatus cambiado a ${nuevoEstatus}`);
        cargarDatos();
      } catch (error) {
        toast.error('Error al cambiar estatus');
      }
    }
  };

  // Filtrado en el frontend
  const matriculasFiltradas = matriculas.filter(m => {
    const coincidePeriodo = !filtroPeriodo || m.periodo_id == filtroPeriodo;
    const coincideEstatus = !filtroEstatus || m.estatus === filtroEstatus;
    const coincideBusqueda = !busqueda || 
      `${m.estudiante_nombres} ${m.estudiante_apellidos}`.toLowerCase().includes(busqueda.toLowerCase()) ||
      `${m.representante_nombres} ${m.representante_apellidos}`.toLowerCase().includes(busqueda.toLowerCase());
    return coincidePeriodo && coincideEstatus && coincideBusqueda;
  });

  const getEstatusColor = (estatus) => {
    switch(estatus) {
      case 'ACTIVO': return 'bg-emerald-100 text-emerald-700';
      case 'INACTIVO': return 'bg-gray-100 text-gray-600';
      case 'RETIRADO': return 'bg-red-100 text-red-700';
      case 'GRADUADO': return 'bg-blue-100 text-blue-700';
      case 'TRANSFERIDO': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Gestión de Matrículas</h2>
        <p className="text-gray-500">Administra las asignaciones académicas y estatus de los estudiantes</p>
      </header>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por estudiante o representante..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
        <select value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200">
          <option value="">Todos los períodos</option>
          {periodos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <select value={filtroEstatus} onChange={(e) => setFiltroEstatus(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200">
          <option value="">Todos los estatus</option>
          <option value="ACTIVO">Activos</option>
          <option value="INACTIVO">Inactivos</option>
          <option value="RETIRADO">Retirados</option>
          <option value="GRADUADO">Graduados</option>
          <option value="TRANSFERIDO">Transferidos</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Estudiante</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Representante</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Período</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Sección</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Estatus</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {matriculasFiltradas.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-12 text-gray-500">No se encontraron matrículas</td></tr>
                ) : (
                  matriculasFiltradas.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <GraduationCap size={18} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{m.estudiante_nombres} {m.estudiante_apellidos}</p>
                            <p className="text-xs text-gray-500">Cédula: {m.estudiante_cedula || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {m.representante_nombres} {m.representante_apellidos}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                          {m.periodo_nombre}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">
                        {m.seccion_nombre}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${getEstatusColor(m.estatus)}`}>
                          {m.estatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => abrirModalEditar(m)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar Matrícula">
                            <Edit2 size={16} />
                          </button>
                          
                          {/* Acciones rápidas de estatus */}
                          {m.estatus === 'ACTIVO' && (
                            <select 
                              onChange={(e) => { if(e.target.value) handleCambiarEstatus(m.id, e.target.value, `${m.estudiante_nombres} ${m.estudiante_apellidos}`); e.target.value = ''; }}
                              className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none"
                              defaultValue=""
                            >
                              <option value="" disabled>Cambiar a...</option>
                              <option value="RETIRADO">Retirar</option>
                              <option value="GRADUADO">Graduar</option>
                              <option value="TRANSFERIDO">Transferir</option>
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
        )}
      </div>

      {/* Modal de Edición */}
      {modalAbierto && editando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Editar Matrícula</h3>
              <button onClick={() => setModalAbierto(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="bg-blue-50 p-3 rounded-xl mb-4">
                <p className="text-sm text-blue-800 font-semibold">{editando.estudiante_nombres} {editando.estudiante_apellidos}</p>
                <p className="text-xs text-blue-600">Período: {editando.periodo_nombre}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Sección Actual</label>
                <select value={formData.seccion_id} onChange={(e) => setFormData({...formData, seccion_id: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-200">
                  <option value={editando.seccion_id}>{editando.seccion_nombre} (Actual)</option>
                  {/* Aquí podrías cargar todas las secciones disponibles si quisieras reasignar */}
                </select>
                <p className="text-xs text-gray-500 mt-1">Para cambiar de sección, usa el módulo de Inscripciones.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Estatus de la Matrícula</label>
                <select value={formData.estatus} onChange={(e) => setFormData({...formData, estatus: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-200">
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                  <option value="RETIRADO">Retirado</option>
                  <option value="GRADUADO">Graduado</option>
                  <option value="TRANSFERIDO">Transferido</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Observaciones</label>
                <textarea value={formData.observaciones_inscripcion} onChange={(e) => setFormData({...formData, observaciones_inscripcion: e.target.value})} rows="3" className="w-full px-4 py-2 rounded-xl border border-gray-200" placeholder="Notas sobre la matrícula..."></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setModalAbierto(false)} className="px-6 py-2 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}