import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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

import { useAuth } from '../context/AuthContext';
import {
  obtenerLocales,
  crearLocal,
  editarLocal,
  eliminarLocal
} from '../services/api';

const emptyForm = { nombre: '', direccion: '', telefono: '', correo: '' };

export default function Locales() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'admin' || usuario?.rol === 'superadmin';

  const [locales, setLocales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchLocales = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await obtenerLocales();
      setLocales(res.data || []);
    } catch (err) {
      setError('No se pudieron cargar los locales.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocales();
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
    setInfo('');
    setError('');
  };

  const openEdit = (local) => {
    setForm({
      nombre: local.nombre || '',
      direccion: local.direccion || '',
      telefono: local.telefono || '',
      correo: local.correo || ''
    });
    setEditingId(local._id);
    setDialogOpen(true);
    setInfo('');
    setError('');
  };

  const handleSave = async () => {
    setError('');
    setInfo('');

    if (!form.nombre.trim()) {
      setError('Ingresa un nombre para el local.');
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      direccion: form.direccion.trim(),
      telefono: form.telefono.trim(),
      correo: form.correo.trim()
    };

    try {
      setSaving(true);
      if (editingId) {
        await editarLocal(editingId, payload);
        setInfo('Local actualizado.');
      } else {
        await crearLocal(payload);
        setInfo('Local creado.');
      }
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      fetchLocales();
    } catch (err) {
      const msg = err?.response?.data?.error || 'No se pudo guardar el local.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (local) => {
    setDeleteTarget(local);
    setError('');
    setInfo('');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleteLoading(true);
      await eliminarLocal(deleteTarget._id);
      setInfo('Local eliminado.');
      setDeleteTarget(null);
      fetchLocales();
    } catch (err) {
      const msg = err?.response?.data?.error || 'No se pudo eliminar el local.';
      setError(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const closeDeleteDialog = () => {
    setDeleteTarget(null);
  };

  return (
    <Box sx={{ mt: 4, px: 2 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: 'transparent',
          boxShadow: 'none',
          fontSize: '0.92rem',
          '& .MuiTypography-body1, & .MuiTypography-body2, & .MuiTypography-subtitle2': {
            fontSize: '0.92rem'
          },
          '& .MuiTableCell-root': { fontSize: '0.85rem' }
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="h5" gutterBottom>
              Locales
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Administra los locales disponibles en el sistema.
            </Typography>
          </Box>

          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreate}
            >
              Crear nuevo local
            </Button>
          )}
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {info && <Alert severity="success" sx={{ mb: 2 }}>{info}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}
        >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Direccion</TableCell>
                  <TableCell>Telefono</TableCell>
                  <TableCell>Correo</TableCell>
                  {isAdmin && <TableCell align="right">Acciones</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {locales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 5 : 4} align="center">
                      No hay locales registrados.
                    </TableCell>
                  </TableRow>
                )}
                {locales.map((local) => (
                  <TableRow key={local._id}>
                    <TableCell>{local.nombre || '-'}</TableCell>
                    <TableCell>{local.direccion || '-'}</TableCell>
                    <TableCell>{local.telefono || '-'}</TableCell>
                    <TableCell>{local.correo || '-'}</TableCell>
                    {isAdmin && (
                      <TableCell align="right">
                        <IconButton onClick={() => openEdit(local)} size="small" sx={{ mr: 0.5 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => confirmDelete(local)}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingId ? 'Editar local' : 'Crear local'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre"
              value={form.nombre}
              onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
              autoFocus
              required
            />
            <TextField
              label="Direccion"
              value={form.direccion}
              onChange={(e) => setForm((prev) => ({ ...prev, direccion: e.target.value }))}
            />
            <TextField
              label="Telefono"
              value={form.telefono}
              onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))}
            />
            <TextField
              label="Correo"
              value={form.correo}
              onChange={(e) => setForm((prev) => ({ ...prev, correo: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={closeDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar local</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Seguro que deseas eliminar el local "{deleteTarget?.nombre}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
