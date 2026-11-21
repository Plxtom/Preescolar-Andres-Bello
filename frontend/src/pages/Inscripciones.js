import { useState, useEffect } from 'react';
import { User, Baby, Save, Loader2, Edit2, Trash2, X, Eye, FileSpreadsheet } from 'lucide-react';
import { 
  crearInscripcion, editarInscripcion, actualizarInscripcionParcial, eliminarInscripcion, 
  listarInscripciones, listarPeriodos, listarSeccionesPorPeriodo 
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function Inscripciones() {
  const { tienePermiso } = useAuth();
  const [periodos, setPeriodos] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(null);
  const [viendo, setViendo] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const [formData, setFormData] = useState(getFormVacio());

  function getFormVacio() {
    return {
      representante: { nombres: '', apellidos: '', cedula: '', telefono: '', email: '', direccion: '', lugar_trabajo: '', telefono_trabajo: '' },
      estudiante: { nombres: '', apellidos: '', cedula_escolar: '', fecha_nacimiento: '', genero: 'M', lugar_nacimiento: '', alergias_condiciones_medicas: '', observaciones: '' },
      matricula: { periodo_id: '', seccion_id: '', parentesco: '', es_representante_legal: true, autorizado_retirar: true, observaciones_inscripcion: '', estatus: 'ACTIVO' }
    };
  }

  useEffect(() => {
    cargarPeriodos();
    cargarInscripciones();
  }, []);

  const cargarPeriodos = async () => {
    try { setPeriodos(await listarPeriodos()); } catch (error) { console.error(error); }
  };

  const cargarSecciones = async (periodoId) => {
    if (!periodoId) { setSecciones([]); return; }
    try { setSecciones(await listarSeccionesPorPeriodo(periodoId)); } catch (error) { toast.error('Error al cargar secciones'); }
  };

  const cargarInscripciones = async () => {
    try { setInscripciones(await listarInscripciones()); } catch (error) { toast.error('Error al cargar inscripciones'); }
  };

  const handleChange = (e, seccion = null) => {
    const { name, value, type, checked } = e.target;
    if (seccion) {
      setFormData(prev => ({
        ...prev,
        [seccion]: { 
          ...prev[seccion], 
          [name]: type === 'checkbox' ? checked : value 
        }
      }));
      
      if (seccion === 'matricula' && name === 'periodo_id') {
        cargarSecciones(value);
        setFormData(prev => ({ ...prev, matricula: { ...prev.matricula, seccion_id: '' } }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log("📤 Datos a enviar al backend:", JSON.stringify(formData, null, 2)); // ✅ Para depurar
      
      if (editando) {
        await editarInscripcion(editando.id, formData); // Usa PUT
        toast.success('¡Inscripción actualizada completamente!');
      } else {
        await crearInscripcion(formData); // Usa POST
        toast.success('¡Inscripción registrada exitosamente!');
      }
      setModalAbierto(false);
      setFormData(getFormVacio());
      setEditando(null);
      cargarInscripciones();
    } catch (error) {
      console.error("❌ Error al guardar:", error);
      toast.error(error.message || 'Error al guardar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstatusRapido = async (id, nuevoEstatus, nombreEstudiante) => {
    const result = await Swal.fire({
      title: 'Cambiar estatus',
      text: `¿Deseas cambiar el estatus de ${nombreEstudiante} a "${nuevoEstatus}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, cambiar'
    });

    if (result.isConfirmed) {
      try {
        await actualizarInscripcionParcial(id, { estatus: nuevoEstatus }); // Usa PATCH
        toast.success(`Estatus cambiado a ${nuevoEstatus}`);
        cargarInscripciones();
      } catch (error) {
        toast.error(error.message || 'Error al cambiar estatus');
      }
    }
  };

  const handleEliminar = async (id, nombre) => {
    const result = await Swal.fire({ 
      title: '¿Eliminar inscripción?', 
      text: `Se marcará como eliminada la inscripción de ${nombre}.`, 
      icon: 'warning', 
      showCancelButton: true, 
      confirmButtonColor: '#EF4444', 
      confirmButtonText: 'Sí, eliminar' 
    });
    if (result.isConfirmed) {
      try { await eliminarInscripcion(id); toast.success('Inscripción eliminada'); cargarInscripciones(); } catch (error) { toast.error(error.message); }
    }
  };

  const exportarExcel = () => {
    const datosExportar = inscripciones.map(insc => ({
      'Estudiante': `${insc.estudiante_nombres} ${insc.estudiante_apellidos}`,
      'Cédula Estudiante': insc.estudiante_cedula || '',
      'Representante': `${insc.representante_nombres} ${insc.representante_apellidos}`,
      'Teléfono': insc.representante_telefono,
      'Período': insc.periodo_nombre,
      'Sección': insc.seccion_nombre,
      'Estatus': insc.estatus,
      'Fecha Inscripción': insc.fecha ? new Date(insc.fecha).toLocaleDateString('es-VE') : ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(datosExportar);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inscripciones");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `Inscripciones_CEI_Andres_Bello_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel descargado correctamente');
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Inscripciones</h2>
          <p className="text-gray-500">{inscripciones.length} registros totales</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportarExcel} className="bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-2">
            <FileSpreadsheet size={18} /> Exportar Excel
          </button>
          {tienePermiso(['admin', 'secretaria']) && (
            <button onClick={() => { setEditando(null); setFormData(getFormVacio()); setSecciones([]); setModalAbierto(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2">
              <Save size={18} /> Nueva Inscripción
            </button>
          )}
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                <tr><td colSpan="6" className="text-center py-12 text-gray-500">No hay inscripciones registradas</td></tr>
              ) : (
                inscripciones.map((insc) => (
                  <tr key={insc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center"><Baby size={14} className="text-amber-600" /></div>
                        <div>
                          <p className="text-sm font-semibold">{insc.estudiante_nombres} {insc.estudiante_apellidos}</p>
                          <p className="text-xs text-gray-500">{insc.estudiante_cedula || 'Sin cédula'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{insc.representante_nombres} {insc.representante_apellidos}</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">{insc.periodo_nombre}</span></td>
                    <td className="px-4 py-3"><span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">{insc.seccion_nombre}</span></td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        insc.estatus === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 
                        insc.estatus === 'INACTIVO' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                      }`}>{insc.estatus}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setViendo(insc)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Ver Detalles"><Eye size={16} /></button>
                        
                        {tienePermiso(['admin', 'secretaria']) && (
                          <>
                            <button onClick={() => { 
                              setEditando(insc); 
                              setFormData({
                                representante: {
                                  nombres: insc.representante_nombres, apellidos: insc.representante_apellidos, cedula: insc.representante_cedula, telefono: insc.representante_telefono,
                                  email: insc.representante_email || '', direccion: insc.representante_direccion || '', lugar_trabajo: insc.representante_lugar_trabajo || '', telefono_trabajo: insc.representante_telefono_trabajo || ''
                                },
                                estudiante: {
                                  nombres: insc.estudiante_nombres, apellidos: insc.estudiante_apellidos, cedula_escolar: insc.estudiante_cedula || '',
                                  fecha_nacimiento: insc.estudiante_fecha_nacimiento || '', genero: insc.estudiante_genero || 'M', lugar_nacimiento: insc.estudiante_lugar_nacimiento || '',
                                  alergias_condiciones_medicas: insc.estudiante_alergias || '', observaciones: insc.estudiante_observaciones || ''
                                },
                                matricula: {
                                  periodo_id: insc.periodo_id, seccion_id: insc.seccion_id, parentesco: insc.parentesco || '',
                                  es_representante_legal: insc.es_representante_legal, autorizado_retirar: insc.autorizado_retirar,
                                  observaciones_inscripcion: insc.observaciones_inscripcion || '', estatus: insc.estatus
                                }
                              }); 
                              if(insc.periodo_id) cargarSecciones(insc.periodo_id); 
                              setModalAbierto(true); 
                            }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar Completo (PUT)">
                              <Edit2 size={16} />
                            </button>

                            {insc.estatus === 'ACTIVO' && (
                              <select 
                                onChange={(e) => { 
                                  if(e.target.value) {
                                    handleCambiarEstatusRapido(insc.id, e.target.value, `${insc.estudiante_nombres} ${insc.estudiante_apellidos}`);
                                    e.target.value = '';
                                  }
                                }}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:bg-gray-50"
                                defaultValue=""
                                title="Cambio rápido (PATCH)"
                              >
                                <option value="" disabled>Cambiar a...</option>
                                <option value="RETIRADO">Retirar</option>
                                <option value="TRANSFERIDO">Transferir</option>
                                <option value="INACTIVO">Inactivar</option>
                              </select>
                            )}
                          </>
                        )}
                        
                        {tienePermiso(['admin']) && (
                          <button onClick={() => handleEliminar(insc.id, `${insc.estudiante_nombres} ${insc.estudiante_apellidos}`)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar"><Trash2 size={16} /></button>
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

      {/* MODAL DE DETALLES (VER) */}
      {viendo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-xl font-bold text-gray-800">Detalles del Estudiante</h3>
              <button onClick={() => setViendo(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="border border-gray-100 rounded-xl p-4 bg-blue-50/30">
                <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2"><Baby size={18} /> Datos del Estudiante</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><p className="text-gray-500">Nombres</p><p className="font-semibold">{viendo.estudiante_nombres}</p></div>
                  <div><p className="text-gray-500">Apellidos</p><p className="font-semibold">{viendo.estudiante_apellidos}</p></div>
                  <div><p className="text-gray-500">Cédula Escolar</p><p className="font-semibold">{viendo.estudiante_cedula || 'N/A'}</p></div>
                  <div><p className="text-gray-500">Fecha de Nacimiento</p><p className="font-semibold">{viendo.estudiante_fecha_nacimiento || 'N/A'}</p></div>
                  <div><p className="text-gray-500">Género</p><p className="font-semibold">{viendo.estudiante_genero === 'M' ? 'Masculino' : 'Femenino'}</p></div>
                  <div><p className="text-gray-500">Lugar de Nacimiento</p><p className="font-semibold">{viendo.estudiante_lugar_nacimiento || 'N/A'}</p></div>
                  <div className="md:col-span-2"><p className="text-gray-500">Alergias / Condiciones Médicas</p><p className="font-semibold">{viendo.estudiante_alergias || 'Ninguna reportada'}</p></div>
                  <div className="md:col-span-2"><p className="text-gray-500">Observaciones</p><p className="font-semibold">{viendo.estudiante_observaciones || 'Sin observaciones'}</p></div>
                </div>
              </div>
              <div className="border border-gray-100 rounded-xl p-4 bg-amber-50/30">
                <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2"><User size={18} /> Datos del Representante</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><p className="text-gray-500">Nombres</p><p className="font-semibold">{viendo.representante_nombres}</p></div>
                  <div><p className="text-gray-500">Apellidos</p><p className="font-semibold">{viendo.representante_apellidos}</p></div>
                  <div><p className="text-gray-500">Cédula</p><p className="font-semibold">{viendo.representante_cedula}</p></div>
                  <div><p className="text-gray-500">Teléfono</p><p className="font-semibold">{viendo.representante_telefono}</p></div>
                  <div><p className="text-gray-500">Email</p><p className="font-semibold">{viendo.representante_email || 'N/A'}</p></div>
                  <div><p className="text-gray-500">Parentesco</p><p className="font-semibold">{viendo.parentesco}</p></div>
                  <div className="md:col-span-2"><p className="text-gray-500">Dirección</p><p className="font-semibold">{viendo.representante_direccion || 'N/A'}</p></div>
                  <div><p className="text-gray-500">Lugar de Trabajo</p><p className="font-semibold">{viendo.representante_lugar_trabajo || 'N/A'}</p></div>
                  <div><p className="text-gray-500">Teléfono Trabajo</p><p className="font-semibold">{viendo.representante_telefono_trabajo || 'N/A'}</p></div>
                </div>
              </div>
              <div className="border border-gray-100 rounded-xl p-4 bg-emerald-50/30">
                <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2"><Save size={18} /> Datos de la Matrícula</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><p className="text-gray-500">Período Académico</p><p className="font-semibold">{viendo.periodo_nombre}</p></div>
                  <div><p className="text-gray-500">Sección Asignada</p><p className="font-semibold">{viendo.seccion_nombre}</p></div>
                  <div><p className="text-gray-500">Estatus</p><p className="font-semibold">{viendo.estatus}</p></div>
                  <div><p className="text-gray-500">Fecha de Inscripción</p><p className="font-semibold">{viendo.fecha ? new Date(viendo.fecha).toLocaleDateString('es-VE') : 'N/A'}</p></div>
                  <div className="md:col-span-2"><p className="text-gray-500">Observaciones de Matrícula</p><p className="font-semibold">{viendo.observaciones_inscripcion || 'Sin observaciones'}</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CREAR / EDITAR (COMPLETO) */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-xl font-bold">{editando ? 'Editar Inscripción Completa (PUT)' : 'Nueva Inscripción'}</h3>
              <button onClick={() => { setModalAbierto(false); setEditando(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* SECCIÓN 1: REPRESENTANTE */}
              <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/50">
                <h4 className="font-bold text-blue-700 mb-4 flex items-center gap-2 text-lg"><User size={20} /> Datos del Representante</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <InputField label="Nombres" name="nombres" value={formData.representante.nombres} onChange={(e) => handleChange(e, 'representante')} required />
                  <InputField label="Apellidos" name="apellidos" value={formData.representante.apellidos} onChange={(e) => handleChange(e, 'representante')} required />
                  <InputField label="Cédula" name="cedula" value={formData.representante.cedula} onChange={(e) => handleChange(e, 'representante')} required placeholder="V-12345678" />
                  <InputField label="Teléfono" name="telefono" value={formData.representante.telefono} onChange={(e) => handleChange(e, 'representante')} required placeholder="0414-1234567" />
                  <InputField label="Email" name="email" type="email" value={formData.representante.email} onChange={(e) => handleChange(e, 'representante')} placeholder="correo@ejemplo.com" />
                  <InputField label="Dirección" name="direccion" value={formData.representante.direccion} onChange={(e) => handleChange(e, 'representante')} required />
                  <InputField label="Lugar de Trabajo" name="lugar_trabajo" value={formData.representante.lugar_trabajo} onChange={(e) => handleChange(e, 'representante')} />
                  <InputField label="Teléfono de Trabajo" name="telefono_trabajo" value={formData.representante.telefono_trabajo} onChange={(e) => handleChange(e, 'representante')} />
                </div>
              </div>

              {/* SECCIÓN 2: ESTUDIANTE */}
              <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/50">
                <h4 className="font-bold text-amber-700 mb-4 flex items-center gap-2 text-lg"><Baby size={20} /> Datos del Estudiante</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <InputField label="Nombres" name="nombres" value={formData.estudiante.nombres} onChange={(e) => handleChange(e, 'estudiante')} required />
                  <InputField label="Apellidos" name="apellidos" value={formData.estudiante.apellidos} onChange={(e) => handleChange(e, 'estudiante')} required />
                  <InputField label="Cédula Escolar" name="cedula_escolar" value={formData.estudiante.cedula_escolar} onChange={(e) => handleChange(e, 'estudiante')} placeholder="E-12345678" />
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Fecha de Nacimiento</label>
                    <input type="date" name="fecha_nacimiento" value={formData.estudiante.fecha_nacimiento} onChange={(e) => handleChange(e, 'estudiante')} required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Género</label>
                    <select name="genero" value={formData.estudiante.genero} onChange={(e) => handleChange(e, 'estudiante')} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                  <InputField label="Lugar de Nacimiento" name="lugar_nacimiento" value={formData.estudiante.lugar_nacimiento} onChange={(e) => handleChange(e, 'estudiante')} />
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Alergias / Condiciones Médicas</label>
                    <textarea name="alergias_condiciones_medicas" value={formData.estudiante.alergias_condiciones_medicas} onChange={(e) => handleChange(e, 'estudiante')} rows="2" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Alergia a la penicilina, asma, etc." />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Observaciones Generales</label>
                    <textarea name="observaciones" value={formData.estudiante.observaciones} onChange={(e) => handleChange(e, 'estudiante')} rows="2" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Cualquier otra información relevante sobre el niño/a" />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: MATRÍCULA (AHORA TODOS LOS CAMPOS SON EDITABLES SIEMPRE) */}
              <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/50">
                <h4 className="font-bold text-emerald-700 mb-4 flex items-center gap-2 text-lg"><Save size={20} /> Datos de la Matrícula</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Período Académico</label>
                    <select name="periodo_id" value={formData.matricula.periodo_id} onChange={(e) => handleChange(e, 'matricula')} required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">Seleccione un período...</option>
                      {periodos.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.activo ? '(Actual)' : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Sección</label>
                    <select name="seccion_id" value={formData.matricula.seccion_id} onChange={(e) => handleChange(e, 'matricula')} required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" disabled={!formData.matricula.periodo_id}>
                      <option value="">Seleccione una sección...</option>
                      {secciones.map((s) => <option key={s.id} value={s.id}>{s.nombre} ({s.inscritos}/{s.capacidad_maxima})</option>)}
                    </select>
                  </div>
                  
                  {/* ✅ QUITADO EL {!editando && ...} PARA QUE SIEMPRE SE PUEDA EDITAR */}
                  <InputField label="Parentesco" name="parentesco" value={formData.matricula.parentesco} onChange={(e) => handleChange(e, 'matricula')} required placeholder="Ej: Madre, Padre, Abuela" />
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Estatus</label>
                    <select name="estatus" value={formData.matricula.estatus} onChange={(e) => handleChange(e, 'matricula')} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="ACTIVO">Activo</option>
                      <option value="INACTIVO">Inactivo</option>
                      <option value="RETIRADO">Retirado</option>
                      <option value="TRANSFERIDO">Transferido</option>
                    </select>
                  </div>

                  {/* ✅ QUITADO EL {!editando && ...} PARA QUE SIEMPRE SE PUEDA EDITAR */}
                  <label className="flex items-center gap-2 cursor-pointer mt-6">
                    <input type="checkbox" name="es_representante_legal" checked={formData.matricula.es_representante_legal} onChange={(e) => handleChange(e, 'matricula')} className="w-5 h-5 rounded text-blue-600" />
                    <span className="text-sm font-semibold text-gray-700">Es representante legal</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer mt-6">
                    <input type="checkbox" name="autorizado_retirar" checked={formData.matricula.autorizado_retirar} onChange={(e) => handleChange(e, 'matricula')} className="w-5 h-5 rounded text-blue-600" />
                    <span className="text-sm font-semibold text-gray-700">Autorizado para retirar</span>
                  </label>
                  
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Observaciones de la Matrícula</label>
                    <textarea name="observaciones_inscripcion" value={formData.matricula.observaciones_inscripcion} onChange={(e) => handleChange(e, 'matricula')} rows="2" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Notas administrativas sobre la inscripción" />
                  </div>
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => { setModalAbierto(false); setEditando(null); }} className="px-6 py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 transition-colors">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {editando ? 'Actualizar Inscripción (PUT)' : 'Registrar Inscripción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente reutilizable para inputs
function InputField({ label, name, value, onChange, type = 'text', placeholder = '', required = false }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
      <input 
        type={type} 
        name={name} 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder} 
        required={required} 
        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
      />
    </div>
  );
}