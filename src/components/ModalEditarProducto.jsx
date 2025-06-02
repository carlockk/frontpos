import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { useState, useEffect } from 'react';
import { editarProducto, obtenerCategorias } from '../services/api';

export default function ModalEditarProducto({ open, onClose, producto, onActualizado }) {
  const [form, setForm] = useState({
    nombre: '',
    precio: '',
    descripcion: '',
    imagen_url: '',
    categoria: '',
    stock: ''
  });

  const [imagenNueva, setImagenNueva] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (producto) {
      setForm({
        nombre: producto.nombre || '',
        precio: producto.precio || '',
        descripcion: producto.descripcion || '',
        imagen_url: producto.imagen_url || '',
        categoria: producto.categoria?._id || producto.categoria || '',
        stock: producto.stock ?? ''
      });
      setImagenNueva(null);
      setError('');
    }
  }, [producto]);

  useEffect(() => {
    obtenerCategorias().then((res) => setCategorias(res.data));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImagen = (e) => {
    const archivo = e.target.files[0];
    if (archivo && !archivo.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen');
      return;
    }
    setImagenNueva(archivo);
    setError('');
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim() || !form.precio) {
      setError('Nombre y precio son obligatorios');
      return;
    }

    if (form.stock !== '' && parseInt(form.stock) < 0) {
      setError('El stock no puede ser negativo');
      return;
    }

    const data = new FormData();
    data.append('nombre', form.nombre.trim());
    data.append('precio', form.precio);
    data.append('descripcion', form.descripcion.trim());
    data.append('categoria', form.categoria);
    if (imagenNueva) {
      data.append('imagen', imagenNueva);
    }
          //data.append('stock', form.stock); probare con la de abajo por mientras,si no funciona la vuelvo a usar
     data.append('stock', form.stock !== '' ? parseInt(form.stock) : '');

    try {
      setCargando(true);
      await editarProducto(producto._id, data);
      alert('✅ Cambios guardados correctamente');
      onClose();
      onActualizado();
    } catch (err) {
      console.error(err);
      setError('❌ Error al guardar los cambios');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>✏️ Editar Producto</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mt: 1, mb: 2 }}>{error}</Alert>}

        <TextField
          fullWidth
          label="Nombre"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          sx={{ mt: 2 }}
        />

        <TextField
          fullWidth
          type="number"
          label="Precio"
          name="precio"
          value={form.precio}
          onChange={handleChange}
          sx={{ mt: 2 }}
        />

        <TextField
          fullWidth
          label="Descripción"
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          sx={{ mt: 2 }}
        />

        <TextField
          fullWidth
          type="number"
          label="Stock (opcional)"
          name="stock"
          value={form.stock}
          onChange={handleChange}
          sx={{ mt: 2 }}
        />

        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="categoria-label">Categoría</InputLabel>
          <Select
            labelId="categoria-label"
            name="categoria"
            value={form.categoria}
            onChange={handleChange}
            label="Categoría"
          >
            {categorias.map((cat) => (
              <MenuItem key={cat._id} value={cat._id}>
                {cat.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {form.imagen_url && (
          <Box sx={{ mt: 2, mb: 1, textAlign: 'center' }}>
            <Typography variant="body2">Imagen actual:</Typography>
            <img
              src={form.imagen_url.startsWith('/uploads')
                ? `http://localhost:5000${form.imagen_url}`
                : form.imagen_url}
              alt="preview"
              width={80}
              height={80}
              style={{ objectFit: 'cover', borderRadius: 8 }}
            />
          </Box>
        )}

        <Button variant="outlined" component="label" sx={{ mt: 1 }}>
          Cambiar Imagen
          <input hidden type="file" accept="image/*" onChange={handleImagen} />
        </Button>

        {imagenNueva && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Nueva imagen: {imagenNueva.name}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={cargando}>
          {cargando ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
