import { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, useTheme,
  useMediaQuery, Divider, Button, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import DatePicker from 'react-multi-date-picker';
import { obtenerResumenPorRango } from '../services/api';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#1976d2', '#2e7d32', '#f57c00', '#9c27b0', '#d32f2f'];

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { selectedLocal } = useAuth();

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
  }, [rangoFechas, selectedLocal?._id]);

  const pieChartData = resumen
    ? Object.entries(resumen.porTipoPago).map(([tipo, valor]) => ({
        name: tipo,
        value: valor
      }))
    : [];

  const pieChartProductoData = resumen
    ? Object.entries(resumen.porTipoProducto || {}).map(([tipo, valor]) => ({
        name: tipo,
        value: valor
      }))
    : [];

  const productosResumen = resumen?.porProducto || [];
  const topProductos = [...productosResumen].sort((a, b) => b.total - a.total).slice(0, 10);

  const formatoMoneda = (valor) =>
    Number(valor || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const renderProductoTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const { nombre, cantidad, total } = payload[0].payload || {};
    return (
      <Box
        sx={{
          backgroundColor: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          px: 1.5,
          py: 1,
          boxShadow: 1
        }}
      >
        <Typography variant="subtitle2">{nombre}</Typography>
        <Typography variant="body2">Cantidad: {cantidad}</Typography>
        <Typography variant="body2">Total: ${formatoMoneda(total)}</Typography>
      </Box>
    );
  };

  const bgCard1 = theme.palette.mode === 'dark' ? '#1e1e1e' : '#e3f2fd';
  const bgCard2 = theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff3e0';
  const bgCard3 = theme.palette.mode === 'dark' ? '#1e1e1e' : '#e8f5e9';
  const bgCard4 = theme.palette.mode === 'dark' ? '#1e1e1e' : '#f3e5f5';

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
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }
          }}
        >
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
          <Card elevation={4} sx={{ backgroundColor: bgCard4, flex: 1, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                Distribucion por Tipo de Producto
              </Typography>
              <Divider sx={{ my: 1 }} />
              {pieChartProductoData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieChartProductoData} dataKey="value" nameKey="name" outerRadius={80} label>
                      {pieChartProductoData.map((entry, i) => (
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

          <Card elevation={4} sx={{ backgroundColor: '#e1f5fe', flex: 1, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                Top Productos (Total Vendido)
              </Typography>
              <Divider sx={{ my: 1 }} />
              {topProductos.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topProductos} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `$${formatoMoneda(value)}`} />
                    <YAxis
                      type="category"
                      dataKey="nombre"
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <ReTooltip content={renderProductoTooltip} />
                    <Bar dataKey="total" fill="#0288d1" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay datos.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card elevation={4} sx={{ backgroundColor: '#f1f8e9', flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                Productos Vendidos
              </Typography>
              <Divider sx={{ my: 1 }} />
              {productosResumen.length > 0 ? (
                <TableContainer component={Paper} sx={{ maxHeight: 320 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Producto</TableCell>
                        <TableCell align="right">Cantidad</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {productosResumen.map((producto) => (
                        <TableRow key={producto.nombre}>
                          <TableCell>{producto.nombre}</TableCell>
                          <TableCell align="right">{producto.cantidad}</TableCell>
                          <TableCell align="right">${formatoMoneda(producto.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay datos.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      ) : (
        <Typography color="text.secondary">Selecciona un rango para ver el resumen.</Typography>
      )}
    </Box>
  );
}
