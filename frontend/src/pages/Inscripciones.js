import { useState, useEffect } from 'react';
import { User, Baby, Save, Loader2, Edit2, Trash2, X, Download } from 'lucide-react';
import { 
  crearInscripcion, editarInscripcion, eliminarInscripcion, 
  listarInscripciones, listarPeriodos, listarSeccionesPorPeriodo 
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { exportarInscripciones } from '../utils/exportarExcel';

export default function Inscripciones() {
  const { tienePermiso } = useAuth();
  const [periodos, setPeriodos] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const [formData, setFormData] = useState(getFormVacio());

  function getFormVacio() {
    return {
      representante: {
        nombres: '', apellidos: '', cedula: '', telefono: '',
        email: '', direccion: '', lugar_trabajo: '', telefono_trabajo: ''
      },
      estudiante: {
        nombres: '', apellidos: '', cedula_escolar: '',
        fecha_nacimiento: '', genero: 'M', lugar_nacimiento: '',
        alergias_condiciones_medicas: '', observaciones: ''
      },
      matricula: {
        periodo_id: '',
        seccion_id: '',
        parentesco: '',
        es_representante_legal: true,
        autorizado_retirar: true,
        observaciones_inscripcion: ''
      }
    };
  }

  useEffect(() => {
    cargarPeriodos();
    cargarInscripciones();
  }, []);

  const cargarPeriodos = async () => {
    try {
      const data = await listarPeriodos();
      setPeriodos(data);
    } catch (error) {
      console.error(error);
    }
  };

  const cargarSecciones = async (periodoId) => {
    if (!periodoId) {
      setSecciones([]);
      return;
    }
    try {
      const data = await listarSeccionesPorPeriodo(periodoId);
      setSecciones(data);
    } catch (error) {
      toast.error('Error al cargar secciones');
    }
  };

  const cargarInscripciones = async () => {
    try {
      const data = await listarInscripciones();
      setInscripciones(data);
    } catch (error) {
      toast.error('Error al cargar inscripciones');
    }
  };

  const handleChange = (e, seccion = null) => {
    const { name, value, type, checked } = e.target;
    
    if (seccion) {
      setFormData({
        ...formData,
        [seccion]: {
          ...formData[seccion],
          [name]: type === 'checkbox' ? checked : value
        }
      });
      
      if (seccion === 'matricula' && name === 'periodo_id') {
        cargarSecciones(value);
        setFormData(prev => ({
          ...prev,
          matricula: { ...prev.matricula, seccion_id: '' }
        }));
      }
    }
  };

  const abrirModalCrear = () => {
    setEditando(null);
    setFormData(getFormVacio());
    setSecciones([]);
    setModalAbierto(true);
  };

  const abrirModalEditar = (inscripcion) => {
    setEditando(inscripcion);
    setFormData({
      representante: {
        nombres: inscripcion.representante_nombres,
        apellidos: inscripcion.representante_apellidos,
        cedula: inscripcion.representante_cedula,
        telefono: inscripcion.representante_telefono,
        email: '', direccion: '', lugar_trabajo: '', telefono_trabajo: ''
      },
      estudiante: {
        nombres: inscripcion.estudiante_nombres,
        apellidos: inscripcion.estudiante_apellidos,
        cedula_escolar: inscripcion.estudiante_cedula,
        fecha_nacimiento: '', genero: 'M', lugar_nacimiento: '',
        alergias_condiciones_medicas: '', observaciones: ''
      },
      matricula: {
        periodo_id: inscripcion.periodo_id,
        seccion_id: inscripcion.seccion_id,
        parentesco: inscripcion.parentesco,
        es_representante_legal: inscripcion.es_representante_legal,
        autorizado_retirar: inscripcion.autorizado_retirar,
        observaciones_inscripcion: ''
      }
    });
    if (inscripcion.periodo_id) {
      cargarSecciones(inscripcion.periodo_id);
    }
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editando) {
        await editarInscripcion(editando.id, formData.matricula);
        toast.success('¡Matrícula actualizada!');
      } else {
        await crearInscripcion(formData);
        toast.success('¡Inscripción registrada!');
      }
      
      setModalAbierto(false);
      setFormData(getFormVacio());
      cargarInscripciones();
    } catch (error) {
      toast.error(error.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id, nombreEstudiante) => {
    const result = await Swal.fire({
      title: '¿Eliminar inscripción?',
      text: `Se eliminará la inscripción de ${nombreEstudiante}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await eliminarInscripcion(id);
        toast.success('Inscripción eliminada');
        cargarInscripciones();
      } catch (error) {
        toast.error(error.message || 'Error al eliminar');
      }
    }
  };

  return (
    <div className="p-8 bg-preescolar-background min-h-screen">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-preescolar-text">Inscripciones</h2>
          <p className="text-gray-500">Gestión de representantes y estudiantes</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportarInscripciones(inscripciones)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700"
          >
            <Download size={18} />
            Exportar Excel
          </button>
          {tienePermiso(['admin', 'secretaria']) && (
            <button onClick={abrirModalCrear} className="btn-primary flex items-center gap-2">
              <Save size={18} />
              Nueva Inscripción
            </button>
          )}
        </div>
      </header>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Estudiante</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Representante</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Período</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Sección</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Estatus</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inscripciones.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-500">
                    No hay inscripciones registradas
                  </td>
                </tr>
              ) : (
                inscripciones.map((insc) => (
                  <tr key={insc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-preescolar-secondary/20 flex items-center justify-center">
                          <Baby size={14} className="text-preescolar-secondary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{insc.estudiante_nombres} {insc.estudiante_apellidos}</p>
                          <p className="text-xs text-gray-500">{insc.estudiante_cedula || 'Sin cédula'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {insc.representante_nombres} {insc.representante_apellidos}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                        {insc.periodo_nombre}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-3 py-1 bg-preescolar-primary/10 text-preescolar-primary text-xs font-bold rounded-full">
                        {insc.seccion_nombre}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        insc.estatus === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {insc.estatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {tienePermiso(['admin', 'secretaria']) && (
                          <button
                            onClick={() => abrirModalEditar(insc)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {tienePermiso(['admin']) && (
                          <button
                            onClick={() => handleEliminar(insc.id, `${insc.estudiante_nombres} ${insc.estudiante_apellidos}`)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">
                {editando ? 'Editar Matrícula' : 'Nueva Inscripción'}
              </h3>
              <button onClick={() => setModalAbierto(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {!editando && (
                <>
                  <div className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4 text-preescolar-primary">
                      <User size={20} />
                      <h4 className="font-bold">Datos del Representante</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <InputField label="Nombres" name="nombres" value={formData.representante.nombres} 
                        onChange={(e) => handleChange(e, 'representante')} required />
                      <InputField label="Apellidos" name="apellidos" value={formData.representante.apellidos} 
                        onChange={(e) => handleChange(e, 'representante')} required />
                      <InputField label="Cédula" name="cedula" value={formData.representante.cedula} 
                        onChange={(e) => handleChange(e, 'representante')} required placeholder="V-12345678" />
                      <InputField label="Teléfono" name="telefono" value={formData.representante.telefono} 
                        onChange={(e) => handleChange(e, 'representante')} required placeholder="0414-1234567" />
                      <InputField label="Email" name="email" type="email" value={formData.representante.email} 
                        onChange={(e) => handleChange(e, 'representante')} />
                      <InputField label="Dirección" name="direccion" value={formData.representante.direccion} 
                        onChange={(e) => handleChange(e, 'representante')} required />
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4 text-preescolar-secondary">
                      <Baby size={20} />
                      <h4 className="font-bold">Datos del Estudiante</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <InputField label="Nombres" name="nombres" value={formData.estudiante.nombres} 
                        onChange={(e) => handleChange(e, 'estudiante')} required />
                      <InputField label="Apellidos" name="apellidos" value={formData.estudiante.apellidos} 
                        onChange={(e) => handleChange(e, 'estudiante')} required />
                      <InputField label="Cédula Escolar" name="cedula_escolar" value={formData.estudiante.cedula_escolar} 
                        onChange={(e) => handleChange(e, 'estudiante')} />
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Fecha Nacimiento</label>
                        <input type="date" name="fecha_nacimiento" value={formData.estudiante.fecha_nacimiento}
                          onChange={(e) => handleChange(e, 'estudiante')} required className="input-field" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Género</label>
                        <select name="genero" value={formData.estudiante.genero}
                          onChange={(e) => handleChange(e, 'estudiante')} className="input-field">
                          <option value="M">Masculino</option>
                          <option value="F">Femenino</option>
                        </select>
                      </div>
                      <InputField label="Lugar de Nacimiento" name="lugar_nacimiento" 
                        value={formData.estudiante.lugar_nacimiento} 
                        onChange={(e) => handleChange(e, 'estudiante')} />
                    </div>
                  </div>
                </>
              )}

              <div className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4 text-preescolar-success">
                  <Save size={20} />
                  <h4 className="font-bold">Período y Sección</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Período Académico</label>
                    <select name="periodo_id" value={formData.matricula.periodo_id}
                      onChange={(e) => handleChange(e, 'matricula')} required className="input-field">
                      <option value="">Seleccione un período...</option>
                      {periodos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} {p.activo ? '(Actual)' : '(Anterior)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Sección</label>
                    <select name="seccion_id" value={formData.matricula.seccion_id}
                      onChange={(e) => handleChange(e, 'matricula')} required className="input-field"
                      disabled={!formData.matricula.periodo_id}>
                      <option value="">Seleccione una sección...</option>
                      {secciones.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre} (Capacidad: {s.capacidad_maxima})
                        </option>
                      ))}
                    </select>
                  </div>
                  {!editando && (
                    <>
                      <InputField label="Parentesco" name="parentesco" value={formData.matricula.parentesco} 
                        onChange={(e) => handleChange(e, 'matricula')} required placeholder="Ej. Madre, Padre" />
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="es_representante_legal" 
                          checked={formData.matricula.es_representante_legal}
                          onChange={(e) => handleChange(e, 'matricula')}
                          className="w-5 h-5 rounded" />
                        <span className="text-sm font-semibold">Es representante legal</span>
                      </label>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setModalAbierto(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {editando ? 'Actualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InputField({ label, name, value, onChange, type = 'text', placeholder = '', required = false }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder} required={required} className="input-field" />
    </div>
  );
}