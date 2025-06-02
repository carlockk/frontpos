import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { useEffect } from 'react';

export default function TicketCaja() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resumen } = location.state || {};

  useEffect(() => {
    const originalTitle = document.title;
    document.title = '.';
    return () => { document.title = originalTitle; };
  }, []);

  if (!resumen) return <Typography>No hay datos del resumen.</Typography>;

  //console.log("🧾 Ticket generado:", resumen); // Verifica que el usuario esté presente

  const fechaHora = new Date().toLocaleString();

  return (
    <>
      <style>{`
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
          }
          button {
            display: none !important;
          }
          @page {
            size: auto;
            margin: 0;
          }
        }
        hr {
          border: none;
          border-top: 1px dashed #999;
          margin: 8px 0;
        }
      `}</style>

      <Box id="ticket-container">
        <Box id="ticket" sx={{ maxWidth: 400, mx: 'auto', px: 2, pt: 2, pb: 3 }}>
          <Typography variant="h6" align="center">🧾 Cierre de Caja</Typography>
          <Typography align="center">N° Reporte</Typography>
          <Typography align="center" fontSize="0.75rem">{fechaHora}</Typography>

          <hr />
          <Typography>Apertura: {new Date(resumen.apertura).toLocaleString()}</Typography>
          <Typography>Cierre: {new Date(resumen.cierre).toLocaleString()}</Typography>
          <Typography>Usuario: {resumen.usuario}</Typography>
          <hr />
          <Typography>Monto Inicial: ${resumen.monto_inicial.toLocaleString()}</Typography>
          <Typography>Total Vendido: ${resumen.vendido.toLocaleString()}</Typography>
          <Typography variant="h6">Total Final: ${resumen.total.toLocaleString()}</Typography>

          {resumen.desglose_por_pago && Object.keys(resumen.desglose_por_pago).length > 0 && (
            <>
              <hr />
              <Typography variant="body2" fontWeight="bold">Desglose por método de pago:</Typography>
              {Object.entries(resumen.desglose_por_pago).map(([tipo, valor]) => (
                <Typography key={tipo}>{tipo}: ${valor.toLocaleString()}</Typography>
              ))}
            </>
          )}

          <hr />
          <Button variant="outlined" fullWidth onClick={() => window.print()}>
            🖨️ Imprimir
          </Button>
          <Button variant="contained" fullWidth sx={{ mt: 1 }} onClick={() => navigate('/caja')}>
            ⬅️ Volver
          </Button>
        </Box>
      </Box>
    </>
  );
}
