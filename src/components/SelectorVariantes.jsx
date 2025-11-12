import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Paper,
  Typography,
  Box
} from '@mui/material';

const formatearPrecio = (valor, fallback) => {
  const numero = Number(valor ?? fallback ?? 0);
  return `$${numero.toLocaleString()}`;
};

export default function SelectorVariantes({ open, onClose, producto, onSelect }) {
  const variantes = producto?.variantes || [];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Selecciona una variante</DialogTitle>
      <DialogContent dividers>
        {variantes.length === 0 ? (
          <Typography color="text.secondary">Este producto no tiene variantes configuradas.</Typography>
        ) : (
          <Stack spacing={2}>
            {variantes.map((vari) => {
              const stock = Number(vari.stock) || 0;
              const agotado = stock === 0;
              const atributos = [vari.color, vari.talla].filter(Boolean).join(' / ') || 'Sin atributos';
              const sku = vari.sku || 'Sin SKU';

              return (
                <Paper
                  key={vari._id || `${vari.nombre}-${atributos}`}
                  sx={{ p: 2, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}
                >
                  <Box>
                    <Typography fontWeight={600}>{vari.nombre}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {atributos}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      SKU: {sku}
                    </Typography>
                    <Typography variant="body2">Stock: {stock}</Typography>
                    <Typography variant="body2">
                      Precio: {formatearPrecio(vari.precio, producto?.precio)}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    disabled={agotado}
                    onClick={() => onSelect?.(vari)}
                  >
                    {agotado ? 'Sin stock' : 'Agregar'}
                  </Button>
                </Paper>
              );
            })}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
