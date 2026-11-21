import { useState, useEffect } from 'react';
import { User, Baby, Save, Loader2, Edit2, Trash2, X, Download, Eye, FileSpreadsheet } from 'lucide-react';
import { 
  crearInscripcion, editarInscripcion, eliminarInscripcion, 
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
  const [viendo, setViendo] = useState(null); // Para el modal de detalles
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
    try { setInscripciones(await listarInscripciones()); } catch (error) { toast.error('Error al cargar'); }
  };

  const handleChange = (e, seccion = null) => {
    const { name, value, type, checked } = e.target;
    if (seccion) {
      setFormData({ ...formData, [seccion]: { ...formData[seccion], [name]: type === 'checkbox' ? checked : value } });
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
      if (editando) {
        await editarInscripcion(editando.id, formData);
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

  const handleEliminar = async (id, nombre) => {
    const result = await Swal.fire({ title: '¿Eliminar inscripción?', text: `Se eliminará a ${nombre}.`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#EF4444', confirmButtonText: 'Sí, eliminar' });
    if (result.isConfirmed) {
      try { await eliminarInscripcion(id); toast.success('Eliminado'); cargarInscripciones(); } catch (error) { toast.error(error.message); }
    }
  };

  // Función para exportar a Excel
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
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Inscripciones</h2>
          <p className="text-gray-500">{inscripciones.length} registros totales</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportarExcel} className="bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-2">
            <FileSpreadsheet size={18} />
            Exportar Excel
          </button>
          {tienePermiso(['admin', 'secretaria']) && (
            <button onClick={() => { setEditando(null); setFormData(getFormVacio()); setSecciones([]); setModalAbierto(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2">
              <Save size={18} />
              Nueva Inscripción
            </button>
          )}
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
            {inscripciones.map((insc) => (
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
                <td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-bold rounded-full ${insc.estatus === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>{insc.estatus}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => setViendo(insc)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Ver Detalles"><Eye size={16} /></button>
                    {tienePermiso(['admin', 'secretaria']) && (
                      <button onClick={() => { setEditando(insc); setFormData({...formData, matricula: {...formData.matricula, periodo_id: insc.periodo_id, seccion_id: insc.seccion_id, estatus: insc.estatus}}); if(insc.periodo_id) cargarSecciones(insc.periodo_id); setModalAbierto(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar"><Edit2 size={16} /></button>
                    )}
                    {tienePermiso(['admin']) && (
                      <button onClick={() => handleEliminar(insc.id, `${insc.estudiante_nombres} ${insc.estudiante_apellidos}`)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar"><Trash2 size={16} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalles (Ver) */}
      {viendo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Detalles del Estudiante</h3>
              <button onClick={() => setViendo(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              {/* Estudiante */}
              <div className="border border-gray-100 rounded-xl p-4 bg-blue-50/30">
                <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2"><Baby size={18} /> Datos del Estudiante</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-gray-500">Nombres</p><p className="font-semibold">{viendo.estudiante_nombres}</p></div>
                  <div><p className="text-gray-500">Apellidos</p><p className="font-semibold">{viendo.estudiante_apellidos}</p></div>
                  <div><p className="text-gray-500">Cédula Escolar</p><p className="font-semibold">{viendo.estudiante_cedula || 'N/A'}</p></div>
                  <div><p className="text-gray-500">Fecha de Nacimiento</p><p className="font-semibold">{viendo.estudiante_fecha_nacimiento || 'N/A'}</p></div>
                  <div><p className="text-gray-500">Género</p><p className="font-semibold">{viendo.estudiante_genero === 'M' ? 'Masculino' : 'Femenino'}</p></div>
                  <div><p className="text-gray-500">Lugar de Nacimiento</p><p className="font-semibold">{viendo.estudiante_lugar_nacimiento || 'N/A'}</p></div>
                  <div className="col-span-2"><p className="text-gray-500">Alergias / Condiciones Médicas</p><p className="font-semibold">{viendo.estudiante_alergias || 'Ninguna reportada'}</p></div>
                  <div className="col-span-2"><p className="text-gray-500">Observaciones</p><p className="font-semibold">{viendo.estudiante_observaciones || 'Sin observaciones'}</p></div>
                </div>
              </div>

              {/* Representante */}
              <div className="border border-gray-100 rounded-xl p-4 bg-amber-50/30">
                <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2"><User size={18} /> Datos del Representante</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-gray-500">Nombres</p><p className="font-semibold">{viendo.representante_nombres}</p></div>
                  <div><p className="text-gray-500">Apellidos</p><p className="font-semibold">{viendo.representante_apellidos}</p></div>
                  <div><p className="text-gray-500">Cédula</p><p className="font-semibold">{viendo.representante_cedula}</p></div>
                  <div><p className="text-gray-500">Teléfono</p><p className="font-semibold">{viendo.representante_telefono}</p></div>
                  <div><p className="text-gray-500">Email</p><p className="font-semibold">{viendo.representante_email || 'N/A'}</p></div>
                  <div><p className="text-gray-500">Parentesco</p><p className="font-semibold">{viendo.parentesco}</p></div>
                  <div className="col-span-2"><p className="text-gray-500">Dirección</p><p className="font-semibold">{viendo.representante_direccion || 'N/A'}</p></div>
                </div>
              </div>

              {/* Matrícula */}
              <div className="border border-gray-100 rounded-xl p-4 bg-emerald-50/30">
                <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2"><Save size={18} /> Datos de la Matrícula</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-gray-500">Período Académico</p><p className="font-semibold">{viendo.periodo_nombre}</p></div>
                  <div><p className="text-gray-500">Sección Asignada</p><p className="font-semibold">{viendo.seccion_nombre}</p></div>
                  <div><p className="text-gray-500">Estatus</p><p className="font-semibold">{viendo.estatus}</p></div>
                  <div><p className="text-gray-500">Fecha de Inscripción</p><p className="font-semibold">{viendo.fecha ? new Date(viendo.fecha).toLocaleDateString('es-VE') : 'N/A'}</p></div>
                  <div className="col-span-2"><p className="text-gray-500">Observaciones de Matrícula</p><p className="font-semibold">{viendo.observaciones_inscripcion || 'Sin observaciones'}</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Crear/Editar (Mantén el que ya tenías, solo asegúrate de que el botón de cerrar funcione con setModalAbierto(false)) */}
      {modalAbierto && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
             <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
               <h3 className="text-xl font-bold">{editando ? 'Editar Inscripción' : 'Nueva Inscripción'}</h3>
               <button onClick={() => setModalAbierto(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
             </div>
             <form onSubmit={handleSubmit} className="p-6 space-y-6">
               {!editando && (
                 <>
                   <div className="border border-gray-100 rounded-xl p-4">
                     <h4 className="font-bold text-blue-600 mb-3 flex items-center gap-2"><User size={18} /> Representante</h4>
                     <div className="grid grid-cols-2 gap-3">
                       <InputField label="Nombres" name="nombres" value={formData.representante.nombres} onChange={(e) => handleChange(e, 'representante')} required />
                       <InputField label="Apellidos" name="apellidos" value={formData.representante.apellidos} onChange={(e) => handleChange(e, 'representante')} required />
                       <InputField label="Cédula" name="cedula" value={formData.representante.cedula} onChange={(e) => handleChange(e, 'representante')} required />
                       <InputField label="Teléfono" name="telefono" value={formData.representante.telefono} onChange={(e) => handleChange(e, 'representante')} required />
                       <InputField label="Email" name="email" type="email" value={formData.representante.email} onChange={(e) => handleChange(e, 'representante')} />
                       <InputField label="Dirección" name="direccion" value={formData.representante.direccion} onChange={(e) => handleChange(e, 'representante')} required />
                     </div>
                   </div>
                   <div className="border border-gray-100 rounded-xl p-4">
                     <h4 className="font-bold text-amber-600 mb-3 flex items-center gap-2"><Baby size={18} /> Estudiante</h4>
                     <div className="grid grid-cols-3 gap-3">
                       <InputField label="Nombres" name="nombres" value={formData.estudiante.nombres} onChange={(e) => handleChange(e, 'estudiante')} required />
                       <InputField label="Apellidos" name="apellidos" value={formData.estudiante.apellidos} onChange={(e) => handleChange(e, 'estudiante')} required />
                       <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Fecha Nacimiento</label>
                         <input type="date" name="fecha_nacimiento" value={formData.estudiante.fecha_nacimiento} onChange={(e) => handleChange(e, 'estudiante')} required className="w-full px-4 py-2 rounded-xl border border-gray-200" />
                       </div>
                       <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Género</label>
                         <select name="genero" value={formData.estudiante.genero} onChange={(e) => handleChange(e, 'estudiante')} className="w-full px-4 py-2 rounded-xl border border-gray-200">
                           <option value="M">Masculino</option>
                           <option value="F">Femenino</option>
                         </select>
                       </div>
                       <InputField label="Lugar Nacimiento" name="lugar_nacimiento" value={formData.estudiante.lugar_nacimiento} onChange={(e) => handleChange(e, 'estudiante')} />
                     </div>
                   </div>
                 </>
               )}
               <div className="border border-gray-100 rounded-xl p-4">
                 <h4 className="font-bold text-emerald-600 mb-3 flex items-center gap-2"><Save size={18} /> Matrícula</h4>
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Período</label>
                     <select name="periodo_id" value={formData.matricula.periodo_id} onChange={(e) => handleChange(e, 'matricula')} required className="w-full px-4 py-2 rounded-xl border border-gray-200">
                       <option value="">Seleccione...</option>
                       {periodos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Sección</label>
                     <select name="seccion_id" value={formData.matricula.seccion_id} onChange={(e) => handleChange(e, 'matricula')} required className="w-full px-4 py-2 rounded-xl border border-gray-200" disabled={!formData.matricula.periodo_id}>
                       <option value="">Seleccione...</option>
                       {secciones.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                     </select>
                   </div>
                   {!editando && <InputField label="Parentesco" name="parentesco" value={formData.matricula.parentesco} onChange={(e) => handleChange(e, 'matricula')} required />}
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Estatus</label>
                     <select name="estatus" value={formData.matricula.estatus} onChange={(e) => handleChange(e, 'matricula')} className="w-full px-4 py-2 rounded-xl border border-gray-200">
                       <option value="ACTIVO">Activo</option>
                       <option value="INACTIVO">Inactivo</option>
                       <option value="RETIRADO">Retirado</option>
                     </select>
                   </div>
                 </div>
               </div>
               <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                 <button type="button" onClick={() => setModalAbierto(false)} className="px-6 py-2 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
                 <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50">
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

function InputField({ label, name, value, onChange, type = 'text', required = false }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} required={required} className="w-full px-4 py-2 rounded-xl border border-gray-200" />
    </div>
  );
}