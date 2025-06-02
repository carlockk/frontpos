import { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, useTheme,
  useMediaQuery, Divider, Button, Stack
} from '@mui/material';
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer, Legend } from 'recharts';
import DatePicker from 'react-multi-date-picker';
import { obtenerResumenPorRango } from '../services/api';

const COLORS = ['#1976d2', '#2e7d32', '#f57c00', '#9c27b0', '#d32f2f'];

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [rangoFechas, setRangoFechas] = useState([]);
  const [resumen, setResumen] = useState(null);

  useEffect(() => {
    const cargarResumen = async () => {
      if (!rangoFechas.length || rangoFechas.length < 2) return;

      try {
        const inicio = rangoFechas[0].format('YYYY-MM-DD');
        const fin = rangoFechas[1].format('YYYY-MM-DD');

        const res = await obtenerResumenPorRango(inicio, fin);
        setResumen(res.data);
      } catch (err) {
        console.error('Error al obtener resumen por rango:', err);
      }
    };

    cargarResumen();
  }, [rangoFechas]);

  const pieChartData = resumen
    ? Object.entries(resumen.porTipoPago).map(([tipo, valor]) => ({
        name: tipo,
        value: valor
      }))
    : [];

  const bgCard1 = theme.palette.mode === 'dark' ? '#1e1e1e' : '#e3f2fd';
  const bgCard2 = theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff3e0';
  const bgCard3 = theme.palette.mode === 'dark' ? '#1e1e1e' : '#e8f5e9';

  return (
    <Box sx={{ mt: 4, px: isMobile ? 2 : 4 }}>
      <Typography variant="h4" gutterBottom align={isMobile ? 'center' : 'left'}>
        📈 Resumen de Ventas
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2">Seleccionar Rango de Fechas</Typography>
        <DatePicker
          range
          value={rangoFechas}
          onChange={(dates) => setRangoFechas([...dates])} // 🔥 Evitamos mutaciones directas
          format="YYYY-MM-DD"
          style={{
            padding: '8px',
            width: isMobile ? '100%' : 260,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 8
          }}
        />
        <Button
          variant="outlined"
          color="secondary"
          sx={{ mt: 1, ml: 1 }}
          onClick={() => {
            setRangoFechas([]);
            setResumen(null);
          }}
        >
          Limpiar
        </Button>
      </Box>

      {resumen ? (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Card elevation={4} sx={{ backgroundColor: bgCard1, flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" color="primary">
                Total Vendido
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h3" color="primary">
                ${resumen.total.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>

          <Card elevation={4} sx={{ backgroundColor: bgCard2, flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                Cantidad de Ventas
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h3" color="text.secondary">
                {resumen.cantidad}
              </Typography>
            </CardContent>
          </Card>

          <Card elevation={4} sx={{ backgroundColor: bgCard3, flex: 1, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                Distribución por Tipo de Pago
              </Typography>
              <Divider sx={{ my: 1 }} />
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieChartData} dataKey="value" nameKey="name" outerRadius={80} label>
                      {pieChartData.map((entry, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay datos.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Stack>
      ) : (
        <Typography color="text.secondary">Selecciona un rango para ver el resumen.</Typography>
      )}
    </Box>
  );
}
