import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import VariantesForm from './VariantesForm';
import { crearProducto, obtenerCategorias } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProductoForm({ onSuccess, onCancel }) {
  const { usuario, selectedLocal } = useAuth();
  const [form, setForm] = useState({
    nombre: '',
    precio: '',
    descripcion: '',
    categoria: '',
    stock: ''
  });
  const [imagen, setImagen] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [controlarStock, setControlarStock] = useState(true);
  const [usaVariantes, setUsaVariantes] = useState(false);
  const [variantes, setVariantes] = useState([]);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    obtenerCategorias().then((res) => setCategorias(res.data));
  }, []);

  const resetForm = () => {
    setForm({
      nombre: '',
      precio: '',
      descripcion: '',
      categoria: '',
      stock: ''
    });
    setImagen(null);
    setVariantes([]);
    setUsaVariantes(false);
    setControlarStock(true);
    setError('');
    setExito('');
  };

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleImageChange = (event) => {
    setImagen(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();
    setError('');
    setExito('');
    setCargando(true);

    if (!form.nombre || !form.precio || !imagen) {
      setError('Nombre, precio e imagen son obligatorios.');
      setCargando(false);
      return;
    }
    if (controlarStock && !usaVariantes && form.stock && parseInt(form.stock, 10) < 0) {
      setError('El stock no puede ser negativo.');
      setCargando(false);
      return;
    }

    if (controlarStock && usaVariantes) {
      const variantesInvalidas =
        variantes.length === 0 ||
        variantes.some((vari) => !vari.nombre || !vari.nombre.trim());
      if (variantesInvalidas) {
        setError('Agrega al menos una variante con nombre.');
        setCargando(false);
        return;
      }
    }

    const data = new FormData();
    data.append('nombre', form.nombre);
    data.append('precio', form.precio);
    data.append('descripcion', form.descripcion);
    data.append('categoria', form.categoria);
    data.append('imagen', imagen);
    data.append('controlarStock', controlarStock);

    if (controlarStock && usaVariantes) {
      data.append('variantes', JSON.stringify(variantes));
    } else if (controlarStock && form.stock !== '') {
      data.append('stock', parseInt(form.stock, 10));
    }

    try {
      const res = await crearProducto(data);
      resetForm();
      setExito('Producto creado correctamente.');
      onSuccess?.(res?.data);
    } catch (err) {
      console.error(err);
      setError('Error al crear el producto. Intentalo nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        {exito && <Alert severity="success">{exito}</Alert>}

        {usuario?.rol === 'superadmin' && (
          <Typography variant="body2" color="text.secondary">
            Local activo: {selectedLocal?.nombre || 'Sin seleccionar'}
          </Typography>
        )}

        <TextField
          label="Nombre"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          fullWidth
          required
        />

        <TextField
          label="Precio"
          name="precio"
          type="number"
          value={form.precio}
          onChange={handleChange}
          fullWidth
          required
        />

        <TextField
          label="Descripcion"
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          fullWidth
          multiline
          minRows={2}
        />

        <FormControlLabel
          control={
            <Switch
              checked={controlarStock}
              onChange={(event) => {
                const value = event.target.checked;
                setControlarStock(value);
                if (!value) {
                  setUsaVariantes(false);
                  setVariantes([]);
                  setForm((prev) => ({ ...prev, stock: '' }));
                }
              }}
            />
          }
          label="Controlar stock"
        />

        {controlarStock && (
          <>
            <FormControlLabel
              control={
                <Switch
                  checked={usaVariantes}
                  onChange={(event) => {
                    setUsaVariantes(event.target.checked);
                    if (!event.target.checked) {
                      setVariantes([]);
                    }
                  }}
                />
              }
              label="Controlar stock por variantes"
            />

            {!usaVariantes && (
              <TextField
                label="Stock (opcional)"
                name="stock"
                type="number"
                value={form.stock}
                onChange={handleChange}
                fullWidth
              />
            )}
          </>
        )}

        <FormControl fullWidth>
          <InputLabel>Categoria</InputLabel>
          <Select
            label="Categoria"
            name="categoria"
            value={form.categoria}
            onChange={handleChange}
          >
            {categorias.map((cat) => (
              <MenuItem key={cat._id} value={cat._id}>
                {cat.label || cat.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box>
          <Button variant="outlined" component="label">
            Seleccionar imagen
            <input
              hidden
              accept="image/*"
              type="file"
              onChange={handleImageChange}
            />
          </Button>
          {imagen && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Imagen seleccionada: {imagen.name}
            </Typography>
          )}
        </Box>

        {usaVariantes && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
              Variantes
            </Typography>
            <VariantesForm variantes={variantes} onChange={setVariantes} />
          </Box>
        )}

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {onCancel && (
            <Button variant="outlined" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button variant="contained" type="submit" disabled={cargando}>
            {cargando ? 'Creando...' : 'Crear'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
