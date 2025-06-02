import { useState } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { abrirCaja, cerrarCaja } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCaja } from '../context/CajaContext';

export default function Caja() {
  const [montoInicial, setMontoInicial] = useState('');
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { cajaAbierta, setCajaAbierta } = useCaja();

  const handleAbrir = async () => {
    const monto = parseFloat(montoInicial);
    if (isNaN(monto) || monto <= 0) {
      alert('❌ Ingresa un monto válido.');
      return;
    }

    try {
      await abrirCaja({ monto_inicial: monto });
      alert('✅ Caja abierta correctamente.');
      setCajaAbierta(true);
      setMontoInicial('');
    } catch (err) {
      alert(err.response?.data?.error || '❌ Ya hay una caja abierta.');
    }
  };

  const handleCerrar = async () => {
    try {
      const res = await cerrarCaja({ nombre: usuario?.nombre });
      setCajaAbierta(false);
      navigate('/ticket-caja', { state: { resumen: res.data.resumen } });
    } catch (err) {
      alert(err.response?.data?.error || '❌ No hay caja abierta.');
    }
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Typography variant="h5">💰 Caja</Typography>
      <TextField
        fullWidth
        label="Monto Inicial"
        type="number"
        value={montoInicial}
        onChange={(e) => setMontoInicial(e.target.value)}
        sx={{ my: 2 }}
        disabled={cajaAbierta}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleAbrir}
        disabled={cajaAbierta}
      >
        Abrir Caja
      </Button>
      <Button
        variant="contained"
        color="error"
        onClick={handleCerrar}
        sx={{ ml: 2 }}
      >
        Cerrar Caja
      </Button>
    </Box>
  );
}
