// src/pages/CrearCategoria.jsx
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
  obtenerCategorias,
  crearCategoria,
  editarCategoria,
  eliminarCategoria
} from '../services/api';

const emptyForm = { nombre: '', descripcion: '' };

export default function Categorias() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'admin';

  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCategorias = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await obtenerCategorias();
      setCategorias(res.data || []);
    } catch (err) {
      setError('No se pudieron cargar las categorias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
    setInfo('');
    setError('');
  };

  const openEdit = (cat) => {
    setForm({
      nombre: cat.nombre || '',
      descripcion: cat.descripcion || ''
    });
    setEditingId(cat._id);
    setDialogOpen(true);
    setInfo('');
    setError('');
  };

  const handleSave = async () => {
    setError('');
    setInfo('');

    if (!form.nombre.trim()) {
      setError('Ingresa un nombre para la categoria.');
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim()
    };

    try {
      setSaving(true);
      if (editingId) {
        await editarCategoria(editingId, payload);
        setInfo('Categoria actualizada.');
      } else {
        await crearCategoria(payload);
        setInfo('Categoria creada.');
      }
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      fetchCategorias();
    } catch (err) {
      const msg = err?.response?.data?.error || 'No se pudo guardar la categoria.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (cat) => {
    setDeleteTarget(cat);
    setError('');
    setInfo('');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleteLoading(true);
      await eliminarCategoria(deleteTarget._id);
      setInfo('Categoria eliminada.');
      setDeleteTarget(null);
      fetchCategorias();
    } catch (err) {
      const msg = err?.response?.data?.error || 'No se pudo eliminar la categoria.';
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
      <Paper elevation={3} sx={{ p: 3 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="h5" gutterBottom>
              Categorias
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Administra las categorias disponibles para tus productos.
            </Typography>
          </Box>

          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreate}
            >
              Crear nueva categoria
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
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripcion</TableCell>
                  {isAdmin && <TableCell align="right">Acciones</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {categorias.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 3 : 2} align="center">
                      No hay categorias registradas.
                    </TableCell>
                  </TableRow>
                )}
                {categorias.map((cat) => (
                  <TableRow key={cat._id}>
                    <TableCell>{cat.nombre || '-'}</TableCell>
                    <TableCell>{cat.descripcion || '-'}</TableCell>
                    {isAdmin && (
                      <TableCell align="right">
                        <IconButton onClick={() => openEdit(cat)} size="small" sx={{ mr: 0.5 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => confirmDelete(cat)}
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
          {editingId ? 'Editar categoria' : 'Crear categoria'}
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
              label="Descripcion"
              value={form.descripcion}
              onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
              multiline
              minRows={2}
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
        <DialogTitle>Eliminar categoria</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Seguro que deseas eliminar la categoria "{deleteTarget?.nombre}"?
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
