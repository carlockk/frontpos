import { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow,
  TableCell, TableBody, IconButton, Paper, Modal,
  TextField, Button, MenuItem
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  obtenerUsuarios,
  eliminarUsuario,
  editarUsuario,
  obtenerLocales
} from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ListaUsuarios() {
  const { usuario, selectedLocal } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [locales, setLocales] = useState([]);
  const [open, setOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [editData, setEditData] = useState({ rol: '', password: '', local: '' });

  const cargarUsuarios = async () => {
    const res = await obtenerUsuarios();
    setUsuarios(res.data);
  };

  const cargarLocales = async () => {
    try {
      const res = await obtenerLocales();
      setLocales(res.data || []);
    } catch (err) {
      setLocales([]);
    }
  };

  const handleEliminar = async (id) => {
    if (confirm('¿Eliminar este usuario?')) {
      await eliminarUsuario(id);
      await cargarUsuarios();
    }
  };

  const handleAbrirEdicion = (usuario) => {
    const localId =
      typeof usuario?.local === 'string'
        ? usuario.local
        : usuario?.local?._id || '';
    setUsuarioEditando(usuario);
    setEditData({ rol: usuario.rol, password: '', local: localId });
    setOpen(true);
  };

  const handleGuardarCambios = async () => {
    const payload = {
      rol: editData.rol
    };
    if (usuario?.rol === 'superadmin') {
      payload.local = editData.local === '' ? null : editData.local;
    }
    if (editData.password && editData.password.trim()) {
      payload.password = editData.password;
    }

    await editarUsuario(usuarioEditando._id, payload);
    setOpen(false);
    await cargarUsuarios();
  };

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (usuario?.rol === 'superadmin' && !selectedLocal?._id) {
      setUsuarios([]);
      return;
    }
    cargarUsuarios();
    cargarLocales();
  }, [usuario?.rol, selectedLocal?._id]);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>📋 Lista de Usuarios</Typography>
      <Paper sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Local</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuarios.map((u) => (
              <TableRow key={u._id}>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.rol}</TableCell>
                <TableCell>{u.local?.nombre || 'Sin asignar'}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleAbrirEdicion(u)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleEliminar(u._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Modal para editar */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper', p: 4, borderRadius: 2, width: 300
        }}>
          <Typography variant="h6" gutterBottom>✏️ Editar Usuario</Typography>
          <TextField
            label="Email"
            value={usuarioEditando?.email || ''}
            fullWidth
            disabled
            sx={{ mb: 2 }}
          />
          <TextField
            select
            label="Rol"
            name="rol"
            fullWidth
            value={editData.rol}
            onChange={handleChange}
            sx={{ mb: 2 }}
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="cajero">Cajero</MenuItem>
          </TextField>
          <TextField
            select
            label="Local"
            name="local"
            fullWidth
            value={editData.local}
            onChange={handleChange}
            sx={{ mb: 2 }}
            disabled={usuario?.rol !== 'superadmin' || locales.length === 0}
          >
            <MenuItem value="">
              {locales.length === 0 ? 'No hay locales disponibles' : 'Sin asignar'}
            </MenuItem>
            {locales.map((local) => (
              <MenuItem key={local._id} value={local._id}>
                {local.nombre}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Nueva Contraseña"
            name="password"
            type="password"
            fullWidth
            value={editData.password}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" fullWidth onClick={handleGuardarCambios}>
            Guardar Cambios
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}
