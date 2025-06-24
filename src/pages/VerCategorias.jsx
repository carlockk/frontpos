import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogActions,
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  obtenerCategorias,
  editarCategoria,
  eliminarCategoria
} from '../services/api';

export default function VerCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    setCargando(true);
    setError('');
    try {
      const res = await obtenerCategorias();
      setCategorias(res.data);
    } catch (err) {
      setError('❌ Error al cargar categorías');
    } finally {
      setCargando(false);
    }
  };

  const iniciarEdicion = (categoria) => {
    setEditandoId(categoria._id);
    setNuevoNombre(categoria.nombre);
    setSuccess('');
    setError('');
  };

  const guardarEdicion = async (id) => {
    if (!nuevoNombre.trim()) {
      setError('⚠️ El nombre no puede estar vacío');
      return;
    }

    try {
      await editarCategoria(id, { nombre: nuevoNombre.trim() });
      setSuccess('✅ Categoría actualizada');
      setEditandoId(null);
      cargarCategorias();
    } catch (err) {
      const msg = err?.response?.data?.error || '❌ Error al editar categoría';
      setError(msg);
    }
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setNuevoNombre('');
    setError('');
  };

  const confirmarEliminarCategoria = async () => {
    if (!confirmarEliminar) return;

    try {
      await eliminarCategoria(confirmarEliminar._id);
      setSuccess('✅ Categoría eliminada');
      setConfirmarEliminar(null);
      cargarCategorias();
    } catch (err) {
      setError('❌ Error al eliminar la categoría');
    }
  };

  return (
    <Box sx={{ mt: 4, px: 2 }}>
      <Paper elevation={3} sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
        <Typography variant="h5" gutterBottom textAlign="center">
          📁 Ver Categorías
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categorias.map((cat) => (
                <TableRow key={cat._id}>
                  <TableCell>
                    {editandoId === cat._id ? (
                      <TextField
                        value={nuevoNombre}
                        onChange={(e) => setNuevoNombre(e.target.value)}
                        size="small"
                        fullWidth
                      />
                    ) : (
                      cat.nombre
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {editandoId === cat._id ? (
                      <>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => guardarEdicion(cat._id)}
                          sx={{ mr: 1 }}
                        >
                          Guardar
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={cancelarEdicion}
                        >
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <IconButton onClick={() => iniciarEdicion(cat)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => setConfirmarEliminar(cat)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Modal de confirmación */}
      <Dialog open={!!confirmarEliminar} onClose={() => setConfirmarEliminar(null)}>
        <DialogTitle>
          ¿Estás seguro de eliminar la categoría "{confirmarEliminar?.nombre}"?
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmarEliminar(null)}>Cancelar</Button>
          <Button color="error" onClick={confirmarEliminarCategoria}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
