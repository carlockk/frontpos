import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Stack, Card, CardContent,
  CardMedia, useMediaQuery, IconButton, Drawer, Snackbar,
  Tooltip, Fab
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  DragDropContext, Droppable, Draggable
} from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';

import CarritoDrawer from '../components/CarritoDrawer';
import { obtenerProductos, obtenerCategorias } from '../services/api';
import { useCarrito } from '../context/CarritoContext';
import { useCaja } from '../context/CajaContext';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ShoppingCartIcon from '@mui/icons-material/PointOfSale';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import BuscadorProducto from '../components/BuscadorProducto';
import ModalCrearProducto from '../components/ModalCrearProducto';
import SettingsIcon from '@mui/icons-material/Tune';

const BASE_URL = 'http://localhost:5000';

export default function POS() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [openCarrito, setOpenCarrito] = useState(false);
  const [openCrear, setOpenCrear] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { agregarProducto } = useCarrito();
  const { cajaAbierta, cajaVerificada } = useCaja();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userKey = user?.id || user?._id || 'anonimo';

  // Estado derivado: productos ordenados por categoría actual
  const [productosOrdenados, setProductosOrdenados] = useState([]);

  const ordenarProductosPorCategorias = (prods, cats) => {
    const orden = cats.map(cat => cat._id);
    const ordenados = [];

    orden.forEach(catId => {
      prods.filter(p => p.categoria?._id === catId).forEach(p => ordenados.push(p));
    });

    return ordenados;
  };

  const cargarDatos = async () => {
    const [resProd, resCat] = await Promise.all([
      obtenerProductos(),
      obtenerCategorias()
    ]);
    const ordenGuardado = JSON.parse(localStorage.getItem(`ordenCategorias_${userKey}`));

    let categoriasOrdenadas = resCat.data;
    if (ordenGuardado) {
      const ordenadas = ordenGuardado.map(id => resCat.data.find(c => c._id === id)).filter(Boolean);
      const faltantes = resCat.data.filter(c => !ordenGuardado.includes(c._id));
      categoriasOrdenadas = [...ordenadas, ...faltantes];
    }

    setProductos(resProd.data);
    setCategorias(categoriasOrdenadas);
    setProductosOrdenados(ordenarProductosPorCategorias(resProd.data, categoriasOrdenadas));
  };

  useEffect(() => {
    cargarDatos();
    window.addEventListener('storage', (e) => {
      if (e.key === `ordenCategorias_${userKey}`) cargarDatos();
    });
    return () => window.removeEventListener('storage', () => {});
  }, []);

  const handleAgregar = (producto) => {
    agregarProducto(producto);
    setOpenCarrito(true);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(categorias);
    const [reordenado] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordenado);

    setCategorias(items);
    localStorage.setItem(`ordenCategorias_${userKey}`, JSON.stringify(items.map(c => c._id)));
    setProductosOrdenados(ordenarProductosPorCategorias(productos, items));
    setSnackbarOpen(true);
  };

  const resetOrden = () => {
    localStorage.removeItem(`ordenCategorias_${userKey}`);
    cargarDatos();
  };

  const productosFiltrados = productosOrdenados.filter(prod => {
    const coincideNombre = prod.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = filtroCategoria ? prod.categoria?._id === filtroCategoria : true;
    return coincideNombre && coincideCategoria;
  });

  if (!cajaVerificada) {
    return (
      <Box sx={{ mt: 6, px: 2, display: 'flex', justifyContent: 'center' }}>
        <Typography variant="h6">Verificando estado de la caja...</Typography>
      </Box>
    );
  }

  if (!cajaAbierta) {
    return (
      <Box sx={{ mt: 6, px: 2 }}>
        <Card sx={{ maxWidth: 420, mx: 'auto', textAlign: 'center', p: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>POS bloqueado</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              No puedes iniciar el POS si no abres la caja.
            </Typography>
            <Button variant="contained" color="primary" onClick={() => navigate('/caja')}>
              Ir a abrir caja
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2, px: 2 }}>
      {/* Encabezado */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        alignItems: 'center',
        mb: 3,
        gap: 2
      }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ShoppingCartIcon sx={{ fontSize: 28 }} />
          <Typography variant="h5" fontWeight={700}>Punto de Venta</Typography>
        </Stack>

        <BuscadorProducto
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          filtroCategoria={filtroCategoria}
          setFiltroCategoria={setFiltroCategoria}
          categorias={categorias}
        />

        <Stack direction="row" spacing={1}>
          <Button variant="contained" color="success" onClick={() => setOpenCrear(true)}>+ Producto</Button>
          <Button variant="outlined" onClick={() => setOpenCarrito(true)}>Ver Carrito</Button>
        </Stack>
      </Box>

      {/* Productos */}
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: isMobile ? 'center' : 'flex-start',
      }}>
        {productosFiltrados.map(prod => {
          const stock = prod.stock;

          return (
            <Box key={prod._id} sx={{ width: 160, minWidth: 160, maxWidth: 160, height: 280, mr: 2, mb: 2 }}>
              <Card sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: 2,
                boxShadow: 2,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.02)', boxShadow: 6 },
              }}>
                <Box sx={{ p: 1, pb: 0 }}>
                  <CardMedia
                    component="img"
                    image={prod.imagen_url?.startsWith('/uploads') ? `${BASE_URL}${prod.imagen_url}` : prod.imagen_url}
                    alt={prod.nombre}
                    sx={{
                      height: 100, width: '100%', objectFit: 'cover',
                      borderTopLeftRadius: '12px', borderTopRightRadius: '12px',
                      backgroundColor: prod.imagen_url ? 'transparent' : '#ccc',
                    }}
                  />
                </Box>
                <CardContent sx={{ px: 1.5, py: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold" textAlign="center" fontSize="0.85rem" mb={0.5}>
                    {prod.nombre}
                  </Typography>
                  <Tooltip title={prod.descripcion}>
                    <Typography variant="body2" color="text.secondary"
                      sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center', fontSize: '0.7rem' }}>
                      {prod.descripcion}
                    </Typography>
                  </Tooltip>
                  <Typography variant="h6" color="primary" textAlign="center" fontSize="1rem">
                    ${prod.precio.toLocaleString()}
                  </Typography>
                  {(typeof stock === 'number' && stock >= 0) && (
                    <Typography variant="caption" color={stock === 0 ? 'error' : 'text.secondary'}
                      sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
                      {stock === 0 ? 'AGOTADO' : `Stock: ${stock}`}
                    </Typography>
                  )}
                  <Box display="flex" justifyContent="center" mt={1}>
                    <Button
                      variant="contained" size="small" disabled={stock === 0}
                      onClick={() => handleAgregar(prod)}
                      sx={{
                        borderRadius: 1.5, textTransform: 'none', fontWeight: 600,
                        fontSize: '0.75rem', px: 2, gap: 1
                      }}
                    >
                      <AddShoppingCartIcon fontSize="small" />
                      Agregar
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          );
        })}
      </Box>

      {/* Botón flotante derecho */}
      <Fab
        color="primary"
        size="medium"
        onClick={() => setDrawerOpen(true)}
        sx={{
          position: 'fixed',
          right: 16,
          bottom: 90,
          zIndex: 1500,
        }}
      >
        <SettingsIcon />
      </Fab>

      {/* Drawer para ordenar categorías */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: isMobile ? '90%' : 320, p: 2 } }}
      >
        <Typography variant="h6" fontWeight={600} mb={2}>Ordenar Categorías</Typography>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="categorias-drawer">
            {(provided) => (
              <Box ref={provided.innerRef} {...provided.droppableProps}>
                {categorias.map((cat, index) => (
                  <Draggable key={cat._id} draggableId={cat._id} index={index}>
                    {(provided) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: filtroCategoria === cat._id ? 'primary.main' : 'grey.200',
                          color: filtroCategoria === cat._id ? 'white' : 'black',
                          px: 1.5, py: 0.5, borderRadius: 1, mb: 1,
                          cursor: 'pointer', fontSize: '0.85rem'
                        }}
                        onClick={() => setFiltroCategoria(cat._id)}
                      >
                        <IconButton {...provided.dragHandleProps} size="small">
                          <DragIndicatorIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" fontWeight={500}>
                          {cat.nombre}
                        </Typography>
                      </Box>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        </DragDropContext>

        <Button
          variant="outlined"
          color="error"
          fullWidth
          sx={{ mt: 2 }}
          onClick={resetOrden}
        >
          Restablecer Orden
        </Button>
      </Drawer>

      <ModalCrearProducto open={openCrear} onClose={() => setOpenCrear(false)} onCreado={cargarDatos} />
      <CarritoDrawer
        open={openCarrito}
        onClose={() => setOpenCarrito(false)}
        onVentaCompletada={cargarDatos}
      />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        message="Orden guardado"
      />
    </Box>
  );
}
