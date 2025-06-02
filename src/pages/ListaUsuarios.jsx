import { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow,
  TableCell, TableBody, IconButton, Paper, Modal,
  TextField, Button, MenuItem
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { obtenerUsuarios, eliminarUsuario, editarUsuario } from '../services/api';

export default function ListaUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [open, setOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [editData, setEditData] = useState({ rol: '', password: '' });

  const cargarUsuarios = async () => {
    const res = await obtenerUsuarios();
    setUsuarios(res.data);
  };

  const handleEliminar = async (id) => {
    if (confirm('¿Eliminar este usuario?')) {
      await eliminarUsuario(id);
      await cargarUsuarios();
    }
  };

  const handleAbrirEdicion = (usuario) => {
    setUsuarioEditando(usuario);
    setEditData({ rol: usuario.rol, password: '' });
    setOpen(true);
  };

  const handleGuardarCambios = async () => {
    await editarUsuario(usuarioEditando._id, editData);
    setOpen(false);
    await cargarUsuarios();
  };

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>📋 Lista de Usuarios</Typography>
      <Paper sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuarios.map((u) => (
              <TableRow key={u._id}>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.rol}</TableCell>
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
