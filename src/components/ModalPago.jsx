import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem
} from '@mui/material';

export default function ModalPago({ open, onClose, onSubmit }) {
  const [tipoPago, setTipoPago] = useState('');
  const [tipoPedido, setTipoPedido] = useState('');

  const handleEnviar = () => {
    if (!tipoPago) return alert('Debes seleccionar un tipo de pago');
    onSubmit({ tipoPago, tipoPedido });
    onClose();
    setTipoPago('');
    setTipoPedido('');
  };

  const handleClose = () => {
    onClose();
    setTipoPago('');
    setTipoPedido('');
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Finalizar Venta</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <TextField
          select
          label="Tipo de pago"
          value={tipoPago}
          onChange={e => setTipoPago(e.target.value)}
          required
        >
          <MenuItem value="Efectivo">Efectivo</MenuItem>
          <MenuItem value="Débito">Débito</MenuItem>
          <MenuItem value="Crédito">Crédito</MenuItem>
          <MenuItem value="Transferencia">Transferencia</MenuItem>
        </TextField>

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
