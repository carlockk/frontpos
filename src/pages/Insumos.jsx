import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
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
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tabs,
  Tab,
  useMediaQuery,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RestoreIcon from '@mui/icons-material/Restore';
import DatePicker from 'react-multi-date-picker';
import { useTheme } from '@mui/material/styles';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuth } from '../context/AuthContext';
import InsumoDialog from './insumos/InsumoDialog';
import MovimientoDialog from './insumos/MovimientoDialog';
import {
  obtenerInsumos,
  eliminarInsumo,
  actualizarEstadoInsumo,
  obtenerLocales,
  obtenerUsuarios,
  obtenerLotesInsumo,
  eliminarLoteInsumo,
  eliminarLotesInsumo,
  actualizarEstadoLoteInsumo,
  obtenerMovimientosInsumo,
  obtenerMovimientosInsumos,
  obtenerConfigAlertasInsumos,
  guardarConfigAlertasInsumos,
  enviarResumenAlertasInsumos,
  clonarInsumos,
  actualizarOrdenInsumos,
  obtenerCategoriasInsumo,
  crearCategoriaInsumo,
  editarCategoriaInsumo,
  eliminarCategoriaInsumo,
  actualizarOrdenCategoriasInsumo
} from '../services/api';

const estadoVencimiento = (lote, alertaDias) => {
  if (!lote?.fecha_vencimiento) return 'normal';
  const hoy = new Date();
  const venc = new Date(lote.fecha_vencimiento);
  if (Number.isNaN(venc.getTime())) return 'normal';
  const diff = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'vencido';
  if (diff <= alertaDias) return 'por_vencer';
  return 'normal';
};

