import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { useEffect } from 'react';

export default function Ticket() {
  const location = useLocation();
  const navigate = useNavigate();
  const { venta } = location.state || {};

  useEffect(() => {
    const originalTitle = document.title;
    document.title = '.'; // evitar "POS System"
    return () => {
      document.title = originalTitle;
    };
  }, []);

  if (!venta) return <Typography>No hay datos de venta.</Typography>;

  const fechaHora = new Date().toLocaleString();

  return (
    <>
      <style>
        {`
        @media print {
          header, nav, .MuiDrawer-root, .MuiAppBar-root {
            display: none !important;
            visibility: hidden !important;
          }

          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          #ticket-container {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            height: 100vh;
            padding-top: 20mm;
          }

          #ticket {
            width: 80mm;
            font-size: 11px;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0;
            padding: 0;
          }

          button {
            display: none !important;
          }

          @page {
            size: auto;
            margin: 0;
          }
        }

        @media screen {
          body[data-theme='dark'] #ticket {
            background-color: #1e1e1e;
            color: #f0f0f0;
          }

          body[data-theme='dark'] #ticket button {
            background-color: #2e2e2e;
            color: #f0f0f0;
            border-color: #555;
          }

          body[data-theme='dark'] #ticket hr {
            border-top: 1px dashed #666;
          }
        }

        hr {
          border: none;
          border-top: 1px dashed #999;
          margin: 8px 0;
        }
        `}
      </style>

      <Box id="ticket-container">
        <Box
          id="ticket"
          sx={{
            maxWidth: 400,
            mx: 'auto',
            px: 2,
            pt: 2,
            pb: 3,
          }}
        >
          <Typography variant="h6" align="center">🧾 Ticket de Venta</Typography>
          <Typography align="center">N° Pedido: #{String(venta.numero_pedido).padStart(2, '0')}</Typography>
          <Typography align="center" fontSize="0.75rem">{fechaHora}</Typography>
          <hr />

        {venta.productos.map((item, i) => (
          <Box key={i} sx={{ mb: 1 }}>
            <Typography>
              {item.nombre}
              {item.varianteNombre ? ` (${item.varianteNombre})` : ''} x{item.cantidad}
            </Typography>
            {Array.isArray(item.atributos) && item.atributos.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                {item.atributos.map(attr => `${attr.nombre}: ${attr.valor}`).join(' | ')}
              </Typography>
            )}
            {item.observacion && (
              <Typography variant="caption">Obs: {item.observacion}</Typography>
            )}
            <Typography>${item.precio_unitario.toLocaleString()} c/u</Typography>
          </Box>
          ))}

          <hr />
          <Typography variant="h6">Total: ${venta.total.toLocaleString()}</Typography>
          <Typography variant="body2">Pago: {venta.tipo_pago}</Typography>
          <Typography variant="body2">Pedido: {venta.tipo_pedido}</Typography>

          <hr />
          <Button
            variant="outlined"
            fullWidth
            onClick={() => window.print()}
          >
            🖨️ Imprimir
          </Button>
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 1 }}
            onClick={() => navigate('/pos')}
          >
            ⬅️ Volver a POS
          </Button>
        </Box>
      </Box>
    </>
  );
}
