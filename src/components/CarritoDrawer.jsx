import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Stack,
  Alert
} from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import { useCarrito } from '../context/CarritoContext';
import { useCaja } from '../context/CajaContext';
import { registrarVenta, guardarTicket } from '../services/api'; // ✅ agregado
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ModalPago from './ModalPago';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

export default function CarritoDrawer({ open, onClose, onVentaCompletada }) {
  const { carrito, actualizarCantidad, actualizarObservacion, vaciarCarrito } = useCarrito();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [ticketNombre, setTicketNombre] = useState(''); // ✅ nombre del ticket
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { cajaAbierta, cajaVerificada } = useCaja();

  const total = carrito.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
  const cajaDisponible = cajaAbierta === true;

  const handleVenta = async ({ tipoPago, tipoPedido }) => {
    if (!cajaDisponible) {
      alert('No puedes iniciar el POS si no abres la caja.');
      setModalOpen(false);
      return;
    }
    const productos_limpios = carrito.map(p => ({
      productoId: p._id,
      nombre: p.nombre,
      precio_unitario: p.precio,
      cantidad: p.cantidad,
      observacion: p.observacion
    }));

    try {
      setLoading(true);
      const res = await registrarVenta({
        productos: productos_limpios,
        total,
        tipo_pago: tipoPago,
        tipo_pedido: tipoPedido || '—'
      });

      vaciarCarrito();
      onClose();
      if (typeof onVentaCompletada === 'function') {
        onVentaCompletada();
      }

      navigate('/ticket', {
        state: {
          venta: {
            numero_pedido: res.data.numero_pedido,
            productos: productos_limpios,
            total,
            tipo_pago: tipoPago,
            tipo_pedido: tipoPedido || '—'
          }
        }
      });
    } catch (err) {
      console.error(err);
      const mensaje = err?.response?.data?.error || 'Error al registrar la venta';
      alert(mensaje);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarTicket = async () => {
    if (!ticketNombre.trim()) {
      alert('❌ Debes ingresar un nombre para el ticket');
      return;
    }

    const productos_limpios = carrito.map(p => ({
      productoId: p._id,
      nombre: p.nombre,
      precio_unitario: p.precio,
      cantidad: p.cantidad,
      observacion: p.observacion
    }));

    try {
      await guardarTicket({
        nombre: ticketNombre,
        productos: productos_limpios,
        total
      });

      alert('✅ Ticket guardado correctamente');
      setTicketNombre('');
      vaciarCarrito();
      onClose();
    } catch (err) {
      alert('❌ Error al guardar el ticket');
      console.error(err);
    }
  };

  return (
    <>
      <Drawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: isMobile ? '100%' : 360,
            height: isMobile ? '90vh' : '100%',
            p: 3,
            bgcolor: theme.palette.background.default,
            color: theme.palette.text.primary,
            borderTopLeftRadius: isMobile ? 12 : 0,
            borderTopRightRadius: isMobile ? 12 : 0
          }
        }}
      >
        <Typography variant="h6" gutterBottom>🛒 Carrito</Typography>

        {carrito.length === 0 ? (
          <Typography variant="body1" sx={{ mt: 2 }}>El carrito está vacío.</Typography>
        ) : (
          <>
            {carrito.map(item => (
              <Box key={item._id} sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: theme.palette.background.paper, border: '1px solid', borderColor: theme.palette.divider }}>
                <Typography fontWeight={600}>{item.nombre}</Typography>

                <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                  <IconButton size="small" onClick={() => actualizarCantidad(item._id, item.cantidad - 1)}>
                    <Remove fontSize="small" />
                  </IconButton>
                  <Typography>{item.cantidad}</Typography>
                  <IconButton size="small" onClick={() => actualizarCantidad(item._id, item.cantidad + 1)}>
                    <Add fontSize="small" />
                  </IconButton>
                </Stack>

                <TextField
                  fullWidth
                  size="small"
                  placeholder="Observación"
                  variant="outlined"
                  value={item.observacion}
                  onChange={e => actualizarObservacion(item._id, e.target.value)}
                  sx={{ mt: 1 }}
                />
              </Box>
            ))}

            <Typography variant="h6" sx={{ mt: 2, textAlign: 'right' }}>
              Total: <strong>${total.toFixed(0)}</strong>
            </Typography>

            {cajaVerificada && !cajaDisponible && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                No puedes iniciar el POS si no abres la caja.
              </Alert>
            )}

            <Stack spacing={1} mt={2}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => setModalOpen(true)}
                disabled={loading || !cajaDisponible}
                sx={{ py: 1.2, fontWeight: 600 }}
              >
                {cajaDisponible ? (loading ? 'Procesando...' : '💳 Finalizar Venta') : 'Abre la caja para vender'}
              </Button>
              <Button variant="text" color="error" onClick={vaciarCarrito}>
                🗑 Vaciar Carrito
              </Button>

              {/* ✅ Campo para guardar ticket */}
              <TextField
                size="small"
                fullWidth
                variant="outlined"
                label="Nombre del ticket"
                value={ticketNombre}
                onChange={(e) => setTicketNombre(e.target.value)}
              />
              <Button
                variant="outlined"
                fullWidth
                onClick={handleGuardarTicket}
              >
                📝 Guardar Ticket
              </Button>
            </Stack>
          </>
        )}
      </Drawer>

      <ModalPago
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleVenta}
      />
    </>
  );
}









