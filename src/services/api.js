import axios from 'axios';

// ✅ Resolver base de API y base de archivos a partir de la variable de entorno
const rawBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

// Normalizamos para que SIEMPRE tenga /api al final
const API_BASE = rawBase.endsWith('/api')
  ? rawBase
  : `${rawBase.replace(/\/+$/, '')}/api`;

// Base para archivos estáticos (/uploads), sin /api
export const FILES_BASE = API_BASE.replace(/\/api\/?$/, '');

// Instancia base de la API usando la URL normalizada
const API = axios.create({
  baseURL: API_BASE,
});

API.interceptors.request.use((config) => {
  const stored = localStorage.getItem('usuario');
  const storedLocal = localStorage.getItem('localSeleccionado');

  let role = '';
  let localId = '';
  let userId = '';

  if (stored) {
    try {
      const usuario = JSON.parse(stored);
      role = typeof usuario?.rol === 'string' ? usuario.rol : '';
      userId = usuario?._id || '';
      if (role && role !== 'superadmin') {
        localId = usuario?.local?._id || '';
      } else if (storedLocal) {
        const localParsed = JSON.parse(storedLocal);
        localId = localParsed?._id || '';
      }
    } catch (err) {
      // ignore parse errors
    }
  }

  if (role) {
    config.headers['x-user-role'] = role;
  }
  if (localId) {
    config.headers['x-local-id'] = localId;
  }
  if (userId) {
    config.headers['x-user-id'] = userId;
  }

  return config;
});

// ─────────────────────────────────────────────
// 🛍️ Productos
// ─────────────────────────────────────────────
export const obtenerProductos = () => API.get('/productos');
export const obtenerProductosBase = () => API.get('/productos/base');

export const crearProducto = (data) =>
  API.post('/productos', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const crearProductoBase = (data) =>
  API.post('/productos/base', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const usarProductoBaseEnLocal = (baseId, data, localId) =>
  API.post(`/productos/local/use-base/${baseId}`, data, {
    ...(localId ? { headers: { 'x-local-id': localId } } : {}),
  });

export const eliminarProducto = (id) => API.delete(`/productos/${id}`);

export const obtenerProductoPorId = (id) => API.get(`/productos/${id}`);

export const editarProducto = (id, data) =>
  API.put(`/productos/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ─────────────────────────────────────────────
// 💸 Ventas
// ─────────────────────────────────────────────
export const registrarVenta = (data) => API.post('/ventas', data);

export const obtenerVentas = (params) => API.get('/ventas', { params });

export const obtenerResumenPorFecha = (fecha) =>
  API.get('/ventas/resumen', { params: { fecha } });

export const obtenerResumenPorRango = (inicio, fin) =>
  API.get('/ventas/resumen-rango', { params: { inicio, fin } });

// ─────────────────────────────────────────────
// 👤 Usuarios
// ─────────────────────────────────────────────
export const loginUsuario = (data) => API.post('/auth/login', data);

export const crearUsuario = (data) => API.post('/usuarios', data);

export const obtenerUsuarios = () => API.get('/usuarios');

export const eliminarUsuario = (id) => API.delete(`/usuarios/${id}`);

export const editarUsuario = (id, data) => API.put(`/usuarios/${id}`, data);

// ─────────────────────────────────────────────
// 💼 Caja
// ─────────────────────────────────────────────
export const abrirCaja = (data) => API.post('/caja/abrir', data);
export const cerrarCaja = (data = {}) => API.post('/caja/cerrar', data);
export const obtenerHistorialCaja = () => API.get('/caja/historial');

// ─────────────────────────────────────────────
// 📁 Categorías
// ─────────────────────────────────────────────
export const obtenerCategorias = (localId) =>
  API.get('/categorias', {
    ...(localId ? { headers: { 'x-local-id': localId } } : {}),
  });
export const crearCategoria = (data) => API.post('/categorias', data);
export const editarCategoria = (id, data) => API.put(`/categorias/${id}`, data);
export const eliminarCategoria = (id) => API.delete(`/categorias/${id}`);
export const clonarCategorias = (data) => API.post('/categorias/clonar', data);

// ─────────────────────────────────────────────
// 🧾 Tickets Abiertos
// ─────────────────────────────────────────────
export const guardarTicket = (data) => API.post('/tickets', data);
export const obtenerTicketsAbiertos = () => API.get('/tickets');
export const eliminarTicket = (id) => API.delete(`/tickets/${id}`);

// ─────────────────────────────────────────────
// 🧪 Insumos
// ─────────────────────────────────────────────
export const obtenerInsumos = () => API.get('/insumos');
export const crearInsumo = (data) => API.post('/insumos', data);
export const editarInsumo = (id, data) => API.put(`/insumos/${id}`, data);
export const eliminarInsumo = (id) => API.delete(`/insumos/${id}`);
export const obtenerLotesInsumo = (id) => API.get(`/insumos/${id}/lotes`);
export const obtenerMovimientosInsumo = (id) => API.get(`/insumos/${id}/movimientos`);
export const obtenerMovimientosInsumos = (params) =>
  API.get('/insumos/movimientos', { params });
export const registrarMovimientoInsumo = (id, data) =>
  API.post(`/insumos/${id}/movimientos`, data);

// ─────────────────────────────────────────────
// 🏬 Locales
// ─────────────────────────────────────────────
export const obtenerLocales = () => API.get('/locales');
export const crearLocal = (data) => API.post('/locales', data);
export const editarLocal = (id, data) => API.put(`/locales/${id}`, data);
export const eliminarLocal = (id) => API.delete(`/locales/${id}`);
