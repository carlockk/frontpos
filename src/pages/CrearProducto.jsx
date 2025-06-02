// src/pages/CrearProducto.jsx
import { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Paper,
  MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import { crearProducto, obtenerCategorias } from '../services/api';

export default function CrearProducto() {
  const [form, setForm] = useState({
    nombre: '',
    precio: '',
    descripcion: '',
    categoria: '',
    stock: ''
  });
  const [imagen, setImagen] = useState(null);
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    obtenerCategorias().then((res) => setCategorias(res.data));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setImagen(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!form.nombre || !form.precio || !imagen) {
      alert('Nombre, precio e imagen son obligatorios');
      return;
    }

    if (form.stock && parseInt(form.stock) < 0) {
      alert('El stock no puede ser negativo');
      return;
    }

    const data = new FormData();
    data.append('nombre', form.nombre);
    data.append('precio', form.precio);
    data.append('descripcion', form.descripcion);
    data.append('categoria', form.categoria);
    data.append('imagen', imagen);
    data.append('stock', form.stock !== '' ? parseInt(form.stock) : '');

    try {
      await crearProducto(data);
      alert('✅ Producto creado correctamente');
      setForm({ nombre: '', precio: '', descripcion: '', categoria: '', stock: '' });
      setImagen(null);
    } catch (err) {
      console.error(err);
      alert('❌ Error al crear producto');
    }
  };

  return (
    <Box sx={{ mt: 4, px: 2 }}>
      <Paper elevation={4} sx={{ maxWidth: 500, mx: 'auto', p: 4 }}>
        <Typography variant="h5" gutterBottom align="center">➕ Crear Producto</Typography>

        <TextField label="Nombre" name="nombre" fullWidth sx={{ mb: 2 }} value={form.nombre} onChange={handleChange} />
        <TextField label="Precio" name="precio" type="number" fullWidth sx={{ mb: 2 }} value={form.precio} onChange={handleChange} />
        <TextField label="Descripción" name="descripcion" fullWidth sx={{ mb: 2 }} value={form.descripcion} onChange={handleChange} />
        <TextField label="Stock (opcional)" name="stock" type="number" fullWidth sx={{ mb: 2 }} value={form.stock} onChange={handleChange} />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Categoría</InputLabel>
          <Select name="categoria" value={form.categoria} onChange={handleChange} label="Categoría">
            {categorias.map((cat) => (
              <MenuItem key={cat._id} value={cat._id}>{cat.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="outlined" component="label" sx={{ mb: 2 }}>
          Seleccionar Imagen
          <input hidden accept="image/*" type="file" onChange={handleImageChange} />
        </Button>

        {imagen && <Typography variant="body2" sx={{ mb: 2 }}>Imagen seleccionada: {imagen.name}</Typography>}

        <Button variant="contained" fullWidth onClick={handleSubmit}>Crear</Button>
      </Paper>
    </Box>
  );
}
