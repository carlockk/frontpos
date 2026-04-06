import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Typography, Stack
} from '@mui/material';

export default function ModalPago({ open, onClose, onSubmit, total = 0 }) {
  const montosRapidos = [5000, 10000, 20000];
  const [tipoPago, setTipoPago] = useState('');
  const [tipoPedido, setTipoPedido] = useState('');
  const [montoRecibido, setMontoRecibido] = useState('');

  const totalNumerico = Number(total) || 0;
  const mostrarCampoEfectivo = tipoPago === 'Efectivo';
  const montoRecibidoNumerico = montoRecibido === '' ? null : Number(montoRecibido);

  const vuelto = useMemo(() => {
    if (montoRecibidoNumerico === null || Number.isNaN(montoRecibidoNumerico)) return null;
    return montoRecibidoNumerico - totalNumerico;
  }, [montoRecibidoNumerico, totalNumerico]);

  const limpiarFormulario = () => {
    setTipoPago('');
    setTipoPedido('');
    setMontoRecibido('');
  };

  useEffect(() => {
    if (!open) {
      limpiarFormulario();
    }
  }, [open]);

  const handleEnviar = () => {
    if (!tipoPago) return alert('Debes seleccionar un tipo de pago');
    if (
      mostrarCampoEfectivo &&
      montoRecibido !== '' &&
      (Number.isNaN(montoRecibidoNumerico) || montoRecibidoNumerico < totalNumerico)
    ) {
      return alert('El monto recibido debe ser mayor o igual al total');
    }

    onSubmit({
      tipoPago,
      tipoPedido,
      montoRecibido: mostrarCampoEfectivo && montoRecibido !== '' ? montoRecibidoNumerico : null,
      vuelto: mostrarCampoEfectivo && montoRecibido !== '' ? vuelto : null
    });
    onClose();
    limpiarFormulario();
  };

  const handleClose = () => {
    onClose();
    limpiarFormulario();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Finalizar Venta</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Total a cobrar: <strong>${totalNumerico.toLocaleString('es-CL')}</strong>
        </Typography>

        <TextField
          select
          label="Tipo de pago"
          value={tipoPago}
          onChange={(e) => {
            const nuevoTipoPago = e.target.value;
            setTipoPago(nuevoTipoPago);
            if (nuevoTipoPago !== 'Efectivo') {
              setMontoRecibido('');
            }
          }}
          required
        >
          <MenuItem value="Efectivo">Efectivo</MenuItem>
          <MenuItem value="Débito">Débito</MenuItem>
          <MenuItem value="Crédito">Crédito</MenuItem>
          <MenuItem value="Transferencia">Transferencia</MenuItem>
        </TextField>

        {mostrarCampoEfectivo && (
          <>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {montosRapidos.map((monto) => (
                <Button
                  key={monto}
                  variant={Number(montoRecibido) === monto ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setMontoRecibido(String(monto))}
                >
                  ${monto.toLocaleString('es-CL')}
                </Button>
              ))}
            </Stack>

            <TextField
              label="Monto recibido (opcional)"
              type="number"
              value={montoRecibido}
              onChange={(e) => setMontoRecibido(e.target.value)}
              placeholder={`Ej: ${totalNumerico.toFixed(0)}`}
              inputProps={{ min: 0, step: 1 }}
              helperText="Si lo ingresas, calculamos el vuelto automáticamente."
            />

            {montoRecibido !== '' && vuelto !== null && !Number.isNaN(vuelto) && (
              <Typography
                color="error.main"
                sx={{ fontWeight: 800, fontSize: '2rem', lineHeight: 1.1 }}
              >
                {vuelto < 0
                  ? `Faltan $${Math.abs(vuelto).toLocaleString('es-CL')}`
                  : `Vuelto: $${vuelto.toLocaleString('es-CL')}`}
              </Typography>
            )}
          </>
        )}

        <TextField
          label="Tipo de pedido (opcional)"
          value={tipoPedido}
          onChange={e => setTipoPedido(e.target.value)}
          placeholder="Ej: local, para llevar, delivery"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleEnviar}>Confirmar</Button>
      </DialogActions>
    </Dialog>
  );
}
