import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Drawer,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import { actualizarEstadoPedidoWeb, obtenerPedidosWeb } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CERRADOS = new Set(['entregado', 'rechazado', 'cancelado']);
const ESTADOS = ['pendiente', 'aceptado', 'preparando', 'listo', 'entregado', 'rechazado', 'cancelado'];

const getEstado = (pedido) =>
  String(pedido?.estado_pedido || pedido?.estado || pedido?.status || 'pendiente').toLowerCase();

const getClienteLabel = (pedido) => {
  const nombre = pedido?.cliente_nombre || '';
  const telefono = pedido?.cliente_telefono || '';
  if (nombre && telefono) return `${nombre} (${telefono})`;
  return nombre || telefono || 'Cliente sin datos';
};

const getLocalId = (selectedLocal, usuario) => {
  if (typeof selectedLocal === 'string') return selectedLocal;
  if (selectedLocal?._id) return selectedLocal._id;
  if (typeof usuario?.local === 'string') return usuario.local;
  if (usuario?.local?._id) return usuario.local._id;
  return '';
};

const getPedidoDate = (pedido) =>
  new Date(pedido?.fecha || pedido?.createdAt || pedido?.updatedAt || 0).getTime();

export default function PedidosWeb() {
  const { usuario, selectedLocal } = useAuth();
  const location = useLocation();
  const [tab, setTab] = useState('abiertos');
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pedidoActivo, setPedidoActivo] = useState(null);
  const [estadoEdicion, setEstadoEdicion] = useState('pendiente');
  const [guardandoEstado, setGuardandoEstado] = useState(false);

  const localId = useMemo(() => getLocalId(selectedLocal, usuario), [selectedLocal, usuario]);

  const cargarPedidos = async () => {
    if (!localId) {
      setPedidos([]);
      return;
    }

    setLoading(true);
    try {
      const res = await obtenerPedidosWeb();
      const data = Array.isArray(res.data) ? res.data : [];
      data.sort((a, b) => getPedidoDate(b) - getPedidoDate(a));
      setPedidos(data);
    } catch {
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, [localId]);

  useEffect(() => {
    const focusId = location.state?.focusPedidoId;
    if (!focusId || pedidos.length === 0) return;
    const found = pedidos.find((p) => p._id === focusId);
    if (found) {
      setPedidoActivo(found);
      setEstadoEdicion(getEstado(found));
    }
  }, [location.state, pedidos]);

  useEffect(() => {
    if (!localId) return undefined;
    const interval = setInterval(() => {
      cargarPedidos();
    }, 15000);
    return () => clearInterval(interval);
  }, [localId]);

  const pedidosFiltrados = useMemo(() => {
    if (tab === 'abiertos') {
      return pedidos.filter((p) => !CERRADOS.has(getEstado(p)));
    }
    return pedidos.filter((p) => CERRADOS.has(getEstado(p)));
  }, [pedidos, tab]);

  const guardarEstado = async () => {
    if (!pedidoActivo?._id) return;
    setGuardandoEstado(true);
    try {
      const res = await actualizarEstadoPedidoWeb(pedidoActivo._id, { estado: estadoEdicion });
      const actualizado = res.data;
      setPedidos((prev) => prev.map((p) => (p._id === actualizado._id ? actualizado : p)));
      setPedidoActivo(actualizado);
    } finally {
      setGuardandoEstado(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Pedidos Web</Typography>
      {!localId && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography color="text.secondary">Selecciona un local para gestionar pedidos web.</Typography>
        </Paper>
      )}

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab value="abiertos" label={`Pedidos abiertos (${pedidos.filter((p) => !CERRADOS.has(getEstado(p))).length})`} />
          <Tab value="cerrados" label={`Pedidos completados/cerrados (${pedidos.filter((p) => CERRADOS.has(getEstado(p))).length})`} />
        </Tabs>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>N° Pedido</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pedidosFiltrados.map((pedido) => (
              <TableRow key={pedido._id} hover>
                <TableCell>#{pedido.numero_pedido || pedido._id?.slice(-5)}</TableCell>
                <TableCell>{new Date(pedido.fecha || pedido.createdAt || Date.now()).toLocaleString()}</TableCell>
                <TableCell>{getClienteLabel(pedido)}</TableCell>
                <TableCell>${Number(pedido.total || 0).toLocaleString('es-CL')}</TableCell>
                <TableCell>
                  <Chip size="small" label={getEstado(pedido)} />
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setPedidoActivo(pedido);
                      setEstadoEdicion(getEstado(pedido));
                    }}
                  >
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {pedidosFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  {loading ? 'Cargando pedidos...' : 'Sin pedidos en esta pestaña'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Drawer
        anchor="right"
        open={Boolean(pedidoActivo)}
        onClose={() => setPedidoActivo(null)}
        PaperProps={{ sx: { width: { xs: '100%', md: 460 }, p: 2 } }}
      >
        {pedidoActivo && (
          <Stack spacing={1.5}>
            <Typography variant="h6">Pedido #{pedidoActivo.numero_pedido || pedidoActivo._id?.slice(-5)}</Typography>
            <Typography><strong>Cliente:</strong> {getClienteLabel(pedidoActivo)}</Typography>
            <Typography><strong>Fecha:</strong> {new Date(pedidoActivo.fecha || pedidoActivo.createdAt || Date.now()).toLocaleString()}</Typography>
            <Typography><strong>Total:</strong> ${Number(pedidoActivo.total || 0).toLocaleString('es-CL')}</Typography>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Estado del pedido</Typography>
              <Stack direction="row" spacing={1}>
                <Select
                  size="small"
                  fullWidth
                  value={estadoEdicion}
                  onChange={(e) => setEstadoEdicion(e.target.value)}
                  disabled={!['admin', 'superadmin', 'cajero'].includes(usuario?.rol || '')}
                >
                  {ESTADOS.map((estado) => (
                    <MenuItem key={estado} value={estado}>{estado}</MenuItem>
                  ))}
                </Select>
                <Button
                  variant="contained"
                  onClick={guardarEstado}
                  disabled={guardandoEstado || !['admin', 'superadmin', 'cajero'].includes(usuario?.rol || '')}
                >
                  Guardar
                </Button>
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Detalle</Typography>
              <Stack spacing={1}>
                {(pedidoActivo.productos || []).map((prod, idx) => (
                  <Paper key={`${prod?.nombre || 'prod'}-${idx}`} variant="outlined" sx={{ p: 1 }}>
                    <Typography sx={{ fontWeight: 600 }}>{prod?.nombre || 'Producto'}</Typography>
                    <Typography variant="body2">Cantidad: {prod?.cantidad || 1}</Typography>
                    <Typography variant="body2">Precio: ${Number(prod?.precio_unitario || 0).toLocaleString('es-CL')}</Typography>
                    {prod?.varianteNombre && (
                      <Typography variant="body2">Variacion: {prod.varianteNombre}</Typography>
                    )}
                    {Array.isArray(prod?.agregados) && prod.agregados.length > 0 && (
                      <Typography variant="body2">
                        Agregados: {prod.agregados.map((agg) => agg.nombre).join(', ')}
                      </Typography>
                    )}
                    {prod?.observacion && (
                      <Typography variant="body2">Obs: {prod.observacion}</Typography>
                    )}
                  </Paper>
                ))}
              </Stack>
            </Box>

            <Box sx={{ pt: 1 }}>
              <Button variant="contained" onClick={() => window.print()}>
                Imprimir
              </Button>
            </Box>
          </Stack>
        )}
      </Drawer>
    </Box>
  );
}
