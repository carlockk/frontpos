import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  CardMedia,
  useMediaQuery,
  IconButton,
  Drawer,
  Snackbar,
  Tooltip,
  Fab
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  DragDropContext,
  Droppable,
  Draggable
} from '@hello-pangea/dnd';
import { useLocation, useNavigate } from 'react-router-dom';

import CarritoDrawer from '../components/CarritoDrawer';
import { obtenerProductos, obtenerCategorias, FILES_BASE } from '../services/api';
import { useCarrito } from '../context/CarritoContext';
import { useCaja } from '../context/CajaContext';
import { useAuth } from '../context/AuthContext';

import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ShoppingCartIcon from '@mui/icons-material/PointOfSale';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SettingsIcon from '@mui/icons-material/Tune';

import BuscadorProducto from '../components/BuscadorProducto';
import ModalCrearProducto from '../components/ModalCrearProducto';
import SelectorVariantes from '../components/SelectorVariantes';
import SelectorAgregadosDialog from '../components/SelectorAgregadosDialog';

// ✅ Ahora usamos la base de archivos que sale de api.js
const BASE_URL = FILES_BASE || (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');
const MIN_STOCK_ALERT = 3;

const buildCategoryLabelMap = (items) => {
  const byId = new Map(items.map((cat) => [cat._id, cat]));
  const cache = new Map();

  const buildLabel = (cat, stack = new Set()) => {
    if (!cat) return '';
    if (cache.has(cat._id)) return cache.get(cat._id);
    if (stack.has(cat._id)) return cat.nombre || '';
    stack.add(cat._id);
    const parent = cat.parent ? byId.get(cat.parent) : null;
    const label = parent ? `${buildLabel(parent, stack)} / ${cat.nombre}` : cat.nombre || '';
    cache.set(cat._id, label);
    return label;
  };

  return items.map((cat) => ({
    ...cat,
    label: buildLabel(cat)
  }));
};

export default function POS() {
  const { selectedLocal } = useAuth();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [openCarrito, setOpenCarrito] = useState(false);
  const [openCrear, setOpenCrear] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [productoConVariantes, setProductoConVariantes] = useState(null);
  const [productoConAgregados, setProductoConAgregados] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const cardBackground =
    theme.palette.mode === 'dark'
      ? theme.palette.background.paper
      : '#ffffff';
  const cardBorderColor =
    theme.palette.mode === 'dark'
      ? 'rgba(148,163,184,0.35)'
      : 'rgba(15,23,42,0.12)';
  const thumbBorderColor =
    theme.palette.mode === 'dark'
      ? 'rgba(148,163,184,0.35)'
      : 'rgba(15,23,42,0.15)';
  const thumbBackground =
    theme.palette.mode === 'dark' ? '#1f2937' : '#f8fafc';
  const titleColor =
    theme.palette.mode === 'dark' ? '#f8fafc' : '#0f172a';
  const descColor =
    theme.palette.mode === 'dark' ? '#94a3b8' : '#475569';
  const stockOkColor =
    theme.palette.mode === 'dark' ? '#a7f3d0' : '#15803d';

  const { agregarProducto, cargarCarrito } = useCarrito();
  const { cajaAbierta, cajaVerificada } = useCaja();
  const navigate = useNavigate();
  const location = useLocation();
  const procesadasRef = useRef(new Set());

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user?.id || user?._id || 'anonimo';
  const userKey = `${userId}_${selectedLocal?._id || 'sin-local'}`;
  const [productosOrdenados, setProductosOrdenados] = useState([]);

  const tieneVariantes = (producto) =>
    Array.isArray(producto?.variantes) &&
    producto.variantes.length > 0;

  const normalizarNumero = (valor) => {
    if (valor === null || valor === undefined || valor === '') return null;
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
  };

  const obtenerStockControlado = (valor) => {
    const numero = normalizarNumero(valor);
    return numero !== null && numero > 0 ? numero : null;
  };

  const varianteEstaAgotada = (variante) => Boolean(variante?.agotado);

  const varianteDisponible = (variante) => !varianteEstaAgotada(variante);

  const obtenerStockTotal = (producto) => {
    const stockVirtual = obtenerStockControlado(producto?.stock_total);
    if (stockVirtual !== null) return stockVirtual;

    if (tieneVariantes(producto)) {
      const stocks = producto.variantes
        .map((vari) => obtenerStockControlado(vari.stock))
        .filter((stock) => stock !== null);
      if (stocks.length === 0) return null;
      return stocks.reduce((acc, val) => acc + val, 0);
    }

    return obtenerStockControlado(producto?.stock);
  };

  const ordenarProductosPorCategorias = (prods, cats) => {
    if (!Array.isArray(cats) || cats.length === 0) {
      return [...prods];
    }
    const orden = cats.map((cat) => cat._id);
    const ordenados = [];
    const usados = new Set();

    orden.forEach((catId) => {
      prods
        .filter((p) => p.categoria?._id === catId)
        .forEach((p) => {
          ordenados.push(p);
          usados.add(p._id);
        });
    });

    prods
      .filter((p) => !usados.has(p._id))
      .forEach((p) => ordenados.push(p));

    return ordenados;
  };

  const cargarDatos = async () => {
    const [resProd, resCat] = await Promise.all([
      obtenerProductos(),
      obtenerCategorias()
    ]);

    const categoriasConEtiqueta = buildCategoryLabelMap(resCat.data || []);
    const ordenGuardado = JSON.parse(
      localStorage.getItem(`ordenCategorias_${userKey}`)
    );

    let categoriasOrdenadas = categoriasConEtiqueta;
    if (ordenGuardado) {
      const ordenadas = ordenGuardado
        .map((id) => categoriasConEtiqueta.find((c) => c._id === id))
        .filter(Boolean);
      const faltantes = categoriasConEtiqueta.filter(
        (c) => !ordenGuardado.includes(c._id)
      );
      categoriasOrdenadas = [...ordenadas, ...faltantes];
    }

    setProductos(resProd.data);
    setCategorias(categoriasOrdenadas);
    setProductosOrdenados(
      ordenarProductosPorCategorias(resProd.data, categoriasOrdenadas)
    );
  };

  useEffect(() => {
    cargarDatos();

    const handler = (e) => {
      if (e.key === `ordenCategorias_${userKey}`) cargarDatos();
    };

    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [selectedLocal?._id]);

  useEffect(() => {
    const comanda = location.state?.comandaPendiente;
    if (!comanda?._id || procesadasRef.current.has(comanda._id)) {
      return;
    }

    const items = (comanda.items || []).map((item) => ({
      productoId: item.productoId,
      nombre: item.nombre,
      precio: Number(item.precio_unitario) || 0,
      cantidad: Number(item.cantidad) || 1,
      observacion: item.nota || '',
      atributos: [],
      agregados: []
    }));

    if (items.length > 0) {
      cargarCarrito(items, true);
      setOpenCarrito(true);
      procesadasRef.current.add(comanda._id);
      navigate('/pos', { replace: true, state: {} });
    }
  }, [location.state, cargarCarrito, navigate]);

  const handleAgregar = (producto) => {
    if (tieneVariantes(producto)) {
      const variantesConStock = producto.variantes.filter((v) => varianteDisponible(v));
      if (variantesConStock.length === 0) {
        alert('Todas las variantes de este producto están agotadas.');
        return;
      }
      setProductoConVariantes({ ...producto, variantes: variantesConStock });
      return;
    }

    const agregadosActivos = Array.isArray(producto?.agregados)
      ? producto.agregados.filter((agg) => agg?.nombre && agg?.activo !== false)
      : [];

    if (agregadosActivos.length > 0) {
      setProductoConAgregados({ producto, variante: null });
      return;
    }

    agregarProducto(producto);
    setOpenCarrito(true);
  };

  const handleSeleccionVariante = (variante) => {
    if (!productoConVariantes) return;
    const agregadosActivos = Array.isArray(productoConVariantes?.agregados)
      ? productoConVariantes.agregados.filter((agg) => agg?.nombre && agg?.activo !== false)
      : [];

    if (agregadosActivos.length > 0) {
      setProductoConAgregados({ producto: productoConVariantes, variante });
      setProductoConVariantes(null);
      return;
    }

    agregarProducto(productoConVariantes, variante);
    setProductoConVariantes(null);
    setOpenCarrito(true);
  };

  const handleConfirmarAgregados = (agregadosSeleccionados = []) => {
    if (!productoConAgregados?.producto) return;
    agregarProducto(
      productoConAgregados.producto,
      productoConAgregados.variante || null,
      { agregados: agregadosSeleccionados }
    );
    setProductoConAgregados(null);
    setOpenCarrito(true);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(categorias);
    const [reordenado] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordenado);

    setCategorias(items);
    localStorage.setItem(
      `ordenCategorias_${userKey}`,
      JSON.stringify(items.map((c) => c._id))
    );
    setProductosOrdenados(
      ordenarProductosPorCategorias(productos, items)
    );
    setSnackbarOpen(true);
  };

  const resetOrden = () => {
    localStorage.removeItem(`ordenCategorias_${userKey}`);
    cargarDatos();
  };

  const busquedaLower = busqueda.trim().toLowerCase();

  const productosFiltrados = productosOrdenados.filter((prod) => {
    const coincideNombre = (prod.nombre || '')
      .toLowerCase()
      .includes(busquedaLower);
    const coincideVariante = tieneVariantes(prod)
      ? prod.variantes.some((vari) =>
          (vari.nombre || '')
            .toLowerCase()
            .includes(busquedaLower)
        )
      : false;

    const coincideCategoria = filtroCategoria
      ? prod.categoria?._id === filtroCategoria
      : true;

    const pasaBusqueda =
      busquedaLower === '' || coincideNombre || coincideVariante;

    return pasaBusqueda && coincideCategoria;
  });

  if (!cajaVerificada) {
    return (
      <Box
        sx={{
          mt: 6,
          px: 2,
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Typography variant="h6">
          Verificando estado de la caja...
        </Typography>
      </Box>
    );
  }

  if (!cajaAbierta) {
    return (
      <Box sx={{ mt: 6, px: 2 }}>
        <Card
          sx={{
            maxWidth: 420,
            mx: 'auto',
            textAlign: 'center',
            p: 3
          }}
        >
          <CardContent>
            <Typography variant="h5" gutterBottom>
              POS bloqueado
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              No puedes iniciar el POS si no abres la caja.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/caja')}
            >
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
        <Stack direction="row" spacing={1.5} alignItems="center">
          <ShoppingCartIcon sx={{ fontSize: 24 }} />
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ letterSpacing: 0.5 }}
            >
              Punto de Venta
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: descColor }}
            >
              Gestiona productos y tickets en tiempo real
            </Typography>
          </Box>
        </Stack>

        <BuscadorProducto
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          filtroCategoria={filtroCategoria}
          setFiltroCategoria={setFiltroCategoria}
          categorias={categorias}
        />

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="success"
            onClick={() => setOpenCrear(true)}
          >
            + Producto
          </Button>
          <Button
            variant="outlined"
            onClick={() => setOpenCarrito(true)}
          >
            Ver Carrito
          </Button>
        </Stack>
      </Box>

      {/* Grid de productos */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 2,
          alignItems: 'stretch'
        }}
      >
        {productosFiltrados.map((prod) => {
          const stockTotal = obtenerStockTotal(prod);
          const mostrarStock = stockTotal !== null;
          const agotado = tieneVariantes(prod)
            ? prod.variantes.every((vari) => varianteEstaAgotada(vari))
            : (mostrarStock ? stockTotal === 0 : false);
          const stockBajo =
            mostrarStock && !agotado && stockTotal <= MIN_STOCK_ALERT;

          const resumenVariantes = tieneVariantes(prod)
            ? prod.variantes.slice(0, 2)
            : [];

          const imagenSrc = prod.imagen_url?.startsWith('/uploads')
            ? `${BASE_URL}${prod.imagen_url}`
            : prod.imagen_url || '';

          const hayVariantes = tieneVariantes(prod);

          return (
            <Box
              key={prod._id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 1.25,
                  border: `1px solid ${cardBorderColor}`,
                  backgroundColor: cardBackground,
                  boxShadow:
                    '0 8px 24px rgba(15,23,42,0.12)',
                  p: 1.5,
                  minHeight: 280,
                  transition:
                    'transform 0.2s ease, border 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: theme.palette.primary.main,
                    boxShadow:
                      '0 16px 32px rgba(15,23,42,0.18)'
                  }
                }}
              >
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  pt: '55%',
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  overflow: 'hidden',
                  border: `1px solid ${thumbBorderColor}`,
                  backgroundColor: thumbBackground,
                  mb: 1.5
                }}
              >
                {imagenSrc ? (
                  isMobile ? (
                    <Box
                      component="img"
                      src={imagenSrc}
                      alt={prod.nombre}
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: agotado ? 'grayscale(1)' : 'none'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(imagenSrc, '_blank', 'noopener,noreferrer');
                      }}
                    />
                  ) : (
                    <Tooltip
                      title={
                        <Box
                          component="img"
                          src={imagenSrc}
                          alt={prod.nombre}
                          sx={{ width: 240, height: 240, objectFit: 'cover' }}
                        />
                      }
                      placement="top"
                      PopperProps={{
                        modifiers: [
                          {
                            name: 'offset',
                            options: {
                              offset: [0, -40]
                            }
                          }
                        ]
                      }}
                    >
                      <Box
                        component="img"
                        src={imagenSrc}
                        alt={prod.nombre}
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: agotado ? 'grayscale(1)' : 'none'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Tooltip>
                  )
                ) : (
                  <Stack
                    position="absolute"
                    inset={0}
                    alignItems="center"
                    justifyContent="center"
                    spacing={0.5}
                    sx={{
                      color: descColor,
                      fontSize: '0.75rem'
                    }}
                  >
                    <StorefrontIcon fontSize="small" />
                    <Typography variant="caption">
                      Sin imagen
                    </Typography>
                  </Stack>
                )}

                {agotado && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor:
                        'rgba(15,23,42,0.55)',
                      color: '#f87171',
                      fontWeight: 700,
                      letterSpacing: 1
                    }}
                  >
                    AGOTADO
                  </Box>
                )}
              </Box>

              <Box
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.75
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  sx={{
                    color: titleColor,
                    fontSize: '0.95rem'
                  }}
                >
                  {prod.nombre}
                </Typography>

                <Tooltip
                  title={prod.descripcion || 'Sin descripción'}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: descColor,
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {prod.descripcion || 'Sin descripción'}
                  </Typography>
                </Tooltip>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 0.5
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.palette.primary.main,
                      fontSize: '1rem'
                    }}
                  >
                    ${prod.precio.toLocaleString('es-CL')}
                  </Typography>

                  {mostrarStock ? (
                    <Typography
                      variant="caption"
                      sx={{
                        px: 1,
                        py: 0.2,
                        borderRadius: 6,
                        border: `1px solid ${cardBorderColor}`,
                        color: agotado
                          ? '#f87171'
                          : stockBajo
                            ? '#f59e0b'
                            : stockOkColor,
                        fontWeight: 600,
                        letterSpacing: 0.5
                      }}
                    >
                      {agotado
                        ? 'AGOTADO'
                        : stockBajo
                          ? `Stock bajo: ${stockTotal}`
                          : `Stock: ${stockTotal}`}
                    </Typography>
                  ) : (
                    <Typography
                      variant="caption"
                      sx={{
                        px: 1,
                        py: 0.2,
                        borderRadius: 6,
                        border: `1px solid ${cardBorderColor}`,
                        color: descColor,
                        fontWeight: 600,
                        letterSpacing: 0.5
                      }}
                    >
                      Stock libre
                    </Typography>
                  )}
                </Box>

                {hayVariantes && (
                  <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                    {resumenVariantes.map((vari) => {
                      const variStock = obtenerStockControlado(vari.stock);
                      const stockLabel = varianteEstaAgotada(vari)
                        ? 'AGOTADO'
                        : variStock === null
                          ? '∞'
                          : variStock;
                      return (
                        <Typography
                          key={`${prod._id}-${vari._id || vari.nombre}`}
                          variant="caption"
                          color={descColor}
                        >
                          {vari.nombre} - Stock {stockLabel}
                        </Typography>
                      );
                    })}
                    {prod.variantes.length >
                      resumenVariantes.length && (
                      <Typography
                        variant="caption"
                        color={descColor}
                      >
                        +{prod.variantes.length -
                          resumenVariantes.length}{' '}
                        variantes adicionales
                      </Typography>
                    )}
                  </Stack>
                )}
              </Box>

              <Button
                variant="contained"
                startIcon={
                  <AddShoppingCartIcon fontSize="small" />
                }
                disabled={agotado}
                onClick={() => handleAgregar(prod)}
                sx={{
                  mt: 2,
                  borderRadius: 1.25,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  background: agotado
                    ? 'rgba(148,163,184,0.3)'
                    : 'linear-gradient(135deg, #1e40af, #2563eb)',
                  color: '#fff',
                  '&:hover': {
                    background: agotado
                      ? 'rgba(148,163,184,0.4)'
                      : 'linear-gradient(135deg, #1d4ed8, #1e3a8a)'
                  }
                }}
              >
                {hayVariantes ? 'Elegir variante' : 'Agregar'}
              </Button>
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
          zIndex: 1500
        }}
      >
        <SettingsIcon />
      </Fab>

      {/* Drawer ordenar categorías */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: { width: isMobile ? '90%' : 320, p: 2 }
        }}
      >
        <Typography
          variant="h6"
          fontWeight={600}
          mb={2}
        >
          Ordenar Categorías
        </Typography>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="categorias-drawer">
            {(provided) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {categorias.map((cat, index) => (
                  <Draggable
                    key={cat._id}
                    draggableId={cat._id}
                    index={index}
                  >
                    {(providedDraggable) => (
                      <Box
                        ref={providedDraggable.innerRef}
                        {...providedDraggable.draggableProps}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor:
                            filtroCategoria === cat._id
                              ? 'primary.main'
                              : 'grey.200',
                          color:
                            filtroCategoria === cat._id
                              ? 'white'
                              : 'black',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 0.75,
                          mb: 1,
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                        onClick={() =>
                          setFiltroCategoria(cat._id)
                        }
                      >
                        <IconButton
                          {...providedDraggable.dragHandleProps}
                          size="small"
                        >
                          <DragIndicatorIcon fontSize="small" />
                        </IconButton>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                        >
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

      <ModalCrearProducto
        open={openCrear}
        onClose={() => setOpenCrear(false)}
        onCreado={cargarDatos}
      />
      <CarritoDrawer
        open={openCarrito}
        onClose={() => setOpenCarrito(false)}
        onVentaCompletada={cargarDatos}
      />
      <SelectorVariantes
        open={Boolean(productoConVariantes)}
        producto={productoConVariantes}
        onClose={() => setProductoConVariantes(null)}
        onSelect={handleSeleccionVariante}
      />
      <SelectorAgregadosDialog
        open={Boolean(productoConAgregados)}
        producto={productoConAgregados?.producto}
        variante={productoConAgregados?.variante}
        onClose={() => setProductoConAgregados(null)}
        onConfirm={handleConfirmarAgregados}
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
