import React from 'react';
import '../estilos/Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-content-only">
      {/* Cabecera */}
      <header className="dashboard-header">
        <h1>¡Bienvenido de nuevo!</h1>
        <p>Resumen del proceso de matrículas actual.</p>
      </header>

      {/* Tarjetas de estadísticas (métricas rápidas) */}
      <section className="stats-grid">
        <div className="stat-card">
          <h3>Total Inscritos</h3>
          <p className="stat-number">48</p>
        </div>
        <div className="stat-card">
          <h3>Pendientes de Pago</h3>
          <p className="stat-number">12</p>
        </div>
        <div className="stat-card">
          <h3>Cupos Disponibles</h3>
          <p className="stat-number">10</p>
        </div>
      </section>

      {/* Sección de tabla o listado reciente */}
      <section className="recent-section">
        <h2>Últimas Solicitudes</h2>
        <div className="table-container">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Representante</th>
                <th>Edad</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Sofía Pérez</td>
                <td>María Gómez</td>
                <td>4 años</td>
                <td><span className="badge success">Aprobado</span></td>
              </tr>
              <tr>
                <td>Lucas Martínez</td>
                <td>Carlos Martínez</td>
                <td>3 años</td>
                <td><span className="badge warning">Pendiente</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;