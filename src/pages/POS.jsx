import { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography, CardMedia,
  Button, Box, useMediaQuery, Tooltip, Stack
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CarritoDrawer from '../components/CarritoDrawer';
import { obtenerProductos, obtenerCategorias } from '../services/api';
import { useCarrito } from '../context/CarritoContext';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import BuscadorProducto from '../components/BuscadorProducto';
import ModalCrearProducto from '../components/ModalCrearProducto';
import ShoppingCartIcon from '@mui/icons-material/PointOfSale';

const BASE_URL = 'http://localhost:5000';

export default function POS() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [openCarrito, setOpenCarrito] = useState(false);
  const [openCrear, setOpenCrear] = useState(false);

  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const [ordenPersonalizado, setOrdenPersonalizado] = useState([]);
  const [colapsadas, setColapsadas] = useState({});

  const { agregarProducto } = useCarrito();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const cargarProductos = async () => {
    const [resProd, resCat] = await Promise.all([
      obtenerProductos(),
      obtenerCategorias()
    ]);

    const ordenLocal = JSON.parse(localStorage.getItem('ordenCategorias')) || [];
    const colapsadasLocal = JSON.parse(localStorage.getItem('colapsadasCategorias')) || {};

    // ordenar categorías según orden en localStorage
    const categoriasOrdenadas = ordenLocal.length > 0
      ? ordenLocal.map(id => resCat.data.find(cat => cat._id === id)).filter(Boolean)
      : resCat.data;

    setProductos(resProd.data);
    setCategorias(categoriasOrdenadas);
    setOrdenPersonalizado(ordenLocal);
    setColapsadas(colapsadasLocal);
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const handleAgregar = (producto) => {
    agregarProducto(producto);
    setOpenCarrito(true);
  };

  const toggleColapsar = (categoriaId) => {
    setColapsadas((prev) => {
      const updated = {
        ...prev,
        [categoriaId]: !prev[categoriaId]
      };
      localStorage.setItem('colapsadasCategorias', JSON.stringify(updated));
      return updated;
    });
  };

  const productosFiltrados = productos.filter((prod) => {
    const nombreOk = prod.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const categoriaOk = filtroCategoria
      ? prod.categoria?._id === filtroCategoria
      : true;
    return nombreOk && categoriaOk;
  });

  // Agrupar productos por categoría
  const productosPorCategoria = categorias.map((cat) => ({
    ...cat,
    productos: productosFiltrados.filter(p => p.categoria?._id === cat._id)
  }));

  return (
    <Box sx={{ mt: 2, px: 2 }}>
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
          <Button
            variant="text"
            color="warning"
            onClick={() => {
              localStorage.removeItem('ordenCategorias');
              localStorage.removeItem('colapsadasCategorias');
              cargarProductos();
            }}
          >
            Restaurar Orden
          </Button>
        </Stack>
      </Box>

      {/* Productos agrupados por categoría */}
      {productosPorCategoria.map((cat) => (
        <Box key={cat._id} sx={{ mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6" fontWeight="bold">
              {cat.nombre}
            </Typography>
            <Button
              size="small"
              onClick={() => toggleColapsar(cat._id)}
              sx={{ textTransform: 'none' }}
            >
              {colapsadas[cat._id] ? 'Mostrar' : 'Ocultar'}
            </Button>
          </Box>

          {!colapsadas[cat._id] && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: isMobile ? 'center' : 'flex-start',
              }}
            >
              {cat.productos.map((prod) => {
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
          )}
        </Box>
      ))}

      <CarritoDrawer open={openCarrito} onClose={() => setOpenCarrito(false)} />

      <ModalCrearProducto
        open={openCrear}
        onClose={() => setOpenCrear(false)}
        onCreado={cargarProductos}
      />
    </Box>
  );
}