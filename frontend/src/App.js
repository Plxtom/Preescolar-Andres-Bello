import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './componentes/Dashboard';
import FormularioInscripcion from './componentes/FormularioInscripcion';
import Layout from './componentes/Layout';
import './App.css'; 

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        {/* Barra de navegación superior compartida */}
        <nav className="main-nav">
          <div className="nav-brand">🏫 Preescolar</div>
          <div className="nav-links">
            <Link to="/" className="nav-link">Dashboard</Link>
            <Link to="/inscripcion" className="nav-link">Nueva Inscripción</Link>
          </div>
        </nav>

        {/* Contenedor de las rutas */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inscripcion" element={<FormularioInscripcion />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;