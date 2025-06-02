import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { crearProducto, obtenerCategorias } from '../services/api';

export default function ModalCrearProducto({ open, onClose, onCreado }) {
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
    if (open) {
      obtenerCategorias().then(res => setCategorias(res.data));
    }
  }, [open]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.nombre || !form.precio || !imagen) {
      alert('Faltan campos obligatorios');
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
    if (form.stock !== '') {
      data.append('stock', parseInt(form.stock));
    }

    try {
      await crearProducto(data);
      onCreado();
      onClose();
    } catch (err) {
      console.error(err);
      alert('❌ Error al crear producto');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>➕ Crear Producto Rápido</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
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
        <TextField
          label="Stock (opcional)"
          name="stock"
          type="number"
          fullWidth
          sx={{ mb: 2 }}
          value={form.stock}
          onChange={handleChange}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Categoría</InputLabel>
          <Select
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

        <Button variant="outlined" component="label" sx={{ mb: 2 }}>
          Seleccionar Imagen
          <input hidden accept="image/*" type="file" onChange={(e) => setImagen(e.target.files[0])} />
        </Button>

        {imagen && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Imagen: {imagen.name}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Crear
        </Button>
      </DialogActions>
    </Dialog>
  );
}
