import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tabs,
  Tab,
  useMediaQuery
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import {
  obtenerInsumos,
  crearInsumo,
  editarInsumo,
  eliminarInsumo,
  obtenerLotesInsumo,
  obtenerMovimientosInsumo,
  obtenerMovimientosInsumos,
  registrarMovimientoInsumo
} from '../services/api';

const emptyForm = {
  nombre: '',
  descripcion: '',
  unidad: 'unid',
  stock_minimo: '',
  alerta_vencimiento_dias: '7',
  stock_inicial: '',
  lote_inicial: '',
  vencimiento_inicial: ''
};

const unidades = [
  { value: 'unid', label: 'Unidad' },
  { value: 'kg', label: 'Kilogramo' },
  { value: 'lt', label: 'Litro' }
];

const estadoVencimiento = (lote, alertaDias) => {
  if (!lote?.fecha_vencimiento) return 'normal';
  const hoy = new Date();
  const venc = new Date(lote.fecha_vencimiento);
  if (Number.isNaN(venc.getTime())) return 'normal';
  const diff = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'vencido';
  if (diff <= alertaDias) return 'por_vencer';
  return 'normal';
};

export default function Insumos() {
  const { usuario, selectedLocal } = useAuth();
  const isAdmin = usuario?.rol === 'admin' || usuario?.rol === 'superadmin';
  const puedeEditar = isAdmin || usuario?.rol === 'cajero';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [lotesOpen, setLotesOpen] = useState(false);
  const [lotesInsumo, setLotesInsumo] = useState(null);
  const [lotes, setLotes] = useState([]);

  const [movOpen, setMovOpen] = useState(false);
  const [movimientos, setMovimientos] = useState([]);
  const [movInsumo, setMovInsumo] = useState(null);
  const [movTipoFijo, setMovTipoFijo] = useState(false);
  const [movTab, setMovTab] = useState('entrada');
  const [movBusqueda, setMovBusqueda] = useState('');
  const [movFechas, setMovFechas] = useState([]);
  const [histOpen, setHistOpen] = useState(false);
  const [histInsumoId, setHistInsumoId] = useState('');
  const [histMovimientos, setHistMovimientos] = useState([]);
  const [histTab, setHistTab] = useState('entrada');
  const [histBusqueda, setHistBusqueda] = useState('');
  const [histFechas, setHistFechas] = useState([]);

  const [movForm, setMovForm] = useState({
    tipo: 'entrada',
    cantidad: '',
    loteId: '',
    lote: '',
    fecha_vencimiento: '',
    motivo: ''
  });

  const fetchInsumos = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await obtenerInsumos();
      setInsumos(res.data || []);
    } catch (err) {
      setError('No se pudieron cargar los insumos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsumos();
  }, [selectedLocal?._id]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
    setError('');
    setInfo('');
  };

  const openEdit = (insumo) => {
    setForm({
      nombre: insumo.nombre || '',
      descripcion: insumo.descripcion || '',
      unidad: insumo.unidad || 'unid',
      stock_minimo: insumo.stock_minimo ?? '',
      alerta_vencimiento_dias: insumo.alerta_vencimiento_dias ?? '7',
      stock_inicial: '',
      lote_inicial: '',
      vencimiento_inicial: ''
    });
    setEditingId(insumo._id);
    setDialogOpen(true);
    setError('');
    setInfo('');
  };

  const handleSave = async () => {
    setError('');
    setInfo('');

    if (!form.nombre.trim() || !form.unidad) {
      setError('Nombre y unidad son obligatorios.');
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      unidad: form.unidad,
      stock_minimo: form.stock_minimo === '' ? 0 : Number(form.stock_minimo),
      alerta_vencimiento_dias: form.alerta_vencimiento_dias === '' ? 7 : Number(form.alerta_vencimiento_dias)
    };

    try {
      if (editingId) {
        await editarInsumo(editingId, payload);
        setInfo('Insumo actualizado.');
      } else {
        const creado = await crearInsumo(payload);
        const stockInicial = Number(form.stock_inicial);
        if (Number.isFinite(stockInicial) && stockInicial > 0) {
          await registrarMovimientoInsumo(creado.data._id, {
            tipo: 'entrada',
            cantidad: stockInicial,
            lote: form.lote_inicial || undefined,
            fecha_vencimiento: form.vencimiento_inicial || undefined,
            motivo: 'Stock inicial'
          });
        }
        setInfo('Insumo creado.');
      }
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchInsumos();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo guardar el insumo.');
    }
  };

  const confirmDelete = (insumo) => {
    setDeleteTarget(insumo);
    setError('');
    setInfo('');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await eliminarInsumo(deleteTarget._id);
      setInfo('Insumo eliminado.');
      setDeleteTarget(null);
      fetchInsumos();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo eliminar el insumo.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openLotes = async (insumo) => {
    try {
      const res = await obtenerLotesInsumo(insumo._id);
      setLotes(res.data || []);
      setLotesInsumo(insumo);
      setLotesOpen(true);
    } catch (err) {
      setError('No se pudieron cargar los lotes.');
    }
  };

  const openMovimientos = async (insumo) => {
    try {
      const res = await obtenerMovimientosInsumo(insumo._id);
      setMovimientos(res.data || []);
      setMovInsumo(insumo);
      setMovTipoFijo(false);
      setMovTab('entrada');
      setMovBusqueda('');
      setMovFechas([]);
      setMovForm({
        tipo: 'entrada',
        cantidad: '',
        loteId: '',
        lote: '',
        fecha_vencimiento: '',
        motivo: ''
      });
      setMovOpen(true);
    } catch (err) {
      setError('No se pudieron cargar los movimientos.');
    }
  };

  const openHistorial = () => {
    setHistOpen(true);
    setHistInsumoId('');
    setHistMovimientos([]);
    setHistTab('entrada');
    setHistBusqueda('');
    setHistFechas([]);
  };

  useEffect(() => {
    if (!histInsumoId) {
      obtenerMovimientosInsumos()
        .then((res) => setHistMovimientos(res.data || []))
        .catch(() => setHistMovimientos([]));
      return;
    }
    obtenerMovimientosInsumo(histInsumoId)
      .then((res) => setHistMovimientos(res.data || []))
      .catch(() => setHistMovimientos([]));
  }, [histInsumoId]);

  const openMovimientoTipo = async (insumo, tipo) => {
    try {
      const [movRes, lotesRes] = await Promise.all([
        obtenerMovimientosInsumo(insumo._id),
        obtenerLotesInsumo(insumo._id)
      ]);
      setMovimientos(movRes.data || []);
      setLotes(lotesRes.data || []);
      setMovInsumo(insumo);
      setMovTipoFijo(true);
      setMovTab(tipo);
      setMovBusqueda('');
      setMovFechas([]);
      setMovForm({
        tipo,
        cantidad: '',
        loteId: '',
        lote: '',
        fecha_vencimiento: '',
        motivo: ''
      });
      setMovOpen(true);
    } catch (err) {
      setError('No se pudieron cargar los movimientos.');
    }
  };

  const handleMovimiento = async () => {
    if (!movInsumo) return;
    const cantidad = Number(movForm.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      setError('Ingresa una cantidad válida.');
      return;
    }
    const payload = {
      tipo: movForm.tipo,
      cantidad,
      loteId: movForm.loteId || undefined,
      lote: movForm.lote || undefined,
      fecha_vencimiento: movForm.fecha_vencimiento || undefined,
      motivo: movForm.motivo || undefined
    };
    try {
      await registrarMovimientoInsumo(movInsumo._id, payload);
      setInfo('Movimiento registrado.');
      setMovForm({
        tipo: 'entrada',
        cantidad: '',
        loteId: '',
        lote: '',
        fecha_vencimiento: '',
        motivo: ''
      });
      fetchInsumos();
      const res = await obtenerMovimientosInsumo(movInsumo._id);
      setMovimientos(res.data || []);
      const lotesRes = await obtenerLotesInsumo(movInsumo._id);
      setLotes(lotesRes.data || []);
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo registrar el movimiento.');
    }
  };

  const estadosPorLote = useMemo(() => {
    const map = new Map();
    lotes.forEach((lote) => {
      const estado = estadoVencimiento(lote, Number(lotesInsumo?.alerta_vencimiento_dias || 7));
      map.set(lote._id, estado);
    });
    return map;
  }, [lotes, lotesInsumo]);

  const movimientosFiltrados = useMemo(() => {
    const texto = movBusqueda.trim().toLowerCase();
    const [inicio, fin] = movFechas;
    const inicioDate = inicio ? new Date(inicio.toDate()) : null;
    const finDate = fin ? new Date(fin.toDate()) : null;

    return movimientos.filter((mov) => {
      if (movTab && mov.tipo !== movTab) return false;
      if (texto) {
        const motivo = (mov.motivo || '').toLowerCase();
        const lote = (mov.lote || '').toLowerCase();
        if (!motivo.includes(texto) && !lote.includes(texto)) return false;
      }
      if (inicioDate && finDate) {
        const fecha = new Date(mov.fecha);
        if (fecha < inicioDate || fecha > finDate) return false;
      }
      return true;
    });
  }, [movimientos, movTab, movBusqueda, movFechas]);

  const historialFiltrado = useMemo(() => {
    const texto = histBusqueda.trim().toLowerCase();
    const [inicio, fin] = histFechas;
    const inicioDate = inicio ? new Date(inicio.toDate()) : null;
    const finDate = fin ? new Date(fin.toDate()) : null;

    return histMovimientos.filter((mov) => {
      if (histTab && mov.tipo !== histTab) return false;
      if (texto) {
        const motivo = (mov.motivo || '').toLowerCase();
        const lote = (mov.lote || '').toLowerCase();
        if (!motivo.includes(texto) && !lote.includes(texto)) return false;
      }
      if (inicioDate && finDate) {
        const fecha = new Date(mov.fecha);
        if (fecha < inicioDate || fecha > finDate) return false;
      }
      return true;
    });
  }, [histMovimientos, histTab, histBusqueda, histFechas]);

  return (
    <Box sx={{ mt: 4, px: 2 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h5" gutterBottom>Insumos</Typography>
            <Typography variant="body2" color="text.secondary">
              Inventario de materias primas e insumos.
            </Typography>
          </Box>
          {isAdmin && (
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                Crear insumo
              </Button>
              <Button variant="outlined" onClick={openHistorial}>
                Ver historial de E/S
              </Button>
            </Stack>
          )}
          {!isAdmin && (
            <Button variant="outlined" onClick={openHistorial}>
              Ver historial de E/S
            </Button>
          )}
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {info && <Alert severity="success" sx={{ mb: 2 }}>{info}</Alert>}

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Unidad</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Minimo</TableCell>
                <TableCell>Vencimiento</TableCell>
                <TableCell>Ingresos/Egresos</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {insumos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No hay insumos registrados.
                  </TableCell>
                </TableRow>
              )}
              {insumos.map((insumo) => {
                const stockBajo = Number(insumo.stock_total || 0) <= Number(insumo.stock_minimo || 0);
                return (
                  <TableRow key={insumo._id}>
                    <TableCell>{insumo.nombre}</TableCell>
                    <TableCell>{insumo.unidad}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={stockBajo ? 'warning' : 'success'}
                        label={Number(insumo.stock_total || 0)}
                      />
                    </TableCell>
                  <TableCell>{Number(insumo.stock_minimo || 0)}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => openLotes(insumo)}>
                      Ver lotes
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => openMovimientoTipo(insumo, 'entrada')}>
                      Entrada
                    </Button>
                    <Button size="small" onClick={() => openMovimientoTipo(insumo, 'salida')}>
                      Salida
                    </Button>
                  </TableCell>
                  <TableCell align="right">
                    {puedeEditar && (
                      <IconButton size="small" onClick={() => openEdit(insumo)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {isAdmin && (
                      <IconButton size="small" onClick={() => confirmDelete(insumo)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Editar insumo' : 'Crear insumo'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre"
              value={form.nombre}
              onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
              required
            />
            <TextField
              label="Descripcion"
              value={form.descripcion}
              onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
              multiline
              minRows={2}
            />
            <TextField
              select
              label="Unidad"
              value={form.unidad}
              onChange={(e) => setForm((prev) => ({ ...prev, unidad: e.target.value }))}
            >
              {unidades.map((u) => (
                <MenuItem key={u.value} value={u.value}>
                  {u.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Stock minimo"
              type="number"
              value={form.stock_minimo}
              onChange={(e) => setForm((prev) => ({ ...prev, stock_minimo: e.target.value }))}
            />
            <TextField
              label="Dias alerta vencimiento"
              type="number"
              value={form.alerta_vencimiento_dias}
              onChange={(e) => setForm((prev) => ({ ...prev, alerta_vencimiento_dias: e.target.value }))}
            />
            {!editingId && (
              <>
                <TextField
                  label="Stock inicial (opcional)"
                  type="number"
                  value={form.stock_inicial}
                  onChange={(e) => setForm((prev) => ({ ...prev, stock_inicial: e.target.value }))}
                />
                <TextField
                  label="Lote inicial (opcional)"
                  value={form.lote_inicial}
                  onChange={(e) => setForm((prev) => ({ ...prev, lote_inicial: e.target.value }))}
                />
                <TextField
                  label="Vencimiento inicial (opcional)"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={form.vencimiento_inicial}
                  onChange={(e) => setForm((prev) => ({ ...prev, vencimiento_inicial: e.target.value }))}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar insumo</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Seguro que deseas eliminar el insumo "{deleteTarget?.nombre}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleteLoading}>
            {deleteLoading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={lotesOpen} onClose={() => setLotesOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Lotes de {lotesInsumo?.nombre}</DialogTitle>
        <DialogContent dividers>
          {lotes.length === 0 ? (
            <Typography color="text.secondary">No hay lotes registrados.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Lote</TableCell>
                  <TableCell>Vencimiento</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lotes.map((lote) => {
                  const estado = estadosPorLote.get(lote._id) || 'normal';
                  const label =
                    estado === 'vencido' ? 'Vencido' : estado === 'por_vencer' ? 'Por vencer' : 'Normal';
                  const color =
                    estado === 'vencido' ? 'error' : estado === 'por_vencer' ? 'warning' : 'success';
                  return (
                    <TableRow key={lote._id}>
                      <TableCell>{lote.lote || '-'}</TableCell>
                      <TableCell>
                        {lote.fecha_vencimiento
                          ? new Date(lote.fecha_vencimiento).toLocaleDateString()
                          : 'Sin vencimiento'}
                      </TableCell>
                      <TableCell>{lote.cantidad}</TableCell>
                      <TableCell>
                        <Chip size="small" color={color} label={label} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLotesOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={movOpen} onClose={() => setMovOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Movimientos - {movInsumo?.nombre}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {!movTipoFijo ? (
              <TextField
                select
                label="Tipo"
                value={movForm.tipo}
                onChange={(e) => setMovForm((prev) => ({ ...prev, tipo: e.target.value }))}
              >
                <MenuItem value="entrada">Entrada</MenuItem>
                <MenuItem value="salida">Salida</MenuItem>
              </TextField>
            ) : (
              <TextField
                label="Tipo"
                value={movForm.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                disabled
              />
            )}
            <TextField
              label="Cantidad"
              type="number"
              value={movForm.cantidad}
              onChange={(e) => setMovForm((prev) => ({ ...prev, cantidad: e.target.value }))}
            />
            {movForm.tipo === 'entrada' && (
              <>
                <TextField
                  label="Lote (opcional)"
                  value={movForm.lote}
                  onChange={(e) => setMovForm((prev) => ({ ...prev, lote: e.target.value }))}
                />
                <TextField
                  label="Fecha vencimiento (opcional)"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={movForm.fecha_vencimiento}
                  onChange={(e) => setMovForm((prev) => ({ ...prev, fecha_vencimiento: e.target.value }))}
                />
              </>
            )}
            {movForm.tipo === 'salida' && (
              <TextField
                select
                label="Lote"
                value={movForm.loteId}
                onChange={(e) => setMovForm((prev) => ({ ...prev, loteId: e.target.value }))}
              >
                <MenuItem value="">FIFO automatico</MenuItem>
                {lotes.map((lote) => (
                  <MenuItem key={lote._id} value={lote._id}>
                    {lote.lote || lote._id} ({lote.cantidad})
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              label="Motivo"
              value={movForm.motivo}
              onChange={(e) => setMovForm((prev) => ({ ...prev, motivo: e.target.value }))}
            />
            <Button variant="contained" onClick={handleMovimiento}>
              Registrar movimiento
            </Button>
          </Stack>
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Historial</Typography>
            <Tabs
              value={movTab}
              onChange={(_e, value) => setMovTab(value)}
              sx={{ mb: 1 }}
            >
              <Tab label="Entradas" value="entrada" />
              <Tab label="Salidas" value="salida" />
            </Tabs>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
              <TextField
                label="Buscar por motivo/lote"
                value={movBusqueda}
                onChange={(e) => setMovBusqueda(e.target.value)}
                size="small"
              />
              <DatePicker
                range
                value={movFechas}
                onChange={(dates) => setMovFechas([...dates])}
                format="YYYY-MM-DD"
                style={{
                  padding: '6px',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb'
                }}
              />
            </Stack>
            {movimientosFiltrados.length === 0 ? (
              <Typography color="text.secondary">Sin movimientos.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Cantidad</TableCell>
                    <TableCell>Motivo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movimientosFiltrados.map((mov) => (
                    <TableRow key={mov._id}>
                      <TableCell>{new Date(mov.fecha).toLocaleString()}</TableCell>
                      <TableCell>{mov.tipo}</TableCell>
                      <TableCell>{mov.cantidad}</TableCell>
                      <TableCell>{mov.motivo || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMovOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={histOpen}
        onClose={() => setHistOpen(false)}
        fullScreen={isMobile}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: !isMobile
            ? { height: '90vh', display: 'flex', flexDirection: 'column' }
            : {}
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Historial de Entradas/Salidas
          <IconButton onClick={() => setHistOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={!isMobile ? { flex: 1, overflow: 'auto' } : {}}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Insumo"
              value={histInsumoId}
              onChange={(e) => setHistInsumoId(e.target.value)}
            >
              <MenuItem value="">Todos los insumos</MenuItem>
              {insumos.map((insumo) => (
                <MenuItem key={insumo._id} value={insumo._id}>
                  {insumo.nombre}
                </MenuItem>
              ))}
            </TextField>
            <Tabs value={histTab} onChange={(_e, value) => setHistTab(value)}>
              <Tab label="Entradas" value="entrada" />
              <Tab label="Salidas" value="salida" />
            </Tabs>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Buscar por motivo/lote"
                value={histBusqueda}
                onChange={(e) => setHistBusqueda(e.target.value)}
                size="small"
              />
              <DatePicker
                range
                value={histFechas}
                onChange={(dates) => setHistFechas([...dates])}
                format="YYYY-MM-DD"
                style={{
                  padding: '6px',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb'
                }}
              />
            </Stack>
          </Stack>
          <Box sx={{ mt: 3 }}>
            {historialFiltrado.length === 0 ? (
              <Typography color="text.secondary">Sin movimientos.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    {histInsumoId === '' && <TableCell>Insumo</TableCell>}
                    <TableCell>Tipo</TableCell>
                    <TableCell>Cantidad</TableCell>
                    <TableCell>Motivo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historialFiltrado.map((mov) => (
                    <TableRow key={mov._id}>
                      <TableCell>{new Date(mov.fecha).toLocaleString()}</TableCell>
                      {histInsumoId === '' && (
                        <TableCell>{mov.insumo?.nombre || '-'}</TableCell>
                      )}
                      <TableCell>{mov.tipo}</TableCell>
                      <TableCell>{mov.cantidad}</TableCell>
                      <TableCell>{mov.motivo || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