export default function Insumos() {
  const { usuario, selectedLocal } = useAuth();
  const isAdmin = usuario?.rol === 'admin' || usuario?.rol === 'superadmin';
  const puedeEditar = isAdmin || usuario?.rol === 'cajero';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [lotesOpen, setLotesOpen] = useState(false);
  const [lotesInsumo, setLotesInsumo] = useState(null);
  const [lotes, setLotes] = useState([]);
  const [loteDeleteLoading, setLoteDeleteLoading] = useState(false);
  const [mostrarLotesOcultos, setMostrarLotesOcultos] = useState(false);

  const [movOpen, setMovOpen] = useState(false);
  const [movimientos, setMovimientos] = useState([]);
  const [movInsumo, setMovInsumo] = useState(null);
  const [movTipoFijo, setMovTipoFijo] = useState(false);
  const [movTab, setMovTab] = useState('entrada');
  const [movBusqueda, setMovBusqueda] = useState('');
  const [movFechas, setMovFechas] = useState([]);
  const [histOpen, setHistOpen] = useState(false);
  const [histInsumoId, setHistInsumoId] = useState('');
  const [histMovimientos, setHistMovimientos] = useState([]);
  const [histTab, setHistTab] = useState('entrada');
  const [histBusqueda, setHistBusqueda] = useState('');
  const [histFechas, setHistFechas] = useState([]);
  const [soloBajoMinimo, setSoloBajoMinimo] = useState(false);
  const [mostrarInsumosOcultos, setMostrarInsumosOcultos] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertUsers, setAlertUsers] = useState([]);
  const [alertSeleccionados, setAlertSeleccionados] = useState([]);
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertSaving, setAlertSaving] = useState(false);
  const [alertSending, setAlertSending] = useState(false);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [cloneLocales, setCloneLocales] = useState([]);
  const [cloneTarget, setCloneTarget] = useState('');
  const [cloneMode, setCloneMode] = useState('all');
  const [cloneInsumo, setCloneInsumo] = useState(null);
  const [cloneLoading, setCloneLoading] = useState(false);
  const [ordenando, setOrdenando] = useState(false);
  const [categoriasInsumo, setCategoriasInsumo] = useState([]);
  const [categoriaDialogOpen, setCategoriaDialogOpen] = useState(false);
  const [categoriaNombre, setCategoriaNombre] = useState('');
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [categoriaOrdenando, setCategoriaOrdenando] = useState(false);
  const [tabCategoria, setTabCategoria] = useState('todas');
  const [ordenarTabs, setOrdenarTabs] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [descTexto, setDescTexto] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);
  const tableContainerRef = useRef(null);

  const handleShowDesc = (texto) => {
    setDescTexto(texto);
    setDescOpen(true);
  };

  const fetchInsumos = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await obtenerInsumos({
        incluir_ocultos: mostrarInsumosOcultos ? 'true' : 'false'
      });
      setInsumos(res.data || []);
    } catch (err) {
      setError('No se pudieron cargar los insumos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsumos();
  }, [selectedLocal?._id, mostrarInsumosOcultos]);

  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const res = await obtenerCategoriasInsumo();
        setCategoriasInsumo(res.data || []);
      } catch {
        setCategoriasInsumo([]);
      }
    };
    cargarCategorias();
  }, [selectedLocal?._id]);

  useEffect(() => {
    const cargarLocales = async () => {
      if (usuario?.rol !== 'superadmin') return;
      try {
        const res = await obtenerLocales();
        setCloneLocales(res.data || []);
      } catch {
        setCloneLocales([]);
      }
    };
    cargarLocales();
  }, [usuario?.rol]);

  const handleOcultarInsumo = async (insumoId, activo) => {
    try {
      await actualizarEstadoInsumo(insumoId, { activo });
      fetchInsumos();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo actualizar el insumo.');
    }
  };

  const openCreate = () => {
    setEditingInsumo(null);
    setDialogOpen(true);
    setError('');
    setInfo('');
  };

  const openAlertas = async () => {
    setAlertOpen(true);
    setAlertLoading(true);
    setError('');
    try {
      const [usuariosRes, configRes] = await Promise.all([
        obtenerUsuarios(),
        obtenerConfigAlertasInsumos()
      ]);
      setAlertUsers(usuariosRes.data || []);
      setAlertSeleccionados(configRes.data?.usuarios || []);
    } catch (err) {
      setError('No se pudieron cargar los usuarios para alertas.');
    } finally {
      setAlertLoading(false);
    }
  };

  const handleGuardarAlertas = async () => {
    try {
      setAlertSaving(true);
      await guardarConfigAlertasInsumos({ usuarios: alertSeleccionados });
      setInfo('Alertas configuradas.');
      setAlertOpen(false);
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo guardar la configuracion.');
    } finally {
      setAlertSaving(false);
    }
  };

  const handleEnviarResumen = async () => {
    try {
      setAlertSending(true);
      await enviarResumenAlertasInsumos();
      setInfo('Resumen enviado.');
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo enviar el resumen.');
    } finally {
      setAlertSending(false);
    }
  };

  const openCloneAll = () => {
    setCloneMode('all');
    setCloneInsumo(null);
    setCloneTarget('');
    setCloneOpen(true);
  };

  const openCloneOne = (insumo) => {
    setCloneMode('single');
    setCloneInsumo(insumo);
    setCloneTarget('');
    setCloneOpen(true);
  };

  const handleClone = async () => {
    if (!selectedLocal?._id) {
      setError('Selecciona un local de origen.');
      return;
    }
    if (!cloneTarget) {
      setError('Selecciona un local destino.');
      return;
    }
    try {
      setCloneLoading(true);
      const payload = {
        sourceLocalId: selectedLocal._id,
        targetLocalId: cloneTarget,
        clonarTodos: cloneMode === 'all'
      };
      if (cloneMode === 'single' && cloneInsumo?._id) {
        payload.insumoId = cloneInsumo._id;
      }
      const res = await clonarInsumos(payload);
      setInfo(res.data?.mensaje || 'Clonado completado.');
      setCloneOpen(false);
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo clonar el insumo.');
    } finally {
      setCloneLoading(false);
    }
  };

  const handleOrdenar = async (result) => {
    if (!result.destination) return;
    if (!isAdmin) return;
    const items = Array.from(insumos);
    const [reordenado] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordenado);
    setInsumos(items);
    try {
      setOrdenando(true);
      await actualizarOrdenInsumos({ orden: items.map((i) => i._id) });
      setInfo('Orden actualizado.');
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo actualizar el orden.');
    } finally {
      setOrdenando(false);
    }
  };

  const openCategorias = () => {
    setCategoriaDialogOpen(true);
    setCategoriaEditando(null);
    setCategoriaNombre('');
  };

  const handleGuardarCategoria = async () => {
    if (!categoriaNombre.trim()) {
      setError('Ingresa un nombre de categoria.');
      return;
    }
    try {
      if (categoriaEditando) {
        await editarCategoriaInsumo(categoriaEditando._id, {
          nombre: categoriaNombre.trim()
        });
      } else {
        await crearCategoriaInsumo({ nombre: categoriaNombre.trim() });
      }
      const res = await obtenerCategoriasInsumo();
      setCategoriasInsumo(res.data || []);
      setCategoriaNombre('');
      setCategoriaEditando(null);
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo guardar la categoria.');
    }
  };

  const handleEditarCategoria = (categoria) => {
    setCategoriaEditando(categoria);
    setCategoriaNombre(categoria.nombre || '');
  };

  const handleEliminarCategoria = async (categoria) => {
    const confirmar = window.confirm('Seguro que deseas eliminar esta categoria?');
    if (!confirmar) return;
    try {
      await eliminarCategoriaInsumo(categoria._id);
      const res = await obtenerCategoriasInsumo();
      setCategoriasInsumo(res.data || []);
      if (tabCategoria === categoria._id) {
        setTabCategoria('todas');
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo eliminar la categoria.');
    }
  };

  const handleOrdenCategorias = async (result) => {
    if (!result.destination) return;
    if (!isAdmin) return;
    const items = Array.from(categoriasInsumo);
    const [reordenado] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordenado);
    setCategoriasInsumo(items);
    try {
      setCategoriaOrdenando(true);
      await actualizarOrdenCategoriasInsumo({ orden: items.map((c) => c._id) });
      setInfo('Categorias ordenadas.');
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo ordenar las categorias.');
    } finally {
      setCategoriaOrdenando(false);
    }
  };

  const openEdit = (insumo) => {
    setEditingInsumo(insumo);
    setDialogOpen(true);
    setError('');
    setInfo('');
  };

  const confirmDelete = (insumo) => {
    setDeleteTarget(insumo);
    setError('');
    setInfo('');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await eliminarInsumo(deleteTarget._id);
      setInfo('Insumo eliminado.');
      setDeleteTarget(null);
      fetchInsumos();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo eliminar el insumo.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openLotes = async (insumo) => {
    try {
      const res = await obtenerLotesInsumo(insumo._id, {
        incluir_ocultos: mostrarLotesOcultos ? 'true' : 'false'
      });
      setLotes(res.data || []);
      setLotesInsumo(insumo);
      setLotesOpen(true);
    } catch (err) {
      setError('No se pudieron cargar los lotes.');
    }
  };

  const recargarLotes = async (insumoId, incluirOcultos) => {
    const res = await obtenerLotesInsumo(insumoId, {
      incluir_ocultos: incluirOcultos ? 'true' : 'false'
    });
    setLotes(res.data || []);
  };

  const handleEliminarLote = async (loteId) => {
    if (!lotesInsumo) return;
    const confirmar = window.confirm('Seguro que deseas eliminar este lote?');
    if (!confirmar) return;
    try {
      setLoteDeleteLoading(true);
      await eliminarLoteInsumo(lotesInsumo._id, loteId);
      await recargarLotes(lotesInsumo._id, mostrarLotesOcultos);
      fetchInsumos();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo eliminar el lote.');
    } finally {
      setLoteDeleteLoading(false);
    }
  };

  const handleOcultarLote = async (loteId, activo) => {
    if (!lotesInsumo) return;
    try {
      setLoteDeleteLoading(true);
      await actualizarEstadoLoteInsumo(lotesInsumo._id, loteId, { activo });
      await recargarLotes(lotesInsumo._id, mostrarLotesOcultos);
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo actualizar el lote.');
    } finally {
      setLoteDeleteLoading(false);
    }
  };

  const handleEliminarTodosLotes = async () => {
    if (!lotesInsumo) return;
    const confirmar = window.confirm('Seguro que deseas eliminar todos los lotes?');
    if (!confirmar) return;
    try {
      setLoteDeleteLoading(true);
      await eliminarLotesInsumo(lotesInsumo._id);
      setLotes([]);
      fetchInsumos();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudieron eliminar los lotes.');
    } finally {
      setLoteDeleteLoading(false);
    }
  };

  const openMovimientos = async (insumo) => {
    try {
      const res = await obtenerMovimientosInsumo(insumo._id);
      setMovimientos(res.data || []);
      setMovInsumo(insumo);
      setMovTipoFijo(false);
      setMovTab('entrada');
      setMovBusqueda('');
      setMovFechas([]);
      setMovOpen(true);
    } catch (err) {
      setError('No se pudieron cargar los movimientos.');
    }
  };

  const openHistorial = () => {
    setHistOpen(true);
    setHistInsumoId('');
    setHistMovimientos([]);
    setHistTab('entrada');
    setHistBusqueda('');
    setHistFechas([]);
  };

  useEffect(() => {
    if (!histInsumoId) {
      obtenerMovimientosInsumos()
        .then((res) => setHistMovimientos(res.data || []))
        .catch(() => setHistMovimientos([]));
      return;
    }
    obtenerMovimientosInsumo(histInsumoId)
      .then((res) => setHistMovimientos(res.data || []))
      .catch(() => setHistMovimientos([]));
  }, [histInsumoId]);

  const openMovimientoTipo = async (insumo, tipo) => {
    try {
      const [movRes, lotesRes] = await Promise.all([
        obtenerMovimientosInsumo(insumo._id),
        obtenerLotesInsumo(insumo._id)
      ]);
      setMovimientos(movRes.data || []);
      setLotes(lotesRes.data || []);
      setMovInsumo(insumo);
      setMovTipoFijo(true);
      setMovTab(tipo);
      setMovBusqueda('');
      setMovFechas([]);
      setMovOpen(true);
    } catch (err) {
      setError('No se pudieron cargar los movimientos.');
    }
  };

  const estadosPorLote = useMemo(() => {
    const map = new Map();
    lotes.forEach((lote) => {
      const estado = estadoVencimiento(lote, Number(lotesInsumo?.alerta_vencimiento_dias || 7));
      map.set(lote._id, estado);
    });
    return map;
  }, [lotes, lotesInsumo]);

  const movimientosFiltrados = useMemo(() => {
    const texto = movBusqueda.trim().toLowerCase();
    const [inicio, fin] = movFechas;
    const inicioDate = inicio ? new Date(inicio.toDate()) : null;
    const finDate = fin ? new Date(fin.toDate()) : null;

    return movimientos.filter((mov) => {
      if (movTab && mov.tipo !== movTab) return false;
      if (texto) {
        const motivo = (mov.motivo || '').toLowerCase();
        const lote = (mov.lote || '').toLowerCase();
        const nota = (mov.nota || '').toLowerCase();
        if (!motivo.includes(texto) && !lote.includes(texto) && !nota.includes(texto)) return false;
      }
      if (inicioDate && finDate) {
        const fecha = new Date(mov.fecha);
        if (fecha < inicioDate || fecha > finDate) return false;
      }
      return true;
    });
  }, [movimientos, movTab, movBusqueda, movFechas]);

  const historialFiltrado = useMemo(() => {
    const texto = histBusqueda.trim().toLowerCase();
    const [inicio, fin] = histFechas;
    const inicioDate = inicio ? new Date(inicio.toDate()) : null;
    const finDate = fin ? new Date(fin.toDate()) : null;

    return histMovimientos.filter((mov) => {
      if (histTab && mov.tipo !== histTab) return false;
      if (texto) {
        const motivo = (mov.motivo || '').toLowerCase();
        const lote = (mov.lote || '').toLowerCase();
        const nota = (mov.nota || '').toLowerCase();
        if (!motivo.includes(texto) && !lote.includes(texto) && !nota.includes(texto)) return false;
      }
      if (inicioDate && finDate) {
        const fecha = new Date(mov.fecha);
        if (fecha < inicioDate || fecha > finDate) return false;
      }
      return true;
    });
  }, [histMovimientos, histTab, histBusqueda, histFechas]);

  const insumosFiltrados = useMemo(() => {
    return insumos.filter((insumo) => {
      if (soloBajoMinimo) {
        if (Number(insumo.stock_total || 0) > Number(insumo.stock_minimo || 0)) {
          return false;
        }
      }
      if (tabCategoria === 'todas') return true;
      if (tabCategoria === 'sin') return !insumo.categoria;
      return insumo.categoria?._id === tabCategoria;
    });
  }, [insumos, soloBajoMinimo, tabCategoria]);

  useEffect(() => {
    setVisibleCount(50);
  }, [soloBajoMinimo, tabCategoria, mostrarInsumosOcultos, insumos.length]);

  useEffect(() => {
    if (visibleCount >= insumosFiltrados.length) return;
    const timer = setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + 100, insumosFiltrados.length));
    }, 50);
    return () => clearTimeout(timer);
  }, [visibleCount, insumosFiltrados.length]);

  const insumosPaginados = useMemo(() => {
    return insumosFiltrados.slice(0, visibleCount);
  }, [insumosFiltrados, visibleCount]);

  const insumosStockBajo = useMemo(
    () =>
      insumos.filter(
        (insumo) =>
          Number(insumo.stock_total || 0) <= Number(insumo.stock_minimo || 0)
      ),
    [insumos]
  );

  return (
    <Box sx={{ mt: 2, px: 1 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: 'transparent',
          boxShadow: 'none',
          fontSize: '0.92rem',
          '& .MuiTypography-body1, & .MuiTypography-body2, & .MuiTypography-subtitle2': {
            fontSize: '0.92rem'
          },
          '& .MuiTableCell-root': { fontSize: '0.75rem' }
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h5" gutterBottom>Insumos</Typography>
            <Typography variant="body2" color="text.secondary">
              Inventario de materias primas e insumos.
            </Typography>
          </Box>
          {isAdmin && (
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                Crear insumo
              </Button>
              {usuario?.rol === 'superadmin' && (
                <>
                  <Button
                    variant="text"
                    onClick={openAlertas}
                    sx={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 400 }}
                  >
                    Configurar alertas
                  </Button>
                  <Button
                    variant="text"
                    onClick={handleEnviarResumen}
                    disabled={alertSending}
                    sx={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 400 }}
                  >
                    {alertSending ? 'Enviando...' : 'Enviar resumen'}
                  </Button>
                  <Button
                    variant="text"
                    onClick={openCloneAll}
                    sx={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 400 }}
                  >
                    Clonar inventario
                  </Button>
                </>
              )}
              <Button
                variant="text"
                onClick={openHistorial}
                sx={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 400 }}
              >
                Ver historial de E/S
              </Button>
            </Stack>
          )}
          {!isAdmin && (
            <Button
              variant="text"
              onClick={openHistorial}
              sx={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 400 }}
            >
              Ver historial de E/S
            </Button>
          )}
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {info && <Alert severity="success" sx={{ mb: 2 }}>{info}</Alert>}
        {insumosStockBajo.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Hay {insumosStockBajo.length} insumo(s) por debajo del stock mínimo.
          </Alert>
        )}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button
            variant={soloBajoMinimo ? 'contained' : 'outlined'}
            color="warning"
            onClick={() => setSoloBajoMinimo((prev) => !prev)}
          >
            {soloBajoMinimo ? 'Mostrando: Bajo mínimo' : 'Filtrar: Bajo mínimo'}
          </Button>
          <Button
            variant={mostrarInsumosOcultos ? 'contained' : 'outlined'}
            onClick={() => setMostrarInsumosOcultos((prev) => !prev)}
          >
            {mostrarInsumosOcultos ? 'Ocultos visibles' : 'Mostrar ocultos'}
          </Button>
          {isAdmin && (
            <Button
              variant="outlined"
              onClick={openCategorias}
            >
              Crear categorias de insumos
            </Button>
          )}
        </Stack>

        {categoriasInsumo.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Categorias
              </Typography>
              {isAdmin && (
                <Button
                  variant="text"
                  onClick={() => setOrdenarTabs((prev) => !prev)}
                  sx={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 400 }}
                >
                  {ordenarTabs ? 'Listo' : 'Ordenar'}
                </Button>
              )}
            </Stack>

            {!ordenarTabs ? (
              <Tabs
                value={tabCategoria}
                onChange={(_e, value) => setTabCategoria(value)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
              >
                <Tab value="todas" label="Todas" sx={{ fontWeight: 400, fontSize: '0.8rem' }} />
                {categoriasInsumo.map((cat) => (
                  <Tab key={cat._id} value={cat._id} label={cat.nombre} sx={{ fontWeight: 400, fontSize: '0.8rem' }} />
                ))}
                <Tab value="sin" label="Sin categoria" sx={{ fontWeight: 400, fontSize: '0.8rem' }} />
              </Tabs>
            ) : (
              <DragDropContext onDragEnd={handleOrdenCategorias}>
                <Droppable droppableId="categorias-tabs" direction="horizontal">
                  {(provided) => (
                    <Stack
                      direction="row"
                      spacing={1}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{ overflowX: 'auto', pb: 1 }}
                    >
                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          border: '1px solid #e5e7eb',
                          bgcolor: '#f3f4f6',
                          fontSize: '0.8rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Todas
                      </Box>
                      {categoriasInsumo.map((cat, index) => (
                        <Draggable
                          key={cat._id}
                          draggableId={cat._id}
                          index={index}
                          isDragDisabled={!isAdmin || categoriaOrdenando}
                        >
                          {(draggableProvided) => (
                            <Box
                              ref={draggableProvided.innerRef}
                              {...draggableProvided.draggableProps}
                              {...draggableProvided.dragHandleProps}
                              sx={{
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 2,
                                border: '1px solid #e5e7eb',
                                bgcolor: '#f9fafb',
                                fontSize: '0.8rem',
                                whiteSpace: 'nowrap',
                                cursor: 'grab'
                              }}
                            >
                              {cat.nombre}
                            </Box>
                          )}
                        </Draggable>
                      ))}
                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          border: '1px solid #e5e7eb',
                          bgcolor: '#f3f4f6',
                          fontSize: '0.8rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Sin categoria
                      </Box>
                      {provided.placeholder}
                    </Stack>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </Box>
        )}

        <TableContainer
          component={Paper}
          variant="outlined"
          ref={tableContainerRef}
          sx={{
            backgroundColor: 'transparent',
            boxShadow: 'none'
          }}
        >
          {insumosPaginados.length < insumosFiltrados.length ? (
            <Typography variant="caption" color="text.secondary" sx={{ px: 1, pb: 1, display: 'block' }}>
              Cargando filas automaticamente... {insumosPaginados.length} de {insumosFiltrados.length}.
            </Typography>
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ px: 1, pb: 1, display: 'block' }}>
              Todas las filas han sido cargadas.
            </Typography>
          )}
          <DragDropContext onDragEnd={handleOrdenar}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 40 }} />
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripcion</TableCell>
                  <TableCell>Unidad</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Minimo</TableCell>
                  <TableCell>Vencimiento</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>Ingresos/Egresos</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <Droppable droppableId="insumos-table" direction="vertical">
                {(provided) => (
                  <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                    {insumosFiltrados.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          No hay insumos registrados.
                        </TableCell>
                      </TableRow>
                    )}
                    {insumosPaginados.map((insumo, index) => {
                        const stockBajo = Number(insumo.stock_total || 0) <= Number(insumo.stock_minimo || 0);
                        const oculto = insumo.activo === false;
                        return (
                          <Draggable
                            key={insumo._id}
                            draggableId={insumo._id}
                            index={index}
                            isDragDisabled={!isAdmin || ordenando || insumosPaginados.length < insumosFiltrados.length}
                          >
                            {(draggableProvided) => (
                              <TableRow
                                ref={draggableProvided.innerRef}
                                {...draggableProvided.draggableProps}
                                sx={
                                  oculto
                                    ? { backgroundColor: 'rgba(148, 163, 184, 0.18)' }
                                    : stockBajo
                                      ? { backgroundColor: 'rgba(251, 191, 36, 0.15)' }
                                      : {}
                                }
                              >
                                <TableCell sx={{ width: 40 }}>
                                  <IconButton
                                    size="small"
                                    {...draggableProvided.dragHandleProps}
                                    disabled={!isAdmin || ordenando}
                                  >
                                    <DragIndicatorIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                                <TableCell>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="body2">{insumo.nombre}</Typography>
                                    {insumo.ultima_nota && (
                                      <Tooltip title={insumo.ultima_nota} arrow disableHoverListener={isMobile}>
                                        <IconButton
                                          size="small"
                                          onClick={() => {
                                            if (!isMobile) return;
                                            setDescTexto(insumo.ultima_nota);
                                            setDescOpen(true);
                                          }}
                                        >
                                          <InfoIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  <Tooltip title={insumo.descripcion || ''} placement="top" arrow disableHoverListener={isMobile}>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{ maxWidth: 80, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: insumo.descripcion ? 'pointer' : 'default' }}
                                      onClick={() => {
                                        if (!isMobile || !insumo.descripcion) return;
                                        setDescTexto(insumo.descripcion);
                                        setDescOpen(true);
                                      }}
                                    >
                                      {insumo.descripcion || '-'}
                                    </Typography>
                                  </Tooltip>
                                </TableCell>
                                <TableCell>{insumo.unidad}</TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    color={stockBajo ? 'warning' : 'success'}
                                    label={Number(insumo.stock_total || 0)}
                                  />
                                  {oculto && (
                                    <Chip
                                      size="small"
                                      color="default"
                                      label="Oculto"
                                      sx={{ ml: 1 }}
                                    />
                                  )}
                                </TableCell>
                                <TableCell>{Number(insumo.stock_minimo || 0)}</TableCell>
                                <TableCell>
                                  <Button size="small" onClick={() => openLotes(insumo)} sx={{ fontWeight: 400, color: '#6b7280' }}>
                                    Ver lotes
                                  </Button>
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'nowrap' }}>
                                    <Button
                                      size="small"
                                      onClick={() => openMovimientoTipo(insumo, 'entrada')}
                                      sx={{ fontWeight: 400, color: '#6b7280', fontSize: '0.75rem', minWidth: 'auto', px: 0.5 }}
                                    >
                                      Entrada
                                    </Button>
                                    <Button
                                      size="small"
                                      onClick={() => openMovimientoTipo(insumo, 'salida')}
                                      sx={{ fontWeight: 400, color: '#6b7280', fontSize: '0.75rem', minWidth: 'auto', px: 0.5 }}
                                    >
                                      Salida
                                    </Button>
                                  </Stack>
                                </TableCell>
                                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                  <Stack direction="row" spacing={0.5} justifyContent="flex-end" sx={{ flexWrap: 'nowrap' }}>
                                    {puedeEditar && (
                                      <IconButton size="small" onClick={() => openEdit(insumo)}>
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    )}
                                    {isAdmin && (
                                      <IconButton size="small" onClick={() => confirmDelete(insumo)} color="error">
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    )}
                                    {isAdmin && !oculto && (
                                      <Tooltip title="Ocultar" arrow>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleOcultarInsumo(insumo._id, false)}
                                        >
                                          <VisibilityOffIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                    {usuario?.rol === 'superadmin' && !oculto && (
                                      <Tooltip title="Clonar" arrow>
                                        <IconButton
                                          size="small"
                                          onClick={() => openCloneOne(insumo)}
                                        >
                                          <ContentCopyIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                    {isAdmin && mostrarInsumosOcultos && oculto && (
                                      <Tooltip title="Restaurar" arrow>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleOcultarInsumo(insumo._id, true)}
                                          color="success"
                                        >
                                          <RestoreIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            )}
                          </Draggable>
                        );
                      })}
                    {provided.placeholder}
                  </TableBody>
                )}
              </Droppable>
            </Table>
          </DragDropContext>
        </TableContainer>
      </Paper>

      <InsumoDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        insumo={editingInsumo}
        categorias={categoriasInsumo}
        externalError={error}
        onInfo={setInfo}
        onError={setError}
        onSaved={fetchInsumos}
      />

      <Dialog open={alertOpen} onClose={() => setAlertOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Configurar alertas de insumos</DialogTitle>
        <DialogContent dividers>
          {alertLoading ? (
            <Typography color="text.secondary">Cargando usuarios...</Typography>
          ) : (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                select
                label="Usuarios que reciben alertas"
                SelectProps={{
                  multiple: true,
                  value: alertSeleccionados,
                  onChange: (e) => setAlertSeleccionados(e.target.value),
                  renderValue: (selected) => {
                    if (!selected || selected.length === 0) return 'Sin destinatarios';
                    const map = new Map(alertUsers.map((u) => [u._id, u]));
                    return selected
                      .map((id) => map.get(id)?.nombre || 'Usuario')
                      .join(', ');
                  }
                }}
              >
                {alertUsers.map((usuarioItem) => (
                  <MenuItem key={usuarioItem._id} value={usuarioItem._id}>
                    {usuarioItem.nombre} ({usuarioItem.email})
                  </MenuItem>
                ))}
              </TextField>
              <Typography variant="body2" color="text.secondary">
                Estas alertas se enviaran para el local seleccionado.
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleGuardarAlertas} disabled={alertSaving}>
            {alertSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={categoriaDialogOpen} onClose={() => setCategoriaDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Categorias de insumos</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={categoriaEditando ? 'Editar categoria' : 'Nueva categoria'}
              value={categoriaNombre}
              onChange={(e) => setCategoriaNombre(e.target.value)}
              fullWidth
            />
            <Button variant="contained" onClick={handleGuardarCategoria}>
              {categoriaEditando ? 'Guardar cambios' : 'Crear categoria'}
            </Button>
            {categoriasInsumo.length === 0 ? (
              <Typography color="text.secondary">No hay categorias registradas.</Typography>
            ) : (
              <DragDropContext onDragEnd={handleOrdenCategorias}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 40 }} />
                      <TableCell>Nombre</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <Droppable droppableId="categorias-insumos" direction="vertical">
                    {(provided) => (
                      <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                        {categoriasInsumo.map((cat, index) => (
                          <Draggable
                            key={cat._id}
                            draggableId={cat._id}
                            index={index}
                            isDragDisabled={!isAdmin || categoriaOrdenando}
                          >
                            {(draggableProvided) => (
                              <TableRow ref={draggableProvided.innerRef} {...draggableProvided.draggableProps}>
                                <TableCell sx={{ width: 40 }}>
                                  <IconButton
                                    size="small"
                                    {...draggableProvided.dragHandleProps}
                                    disabled={!isAdmin || categoriaOrdenando}
                                  >
                                    <DragIndicatorIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                                <TableCell>{cat.nombre}</TableCell>
                                <TableCell align="right">
                                  <Button size="small" onClick={() => handleEditarCategoria(cat)}>
                                    Editar
                                  </Button>
                                  <Button size="small" color="error" onClick={() => handleEliminarCategoria(cat)}>
                                    Eliminar
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </TableBody>
                    )}
                  </Droppable>
                </Table>
              </DragDropContext>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoriaDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={descOpen} onClose={() => setDescOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Descripcion</DialogTitle>
        <DialogContent dividers>
          <Typography>{descTexto || '-'}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDescOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={cloneOpen} onClose={() => setCloneOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Clonar insumos</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {cloneMode === 'all'
                ? 'Se clonaran todos los insumos del local actual (sin lotes ni vencimientos).'
                : `Se clonara el insumo "${cloneInsumo?.nombre || ''}" (sin lotes ni vencimientos).`}
            </Typography>
            <TextField
              select
              label="Local destino"
              value={cloneTarget}
              onChange={(e) => setCloneTarget(e.target.value)}
            >
              {cloneLocales
                .filter((l) => l._id !== selectedLocal?._id)
                .map((local) => (
                  <MenuItem key={local._id} value={local._id}>
                    {local.nombre}
                  </MenuItem>
                ))}
            </TextField>
            <Typography variant="caption" color="text.secondary">
              Si un insumo ya existe en el local destino, se omitira.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloneOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleClone} disabled={cloneLoading}>
            {cloneLoading ? 'Clonando...' : 'Clonar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar insumo</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Seguro que deseas eliminar el insumo "{deleteTarget?.nombre}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleteLoading}>
            {deleteLoading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={lotesOpen} onClose={() => setLotesOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Lotes de {lotesInsumo?.nombre}</DialogTitle>
        <DialogContent dividers>
          {isAdmin && (
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Button
                variant={mostrarLotesOcultos ? 'contained' : 'outlined'}
                onClick={async () => {
                  const next = !mostrarLotesOcultos;
                  setMostrarLotesOcultos(next);
                  if (lotesInsumo) {
                    await recargarLotes(lotesInsumo._id, next);
                  }
                }}
              >
                {mostrarLotesOcultos ? 'Ocultos visibles' : 'Mostrar ocultos'}
              </Button>
              {lotes.length > 0 && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleEliminarTodosLotes}
                  disabled={loteDeleteLoading}
                >
                  {loteDeleteLoading ? 'Eliminando...' : 'Eliminar todos los lotes'}
                </Button>
              )}
            </Stack>
          )}
          {lotes.length === 0 ? (
            <Typography color="text.secondary">No hay lotes registrados.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Lote</TableCell>
                  <TableCell>Vencimiento</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Estado</TableCell>
                  {isAdmin && <TableCell align="right">Acciones</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {lotes.map((lote) => {
                  const estado = estadosPorLote.get(lote._id) || 'normal';
                  const label =
                    estado === 'vencido' ? 'Vencido' : estado === 'por_vencer' ? 'Por vencer' : 'Normal';
                  const color =
                    estado === 'vencido' ? 'error' : estado === 'por_vencer' ? 'warning' : 'success';
                  const loteOculto = lote.activo === false;
                  return (
                    <TableRow key={lote._id}>
                      <TableCell>{lote.lote || '-'}</TableCell>
                      <TableCell>
                        {lote.fecha_vencimiento
                          ? new Date(lote.fecha_vencimiento).toLocaleDateString()
                          : 'Sin vencimiento'}
                      </TableCell>
                      <TableCell>{lote.cantidad}</TableCell>
                      <TableCell>
                        <Chip size="small" color={color} label={label} />
                        {isAdmin && loteOculto && (
                          <Chip size="small" label="Oculto" sx={{ ml: 1 }} />
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              color={lote.activo ? 'warning' : 'success'}
                              onClick={() => handleOcultarLote(lote._id, !lote.activo)}
                              disabled={loteDeleteLoading}
                            >
                              {lote.activo ? 'Ocultar' : 'Restaurar'}
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => handleEliminarLote(lote._id)}
                              disabled={loteDeleteLoading}
                            >
                              Eliminar
                            </Button>
                          </Stack>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLotesOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <MovimientoDialog
        open={movOpen}
        onClose={() => setMovOpen(false)}
        insumo={movInsumo}
        lotes={lotes}
        tipoFijo={movTipoFijo}
        tipoInicial={movTab}
        isMobile={isMobile}
        onInfo={setInfo}
        onError={setError}
        onShowDesc={handleShowDesc}
        onRefreshInsumos={fetchInsumos}
        onUpdateMovimientos={setMovimientos}
        onUpdateLotes={setLotes}
      />

      <Dialog
        open={histOpen}
        onClose={() => setHistOpen(false)}
        fullScreen={isMobile}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: !isMobile
            ? { height: '90vh', display: 'flex', flexDirection: 'column' }
            : {}
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Historial de Entradas/Salidas
          <IconButton onClick={() => setHistOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={!isMobile ? { flex: 1, overflow: 'auto' } : {}}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Insumo"
              value={histInsumoId}
              onChange={(e) => setHistInsumoId(e.target.value)}
            >
              <MenuItem value="">Todos los insumos</MenuItem>
              {insumos.map((insumo) => (
                <MenuItem key={insumo._id} value={insumo._id}>
                  {insumo.nombre}
                </MenuItem>
              ))}
            </TextField>
            <Tabs value={histTab} onChange={(_e, value) => setHistTab(value)}>
              <Tab label="Entradas" value="entrada" />
              <Tab label="Salidas" value="salida" />
            </Tabs>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Buscar por motivo/lote/nota"
                value={histBusqueda}
                onChange={(e) => setHistBusqueda(e.target.value)}
                size="small"
              />
              <DatePicker
                range
                value={histFechas}
                onChange={(dates) => setHistFechas([...dates])}
                format="YYYY-MM-DD"
                render={(value, openCalendar) => (
                  <Box
                    onClick={openCalendar}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1.25,
                      py: 0.7,
                      border: '1px solid #e5e7eb',
                      borderRadius: 1,
                      minHeight: 36,
                      cursor: 'pointer',
                      color: '#6b7280'
                    }}
                  >
                    <SearchIcon fontSize="small" />
                    <Typography variant="body2">
                      {value || 'Buscar por fecha'}
                    </Typography>
                  </Box>
                )}
              />
            </Stack>
          </Stack>
          <Box sx={{ mt: 3 }}>
            {historialFiltrado.length === 0 ? (
              <Typography color="text.secondary">Sin movimientos.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    {histInsumoId === '' && <TableCell>Insumo</TableCell>}
                    <TableCell>Tipo</TableCell>
                    <TableCell>Cantidad</TableCell>
                    <TableCell>Motivo</TableCell>
                    <TableCell>Nota</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historialFiltrado.map((mov) => (
                    <TableRow key={mov._id}>
                      <TableCell>{new Date(mov.fecha).toLocaleString()}</TableCell>
                      {histInsumoId === '' && (
                        <TableCell>{mov.insumo?.nombre || '-'}</TableCell>
                      )}
                      <TableCell>{mov.tipo}</TableCell>
                      <TableCell>{mov.cantidad}</TableCell>
                      <TableCell>{mov.motivo || '-'}</TableCell>
                      <TableCell>
                        {mov.nota ? (
                          <Tooltip title={mov.nota} arrow disableHoverListener={isMobile}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                if (!isMobile) return;
                                setDescTexto(mov.nota);
                                setDescOpen(true);
                              }}
                            >
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
