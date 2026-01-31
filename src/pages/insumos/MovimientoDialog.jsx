import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import {
  obtenerLotesInsumo,
  obtenerMovimientosInsumo,
  registrarMovimientoInsumo
} from '../../services/api';

const buildEmptyForm = (tipo) => ({
  tipo: tipo || 'entrada',
  cantidad: '',
  loteId: '',
  lote: '',
  fecha_vencimiento: '',
  nota: ''
});

export default function MovimientoDialog({
  open,
  onClose,
  insumo,
  lotes,
  tipoFijo,
  tipoInicial,
  onInfo,
  onError,
  onRefreshInsumos,
  onUpdateMovimientos,
  onUpdateLotes
}) {
  const [form, setForm] = useState(buildEmptyForm('entrada'));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const tipo = tipoFijo ? (tipoInicial || 'entrada') : 'entrada';
    setForm(buildEmptyForm(tipo));
  }, [open, tipoFijo, tipoInicial]);

  const handleMovimiento = async () => {
    if (!insumo?._id) return;
    const cantidad = Number(form.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      onError?.('Ingresa una cantidad válida.');
      return;
    }
    const payload = {
      tipo: form.tipo,
      cantidad,
      loteId: form.loteId || undefined,
      lote: form.lote || undefined,
      fecha_vencimiento: form.fecha_vencimiento || undefined,
      nota: form.nota || undefined
    };
    try {
      setSaving(true);
      await registrarMovimientoInsumo(insumo._id, payload);
      onInfo?.('Movimiento registrado.');
      setForm(buildEmptyForm(tipoFijo ? (tipoInicial || 'entrada') : 'entrada'));
      onRefreshInsumos?.();
      const res = await obtenerMovimientosInsumo(insumo._id);
      onUpdateMovimientos?.(res.data || []);
      const lotesRes = await obtenerLotesInsumo(insumo._id);
      onUpdateLotes?.(lotesRes.data || []);
    } catch (err) {
      onError?.(err?.response?.data?.error || 'No se pudo registrar el movimiento.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Movimientos - {insumo?.nombre}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {!tipoFijo ? (
            <TextField
              select
              label="Tipo"
              value={form.tipo}
              onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value }))}
            >
              <MenuItem value="entrada">Entrada</MenuItem>
              <MenuItem value="salida">Salida</MenuItem>
            </TextField>
          ) : (
            <TextField
              label="Tipo"
              value={form.tipo === 'entrada' ? 'Entrada' : 'Salida'}
              disabled
            />
          )}
          <TextField
            label="Cantidad"
            type="number"
            value={form.cantidad}
            onChange={(e) => setForm((prev) => ({ ...prev, cantidad: e.target.value }))}
          />
          {form.tipo === 'entrada' && (
            <>
              <TextField
                label="Lote (opcional)"
                value={form.lote}
                onChange={(e) => setForm((prev) => ({ ...prev, lote: e.target.value }))}
              />
              <TextField
                label="Fecha vencimiento (opcional)"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.fecha_vencimiento}
                onChange={(e) => setForm((prev) => ({ ...prev, fecha_vencimiento: e.target.value }))}
              />
            </>
          )}
          {form.tipo === 'salida' && (
            <TextField
              select
              label="Lote"
              value={form.loteId}
              onChange={(e) => setForm((prev) => ({ ...prev, loteId: e.target.value }))}
            >
              <MenuItem value="">FIFO automatico</MenuItem>
              {lotes.map((lote) => (
                <MenuItem key={lote._id} value={lote._id}>
                  {lote.lote || lote._id} ({lote.cantidad})
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            label="Nota (opcional)"
            value={form.nota}
            onChange={(e) => setForm((prev) => ({ ...prev, nota: e.target.value }))}
            multiline
            minRows={2}
          />
          <Button variant="contained" onClick={handleMovimiento} disabled={saving}>
            {saving ? 'Registrando...' : 'Registrar movimiento'}
          </Button>
        </Stack>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            El historial completo está disponible en “Ver historial de E/S”.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
