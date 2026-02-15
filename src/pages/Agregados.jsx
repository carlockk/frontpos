import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import {
  crearAgregado,
  crearGrupoAgregados,
  editarAgregado,
  editarGrupoAgregados,
  eliminarAgregado,
  eliminarGrupoAgregados,
  obtenerAgregados,
  obtenerCategorias,
  obtenerGruposAgregados,
  obtenerProductos
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const emptyGrupo = { titulo: '', descripcion: '' };
const emptyAgregado = {
  nombre: '',
  descripcion: '',
  precio: '',
  grupo: '',
  categorias: [],
  productos: []
};

export default function Agregados() {
  const { usuario, selectedLocal } = useAuth();
  const puedeCrearEditar = ['admin', 'superadmin', 'cajero'].includes(usuario?.rol);
  const puedeEliminar = ['admin', 'superadmin'].includes(usuario?.rol);

  const [grupos, setGrupos] = useState([]);
  const [agregados, setAgregados] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [grupoOpen, setGrupoOpen] = useState(false);
  const [grupoForm, setGrupoForm] = useState(emptyGrupo);
  const [grupoEditId, setGrupoEditId] = useState('');

  const [agregadoOpen, setAgregadoOpen] = useState(false);
  const [agregadoForm, setAgregadoForm] = useState(emptyAgregado);
  const [agregadoEditId, setAgregadoEditId] = useState('');

  const productosOptions = useMemo(
    () =>
      productos.map((p) => ({
        _id: p._id,
        nombre: p.nombre || p.productoBase?.nombre || 'Producto'
      })),
    [productos]
  );

  const cargar = async () => {
    setError('');
    try {
      const [gruposRes, agregadosRes, categoriasRes, productosRes] = await Promise.all([
        obtenerGruposAgregados(),
        obtenerAgregados(),
        obtenerCategorias(),
        obtenerProductos()
      ]);
      setGrupos(gruposRes.data || []);
      setAgregados(agregadosRes.data || []);
      setCategorias(categoriasRes.data || []);
      setProductos(productosRes.data || []);
    } catch (err) {
      setError('No se pudo cargar agregados.');
    }
  };

  useEffect(() => {
    cargar();
  }, [selectedLocal?._id]);

  const openCrearGrupo = () => {
    setGrupoEditId('');
    setGrupoForm(emptyGrupo);
    setGrupoOpen(true);
  };

  const openEditarGrupo = (grupo) => {
    setGrupoEditId(grupo._id);
    setGrupoForm({ titulo: grupo.titulo || '', descripcion: grupo.descripcion || '' });
    setGrupoOpen(true);
  };

  const guardarGrupo = async () => {
    if (!grupoForm.titulo.trim()) {
      setError('El titulo del grupo es obligatorio.');
      return;
    }
    try {
      if (grupoEditId) {
        await editarGrupoAgregados(grupoEditId, grupoForm);
        setInfo('Grupo actualizado.');
      } else {
        await crearGrupoAgregados(grupoForm);
        setInfo('Grupo creado.');
      }
      setGrupoOpen(false);
      setGrupoForm(emptyGrupo);
      setGrupoEditId('');
      cargar();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo guardar el grupo.');
    }
  };

  const borrarGrupo = async (id) => {
    if (!puedeEliminar) return;
    if (!window.confirm('Seguro que deseas eliminar este grupo?')) return;
    try {
      await eliminarGrupoAgregados(id);
      setInfo('Grupo eliminado.');
      cargar();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo eliminar el grupo.');
    }
  };

  const openCrearAgregado = () => {
    setAgregadoEditId('');
    setAgregadoForm(emptyAgregado);
    setAgregadoOpen(true);
  };

  const openEditarAgregado = (agregado) => {
    setAgregadoEditId(agregado._id);
    setAgregadoForm({
      nombre: agregado.nombre || '',
      descripcion: agregado.descripcion || '',
      precio:
        agregado.precio === null || agregado.precio === undefined ? '' : String(agregado.precio),
      grupo: agregado.grupo?._id || '',
      categorias: (agregado.categorias || []).map((c) => c._id || c),
      productos: (agregado.productos || []).map((p) => p._id || p)
    });
    setAgregadoOpen(true);
  };

  const guardarAgregado = async () => {
    if (!agregadoForm.nombre.trim()) {
      setError('El nombre del agregado es obligatorio.');
      return;
    }
    const payload = {
      nombre: agregadoForm.nombre.trim(),
      descripcion: agregadoForm.descripcion.trim(),
      precio: agregadoForm.precio === '' ? null : Number(agregadoForm.precio),
      grupo: agregadoForm.grupo || null,
      categorias: agregadoForm.categorias || [],
      productos: agregadoForm.productos || []
    };
    try {
      if (agregadoEditId) {
        await editarAgregado(agregadoEditId, payload);
        setInfo('Agregado actualizado.');
      } else {
        await crearAgregado(payload);
        setInfo('Agregado creado.');
      }
      setAgregadoOpen(false);
      setAgregadoForm(emptyAgregado);
      setAgregadoEditId('');
      cargar();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo guardar el agregado.');
    }
  };

  const borrarAgregado = async (id) => {
    if (!puedeEliminar) return;
    if (!window.confirm('Seguro que deseas eliminar este agregado?')) return;
    try {
      await eliminarAgregado(id);
      setInfo('Agregado eliminado.');
      cargar();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo eliminar el agregado.');
    }
  };

  return (
    <Box sx={{ mt: 2, px: 1 }}>
      <Paper elevation={0} sx={{ p: 3, backgroundColor: 'transparent', boxShadow: 'none' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h5" gutterBottom>Agregados</Typography>
            <Typography variant="body2" color="text.secondary">
              Crea extras y asocialos por producto o categoria.
            </Typography>
          </Box>
          {puedeCrearEditar && (
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={openCrearGrupo}>Crear grupo</Button>
              <Button variant="contained" onClick={openCrearAgregado}>Crear agregado</Button>
            </Stack>
          )}
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {info && <Alert severity="success" sx={{ mb: 2 }}>{info}</Alert>}

        <Typography variant="subtitle1" sx={{ mb: 1 }}>Grupos</Typography>
        <Table size="small" sx={{ mb: 3 }}>
          <TableHead>
            <TableRow>
              <TableCell>Titulo</TableCell>
              <TableCell>Descripcion</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {grupos.length === 0 ? (
              <TableRow><TableCell colSpan={3} align="center">Sin grupos</TableCell></TableRow>
            ) : (
              grupos.map((grupo) => (
                <TableRow key={grupo._id}>
                  <TableCell>{grupo.titulo}</TableCell>
                  <TableCell>{grupo.descripcion || '-'}</TableCell>
                  <TableCell align="right">
                    {puedeCrearEditar && (
                      <IconButton size="small" onClick={() => openEditarGrupo(grupo)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {puedeEliminar && (
                      <IconButton size="small" color="error" onClick={() => borrarGrupo(grupo._id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Typography variant="subtitle1" sx={{ mb: 1 }}>Agregados</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Grupo</TableCell>
              <TableCell>Precio</TableCell>
              <TableCell>Categorias</TableCell>
              <TableCell>Productos</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {agregados.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center">Sin agregados</TableCell></TableRow>
            ) : (
              agregados.map((agregado) => (
                <TableRow key={agregado._id}>
                  <TableCell>{agregado.nombre}</TableCell>
                  <TableCell>{agregado.grupo?.titulo || '-'}</TableCell>
                  <TableCell>{agregado.precio === null || agregado.precio === undefined ? '-' : agregado.precio}</TableCell>
                  <TableCell>{(agregado.categorias || []).map((c) => c.nombre).join(', ') || '-'}</TableCell>
                  <TableCell>
                    {(agregado.productos || [])
                      .map((p) => p?.productoBase?.nombre || p?.nombre)
                      .filter(Boolean)
                      .join(', ') || '-'}
                  </TableCell>
                  <TableCell align="right">
                    {puedeCrearEditar && (
                      <IconButton size="small" onClick={() => openEditarAgregado(agregado)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {puedeEliminar && (
                      <IconButton size="small" color="error" onClick={() => borrarAgregado(agregado._id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={grupoOpen} onClose={() => setGrupoOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{grupoEditId ? 'Editar grupo' : 'Crear grupo'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Titulo"
              value={grupoForm.titulo}
              onChange={(e) => setGrupoForm((prev) => ({ ...prev, titulo: e.target.value }))}
            />
            <TextField
              label="Descripcion"
              value={grupoForm.descripcion}
              onChange={(e) => setGrupoForm((prev) => ({ ...prev, descripcion: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGrupoOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardarGrupo}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={agregadoOpen} onClose={() => setAgregadoOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{agregadoEditId ? 'Editar agregado' : 'Crear agregado'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre"
              value={agregadoForm.nombre}
              onChange={(e) => setAgregadoForm((prev) => ({ ...prev, nombre: e.target.value }))}
            />
            <TextField
              label="Descripcion"
              value={agregadoForm.descripcion}
              onChange={(e) => setAgregadoForm((prev) => ({ ...prev, descripcion: e.target.value }))}
            />
            <TextField
              label="Precio (opcional)"
              type="number"
              value={agregadoForm.precio}
              onChange={(e) => setAgregadoForm((prev) => ({ ...prev, precio: e.target.value }))}
            />
            <TextField
              select
              label="Grupo (opcional)"
              value={agregadoForm.grupo}
              onChange={(e) => setAgregadoForm((prev) => ({ ...prev, grupo: e.target.value }))}
            >
              <MenuItem value="">Sin grupo</MenuItem>
              {grupos.map((g) => (
                <MenuItem key={g._id} value={g._id}>{g.titulo}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              SelectProps={{ multiple: true }}
              label="Categorias asociadas"
              value={agregadoForm.categorias}
              onChange={(e) => setAgregadoForm((prev) => ({ ...prev, categorias: e.target.value }))}
            >
              {categorias.map((c) => (
                <MenuItem key={c._id} value={c._id}>{c.nombre}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              SelectProps={{ multiple: true }}
              label="Productos asociados"
              value={agregadoForm.productos}
              onChange={(e) => setAgregadoForm((prev) => ({ ...prev, productos: e.target.value }))}
            >
              {productosOptions.map((p) => (
                <MenuItem key={p._id} value={p._id}>{p.nombre}</MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAgregadoOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardarAgregado}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
