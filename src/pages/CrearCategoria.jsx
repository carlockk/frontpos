// src/pages/CrearCategoria.jsx
import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert
} from '@mui/material';
import { crearCategoria } from '../services/api';

export default function CrearCategoria() {
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!nombre.trim()) {
      setError('⚠️ Debes ingresar un nombre');
      return;
    }

    try {
      setLoading(true);
      await crearCategoria({ nombre: nombre.trim() });
      setSuccess('✅ Categoría creada correctamente');
      setNombre('');
    } catch (err) {
      const msg = err?.response?.data?.error || '❌ Error al crear la categoría';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 4, px: 2 }}>
      <Paper elevation={3} sx={{ maxWidth: 500, mx: 'auto', p: 4 }}>
        <Typography variant="h5" gutterBottom textAlign="center">
          ➕ Crear Categoría
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <TextField
          label="Nombre de la categoría"
          fullWidth
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained"
          fullWidth
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Creando...' : 'Crear'}
        </Button>
      </Paper>
    </Box>
  );
}
