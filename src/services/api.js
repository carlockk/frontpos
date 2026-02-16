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
        if (typeof usuario?.local === 'string') {
          localId = usuario.local;
        } else {
          localId = usuario?.local?._id || '';
        }
      } else if (storedLocal) {
        const localParsed = JSON.parse(storedLocal);
        if (typeof localParsed === 'string') {
          localId = localParsed;
        } else {
          localId = localParsed?._id || '';
        }
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
// ➕ Agregados
// ─────────────────────────────────────────────
export const obtenerAgregados = () => API.get('/agregados');
export const crearAgregado = (data) => API.post('/agregados', data);
export const editarAgregado = (id, data) => API.put(`/agregados/${id}`, data);
export const eliminarAgregado = (id) => API.delete(`/agregados/${id}`);
export const obtenerOpcionesAgregados = () => API.get('/agregados/opciones');
export const obtenerGruposAgregados = () => API.get('/agregados/grupos');
export const crearGrupoAgregados = (data) => API.post('/agregados/grupos', data);
export const editarGrupoAgregados = (id, data) => API.put(`/agregados/grupos/${id}`, data);
export const eliminarGrupoAgregados = (id) => API.delete(`/agregados/grupos/${id}`);

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
export const obtenerInsumos = (params) => API.get('/insumos', { params });
export const crearInsumo = (data) => API.post('/insumos', data);
export const editarInsumo = (id, data) => API.put(`/insumos/${id}`, data);
export const eliminarInsumo = (id) => API.delete(`/insumos/${id}`);
export const actualizarEstadoInsumo = (id, data) => API.put(`/insumos/${id}/estado`, data);
export const actualizarNotaInsumo = (id, data) => API.put(`/insumos/${id}/nota`, data);
export const clonarInsumos = (data) => API.post('/insumos/clonar', data);
export const actualizarOrdenInsumos = (data) => API.put('/insumos/orden', data);
export const obtenerCategoriasInsumo = () => API.get('/insumo-categorias');
export const crearCategoriaInsumo = (data) => API.post('/insumo-categorias', data);
export const editarCategoriaInsumo = (id, data) => API.put(`/insumo-categorias/${id}`, data);
export const eliminarCategoriaInsumo = (id) => API.delete(`/insumo-categorias/${id}`);
export const actualizarOrdenCategoriasInsumo = (data) =>
  API.put('/insumo-categorias/orden', data);
export const obtenerLotesInsumo = (id, params) =>
  API.get(`/insumos/${id}/lotes`, { params });
export const eliminarLoteInsumo = (insumoId, loteId) =>
  API.delete(`/insumos/${insumoId}/lotes/${loteId}`);
export const eliminarLotesInsumo = (insumoId) =>
  API.delete(`/insumos/${insumoId}/lotes`);
export const actualizarEstadoLoteInsumo = (insumoId, loteId, data) =>
  API.put(`/insumos/${insumoId}/lotes/${loteId}/estado`, data);
export const crearLoteInsumo = (insumoId, data) =>
  API.post(`/insumos/${insumoId}/lotes`, data);
export const obtenerMovimientosInsumo = (id) => API.get(`/insumos/${id}/movimientos`);
export const obtenerMovimientosInsumos = (params) =>
  API.get('/insumos/movimientos', { params });
export const registrarMovimientoInsumo = (id, data) =>
  API.post(`/insumos/${id}/movimientos`, data);
export const eliminarMovimientoInsumo = (id) => API.delete(`/insumos/movimientos/${id}`);
export const eliminarMovimientosInsumos = (params) =>
  API.delete('/insumos/movimientos', { params });
export const obtenerConfigAlertasInsumos = () => API.get('/insumos/alertas/config');
export const guardarConfigAlertasInsumos = (data) => API.put('/insumos/alertas/config', data);
export const enviarResumenAlertasInsumos = () => API.post('/insumos/alertas/resumen');

// ─────────────────────────────────────────────
// 🧾 Configuracion de recibos
// ─────────────────────────────────────────────
export const obtenerConfigRecibo = () => API.get('/recibo-config');
export const guardarConfigRecibo = (data) =>
  API.put('/recibo-config', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ─────────────────────────────────────────────
// 🏬 Locales
// ─────────────────────────────────────────────
export const obtenerLocales = () => API.get('/locales');
export const crearLocal = (data) => API.post('/locales', data);
export const editarLocal = (id, data) => API.put(`/locales/${id}`, data);
export const eliminarLocal = (id) => API.delete(`/locales/${id}`);

// ─────────────────────────────────────────────
// 🌐 Pedidos Web (cliente)
// ─────────────────────────────────────────────
export const obtenerPedidosWeb = (params) => API.get('/ventasCliente/local/pedidos', { params });
export const obtenerEstadosPedidoWeb = () => API.get('/ventasCliente/local/estados');
export const crearEstadoPedidoWeb = (data) => API.post('/ventasCliente/local/estados', data);
export const actualizarEstadoPedidoWeb = (id, data) => API.patch(`/ventasCliente/local/pedidos/${id}/estado`, data);




