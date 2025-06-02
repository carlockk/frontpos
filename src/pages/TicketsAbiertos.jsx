// src/pages/TicketsAbiertos.jsx
import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack
} from '@mui/material';
import { obtenerTicketsAbiertos, eliminarTicket } from '../services/api';
import { useCarrito } from '../context/CarritoContext';
import { useNavigate } from 'react-router-dom';

export default function TicketsAbiertos() {
  const [tickets, setTickets] = useState([]);
  const { cargarCarrito } = useCarrito();
  const navigate = useNavigate();

  const cargarTickets = async () => {
    try {
      const res = await obtenerTicketsAbiertos();
      setTickets(res.data);
    } catch (err) {
      alert('❌ Error al cargar tickets');
    }
  };

  const handleCargarAlCarrito = async (ticket) => {
    await eliminarTicket(ticket._id); // 🔥 Eliminamos ticket antes (opcional)
    cargarCarrito(ticket.productos, true); // 🔥 Reemplaza el carrito por este ticket
    navigate('/pos');
  };

  const handleEliminar = async (id) => {
    await eliminarTicket(id);
    cargarTickets();
  };

  useEffect(() => {
    cargarTickets();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>🧾 Tickets Abiertos</Typography>

      {tickets.length === 0 ? (
        <Typography color="text.secondary">No hay tickets abiertos.</Typography>
      ) : (
        <Stack spacing={2}>
          {tickets.map(ticket => (
            <Paper key={ticket._id} sx={{ p: 2 }}>
              <Typography fontWeight="bold">{ticket.nombre}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total: ${ticket.total.toFixed(0)}
              </Typography>

              <Stack direction="row" spacing={2} mt={1}>
                <Button
                  variant="contained"
                  onClick={() => handleCargarAlCarrito(ticket)}
                >
                  Cargar al carrito
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleEliminar(ticket._id)}
                >
                  Eliminar
                </Button>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
