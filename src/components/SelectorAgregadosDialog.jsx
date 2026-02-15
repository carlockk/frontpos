import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Typography
} from '@mui/material';

const formatearPrecio = (valor) => {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero <= 0) return 'Incluido';
  return `+$${numero.toLocaleString('es-CL')}`;
};

export default function SelectorAgregadosDialog({
  open,
  producto,
  variante,
  onClose,
  onConfirm
}) {
  const agregadosDisponibles = useMemo(
    () => (Array.isArray(producto?.agregados) ? producto.agregados.filter((agg) => agg?.nombre) : []),
    [producto]
  );
  const [seleccionados, setSeleccionados] = useState([]);

  useEffect(() => {
    if (open) {
      setSeleccionados([]);
    }
  }, [open, producto?._id, variante?._id]);

  const toggleAgregado = (agregado) => {
    setSeleccionados((prev) => {
      const existe = prev.some((agg) => (agg.agregadoId || agg._id) === (agregado._id || agregado.agregadoId));
      if (existe) {
        return prev.filter((agg) => (agg.agregadoId || agg._id) !== (agregado._id || agregado.agregadoId));
      }
      return [
        ...prev,
        {
          agregadoId: agregado._id || agregado.agregadoId || null,
          nombre: agregado.nombre,
          precio: Number(agregado.precio) || 0
        }
      ];
    });
  };

  const totalExtras = seleccionados.reduce((acc, agg) => acc + (Number(agg.precio) || 0), 0);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Seleccionar agregados</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {producto?.nombre}
          {variante?.nombre ? ` - ${variante.nombre}` : ''}
        </Typography>

        {agregadosDisponibles.length === 0 ? (
          <Typography color="text.secondary">Este producto no tiene agregados configurados.</Typography>
        ) : (
          <Stack spacing={1.25}>
            {agregadosDisponibles.map((agg) => {
              const seleccionado = seleccionados.some(
                (item) => (item.agregadoId || item._id) === (agg._id || agg.agregadoId)
              );
              return (
                <Box
                  key={agg._id || agg.agregadoId || agg.nombre}
                  sx={{
                    px: 1.25,
                    py: 0.75,
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <FormControlLabel
                    sx={{ width: '100%', m: 0 }}
                    control={
                      <Checkbox checked={seleccionado} onChange={() => toggleAgregado(agg)} />
                    }
                    label={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                        <Typography>{agg.nombre}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatearPrecio(agg.precio)}
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              );
            })}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.25 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 'auto' }}>
          Extras: ${totalExtras.toLocaleString('es-CL')}
        </Typography>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={() => onConfirm?.(seleccionados)}>
          Agregar al carrito
        </Button>
      </DialogActions>
    </Dialog>
  );
}
