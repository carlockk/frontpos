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

      const grupos = Array.isArray(agg?.grupos) && agg.grupos.length > 0
        ? agg.grupos
        : (agg?.grupo ? [agg.grupo] : []);

      if (grupos.length === 0) {
        const key = '__sin_grupo__';
        if (!byKey.has(key)) {
          byKey.set(key, {
            key,
            categoriaPrincipal: '',
            titulo: 'Otros agregados',
            modoSeleccion: 'multiple',
            obligatorio: false,
            items: []
          });
        }
        byKey.get(key).items.push(agg);
        return;
      }

      grupos.forEach((grupo) => {
        const key = grupo?._id ? String(grupo._id) : '__sin_grupo__';
        if (!byKey.has(key)) {
          byKey.set(key, {
            key,
            categoriaPrincipal: grupo?.categoriaPrincipal || '',
            titulo: grupo?.titulo || 'Otros agregados',
            modoSeleccion: grupo?.modoSeleccion === 'unico' ? 'unico' : 'multiple',
            obligatorio: Boolean(grupo?.obligatorio),
            items: []
          });
        }
        byKey.get(key).items.push(agg);
      });
    });

    return Array.from(byKey.values());
  }, [agregadosDisponibles]);

  const categoriasPrincipales = useMemo(() => {
    const byKey = new Map();
    gruposConfigurados.forEach((grupo) => {
      const key = String(grupo.categoriaPrincipal || '__sin_categoria_principal__');
      if (!byKey.has(key)) {
        byKey.set(key, {
          key,
          titulo:
            grupo.categoriaPrincipal && String(grupo.categoriaPrincipal).trim()
              ? String(grupo.categoriaPrincipal).trim()
              : 'Agregados',
          grupos: []
        });
      }
      byKey.get(key).grupos.push(grupo);
    });
    return Array.from(byKey.values());
  }, [gruposConfigurados]);

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
  const [selectionError, setSelectionError] = useState('');

  useEffect(() => {
    if (open) {
      setSeleccionados([]);
      setSelectionError('');
    }
  }, [open, producto?._id, variante?._id]);

  useEffect(() => {
    if (selectionError) setSelectionError('');
  }, [seleccionados]);

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
  const selectedIds = new Set(
    (seleccionados || []).map((item) => String(item?.agregadoId || item?._id || '')).filter(Boolean)
  );

  const validarObligatorios = () => {
    const faltantes = (gruposConfigurados || [])
      .filter((grupo) => grupo?.obligatorio)
      .filter((grupo) => {
        const idsGrupo = (grupo.items || [])
          .map((agg) => String(agg?._id || agg?.agregadoId || ''))
          .filter(Boolean);
        return !idsGrupo.some((id) => selectedIds.has(id));
      })
      .map((grupo) => grupo.titulo || 'Titulo sin nombre');

    if (faltantes.length > 0) {
      setSelectionError(`Debes seleccionar una opcion en: ${faltantes.join(', ')}`);
      return false;
    }

    setSelectionError('');
    return true;
  };

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
            {categoriasPrincipales.map((categoria) => (
              <Box key={categoria.key}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                  {categoria.titulo}
                </Typography>
                <Stack spacing={2}>
                  {categoria.grupos.map((grupo) => (
                    <Box key={grupo.key}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        {grupo.titulo}{' '}
                        {grupo.modoSeleccion === 'unico' ? '(elige uno)' : '(elige uno o varios)'}
                        {grupo.obligatorio ? ' - obligatorio' : ' - opcional'}
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
              </Box>
            ))}
          </Stack>
        )}
        {selectionError ? (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            {selectionError}
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.25 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 'auto' }}>
          Extras: ${totalExtras.toLocaleString('es-CL')}
        </Typography>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={() => {
            if (!validarObligatorios()) return;
            onConfirm?.(seleccionados);
          }}
        >
          Agregar al carrito
        </Button>
      </DialogActions>
    </Dialog>
  );
}
