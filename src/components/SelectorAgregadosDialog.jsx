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
  Radio,
  RadioGroup,
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
  const gruposConfigurados = useMemo(() => {
    const byKey = new Map();

    agregadosDisponibles.forEach((agg) => {
      const agregadoId = String(agg._id || agg.agregadoId || '');
      if (!agregadoId) return;

      const grupo = agg?.grupo && typeof agg.grupo === 'object' ? agg.grupo : null;
      const key = grupo?._id ? String(grupo._id) : '__sin_grupo__';
      if (!byKey.has(key)) {
        byKey.set(key, {
          key,
          titulo: grupo?.titulo || 'Otros agregados',
          modoSeleccion: grupo?.modoSeleccion === 'unico' ? 'unico' : 'multiple',
          items: []
        });
      }
      byKey.get(key).items.push(agg);
    });

    return Array.from(byKey.values());
  }, [agregadosDisponibles]);

  const metaByAgregadoId = useMemo(() => {
    const map = new Map();
    gruposConfigurados.forEach((grupo) => {
      grupo.items.forEach((agg) => {
        const id = String(agg._id || agg.agregadoId || '');
        if (!id) return;
        map.set(id, { groupKey: grupo.key });
      });
    });
    return map;
  }, [gruposConfigurados]);

  const [seleccionados, setSeleccionados] = useState([]);

  useEffect(() => {
    if (open) {
      setSeleccionados([]);
    }
  }, [open, producto?._id, variante?._id]);

  const buildAgregadoPayload = (agregado) => ({
    agregadoId: agregado._id || agregado.agregadoId || null,
    nombre: agregado.nombre,
    precio: Number(agregado.precio) || 0
  });

  const toggleAgregado = (agregado) => {
    const agregadoId = String(agregado._id || agregado.agregadoId || '');
    setSeleccionados((prev) => {
      const existe = prev.some((agg) => String(agg.agregadoId || agg._id || '') === agregadoId);
      if (existe) {
        return prev.filter((agg) => String(agg.agregadoId || agg._id || '') !== agregadoId);
      }
      return [...prev, buildAgregadoPayload(agregado)];
    });
  };

  const seleccionarUnico = (groupKey, agregado) => {
    const agregadoId = agregado._id || agregado.agregadoId;
    if (!agregadoId) return;
    setSeleccionados((prev) => {
      const next = prev.filter((item) => {
        const itemId = String(item.agregadoId || item._id || '');
        const itemMeta = metaByAgregadoId.get(itemId);
        return itemMeta?.groupKey !== groupKey;
      });
      return [...next, buildAgregadoPayload(agregado)];
    });
  };

  const getSeleccionadoRadio = (groupKey) =>
    (
      seleccionados.find((item) => {
        const itemId = String(item.agregadoId || item._id || '');
        const itemMeta = metaByAgregadoId.get(itemId);
        return itemMeta?.groupKey === groupKey;
      }) || {}
    ).agregadoId || '';

  const totalExtras = seleccionados.reduce((acc, agg) => acc + (Number(agg.precio) || 0), 0);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Seleccionar agregados</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {producto?.nombre}
          {variante?.nombre ? ` - ${variante.nombre}` : ''}
        </Typography>

        {gruposConfigurados.length === 0 ? (
          <Typography color="text.secondary">Este producto no tiene agregados configurados.</Typography>
        ) : (
          <Stack spacing={2}>
            {gruposConfigurados.map((grupo) => (
              <Box key={grupo.key}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {grupo.titulo} {grupo.modoSeleccion === 'unico' ? '(elige uno)' : '(elige uno o varios)'}
                </Typography>
                {grupo.modoSeleccion === 'unico' ? (
                  <RadioGroup
                    value={String(getSeleccionadoRadio(grupo.key))}
                    onChange={(event) => {
                      const elegido = grupo.items.find(
                        (agg) => String(agg._id || agg.agregadoId || '') === String(event.target.value)
                      );
                      if (elegido) {
                        seleccionarUnico(grupo.key, elegido);
                      }
                    }}
                  >
                    <Stack spacing={1.25}>
                      {grupo.items.map((agg) => (
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
                            value={String(agg._id || agg.agregadoId || '')}
                            control={<Radio />}
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
                      ))}
                    </Stack>
                  </RadioGroup>
                ) : (
                  <Stack spacing={1.25}>
                    {grupo.items.map((agg) => {
                      const seleccionado = seleccionados.some(
                        (item) =>
                          String(item.agregadoId || item._id || '') ===
                          String(agg._id || agg.agregadoId || '')
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
              </Box>
            ))}
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
