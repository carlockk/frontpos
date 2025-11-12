// src/pages/CrearProducto.jsx
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material';
import { crearProducto, obtenerCategorias } from '../services/api';
import VariantesForm from '../components/VariantesForm';

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
  const [usaVariantes, setUsaVariantes] = useState(false);
  const [variantes, setVariantes] = useState([]);
  const [error, setError] = useState('');

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
      setError('Nombre, precio e imagen son obligatorios');
      return;
    }

    if (!usaVariantes && form.stock && parseInt(form.stock, 10) < 0) {
      setError('El stock no puede ser negativo');
      return;
    }

    if (usaVariantes) {
      if (variantes.length === 0 || variantes.some((v) => !v.nombre.trim())) {
        setError('Agrega al menos una variante con nombre.');
        return;
      }
    }

    const data = new FormData();
    data.append('nombre', form.nombre);
    data.append('precio', form.precio);
    data.append('descripcion', form.descripcion);
    data.append('categoria', form.categoria);
    data.append('imagen', imagen);

    if (usaVariantes) {
      data.append('stock', '');
      data.append('variantes', JSON.stringify(variantes));
    } else {
      data.append('stock', form.stock !== '' ? parseInt(form.stock, 10) : '');
    }

    try {
      await crearProducto(data);
      alert('Producto creado correctamente');
      setForm({ nombre: '', precio: '', descripcion: '', categoria: '', stock: '' });
      setImagen(null);
      setVariantes([]);
      setUsaVariantes(false);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Error al crear producto');
    }
  };

  return (
    <Box sx={{ mt: 4, px: 2 }}>
      <Paper elevation={4} sx={{ maxWidth: 600, mx: 'auto', p: 4 }}>
        <Typography variant="h5" gutterBottom align="center">
          Crear Producto
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Nombre"
          name="nombre"
          fullWidth
          sx={{ mb: 2 }}
          value={form.nombre}
          onChange={handleChange}
        />
        <TextField
          label="Precio"
          name="precio"
          type="number"
          fullWidth
          sx={{ mb: 2 }}
          value={form.precio}
          onChange={handleChange}
        />
        <TextField
          label="Descripción"
          name="descripcion"
          fullWidth
          sx={{ mb: 2 }}
          value={form.descripcion}
          onChange={handleChange}
        />

        <FormControlLabel
          control={
            <Switch
              checked={usaVariantes}
              onChange={(e) => {
                setUsaVariantes(e.target.checked);
                if (!e.target.checked) {
                  setVariantes([]);
                }
              }}
            />
          }
          label="Controlar stock por variantes"
          sx={{ mb: 2 }}
        />

        {!usaVariantes && (
          <TextField
            label="Stock (opcional)"
            name="stock"
            type="number"
            fullWidth
            sx={{ mb: 2 }}
            value={form.stock}
            onChange={handleChange}
          />
        )}

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Categoría</InputLabel>
          <Select name="categoria" value={form.categoria} onChange={handleChange} label="Categoría">
            {categorias.map((cat) => (
              <MenuItem key={cat._id} value={cat._id}>
                {cat.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="outlined" component="label" sx={{ mb: 2 }}>
          Seleccionar Imagen
          <input hidden accept="image/*" type="file" onChange={handleImageChange} />
        </Button>

        {imagen && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Imagen seleccionada: {imagen.name}
          </Typography>
        )}

        {usaVariantes && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
              Variantes
            </Typography>
            <VariantesForm variantes={variantes} onChange={setVariantes} />
          </Box>
        )}

        <Button variant="contained" fullWidth sx={{ mt: 3 }} onClick={handleSubmit}>
          Crear
        </Button>
      </Paper>
    </Box>
  );
}
