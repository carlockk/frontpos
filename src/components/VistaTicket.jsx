import { Box, Typography, Button } from '@mui/material';
import { useEffect, useRef } from 'react';

export default function VistaTicket({ venta }) {
  const ticketRef = useRef();

  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'Vista Ticket';
    return () => {
      document.title = originalTitle;
    };
  }, []);

  const handleImprimir = () => {
    const printContent = ticketRef.current.innerHTML;
    const ventana = window.open('', '', 'width=600,height=800');
    ventana.document.write(`
      <html>
        <head>
          <title>Ticket</title>
          <style>
            @page {
              size: auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: monospace;
              font-size: 14px;
              background: white;
              color: black;
            }
            .ticket {
              width: 80mm;
              max-width: 100%;
              margin: auto;
              padding: 10px;
              text-align: center;
            }
            hr {
              border: none;
              border-top: 1px dashed #999;
              margin: 10px 0;
            }
            .bold {
              font-weight: bold;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="ticket">
            ${printContent}
          </div>
        </body>
      </html>
    `);
    ventana.document.close();
  };

  if (!venta) return null;

  return (
    <>
      <style>
        {`
        @media screen {
          body[data-theme='dark'] #ticket-vista {
            background-color: #1e1e1e;
            color: #f0f0f0;
          }

          body[data-theme='dark'] #ticket-vista hr {
            border-top: 1px dashed #666;
          }
        }

        @media print {
          .no-print {
            display: none !important;
          }
        }

        hr {
          border: none;
          border-top: 1px dashed #999;
          margin: 10px 0;
        }
        `}
      </style>

      <Box
        id="ticket-vista"
        ref={ticketRef}
        sx={{
          textAlign: 'center',
          px: 1,
          py: 2
        }}
      >
        <Typography className="bold" fontSize="1.2rem">🧾 Ticket de Venta</Typography>
        <Typography>N° Pedido: #{String(venta.numero_pedido).padStart(2, '0')}</Typography>
        <Typography fontSize="0.8rem">
          {new Date(venta.fecha).toLocaleString()}
        </Typography>

        <hr />

        {venta.productos.map((item, i) => (
          <Box key={i} sx={{ mb: 1 }}>
            <Typography>{item.nombre} x{item.cantidad}</Typography>
            {item.observacion && (
              <Typography variant="caption">Obs: {item.observacion}</Typography>
            )}
            <Typography>${item.precio_unitario.toLocaleString()} c/u</Typography>
          </Box>
        ))}

        {/* 🔽 Total resaltado con líneas */}
        <Box sx={{ my: 2 }}>
          <hr />
          <Typography className="bold" sx={{ fontSize: '1rem', my: 1 }}>
            Total: ${venta.total.toLocaleString()}
          </Typography>
          <hr />
        </Box>

        <Typography>Pago: {venta.tipo_pago || '—'}</Typography>
        <Typography>Pedido: {venta.tipo_pedido || '—'}</Typography>
      </Box>

      {/* 🔘 Botón fuera de la impresión */}
      <Box className="no-print" sx={{ mt: 2, maxWidth: 400, mx: 'auto' }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={handleImprimir}
        >
          🖨️ Imprimir Ticket
        </Button>
      </Box>
    </>
  );
}
