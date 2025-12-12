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

// ─────────────────────────────────────────────
// 🛍️ Productos
// ─────────────────────────────────────────────
export const obtenerProductos = () => API.get('/productos');

export const crearProducto = (data) =>
  API.post('/productos', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
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
export const obtenerCategorias = () => API.get('/categorias');
export const crearCategoria = (data) => API.post('/categorias', data);
export const editarCategoria = (id, data) => API.put(`/categorias/${id}`, data);
export const eliminarCategoria = (id) => API.delete(`/categorias/${id}`);

// ─────────────────────────────────────────────
// 🧾 Tickets Abiertos
// ─────────────────────────────────────────────
export const guardarTicket = (data) => API.post('/tickets', data);
export const obtenerTicketsAbiertos = () => API.get('/tickets');
export const eliminarTicket = (id) => API.delete(`/tickets/${id}`);
