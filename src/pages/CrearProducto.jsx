import { Box, Paper, Typography } from '@mui/material';
import ProductoForm from '../components/ProductoForm';

export default function CrearProducto() {
  return (
    <Box sx={{ mt: 4, px: 2 }}>
      <Paper elevation={4} sx={{ maxWidth: 640, mx: 'auto', p: 4 }}>
        <Typography variant="h5" gutterBottom align="center">
          Crear Producto
        </Typography>
        <ProductoForm />
      </Paper>
    </Box>
  );
}
