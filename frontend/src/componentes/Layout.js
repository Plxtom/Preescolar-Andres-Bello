import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import '../estilos/Layout.css';

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Limpiamos el token del almacenamiento local al cerrar sesión
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="app-container">
      {/* Menú Lateral (Sidebar) */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>C.E.I. Andrés Bello</h2>
          <p>Sistema de Control Escolar</p>
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item">🏠 Inicio</Link>
          <Link to="/estudiantes" className="nav-item">👶 Estudiantes</Link>
          <Link to="/representantes" className="nav-item">👥 Representantes</Link>
          <Link to="/secciones" className="nav-item">🏫 Secciones</Link>
          <Link to="/periodos" className="nav-item">📅 Períodos Académicos</Link>
          <Link to="/matriculas" className="nav-item">📝 Matrículas / Inscripciones</Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout">
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenedor Principal */}
      <div className="main-wrapper">
        {/* Barra Superior */}
        <header className="topbar">
          <h3>Panel Administrativo</h3>
          <div className="user-info">
            <span className="user-role">Administrador / Secretaría</span>
          </div>
        </header>

        {/* Área de Contenido Dinámico (donde cambian las vistas) */}
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}