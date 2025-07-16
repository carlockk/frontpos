import { useEffect, useRef, useState } from 'react';
import {
  Card, CardContent, Typography, CardMedia,
  Button, Box, useMediaQuery, Tooltip, Stack, IconButton
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

import CarritoDrawer from '../components/CarritoDrawer';
import { obtenerProductos, obtenerCategorias } from '../services/api';
import { useCarrito } from '../context/CarritoContext';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import BuscadorProducto from '../components/BuscadorProducto';
import ModalCrearProducto from '../components/ModalCrearProducto';
import ShoppingCartIcon from '@mui/icons-material/PointOfSale';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CloseIcon from '@mui/icons-material/Close';

const BASE_URL = 'http://localhost:5000';

export default function POS() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [openCarrito, setOpenCarrito] = useState(false);
  const [openCrear, setOpenCrear] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const drawerRef = useRef(null);

  const { agregarProducto } = useCarrito();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const cargar = async () => {
      const [resProd, resCat] = await Promise.all([
        obtenerProductos(),
        obtenerCategorias()
      ]);
      setProductos(resProd.data);

      const localOrder = JSON.parse(localStorage.getItem('ordenCategorias'));
      if (localOrder) {
        const ordenadas = localOrder
          .map(id => resCat.data.find(c => c._id === id))
          .filter(Boolean);
        const faltantes = resCat.data.filter(c => !localOrder.includes(c._id));
        setCategorias([...ordenadas, ...faltantes]);
      } else {
        setCategorias(resCat.data);
      }
    };
    cargar();
  }, []);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(categorias);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setCategorias(items);
    localStorage.setItem('ordenCategorias', JSON.stringify(items.map(c => c._id)));
  };

  const handleAgregar = (producto) => {
    agregarProducto(producto);
    setOpenCarrito(true);
  };

  const handleOutsideClick = (e) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target)) {
      setDrawerOpen(false);
    }
  };

  useEffect(() => {
    if (drawerOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [drawerOpen]);

  const productosFiltrados = productos.filter((prod) => {
    const nombreOk = prod.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const categoriaOk = filtroCategoria ? prod.categoria?._id === filtroCategoria : true;
    return nombreOk && categoriaOk;
  });

  return (
    <Box sx={{ mt: 2, px: 2, position: 'relative' }}>
      {/* Encabezado */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          alignItems: 'center',
          mb: 3,
          gap: 2
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <ShoppingCartIcon sx={{ fontSize: 28 }} />
          <Typography variant="h5" fontWeight={700}>
            Punto de Venta
          </Typography>
        </Stack>

        <BuscadorProducto
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          filtroCategoria={filtroCategoria}
          setFiltroCategoria={setFiltroCategoria}
          categorias={categorias}
        />

        <Stack direction="row" spacing={1}>
          <Button variant="contained" color="success" onClick={() => setOpenCrear(true)}>
            + Producto
          </Button>
          <Button variant="outlined" onClick={() => setOpenCarrito(true)}>
            Ver Carrito
          </Button>
        </Stack>
      </Box>

      {/* Botón lateral para abrir el drawer */}
      <Box
        sx={{
          position: 'fixed',
          top: '50%',
          right: drawerOpen ? 240 : 0,
          transform: 'translateY(-50%)',
          zIndex: 1300,
        }}
      >
        <Button
          onClick={() => setDrawerOpen(!drawerOpen)}
          sx={{
            borderRadius: '4px 0 0 4px',
            py: 1,
            px: 1.5,
            fontSize: '0.75rem',
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            boxShadow: 3,
            '&:hover': { backgroundColor: theme.palette.primary.dark },
          }}
        >
          Categorías
        </Button>
      </Box>

      {/* Drawer lateral */}
      <Box
        ref={drawerRef}
        sx={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 240,
          height: '100vh',
          backgroundColor: 'white',
          borderLeft: '1px solid #ddd',
          boxShadow: 4,
          transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-in-out',
          zIndex: 1200,
          p: 2,
          overflowY: 'auto',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle2" fontWeight={700}>
            Ordenar Categorías
          </Typography>
          <IconButton size="small" onClick={() => setDrawerOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="categoriasDrawer" direction="vertical">
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
                          justifyContent: 'space-between',
                          mb: 1,
                          backgroundColor: filtroCategoria === cat._id ? 'primary.main' : 'grey.100',
                          color: filtroCategoria === cat._id ? 'white' : 'black',
                          borderRadius: 1,
                          px: 1.2,
                          py: 0.6,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                        onClick={() => setFiltroCategoria(cat._id)}
                      >
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {cat.nombre}
                        </Typography>
                        <IconButton {...provided.dragHandleProps} size="small">
                          <DragIndicatorIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        </DragDropContext>
      </Box>

      {/* Rejilla de productos */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: isMobile ? 'center' : 'flex-start',
        }}
      >
        {productosFiltrados.map((prod) => {
          const stock = prod.stock;

          return (
            <Box
              key={prod._id}
              sx={{
                width: 160,
                minWidth: 160,
                maxWidth: 160,
                height: 280,
                display: 'flex',
                justifyContent: 'center',
                mr: 2,
                mb: 2,
              }}
            >
              <Card
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 2,
                  boxShadow: 2,
                  transition: 'transform 0.2s',
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: 6,
                  },
                }}
              >
                <Box sx={{ p: 1, pb: 0 }}>
                  <CardMedia
                    component="img"
                    image={
                      prod.imagen_url?.startsWith('/uploads')
                        ? `${BASE_URL}${prod.imagen_url}`
                        : prod.imagen_url
                    }
                    alt={prod.nombre}
                    sx={{
                      height: 100,
                      width: '100%',
                      objectFit: 'cover',
                      borderTopLeftRadius: '12px',
                      borderTopRightRadius: '12px',
                      backgroundColor: prod.imagen_url ? 'transparent' : '#ccc',
                    }}
                  />
                </Box>

                <CardContent sx={{ px: 1.5, py: 1 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    sx={{ textAlign: 'center', fontSize: '0.85rem', mb: 0.5 }}
                  >
                    {prod.nombre}
                  </Typography>

                  <Tooltip title={prod.descripcion}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textAlign: 'center',
                        fontSize: '0.7rem',
                      }}
                    >
                      {prod.descripcion}
                    </Typography>
                  </Tooltip>

                  <Typography
                    variant="h6"
                    color="primary"
                    sx={{ textAlign: 'center', fontSize: '1rem' }}
                  >
                    ${prod.precio.toLocaleString()}
                  </Typography>

                  {(typeof stock === 'number' && stock >= 0) && (
                    <Typography
                      variant="caption"
                      color={stock === 0 ? 'error' : 'text.secondary'}
                      sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}
                    >
                      {stock === 0 ? 'AGOTADO' : `Stock: ${stock}`}
                    </Typography>
                  )}

                  <Box display="flex" justifyContent="center" mt={1}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleAgregar(prod)}
                      disabled={stock === 0}
                      sx={{
                        borderRadius: 1.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        px: 2,
                        gap: 1
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

      <CarritoDrawer open={openCarrito} onClose={() => setOpenCarrito(false)} />

      <ModalCrearProducto
        open={openCrear}
        onClose={() => setOpenCrear(false)}
        onCreado={() => window.location.reload()}
      />
    </Box>
  );
}
