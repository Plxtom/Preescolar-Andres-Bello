import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './componentes/layout/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inscripciones from './pages/Inscripciones';
import Matriculas from './pages/Matriculas';
import Auditoria from './pages/Auditoria';
import Usuarios from './pages/Usuarios';

function ProtectedRoute({ children, rolesPermitidos }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (rolesPermitidos && !rolesPermitidos.includes(user.rol)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" replace /> : <Login />} 
      />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inscripciones" element={<Inscripciones />} />
        <Route path="/matriculas" element={<Matriculas />} />
        
        <Route 
          path="/auditoria" 
          element={
            <ProtectedRoute rolesPermitidos={['admin', 'directora']}>
              <Auditoria />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/usuarios" 
          element={
            <ProtectedRoute rolesPermitidos={['admin']}>
              <Usuarios />
            </ProtectedRoute>
          } 
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;