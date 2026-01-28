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
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import { useAuth } from '../context/AuthContext';
import {
  obtenerInsumos,
  crearInsumo,
  editarInsumo,
  eliminarInsumo,
  obtenerLotesInsumo,
  obtenerMovimientosInsumo,
  registrarMovimientoInsumo
} from '../services/api';

const emptyForm = {
  nombre: '',
  descripcion: '',
  unidad: 'unid',
  stock_minimo: '',
  alerta_vencimiento_dias: '7'
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
      alerta_vencimiento_dias: insumo.alerta_vencimiento_dias ?? '7'
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
        await crearInsumo(payload);
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
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              Crear insumo
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
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {insumos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
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
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEdit(insumo)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => confirmDelete(insumo)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => openMovimientos(insumo)}>
                        <InfoIcon fontSize="small" />
                      </IconButton>
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
            <TextField
              select
              label="Tipo"
              value={movForm.tipo}
              onChange={(e) => setMovForm((prev) => ({ ...prev, tipo: e.target.value }))}
            >
              <MenuItem value="entrada">Entrada</MenuItem>
              <MenuItem value="salida">Salida</MenuItem>
            </TextField>
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
            {movimientos.length === 0 ? (
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
                  {movimientos.map((mov) => (
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
    </Box>
  );
}
