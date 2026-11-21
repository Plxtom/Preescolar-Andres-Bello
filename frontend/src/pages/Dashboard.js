import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Users, GraduationCap, TrendingUp, RefreshCw, Loader2, UserCheck } from 'lucide-react';
import { getDashboardAnalytics } from '../services/api';
import toast from 'react-hot-toast';

const COLORES = ['#60A5FA', '#F472B6', '#FBBF24', '#34D399', '#A78BFA'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const response = await getDashboardAnalytics();
      setData(response);
    } catch (error) {
      toast.error('No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Panel de Control</h2>
          <p className="text-gray-500">Resumen del período académico actual</p>
        </div>
        <button 
          onClick={cargarDatos}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard icon={<Users size={28} />} color="blue" label="Estudiantes" value={data.total_estudiantes} />
        <KpiCard icon={<UserCheck size={28} />} color="amber" label="Representantes" value={data.total_representantes} />
        <KpiCard icon={<GraduationCap size={28} />} color="emerald" label="Secciones" value={data.total_secciones} />
        <KpiCard icon={<TrendingUp size={28} />} color="purple" label="Ocupación" value={`${data.ocupacion_promedio}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Ocupación por Sección</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.secciones}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="nombre" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="inscritos" fill="#4F46E5" radius={[6, 6, 0, 0]} name="Inscritos" />
                <Bar dataKey="capacidad" fill="#E2E8F0" radius={[6, 6, 0, 0]} name="Capacidad" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Distribución por Género</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.genero} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label>
                  {data.genero.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {data.edades && data.edades.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Distribución por Edad</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.edades}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="edad" label={{ value: 'Edad', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Cantidad', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="cantidad" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon, color, label, value }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    purple: 'bg-purple-100 text-purple-600'
  };
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`p-4 rounded-xl ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}