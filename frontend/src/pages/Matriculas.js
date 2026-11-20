import { useState, useEffect } from 'react';
import { GraduationCap, RefreshCw, Loader2 } from 'lucide-react';
import { listarInscripciones, listarTodasSecciones, listarPeriodos } from '../services/api';
import toast from 'react-hot-toast';

export default function Matriculas() {
  const [matriculas, setMatriculas] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [mat, sec, per] = await Promise.all([
        listarInscripciones(),
        listarTodasSecciones(),
        listarPeriodos()
      ]);
      setMatriculas(mat);
      setSecciones(sec);
      setPeriodos(per);
    } catch (error) {
      toast.error('Error al cargar datos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-preescolar-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="p-8 bg-preescolar-background min-h-screen">
      <header className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-preescolar-secondary/10 rounded-xl">
            <GraduationCap className="text-preescolar-secondary" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-preescolar-text">Matrículas</h2>
            <p className="text-gray-500">Gestión de matrículas, secciones y períodos</p>
          </div>
        </div>
        <button
          onClick={cargarDatos}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl font-semibold hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Secciones */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Secciones ({secciones.length})</h3>
          <div className="space-y-2">
            {secciones.map((s) => (
              <div key={s.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="font-semibold">{s.nombre_seccion || s.nombre}</span>
                <span className="text-sm text-gray-500">Capacidad: {s.capacidad_maxima || s.capacidad}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Períodos */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Períodos Académicos ({periodos.length})</h3>
          <div className="space-y-2">
            {periodos.map((p) => (
              <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="font-semibold">{p.nombre}</span>
                <span className="text-sm text-gray-500">
                  {p.activo ? '🟢 Activo' : '⚪ Inactivo'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de matrículas */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Matrículas Registradas ({matriculas.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Estudiante</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Sección</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Período</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {matriculas.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-500">
                    No hay matrículas registradas
                  </td>
                </tr>
              ) : (
                matriculas.map((m, idx) => (
                  <tr key={m.id || idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold">
                      {m.estudiante || `${m.estudiante_nombres || ''} ${m.estudiante_apellidos || ''}`.trim() || `Estudiante #${m.estudiante_id}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {m.seccion || m.seccion_nombre || `Sección #${m.seccion_id}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {m.periodo || m.periodo_nombre || `Período #${m.periodo_id}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(m.fecha_matricula || m.fecha).toLocaleDateString('es-VE')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}