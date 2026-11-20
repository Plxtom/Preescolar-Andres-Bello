import { useState, useEffect, useCallback } from 'react';
import { Shield, ChevronLeft, ChevronRight, RefreshCw, Loader2, Filter } from 'lucide-react';
import { getAuditoriaLogs, getAccionesDisponibles } from '../services/api';
import toast from 'react-hot-toast';

export default function Auditoria() {
  const [logs, setLogs] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [acciones, setAcciones] = useState([]);
  const [filtroAccion, setFiltroAccion] = useState('');
  const limite = 15;

  useEffect(() => {
    cargarAcciones();
  }, []);

  // ✅ Solución: envolver cargarLogs con useCallback
  const cargarLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAuditoriaLogs(pagina, limite, { accion: filtroAccion });
      setLogs(data.logs);
      setTotal(data.total);
      setTotalPaginas(data.total_paginas);
    } catch (error) {
      toast.error('Error al cargar logs');
    } finally {
      setLoading(false);
    }
  }, [pagina, filtroAccion]); // Dependencias de la función

  useEffect(() => {
    cargarLogs();
  }, [cargarLogs]); // ✅ Ahora cargarLogs está en el array

  const cargarAcciones = async () => {
    try {
      const data = await getAccionesDisponibles();
      setAcciones(data);
    } catch (error) {
      console.error(error);
    }
  };

  const colorAccion = (accion) => {
    const colores = {
      CREATE: 'bg-emerald-100 text-emerald-700',
      UPDATE: 'bg-blue-100 text-blue-700',
      DELETE: 'bg-red-100 text-red-700',
      LOGIN: 'bg-amber-100 text-amber-700',
    };
    return colores[accion] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-8 bg-preescolar-background min-h-screen">
      <header className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-preescolar-primary/10 rounded-xl">
            <Shield className="text-preescolar-primary" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-preescolar-text">Auditoría del Sistema</h2>
            <p className="text-gray-500">{total} registros encontrados</p>
          </div>
        </div>
        <button onClick={cargarLogs} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl font-semibold hover:bg-gray-50">
          <RefreshCw size={16} />
          Actualizar
        </button>
      </header>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="flex items-center gap-3">
          <Filter size={18} className="text-gray-500" />
          <select
            value={filtroAccion}
            onChange={(e) => { setFiltroAccion(e.target.value); setPagina(1); }}
            className="input-field max-w-xs"
          >
            <option value="">Todas las acciones</option>
            {acciones.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-preescolar-primary" size={32} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Acción</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tabla</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Descripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-gray-500">
                        No hay registros
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {log.fecha ? new Date(log.fecha).toLocaleString('es-VE') : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold">{log.usuario}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${colorAccion(log.accion)}`}>
                            {log.accion}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{log.tabla || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{log.detalles}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Página {pagina} de {totalPaginas}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={pagina === 1}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                    disabled={pagina === totalPaginas}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}