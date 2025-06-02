import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, TextField, List, ListItemButton, Divider, Paper, Stack
} from '@mui/material';
import { obtenerVentas } from '../services/api';
import VistaTicket from '../components/VistaTicket';

export default function Historial() {
  const [ventas, setVentas] = useState([]);
  const [filtradas, setFiltradas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const res = await obtenerVentas({});
      setVentas(res.data);
      setFiltradas(res.data);
    } catch {
      alert('❌ Error al cargar historial');
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    const b = busqueda.toLowerCase();
    const resultado = ventas.filter(v =>
      String(v.numero_pedido).includes(b) ||
      v.productos.some(p => p.nombre.toLowerCase().includes(b))
    );
    setFiltradas(resultado);
  }, [busqueda, ventas]);

  const agrupadas = filtradas.reduce((acc, v) => {
    const fecha = new Date(v.fecha).toLocaleDateString('es-CL');
    acc[fecha] = acc[fecha] || [];
    acc[fecha].push(v);
    return acc;
  }, {});

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
      {/* Panel izquierdo: Lista de tickets */}
      <Box sx={{ flex: 1 }}>
        <TextField
          label="Buscar ticket o producto"
          variant="outlined"
          fullWidth
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Paper sx={{ maxHeight: '75vh', overflowY: 'auto', p: 1 }}>
          {Object.entries(agrupadas).map(([fecha, ventas]) => (
            <Box key={fecha} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 1 }}>{fecha}</Typography>
              <Divider />
              <List dense>
                {ventas.map((venta) => (
                  <ListItemButton
                    key={venta._id}
                    onClick={() => setVentaSeleccionada(venta)}
                    selected={ventaSeleccionada?._id === venta._id}
                  >
                    <Box>
                      <Typography variant="body1">
                        🧾 Ticket #{String(venta.numero_pedido).padStart(2, '0')}
                      </Typography>
                      <Typography variant="caption">
                        {new Date(venta.fecha).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </ListItemButton>
                ))}
              </List>
            </Box>
          ))}
        </Paper>
      </Box>

      {/* Panel derecho: Detalle */}
      <Box sx={{ flex: 2 }}>
        {ventaSeleccionada ? (
          <VistaTicket venta={ventaSeleccionada} />
        ) : (
          <Typography variant="body1" sx={{ mt: 4 }}>
            Selecciona un ticket para ver su detalle
          </Typography>
        )}
      </Box>
    </Stack>
  );
}
