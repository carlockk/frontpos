import {
  Drawer,
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  Collapse,
  useMediaQuery,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

import { useTheme } from '@mui/material/styles';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { useCaja } from '../context/CajaContext';
import { obtenerLocales } from '../services/api';

// Icons
import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import PointOfSaleIcon from '@mui/icons-material/PointOfSaleOutlined';
import HistoryIcon from '@mui/icons-material/HistoryOutlined';
import StoreIcon from '@mui/icons-material/StoreOutlined';
import StorefrontIcon from '@mui/icons-material/StorefrontOutlined';
import PeopleAltIcon from '@mui/icons-material/PeopleAltOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useThemeMode } from '../context/ThemeContext';
import logo from '../possail.png';

const drawerWidth = 320;

export default function Sidebar({ mobileOpen, toggleDrawer }) {
  const { usuario, logout, selectedLocal, seleccionarLocal } = useAuth();
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { modoOscuro, toggleTema } = useThemeMode();
  const { cajaAbierta } = useCaja(); // ✅ Estado dinámico de caja

  const [openMenus, setOpenMenus] = useState({
    caja: false,
    usuarios: false,
  });
  const [locales, setLocales] = useState([]);
  const [localesLoading, setLocalesLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebarMenus');
    if (saved) {
      const parsed = JSON.parse(saved);
      setOpenMenus({
        caja: Boolean(parsed.caja),
        usuarios: Boolean(parsed.usuarios),
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarMenus', JSON.stringify(openMenus));
  }, [openMenus]);

  useEffect(() => {
    if (isMobile && toggleDrawer) {
      toggleDrawer();
    }
  }, [location]);

  useEffect(() => {
    const cargarLocales = async () => {
      if (usuario?.rol !== 'superadmin') return;
      setLocalesLoading(true);
      try {
        const res = await obtenerLocales();
        setLocales(res.data || []);
      } catch (err) {
        setLocales([]);
      } finally {
        setLocalesLoading(false);
      }
    };

    cargarLocales();
  }, [usuario?.rol]);

  const toggleMenu = (key) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const drawerContent = (
    <Box
      sx={{
        width: drawerWidth,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#111827',
        color: '#fff',
        borderRight: '1px solid #1f2937',
        overflowX: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3 }}>
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    <img src={logo} alt="POS System" style={{ width: '60%', height: '52px', maxWidth: 120 }} />
  </Box>
  <Typography sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    Sistema de punto de venta
  </Typography>
  {usuario && (
    <Typography variant="body2" sx={{ mt: 1, color: '#9ca3af', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      👤 {usuario.email} ({usuario.rol})
    </Typography>
  )}
  {usuario?.local?.nombre && (
    <Typography variant="body2" sx={{ mt: 0.5, color: '#9ca3af', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      📍 {usuario.local.nombre}
    </Typography>
  )}
  {usuario?.rol === 'superadmin' && (
    <Box sx={{ mt: 2 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="locales-select-label" sx={{ color: '#e5e7eb' }}>
          Local activo
        </InputLabel>
        <Select
          labelId="locales-select-label"
          label="Local activo"
          value={selectedLocal?._id || ''}
          onChange={(e) => {
            const local = locales.find((item) => item._id === e.target.value);
            seleccionarLocal(local || null);
          }}
          disabled={localesLoading || locales.length === 0}
          sx={{
            color: '#fff',
            '.MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4b5563' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#93c5fd' },
            '.MuiSvgIcon-root': { color: '#e5e7eb' },
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                bgcolor: '#111827',
                color: '#fff',
              },
            },
          }}
        >
          <MenuItem value="" sx={{ color: '#e5e7eb' }}>
            {localesLoading ? 'Cargando...' : 'Selecciona un local'}
          </MenuItem>
          {locales.map((local) => (
            <MenuItem key={local._id} value={local._id} sx={{ color: '#fff' }}>
              {local.nombre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )}
</Box>

      <Divider sx={{ borderColor: '#374151' }} />

      <List
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          pr: 0.5,
          '&::-webkit-scrollbar': {
            width: '8px'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#0f172a'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#334155',
            borderRadius: '8px'
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#475569'
          }
        }}
      >
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/dashboard" sx={{ px: 3, py: 1.5, color: '#d1d5db' }}>
            <Box sx={{ mr: 2 }}><DashboardIcon /></Box>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>

        {/* Productos */}
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/" sx={{ px: 3, py: 1.5, color: '#d1d5db' }}>
            <Box sx={{ mr: 2 }}><InventoryIcon /></Box>
            <ListItemText primary="Productos" />
          </ListItemButton>
        </ListItem>

        {/* Insumos */}
        {usuario && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/insumos" sx={{ px: 3, py: 1.5, color: '#d1d5db' }}>
              <Box sx={{ mr: 2 }}><InventoryOutlinedIcon /></Box>
              <ListItemText primary="Insumos" />
            </ListItemButton>
          </ListItem>
        )}

        {/* Categorias */}
        {(usuario?.rol === 'admin' || usuario?.rol === 'superadmin') && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/categorias" sx={{ px: 3, py: 1.5, color: '#d1d5db' }}>
              <Box sx={{ mr: 2 }}><StoreIcon /></Box>
              <ListItemText primary="Categorias" />
            </ListItemButton>
          </ListItem>
        )}

        {/* Locales */}
        {(usuario?.rol === 'admin' || usuario?.rol === 'superadmin') && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/locales" sx={{ px: 3, py: 1.5, color: '#d1d5db' }}>
              <Box sx={{ mr: 2 }}><StorefrontIcon /></Box>
              <ListItemText primary="Locales" />
            </ListItemButton>
          </ListItem>
        )}

        {/* Configuracion recibos */}
        {(usuario?.rol === 'admin' || usuario?.rol === 'superadmin') && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/config-recibo" sx={{ px: 3, py: 1.5, color: '#d1d5db' }}>
              <Box sx={{ mr: 2 }}><ReceiptLongIcon /></Box>
              <ListItemText primary="Configuracion de Recibos" />
            </ListItemButton>
          </ListItem>
        )}

        {/* POS */}
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/pos" sx={{ px: 3, py: 1.5, color: '#d1d5db' }}>
            <Box sx={{ mr: 2 }}><PointOfSaleIcon /></Box>
            <ListItemText primary="POS" />
          </ListItemButton>
        </ListItem>

        {/* Historial */}
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/historial" sx={{ px: 3, py: 1.5, color: '#d1d5db' }}>
            <Box sx={{ mr: 2 }}><HistoryIcon /></Box>
            <ListItemText primary="Historial de tickets" />
          </ListItemButton>
        </ListItem>

 {/* tickets abiertos */}
        <ListItem disablePadding>
  <ListItemButton component={Link} to="/tickets-abiertos" sx={{ px: 3, py: 1.5, color: '#d1d5db' }}>
    <Box sx={{ mr: 2 }}><StoreIcon /></Box>
    <ListItemText primary="Tickets Abiertos" />
  </ListItemButton>
</ListItem>


        {/* Solo admin */}
        {(usuario?.rol === 'admin' || usuario?.rol === 'superadmin' || usuario?.rol === 'cajero') && (
          <>
            {/* Caja */}
            <ListItemButton onClick={() => toggleMenu('caja')} sx={{ px: 3, py: 1.5, color: '#d1d5db' }}>
              <Box sx={{ mr: 2 }}><StoreIcon /></Box>
              <ListItemText primary="Caja" />
              {openMenus.caja ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={openMenus.caja} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton component={Link} to="/caja" sx={{ pl: 5, py: 1, color: '#d1d5db' }}>
                  <ListItemText primary={cajaAbierta ? 'Cerrar Caja' : 'Abrir Caja'} />
                </ListItemButton>
                {(usuario?.rol === 'admin' || usuario?.rol === 'superadmin') && (
                  <ListItemButton component={Link} to="/historial-cajas" sx={{ pl: 5, py: 1, color: '#d1d5db' }}>
                    <ListItemText primary="Historial de Cajas" />
                  </ListItemButton>
                )}
              </List>
            </Collapse>

            {/* Usuarios */}
            {(usuario?.rol === 'admin' || usuario?.rol === 'superadmin') && (
              <ListItem disablePadding>
                <ListItemButton component={Link} to="/usuarios" sx={{ px: 3, py: 1.5, color: '#d1d5db' }}>
                  <Box sx={{ mr: 2 }}><PeopleAltIcon /></Box>
                  <ListItemText primary="Usuarios" />
                </ListItemButton>
              </ListItem>
            )}
          </>
        )}
      </List>

      {/* Cambiar tema + Cerrar sesión */}
      <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ color: '#9ca3af' }}>
          Tema
        </Typography>
        <Tooltip title="Cambiar tema">
          <IconButton onClick={toggleTema} color="inherit" sx={{ mr: 2.5 }}>
            {modoOscuro ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Tooltip>
      </Box>

      {usuario && (
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            color="error"
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={() => {
              logout();
              navigate('/login');
            }}
            sx={{
              color: '#f87171',
              borderColor: '#f87171',
              width: '90%;', // Aquí le quito 10px de ancho
              '&:hover': {
                backgroundColor: '#7f1d1d',
                color: '#fff',
                borderColor: '#ef4444',
              }
            }}
          >
            Cerrar Sesión
          </Button>
        </Box>
      )}
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? mobileOpen : true}
      onClose={toggleDrawer}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#111827',
          overflowX: 'hidden'
        }
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
