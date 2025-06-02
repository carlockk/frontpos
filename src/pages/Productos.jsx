import { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell,
  TableBody, Paper, IconButton, Dialog, DialogTitle,
  DialogActions, Button, useTheme, Pagination, Stack
} from '@mui/material';
import {
  obtenerProductos,
  eliminarProducto,
  obtenerCategorias
} from '../services/api';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ModalEditarProducto from '../components/ModalEditarProducto';
import BuscadorProducto from '../components/BuscadorProducto';

// ✅ Cambiar BASE_URL usando .env (VITE_BACKEND_URL)
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function Productos() {
  const theme = useTheme();

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openEditar, setOpenEditar] = useState(false);

  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [stockMin, setStockMin] = useState('');

  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 10;

  const cargarDatos = async () => {
    try {
      const [resProductos, resCategorias] = await Promise.all([
        obtenerProductos(),
        obtenerCategorias()
      ]);
      setProductos(resProductos.data);
      setCategorias(resCategorias.data);
    } catch (err) {
      console.error('❌ Error al cargar productos/categorías:', err);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleEliminar = async () => {
    try {
      await eliminarProducto(productoSeleccionado._id);
      setOpenConfirm(false);
      setProductoSeleccionado(null);
      cargarDatos();
    } catch (err) {
      alert('❌ Error al eliminar producto');
    }
  };

  const productosFiltrados = productos.filter((prod) => {
    const nombreOk = prod.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const categoriaOk = filtroCategoria ? prod.categoria && prod.categoria._id === filtroCategoria : true;
    const precioOk = (!precioMin || prod.precio >= parseFloat(precioMin)) &&
                     (!precioMax || prod.precio <= parseFloat(precioMax));
    const stockOk = !stockMin || (prod.stock ?? 0) >= parseInt(stockMin);
    return nombreOk && categoriaOk && precioOk && stockOk;
  });

  const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);
  const productosEnPagina = productosFiltrados.slice(
    (paginaActual - 1) * productosPorPagina,
    paginaActual * productosPorPagina
  );

  const handleCambioPagina = (evento, nuevaPagina) => {
    setPaginaActual(nuevaPagina);
  };

  return (
    <Box sx={{ mt: 4, px: 2 }}>
      <Typography variant="h4" gutterBottom>📦 Lista de Productos</Typography>

      <BuscadorProducto
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        filtroCategoria={filtroCategoria}
        setFiltroCategoria={setFiltroCategoria}
        categorias={categorias}
        precioMin={precioMin}
        setPrecioMin={setPrecioMin}
        precioMax={precioMax}
        setPrecioMax={setPrecioMax}
        stockMin={stockMin}
        setStockMin={setStockMin}
      />

      <Paper sx={{ width: '100%', overflowX: 'auto' }}>
        <Table>
          <TableHead sx={{ backgroundColor: theme.palette.background.paper }}>
            <TableRow>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>Precio</strong></TableCell>
              <TableCell><strong>Descripción</strong></TableCell>
              <TableCell><strong>Categoría</strong></TableCell>
              <TableCell><strong>Stock</strong></TableCell>
              <TableCell><strong>Imagen</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {productosEnPagina.map((prod) => (
              <TableRow key={prod._id} hover>
                <TableCell>{prod.nombre}</TableCell>
                <TableCell>${prod.precio.toLocaleString()}</TableCell>
                <TableCell>{prod.descripcion || '—'}</TableCell>
                <TableCell>{prod.categoria?.nombre || '—'}</TableCell>
                <TableCell>{typeof prod.stock === 'number' && prod.stock >= 0 ? prod.stock : '—'}</TableCell>
                <TableCell>
                  {prod.imagen_url ? (
                    <Box
                      sx={{
                        width: 60, height: 60, overflow: 'hidden',
                        borderRadius: '6px', border: '4px solid white',
                        boxShadow: '0 0 4px rgba(0,0,0,0.3)',
                        backgroundColor: '#f4f4f4'
                      }}
                    >
                      <img
                        src={prod.imagen_url.startsWith('/uploads')
                          ? `${BASE_URL}${prod.imagen_url}`
                          : prod.imagen_url}
                        alt={prod.nombre}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                  ) : 'Sin imagen'}
                </TableCell>
                <TableCell align="center">
                  <IconButton color="primary" size="small" onClick={() => {
                    setProductoSeleccionado({ ...prod });
                    setOpenEditar(true);
                  }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" size="small" onClick={() => {
                    setProductoSeleccionado(prod);
                    setOpenConfirm(true);
                  }}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {productosFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No hay productos coincidentes.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {totalPaginas > 1 && (
        <Stack spacing={2} alignItems="center" sx={{ mt: 3 }}>
          <Pagination
            count={totalPaginas}
            page={paginaActual}
            onChange={handleCambioPagina}
            color="primary"
          />
        </Stack>
      )}

      <Dialog
        open={openConfirm}
        onClose={() => {
          setOpenConfirm(false);
          setProductoSeleccionado(null);
        }}
      >
        <DialogTitle>
          ¿Eliminar producto "{productoSeleccionado?.nombre || ''}"?
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleEliminar} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>

      <ModalEditarProducto
        open={openEditar}
        onClose={() => {
          setOpenEditar(false);
          setProductoSeleccionado(null);
        }}
        producto={productoSeleccionado}
        onActualizado={cargarDatos}
      />
    </Box>
  );
}
