import { useState } from 'react';
import {
  Box, Typography, TextField, Button, MenuItem
} from '@mui/material';
import { crearUsuario } from '../services/api';

export default function CrearUsuario() {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'cajero'
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const { nombre, email, password, rol } = form;

    if (!nombre || !email || !password) {
      alert('Todos los campos son obligatorios');
      return;
    }

    try {
      await crearUsuario({ nombre, email, password, rol });
      alert('✅ Usuario creado correctamente');
      setForm({ nombre: '', email: '', password: '', rol: 'cajero' });
    } catch (err) {
      const msg = err?.response?.data?.error || 'Error inesperado';
      alert(`❌ ${msg}`);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>👤 Crear Usuario</Typography>

      <TextField
        label="Nombre"
        name="nombre"
        fullWidth
        value={form.nombre}
        onChange={handleChange}
        sx={{ mb: 2 }}
      />

      <TextField
        label="Email"
        name="email"
        fullWidth
        value={form.email}
        onChange={handleChange}
        sx={{ mb: 2 }}
      />

      <TextField
        label="Contraseña"
        name="password"
        type="password"
        fullWidth
        value={form.password}
        onChange={handleChange}
        sx={{ mb: 2 }}
      />

      <TextField
        select
        label="Rol"
        name="rol"
        fullWidth
        value={form.rol}
        onChange={handleChange}
        sx={{ mb: 2 }}
      >
        <MenuItem value="admin">Admin</MenuItem>
        <MenuItem value="cajero">Cajero</MenuItem>
      </TextField>

      <Button variant="contained" fullWidth onClick={handleSubmit}>
        Crear Usuario
      </Button>
    </Box>
  );
}
