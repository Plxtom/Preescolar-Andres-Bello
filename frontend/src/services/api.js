const API_BASE_URL = 'http://localhost:8000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Inicia sesión nuevamente.');
    }
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        if (typeof errorData.detail === 'string') throw new Error(errorData.detail);
        if (Array.isArray(errorData.detail)) {
          throw new Error(errorData.detail.map(e => e.msg || e.message).join(', '));
        }
        throw new Error(JSON.stringify(errorData.detail));
      }
      throw new Error(`Error ${response.status}`);
    } catch (parseError) {
      if (parseError.message && !parseError.message.includes('JSON')) throw parseError;
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  }
  return response.json();
};

// ============ AUTENTICACIÓN ============
export const login = async (email, password) => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  });
  return handleResponse(response);
};

export const obtenerPerfil = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/perfil`, { method: 'GET', headers: getAuthHeaders() });
  return handleResponse(response);
};

// ============ USUARIOS ============
export const listarUsuarios = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/usuarios`, { method: 'GET', headers: getAuthHeaders() });
  return handleResponse(response);
};

export const crearUsuario = async (datos) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(datos) });
  return handleResponse(response);
};

export const editarUsuario = async (id, datos) => {
  const response = await fetch(`${API_BASE_URL}/auth/usuarios/${id}`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify(datos) });
  return handleResponse(response);
};

export const eliminarUsuario = async (id) => {
  const response = await fetch(`${API_BASE_URL}/auth/usuarios/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  return handleResponse(response);
};

// ============ ANALÍTICA ============
export const getDashboardAnalytics = async () => {
  const response = await fetch(`${API_BASE_URL}/analytics/dashboard`, { method: 'GET', headers: getAuthHeaders() });
  return handleResponse(response);
};

// ============ INSCRIPCIONES ============
export const listarInscripciones = async () => {
  const response = await fetch(`${API_BASE_URL}/inscripciones/`, { method: 'GET', headers: getAuthHeaders() });
  return handleResponse(response);
};

export const crearInscripcion = async (datos) => {
  const response = await fetch(`${API_BASE_URL}/inscripciones/`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(datos) });
  return handleResponse(response);
};

export const editarInscripcion = async (id, datos) => {
  const response = await fetch(`${API_BASE_URL}/inscripciones/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(datos) });
  return handleResponse(response);
};

export const actualizarInscripcionParcial = async (id, datos) => {
  const response = await fetch(`${API_BASE_URL}/inscripciones/${id}`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify(datos) });
  return handleResponse(response);
};

export const eliminarInscripcion = async (id) => {
  const response = await fetch(`${API_BASE_URL}/inscripciones/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  return handleResponse(response);
};

// ============ PERÍODOS ============
export const listarPeriodos = async (soloActivos = false) => {
  const url = soloActivos ? `${API_BASE_URL}/periodos/?solo_activos=true` : `${API_BASE_URL}/periodos/`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  return handleResponse(response);
};

export const crearPeriodo = async (datos) => {
  const response = await fetch(`${API_BASE_URL}/periodos/`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(datos) });
  return handleResponse(response);
};

export const editarPeriodo = async (id, datos) => {
  const response = await fetch(`${API_BASE_URL}/periodos/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(datos) });
  return handleResponse(response);
};

export const eliminarPeriodo = async (id) => {
  const response = await fetch(`${API_BASE_URL}/periodos/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  return handleResponse(response);
};

// ============ SECCIONES ============
export const listarSeccionesPorPeriodo = async (periodoId) => {
  const response = await fetch(`${API_BASE_URL}/periodos/${periodoId}/secciones`, { method: 'GET', headers: getAuthHeaders() });
  return handleResponse(response);
};

export const listarTodasSecciones = async () => {
  const response = await fetch(`${API_BASE_URL}/periodos/secciones/todas`, { method: 'GET', headers: getAuthHeaders() });
  return handleResponse(response);
};

// URL con slash al final (CRUCIAL para FastAPI)
export const crearSeccion = async (datos) => {
  const response = await fetch(`${API_BASE_URL}/periodos/secciones/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(datos)
  });
  return handleResponse(response);
};

export const editarSeccion = async (id, datos) => {
  const response = await fetch(`${API_BASE_URL}/periodos/secciones/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(datos) });
  return handleResponse(response);
};

export const eliminarSeccion = async (id) => {
  const response = await fetch(`${API_BASE_URL}/periodos/secciones/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  return handleResponse(response);
};

// ============ AUDITORÍA ============
export const getAuditoriaLogs = async (pagina = 1, limite = 20, filtros = {}) => {
  const params = new URLSearchParams({
    page: pagina, limit: limite,
    ...(filtros?.accion && { accion: filtros.accion }),
    ...(filtros?.usuario_id && { usuario_id: filtros.usuario_id })
  });
  const response = await fetch(`${API_BASE_URL}/auditoria/logs?${params}`, { method: 'GET', headers: getAuthHeaders() });
  return handleResponse(response);
};

export const getAccionesDisponibles = async () => {
  const response = await fetch(`${API_BASE_URL}/auditoria/acciones-disponibles`, { method: 'GET', headers: getAuthHeaders() });
  return handleResponse(response);
};