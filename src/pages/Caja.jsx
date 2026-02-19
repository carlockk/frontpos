import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  abrirCaja,
  cerrarCaja,
  cobrarComandaCaja,
  obtenerComandasPendientesCaja,
  obtenerRendicionesPendientesCaja,
  rendirCobroMesaCaja
} from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCaja } from '../context/CajaContext';
import ModalPago from '../components/ModalPago';

export default function Caja() {
  const [montoInicial, setMontoInicial] = useState('');
  const [pendientes, setPendientes] = useState([]);
  const [cargandoPendientes, setCargandoPendientes] = useState(false);
  const [modalCobroOpen, setModalCobroOpen] = useState(false);
  const [comandaSeleccionada, setComandaSeleccionada] = useState(null);
  const [rendicionesPendientes, setRendicionesPendientes] = useState([]);
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { cajaAbierta, setCajaAbierta } = useCaja();

  const cargarPendientes = async () => {
    if (!cajaAbierta) {
      setPendientes([]);
      setRendicionesPendientes([]);
      return;
    }
    setCargandoPendientes(true);
    try {
      const [resPendientes, resRendiciones] = await Promise.all([
        obtenerComandasPendientesCaja(),
        obtenerRendicionesPendientesCaja()
      ]);
      setPendientes(resPendientes.data || []);
      setRendicionesPendientes(resRendiciones.data || []);
    } catch (err) {
      setPendientes([]);
      setRendicionesPendientes([]);
    } finally {
      setCargandoPendientes(false);
    }
  };

  useEffect(() => {
    cargarPendientes();
  }, [cajaAbierta]);

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
      await cargarPendientes();
      navigate('/pos');
    } catch (err) {
      alert(err.response?.data?.error || '❌ Ya hay una caja abierta.');
    }
  };

  const handleCerrar = async () => {
    try {
      const res = await cerrarCaja({ nombre: usuario?.nombre });
      setCajaAbierta(false);
      setPendientes([]);
      setRendicionesPendientes([]);
      navigate('/ticket-caja', { state: { resumen: res.data.resumen } });
    } catch (err) {
      alert(err.response?.data?.error || '❌ No hay caja abierta.');
    }
  };

  const abrirCobroComanda = (comanda) => {
    setComandaSeleccionada(comanda);
    setModalCobroOpen(true);
  };

  const handleCobrarComanda = async ({ tipoPago, tipoPedido }) => {
    if (!comandaSeleccionada?._id) return;
    try {
      const res = await cobrarComandaCaja(comandaSeleccionada._id, {
        tipo_pago: tipoPago,
        tipo_pedido: tipoPedido || `restaurante mesa ${comandaSeleccionada?.mesa?.numero || ''}`,
        cobrador_nombre: usuario?.nombre || usuario?.email || ''
      });
      await cargarPendientes();
      navigate('/ticket', { state: { venta: res.data.venta } });
    } catch (err) {
      alert(err?.response?.data?.error || '❌ No se pudo cobrar la comanda');
    } finally {
      setComandaSeleccionada(null);
    }
  };

  const rendirCobro = async (comandaId) => {
    try {
      await rendirCobroMesaCaja(comandaId);
      await cargarPendientes();
    } catch (err) {
      alert(err?.response?.data?.error || '❌ No se pudo registrar la rendicion');
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

      <Divider sx={{ my: 3 }} />

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h6">Comandas pendientes de cobro</Typography>
        <Button size="small" variant="outlined" onClick={cargarPendientes} disabled={!cajaAbierta || cargandoPendientes}>
          {cargandoPendientes ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </Stack>

      {!cajaAbierta ? (
        <Typography variant="body2" color="text.secondary">
          Abre la caja para ver y cobrar comandas de restaurante.
        </Typography>
      ) : pendientes.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No hay comandas pendientes por ahora.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {pendientes.map((comanda) => (
            <Card key={comanda._id} variant="outlined">
              <CardContent sx={{ py: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography fontWeight={700}>
                      Mesa {comanda?.mesa?.numero || '-'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Mesero: {comanda?.mesero?.nombre || comanda?.mesero?.email || 'Sin asignar'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Items: {Array.isArray(comanda.items) ? comanda.items.length : 0}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography fontWeight={700}>
                      ${Number(comanda.total || 0).toLocaleString('es-CL')}
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      sx={{ mt: 1 }}
                      onClick={() => abrirCobroComanda(comanda)}
                    >
                      Cobrar
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Divider sx={{ my: 3 }} />
      <Typography variant="h6" sx={{ mb: 1 }}>Rendiciones de efectivo pendientes</Typography>
      {!cajaAbierta ? (
        <Typography variant="body2" color="text.secondary">
          Abre la caja para gestionar rendiciones en efectivo.
        </Typography>
      ) : rendicionesPendientes.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No hay rendiciones pendientes.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {rendicionesPendientes.map((comanda) => (
            <Card key={`rend-${comanda._id}`} variant="outlined">
              <CardContent sx={{ py: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography fontWeight={700}>Mesa {comanda?.mesa?.numero || '-'}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cobrado por: {comanda?.cobradaPor?.nombre || comanda?.mesero?.nombre || comanda?.mesero?.email || 'Mesero'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pago: {comanda?.tipo_pago || 'Efectivo'}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography fontWeight={700}>
                      ${Number(comanda.total || 0).toLocaleString('es-CL')}
                    </Typography>
                    <Button size="small" variant="contained" sx={{ mt: 1 }} onClick={() => rendirCobro(comanda._id)}>
                      Marcar rendido
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <ModalPago
        open={modalCobroOpen}
        onClose={() => {
          setModalCobroOpen(false);
          setComandaSeleccionada(null);
        }}
        onSubmit={handleCobrarComanda}
      />
    </Box>
  );
}
