import { useEffect, useState } from 'react';
import {
  Grid, Card, CardContent, Typography, CardMedia,
  Button, Box, useMediaQuery, Tooltip, Stack, Skeleton
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
  const [cargando, setCargando] = useState(true);

  const { agregarProducto } = useCarrito();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const cargarProductos = async () => {
    setCargando(true);
    const [resProd, resCat] = await Promise.all([
      obtenerProductos(),
      obtenerCategorias()
    ]);
    setProductos(resProd.data);
    setCategorias(resCat.data);
    setCargando(false);
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const handleAgregar = (producto) => {
    agregarProducto(producto);
    setOpenCarrito(true);
  };

  const productosFiltrados = productos.filter((prod) => {
    const nombreOk = prod.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const categoriaOk = filtroCategoria
      ? prod.categoria?._id === filtroCategoria
      : true;
    return nombreOk && categoriaOk;
  });

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
        </Stack>
      </Box>

      {/* Rejilla de productos */}
      <Grid container spacing={3} justifyContent={isMobile ? 'center' : 'flex-start'}>
        {(cargando ? Array.from(new Array(6)) : productosFiltrados).map((prod, index) => (
          <Grid item key={prod?._id || index} xs={6} sm={4} md={3} lg={2}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: 2,
                boxShadow: 2,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: 6,
                },
              }}
            >
              {/* Imagen o Skeleton */}
              <Box sx={{ position: 'relative', height: 120 }}>
                {cargando ? (
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height="100%"
                    sx={{ borderTopLeftRadius: 2, borderTopRightRadius: 2 }}
                    animation="wave"
                  />
                ) : (
                  <>
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      height="100%"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 1,
                        borderTopLeftRadius: 2,
                        borderTopRightRadius: 2,
                      }}
                      animation="wave"
                    />
                    <CardMedia
                      component="img"
                      image={
                        prod.imagen_url?.startsWith('/uploads')
                          ? `${BASE_URL}${prod.imagen_url}`
                          : prod.imagen_url
                      }
                      alt={prod.nombre}
                      loading="lazy"
                      sx={{
                        height: '100%',
                        objectFit: 'cover',
                        borderTopLeftRadius: 2,
                        borderTopRightRadius: 2,
                        position: 'relative',
                        zIndex: 2,
                      }}
                      onLoad={(e) => {
                        e.target.previousSibling.style.display = 'none';
                      }}
                    />
                  </>
                )}
              </Box>

              {/* Contenido */}
              <CardContent sx={{ px: 2, py: 1.5 }}>
                {cargando ? (
                  <>
                    <Skeleton variant="text" height={30} />
                    <Skeleton variant="text" height={20} />
                    <Skeleton variant="text" height={20} width="60%" />
                  </>
                ) : (
                  <>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{ textAlign: 'center', fontSize: '0.9rem', mb: 0.5 }}
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
                          fontSize: '0.75rem',
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

                    {typeof prod.stock === 'number' && (
                      <Typography
                        variant="caption"
                        color={prod.stock === 0 ? 'error' : 'text.secondary'}
                        sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}
                      >
                        {prod.stock === 0 ? 'AGOTADO' : `Stock: ${prod.stock}`}
                      </Typography>
                    )}

                    <Box display="flex" justifyContent="center" mt={1}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleAgregar(prod)}
                        disabled={prod.stock === 0}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          px: 2,
                          gap: 1,
                        }}
                      >
                        <AddShoppingCartIcon fontSize="small" />
                        Agregar
                      </Button>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <CarritoDrawer open={openCarrito} onClose={() => setOpenCarrito(false)} />

      <ModalCrearProducto
        open={openCrear}
        onClose={() => setOpenCrear(false)}
        onCreado={cargarProductos}
      />
    </Box>
  );
}
