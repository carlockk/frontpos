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
  InputLabel,
  Switch,
  FormControlLabel
} from '@mui/material';
import { useState, useEffect } from 'react';
import { editarProducto, obtenerCategorias } from '../services/api';
import VariantesForm from './VariantesForm';

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
  const [usaVariantes, setUsaVariantes] = useState(false);
  const [variantes, setVariantes] = useState([]);

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
      setUsaVariantes(Array.isArray(producto.variantes) && producto.variantes.length > 0);
      setVariantes(
        (producto.variantes || []).map((v) => ({
          _id: v._id,
          nombre: v.nombre || '',
          color: v.color || '',
          talla: v.talla || '',
          sku: v.sku || '',
          precio: v.precio === 0 || v.precio ? String(v.precio) : '',
          stock: v.stock === 0 || v.stock ? String(v.stock) : ''
        }))
      );
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

    if (!usaVariantes && form.stock !== '' && parseInt(form.stock, 10) < 0) {
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
    data.append('nombre', form.nombre.trim());
    data.append('precio', form.precio);
    data.append('descripcion', form.descripcion.trim());
    data.append('categoria', form.categoria);
    if (imagenNueva) {
      data.append('imagen', imagenNueva);
    }
    if (usaVariantes) {
      data.append('stock', '');
      data.append('variantes', JSON.stringify(variantes));
    } else {
      data.append('stock', form.stock !== '' ? parseInt(form.stock, 10) : '');
    }

    try {
      setCargando(true);
      await editarProducto(producto._id, data);
      alert('Cambios guardados correctamente');
      onClose();
      onActualizado?.();
    } catch (err) {
      console.error(err);
      setError('Error al guardar los cambios');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Editar Producto</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
            {error}
          </Alert>
        )}

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
          sx={{ mt: 2 }}
        />

        {!usaVariantes && (
          <TextField
            fullWidth
            type="number"
            label="Stock (opcional)"
            name="stock"
            value={form.stock}
            onChange={handleChange}
            sx={{ mt: 2 }}
          />
        )}

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

        {usaVariantes && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Variantes
            </Typography>
            <VariantesForm variantes={variantes} onChange={setVariantes} />
          </Box>
        )}

        {form.imagen_url && (
          <Box sx={{ mt: 2, mb: 1, textAlign: 'center' }}>
            <Typography variant="body2">Imagen actual:</Typography>
            <img
              src={
                form.imagen_url.startsWith('/uploads')
                  ? `http://localhost:5000${form.imagen_url}`
                  : form.imagen_url
              }
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
