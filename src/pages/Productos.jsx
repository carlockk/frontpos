import { useEffect, useState, Fragment } from 'react';

import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  Button,
  useTheme,
  Pagination,
  Stack,
  Chip,
  Collapse
} from '@mui/material';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import {
  obtenerProductos,
  eliminarProducto,
  obtenerCategorias,
  FILES_BASE,
} from '../services/api';

import ModalEditarProducto from '../components/ModalEditarProducto';
import BuscadorProducto from '../components/BuscadorProducto';

const BASE_URL = FILES_BASE;

export default function Productos() {
  const theme = useTheme();

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openEditar, setOpenEditar] = useState(false);
  const [detalleAbierto, setDetalleAbierto] = useState(null);
  const [productoStockModal, setProductoStockModal] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [stockMin, setStockMin] = useState('');

  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 10;

  const tieneVariantes = (prod) =>
    Array.isArray(prod?.variantes) && prod.variantes.length > 0;

  const obtenerStockTotal = (prod) => {
    // Si viene el virtual desde la API, úsalo
    if (typeof prod.stock_total === 'number') return prod.stock_total;

    // Si hay variantes, suma sus stocks
    if (Array.isArray(prod.variantes) && prod.variantes.length > 0) {
      return prod.variantes.reduce(
        (acc, vari) => acc + (Number(vari.stock) || 0),
        0
      );
    }

    // Si no hay variantes, usa stock base
    return Number(prod.stock) || 0;
  };

  const cargarDatos = async () => {
    const [resProd, resCat] = await Promise.all([
      obtenerProductos(),
      obtenerCategorias()
    ]);

    const productosOrdenados = ordenarProductosPorCategoria(
      resProd.data,
      resCat.data
    );

    setProductos(productosOrdenados);
    setCategorias(resCat.data);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const ordenarProductosPorCategoria = (prods, cats) => {
    const ordenIds = cats.map((c) => c._id);
    const ordenados = [];

    ordenIds.forEach((catId) => {
      prods
        .filter((p) => p.categoria?._id === catId)
        .forEach((p) => ordenados.push(p));
    });

    return ordenados;
  };

  const handleEliminarClick = (producto) => {
    setProductoSeleccionado(producto);
    setOpenConfirm(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!productoSeleccionado) return;

    await eliminarProducto(productoSeleccionado._id);
    setOpenConfirm(false);
    setProductoSeleccionado(null);
    cargarDatos();
  };

  const handleEditarClick = (producto) => {
    setProductoSeleccionado(producto);
    setOpenEditar(true);
  };

  const handleCerrarEditar = () => {
    setOpenEditar(false);
    setProductoSeleccionado(null);
  };

  const toggleDetalle = (id) => {
    setDetalleAbierto((prev) => (prev === id ? null : id));
  };

  const filtrarProductos = productos.filter((prod) => {
    const nombreOk = prod.nombre
      .toLowerCase()
      .includes(busqueda.toLowerCase().trim());

    const categoriaOk =
      !filtroCategoria || prod.categoria?._id === filtroCategoria;

    const stockTotal = obtenerStockTotal(prod);

    const precioOk =
      (!precioMin || prod.precio >= Number(precioMin)) &&
      (!precioMax || prod.precio <= Number(precioMax));

    const stockOk = !stockMin || stockTotal >= Number(stockMin);

    return nombreOk && categoriaOk && precioOk && stockOk;
  });

  const totalPaginas = Math.ceil(filtrarProductos.length / productosPorPagina);
  const productosEnPagina = filtrarProductos.slice(
    (paginaActual - 1) * productosPorPagina,
    paginaActual * productosPorPagina
  );

  const handleCambioPagina = (_evento, nuevaPagina) => {
    setPaginaActual(nuevaPagina);
  };

  return (
    <Box sx={{ mt: 4, px: 2 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: 'bold', mb: 3 }}
      >
        Gestión de Productos
      </Typography>

      {/* Filtros y buscador */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <BuscadorProducto
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          categorias={categorias}
          filtroCategoria={filtroCategoria}
          setFiltroCategoria={setFiltroCategoria}
          precioMin={precioMin}
          setPrecioMin={setPrecioMin}
          precioMax={precioMax}
          setPrecioMax={setPrecioMax}
          stockMin={stockMin}
          setStockMin={setStockMin}
        />
      </Paper>

      {/* Tabla de productos */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Nombre</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Imagen</TableCell>
              <TableCell align="right">Precio</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {productosEnPagina.map((prod) => {
              const hayVariantes = tieneVariantes(prod);
              const stockTotal = obtenerStockTotal(prod);
              const totalVisible = stockTotal;

              return (
                <Fragment key={prod._id}>
                  <TableRow hover>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => toggleDetalle(prod._id)}
                      >
                        {detalleAbierto === prod._id ? (
                          <KeyboardArrowUpIcon />
                        ) : (
                          <KeyboardArrowDownIcon />
                        )}
                      </IconButton>
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography>{prod.nombre}</Typography>
                        {hayVariantes && (
                          <Chip
                            label="Con variantes"
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </TableCell>

                    <TableCell>{prod.categoria?.nombre || '-'}</TableCell>

                    <TableCell>
                      {hayVariantes ? (
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ flexWrap: 'wrap' }}
                        >
                          <Typography fontWeight="bold">
                            Total: {totalVisible}
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setProductoStockModal(prod)}
                          >
                            Ver por variante
                          </Button>
                        </Stack>
                      ) : (
                        <Typography>{stockTotal}</Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      {prod.imagen_url ? (
                        <Box
                          sx={{
                            width: 60,
                            height: 60,
                            overflow: 'hidden',
                            borderRadius: '6px',
                            border: '4px solid white',
                            boxShadow: '0 0 4px rgba(0,0,0,0.3)',
                            backgroundColor: '#f4f4f4'
                          }}
                        >
                          <Box
                            component="img"
                            src={
                              prod.imagen_url.startsWith('/uploads')
                                ? `${BASE_URL}${prod.imagen_url}`
                                : prod.imagen_url
                            }
                            alt={prod.nombre}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </Box>
                      ) : (
                        <Typography color="text.secondary">
                          Sin imagen
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell align="right">
                      ${prod.precio.toLocaleString('es-CL')}
                    </TableCell>

                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleEditarClick(prod)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleEliminarClick(prod)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>

                  {/* Detalle colapsable */}
                  <TableRow>
                    <TableCell
                      style={{ paddingBottom: 0, paddingTop: 0 }}
                      colSpan={7}
                    >
                      <Collapse
                        in={detalleAbierto === prod._id}
                        timeout="auto"
                        unmountOnExit
                      >
                        <Box margin={2}>
                          <Typography variant="subtitle1" gutterBottom>
                            Detalles
                          </Typography>
                          {hayVariantes ? (
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Nombre</TableCell>
                                  <TableCell>Color / Talla</TableCell>
                                  <TableCell align="right">Stock</TableCell>
                                  <TableCell align="right">Precio</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {prod.variantes.map((vari, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{vari.nombre}</TableCell>
                                    <TableCell>
                                      {[
                                        vari.color,
                                        vari.talla
                                      ]
                                        .filter(Boolean)
                                        .join(' / ') || 'Sin atributos'}
                                    </TableCell>
                                    <TableCell align="right">
                                      {Number(vari.stock) || 0}
                                    </TableCell>
                                    <TableCell align="right">
                                      {vari.precio
                                        ? `$${vari.precio.toLocaleString(
                                            'es-CL'
                                          )}`
                                        : '-'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <Typography color="text.secondary">
                              Producto sin variantes.
                            </Typography>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              );
            })}
          </TableBody>
        </Table>

        {/* Paginación */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={totalPaginas || 1}
            page={paginaActual}
            onChange={handleCambioPagina}
            color="primary"
          />
        </Box>
      </Paper>

      {/* Modal de confirmación de eliminación */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>Eliminar producto</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el producto{' '}
            <strong>{productoSeleccionado?.nombre}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>Cancelar</Button>
          <Button color="error" onClick={handleConfirmarEliminar}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de edición */}
      <ModalEditarProducto
        open={openEditar}
        onClose={handleCerrarEditar}
        producto={productoSeleccionado}
        onActualizado={cargarDatos}
      />

      {/* Modal stock por variante */}
      <Dialog
        open={Boolean(productoStockModal)}
        onClose={() => setProductoStockModal(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Stock por variante
          {productoStockModal
            ? ` - ${productoStockModal.nombre}`
            : ''}
        </DialogTitle>
        <DialogContent dividers>
          {productoStockModal?.variantes &&
          productoStockModal.variantes.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Variante</TableCell>
                  <TableCell>Color / Talla</TableCell>
                  <TableCell align="right">Stock</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productoStockModal.variantes.map((vari) => (
                  <TableRow key={vari._id || vari.nombre}>
                    <TableCell>{vari.nombre}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Typography variant="body2">
                          {[
                            vari.color,
                            vari.talla
                          ]
                            .filter(Boolean)
                            .join(' / ') || 'Sin atributos'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      {Number(vari.stock) || 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography color="text.secondary">
              Este producto no tiene variantes configuradas.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductoStockModal(null)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
