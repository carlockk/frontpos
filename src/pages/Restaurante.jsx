import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import {
  actualizarEstadoComandaRestaurante,
  actualizarEstadoMesaRestaurante,
  crearComandaRestaurante,
  crearMesaRestaurante,
  editarComandaRestaurante,
  editarMesaRestaurante,
  eliminarComandaRestaurante,
  eliminarMesaRestaurante,
  obtenerComandasRestaurante,
  obtenerMesasRestaurante,
  obtenerProductos
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const ESTADOS_MESA = ['libre', 'ocupada', 'reservada', 'inactiva'];
const ESTADOS_COMANDA = ['abierta', 'en_preparacion', 'lista', 'entregada', 'cerrada', 'cancelada'];

const labelEstadoMesa = {
  libre: 'Libre',
  ocupada: 'Ocupada',
  reservada: 'Reservada',
  inactiva: 'Inactiva'
};

const labelEstadoComanda = {
  abierta: 'Abierta',
  en_preparacion: 'En preparación',
  lista: 'Lista',
  entregada: 'Entregada',
  cerrada: 'Cerrada',
  cancelada: 'Cancelada'
};

export default function Restaurante() {
  const { usuario } = useAuth();
  const [mesas, setMesas] = useState([]);
  const [comandas, setComandas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [openMesaDialog, setOpenMesaDialog] = useState(false);
  const [openEditarMesaDialog, setOpenEditarMesaDialog] = useState(false);
  const [openComandaDialog, setOpenComandaDialog] = useState(false);
  const [openEditarComandaDialog, setOpenEditarComandaDialog] = useState(false);

  const [mesaForm, setMesaForm] = useState({
    numero: '',
    nombre: '',
    zona: '',
    capacidad: 4
  });

  const [comandaForm, setComandaForm] = useState({
    mesaId: '',
    observacion: '',
    items: [{ productoId: '', cantidad: 1, nota: '' }]
  });
  const [editMesaForm, setEditMesaForm] = useState({
    id: '',
    numero: '',
    nombre: '',
    zona: '',
    capacidad: 4,
    estado: 'libre'
  });
  const [editComandaForm, setEditComandaForm] = useState({
    id: '',
    mesaId: '',
    estado: 'abierta',
    observacion: ''
  });

  const esAdmin = usuario?.rol === 'admin' || usuario?.rol === 'superadmin';

  const mesasDisponibles = useMemo(
    () => mesas.filter((mesa) => mesa.estado !== 'inactiva'),
    [mesas]
  );

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    try {
      const [resMesas, resComandas, resProductos] = await Promise.all([
        obtenerMesasRestaurante(),
        obtenerComandasRestaurante(),
        obtenerProductos()
      ]);
      setMesas(resMesas.data || []);
      setComandas(resComandas.data || []);
      setProductos(resProductos.data || []);
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo cargar el modulo restaurante');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const crearMesa = async () => {
    try {
      await crearMesaRestaurante({
        numero: Number(mesaForm.numero),
        nombre: mesaForm.nombre,
        zona: mesaForm.zona,
        capacidad: Number(mesaForm.capacidad) || 4
      });
      setOpenMesaDialog(false);
      setMesaForm({ numero: '', nombre: '', zona: '', capacidad: 4 });
      await cargarDatos();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo crear la mesa');
    }
  };

  const abrirEditorMesa = (mesa) => {
    setEditMesaForm({
      id: mesa._id,
      numero: mesa.numero ?? '',
      nombre: mesa.nombre || '',
      zona: mesa.zona || '',
      capacidad: mesa.capacidad || 4,
      estado: mesa.estado || 'libre'
    });
    setOpenEditarMesaDialog(true);
  };

  const guardarEdicionMesa = async () => {
    try {
      await editarMesaRestaurante(editMesaForm.id, {
        numero: Number(editMesaForm.numero),
        nombre: editMesaForm.nombre,
        zona: editMesaForm.zona,
        capacidad: Number(editMesaForm.capacidad),
        estado: editMesaForm.estado
      });
      setOpenEditarMesaDialog(false);
      await cargarDatos();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo editar la mesa');
    }
  };

  const eliminarMesa = async (mesaId) => {
    const ok = window.confirm('¿Seguro que deseas eliminar esta mesa?');
    if (!ok) return;
    try {
      await eliminarMesaRestaurante(mesaId);
      await cargarDatos();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo eliminar la mesa');
    }
  };

  const actualizarEstadoMesa = async (mesaId, estado) => {
    try {
      await actualizarEstadoMesaRestaurante(mesaId, { estado });
      await cargarDatos();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo actualizar la mesa');
    }
  };

  const actualizarEstadoComanda = async (comandaId, estado) => {
    try {
      await actualizarEstadoComandaRestaurante(comandaId, { estado });
      await cargarDatos();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo actualizar la comanda');
    }
  };

  const addComandaItemRow = () => {
    setComandaForm((prev) => ({
      ...prev,
      items: [...prev.items, { productoId: '', cantidad: 1, nota: '' }]
    }));
  };

  const updateComandaItem = (index, field, value) => {
    setComandaForm((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    }));
  };

  const removeComandaItem = (index) => {
    setComandaForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const crearComanda = async () => {
    try {
      const itemsLimpios = comandaForm.items
        .map((item) => ({
          productoId: item.productoId,
          cantidad: Number(item.cantidad),
          nota: item.nota
        }))
        .filter((item) => item.productoId && Number.isFinite(item.cantidad) && item.cantidad > 0);

      await crearComandaRestaurante({
        mesaId: comandaForm.mesaId,
        observacion: comandaForm.observacion,
        items: itemsLimpios
      });
      setOpenComandaDialog(false);
      setComandaForm({
        mesaId: '',
        observacion: '',
        items: [{ productoId: '', cantidad: 1, nota: '' }]
      });
      await cargarDatos();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo crear la comanda');
    }
  };

  const abrirEditorComanda = (comanda) => {
    setEditComandaForm({
      id: comanda._id,
      mesaId: comanda?.mesa?._id || '',
      estado: comanda.estado || 'abierta',
      observacion: comanda.observacion || ''
    });
    setOpenEditarComandaDialog(true);
  };

  const guardarEdicionComanda = async () => {
    try {
      await editarComandaRestaurante(editComandaForm.id, {
        mesaId: editComandaForm.mesaId,
        estado: editComandaForm.estado,
        observacion: editComandaForm.observacion
      });
      setOpenEditarComandaDialog(false);
      await cargarDatos();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo editar la comanda');
    }
  };

  const eliminarComanda = async (comandaId) => {
    const ok = window.confirm('¿Seguro que deseas eliminar esta comanda?');
    if (!ok) return;
    try {
      await eliminarComandaRestaurante(comandaId);
      await cargarDatos();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo eliminar la comanda');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Cargando modulo restaurante...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" mb={2} gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Restaurante</Typography>
          <Typography variant="body2" color="text.secondary">
            Gestion de mesas y comandas sin afectar el POS actual.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => setOpenMesaDialog(true)}>+ Mesa</Button>
          <Button variant="contained" onClick={() => setOpenComandaDialog(true)}>+ Comanda</Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {mesas.map((mesa) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={mesa._id}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" fontWeight={700}>
                    Mesa {mesa.numero}
                  </Typography>
                  <Chip label={labelEstadoMesa[mesa.estado] || mesa.estado} size="small" />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {mesa.nombre || 'Sin nombre'} {mesa.zona ? `- ${mesa.zona}` : ''}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                  Capacidad: {mesa.capacidad || 4}
                </Typography>
                <FormControl size="small" fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    label="Estado"
                    value={mesa.estado}
                    onChange={(e) => actualizarEstadoMesa(mesa._id, e.target.value)}
                  >
                    {ESTADOS_MESA.map((estado) => (
                      <MenuItem key={estado} value={estado}>
                        {labelEstadoMesa[estado] || estado}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {esAdmin && (
                  <Stack direction="row" spacing={1} mt={1}>
                    <Button size="small" variant="outlined" onClick={() => abrirEditorMesa(mesa)}>
                      Editar
                    </Button>
                    <Button size="small" color="error" variant="outlined" onClick={() => eliminarMesa(mesa._id)}>
                      Eliminar
                    </Button>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" mb={1}>Comandas</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Mesa</TableCell>
                <TableCell>Mesero</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Estado</TableCell>
                {esAdmin && <TableCell>Acciones</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {comandas.map((comanda) => (
                <TableRow key={comanda._id}>
                  <TableCell>
                    Mesa {comanda.mesa?.numero || '-'}
                  </TableCell>
                  <TableCell>{comanda.mesero?.nombre || comanda.mesero?.email || 'Sin asignar'}</TableCell>
                  <TableCell>{Array.isArray(comanda.items) ? comanda.items.length : 0}</TableCell>
                  <TableCell>${Number(comanda.total || 0).toLocaleString('es-CL')}</TableCell>
                  <TableCell width={220}>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={comanda.estado}
                        onChange={(e) => actualizarEstadoComanda(comanda._id, e.target.value)}
                      >
                        {ESTADOS_COMANDA.map((estado) => (
                          <MenuItem key={estado} value={estado}>
                            {labelEstadoComanda[estado] || estado}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  {esAdmin && (
                    <TableCell width={220}>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="outlined" onClick={() => abrirEditorComanda(comanda)}>
                          Editar
                        </Button>
                        <Button size="small" color="error" variant="outlined" onClick={() => eliminarComanda(comanda._id)}>
                          Eliminar
                        </Button>
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={openMesaDialog} onClose={() => setOpenMesaDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nueva Mesa</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Numero"
              type="number"
              value={mesaForm.numero}
              onChange={(e) => setMesaForm((prev) => ({ ...prev, numero: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Nombre (opcional)"
              value={mesaForm.nombre}
              onChange={(e) => setMesaForm((prev) => ({ ...prev, nombre: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Zona (opcional)"
              value={mesaForm.zona}
              onChange={(e) => setMesaForm((prev) => ({ ...prev, zona: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Capacidad"
              type="number"
              value={mesaForm.capacidad}
              onChange={(e) => setMesaForm((prev) => ({ ...prev, capacidad: e.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMesaDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={crearMesa}>Crear</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openComandaDialog} onClose={() => setOpenComandaDialog(false)} fullWidth maxWidth="md">
        <DialogTitle>Nueva Comanda</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <FormControl fullWidth size="small">
              <InputLabel>Mesa</InputLabel>
              <Select
                label="Mesa"
                value={comandaForm.mesaId}
                onChange={(e) => setComandaForm((prev) => ({ ...prev, mesaId: e.target.value }))}
              >
                {mesasDisponibles.map((mesa) => (
                  <MenuItem key={mesa._id} value={mesa._id}>
                    Mesa {mesa.numero} ({labelEstadoMesa[mesa.estado] || mesa.estado})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Observacion"
              value={comandaForm.observacion}
              onChange={(e) => setComandaForm((prev) => ({ ...prev, observacion: e.target.value }))}
              fullWidth
            />

            {comandaForm.items.map((item, idx) => (
              <Grid container spacing={1} key={`item-${idx}`} alignItems="center">
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Producto</InputLabel>
                    <Select
                      label="Producto"
                      value={item.productoId}
                      onChange={(e) => updateComandaItem(idx, 'productoId', e.target.value)}
                    >
                      {productos.map((producto) => (
                        <MenuItem key={producto._id} value={producto._id}>
                          {producto.nombre} - ${Number(producto.precio || 0).toLocaleString('es-CL')}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    label="Cant."
                    type="number"
                    size="small"
                    value={item.cantidad}
                    onChange={(e) => updateComandaItem(idx, 'cantidad', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Nota"
                    size="small"
                    value={item.nota}
                    onChange={(e) => updateComandaItem(idx, 'nota', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={1}>
                  <Button color="error" onClick={() => removeComandaItem(idx)}>X</Button>
                </Grid>
              </Grid>
            ))}

            <Button variant="text" onClick={addComandaItemRow}>
              + Agregar item
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenComandaDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={crearComanda}>Crear</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openEditarMesaDialog} onClose={() => setOpenEditarMesaDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Editar Mesa</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Numero"
              type="number"
              value={editMesaForm.numero}
              onChange={(e) => setEditMesaForm((prev) => ({ ...prev, numero: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Nombre"
              value={editMesaForm.nombre}
              onChange={(e) => setEditMesaForm((prev) => ({ ...prev, nombre: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Zona"
              value={editMesaForm.zona}
              onChange={(e) => setEditMesaForm((prev) => ({ ...prev, zona: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Capacidad"
              type="number"
              value={editMesaForm.capacidad}
              onChange={(e) => setEditMesaForm((prev) => ({ ...prev, capacidad: e.target.value }))}
              fullWidth
            />
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                label="Estado"
                value={editMesaForm.estado}
                onChange={(e) => setEditMesaForm((prev) => ({ ...prev, estado: e.target.value }))}
              >
                {ESTADOS_MESA.map((estado) => (
                  <MenuItem key={estado} value={estado}>
                    {labelEstadoMesa[estado] || estado}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditarMesaDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardarEdicionMesa}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openEditarComandaDialog} onClose={() => setOpenEditarComandaDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Editar Comanda</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <FormControl fullWidth size="small">
              <InputLabel>Mesa</InputLabel>
              <Select
                label="Mesa"
                value={editComandaForm.mesaId}
                onChange={(e) => setEditComandaForm((prev) => ({ ...prev, mesaId: e.target.value }))}
              >
                {mesasDisponibles.map((mesa) => (
                  <MenuItem key={mesa._id} value={mesa._id}>
                    Mesa {mesa.numero}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                label="Estado"
                value={editComandaForm.estado}
                onChange={(e) => setEditComandaForm((prev) => ({ ...prev, estado: e.target.value }))}
              >
                {ESTADOS_COMANDA.map((estado) => (
                  <MenuItem key={estado} value={estado}>
                    {labelEstadoComanda[estado] || estado}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Observacion"
              value={editComandaForm.observacion}
              onChange={(e) => setEditComandaForm((prev) => ({ ...prev, observacion: e.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditarComandaDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardarEdicionComanda}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
