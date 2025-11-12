import {
  Box,
  Stack,
  TextField,
  Typography,
  IconButton,
  Button,
  Divider
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';

const varianteBase = {
  _id: undefined,
  nombre: '',
  color: '',
  talla: '',
  sku: '',
  precio: '',
  stock: ''
};

export default function VariantesForm({ variantes = [], onChange }) {
  const handleChange = (index, field, value) => {
    const copia = variantes.map((item, idx) =>
      idx === index ? { ...item, [field]: value } : item
    );
    onChange?.(copia);
  };

  const handleAdd = () => {
    onChange?.([
      ...variantes,
      {
        ...varianteBase,
        tempId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
      }
    ]);
  };

  const handleRemove = (index) => {
    const copia = variantes.filter((_, idx) => idx !== index);
    onChange?.(copia);
  };

  return (
    <Stack spacing={2}>
      {variantes.length === 0 && (
        <Box
          sx={{
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            p: 2,
            textAlign: 'center',
            color: 'text.secondary'
          }}
        >
          <Typography variant="body2">
            Aún no agregas variantes. Usa el botón para crear combinaciones de color, talla, etc.
          </Typography>
        </Box>
      )}

      {variantes.map((variante, index) => (
        <Box
          key={variante._id || variante.tempId || index}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: 2
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2">
              Variante #{index + 1}
            </Typography>
            <IconButton
              size="small"
              color="error"
              onClick={() => handleRemove(index)}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Stack spacing={1.5}>
            <TextField
              label="Nombre identificador"
              value={variante.nombre}
              onChange={(e) => handleChange(index, 'nombre', e.target.value)}
              required
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="Color"
                value={variante.color || ''}
                onChange={(e) => handleChange(index, 'color', e.target.value)}
                fullWidth
              />
              <TextField
                label="Talla"
                value={variante.talla || ''}
                onChange={(e) => handleChange(index, 'talla', e.target.value)}
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="SKU / código"
                value={variante.sku || ''}
                onChange={(e) => handleChange(index, 'sku', e.target.value)}
                fullWidth
              />
              <TextField
                label="Stock"
                type="number"
                value={variante.stock}
                onChange={(e) => handleChange(index, 'stock', e.target.value)}
                fullWidth
              />
              <TextField
                label="Precio (opcional)"
                type="number"
                value={variante.precio}
                onChange={(e) => handleChange(index, 'precio', e.target.value)}
                fullWidth
              />
            </Stack>
          </Stack>
        </Box>
      ))}

      <Divider />

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleAdd}
      >
        Agregar variante
      </Button>
    </Stack>
  );
}
