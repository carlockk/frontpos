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
  Tooltip
} from '@mui/material';

import { useTheme } from '@mui/material/styles';
import { Link, useLocation } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { useCaja } from '../context/CajaContext';

// Icons
import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import PointOfSaleIcon from '@mui/icons-material/PointOfSaleOutlined';
import HistoryIcon from '@mui/icons-material/HistoryOutlined';
import StoreIcon from '@mui/icons-material/StoreOutlined';
import PeopleAltIcon from '@mui/icons-material/PeopleAltOutlined';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useThemeMode } from '../context/ThemeContext';
import logo from '../possail.png';

const drawerWidth = 290;

export default function Sidebar({ mobileOpen, toggleDrawer }) {
  const { usuario, logout } = useAuth();
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { modoOscuro, toggleTema } = useThemeMode();
  const { cajaAbierta } = useCaja(); // ✅ Estado dinámico de caja

  const [openMenus, setOpenMenus] = useState({
    productos: false,
    caja: false,
    usuarios: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem('sidebarMenus');
    if (saved) {
      setOpenMenus(JSON.parse(saved));
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
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3 }}>
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    <img src={logo} alt="POS System" style={{ width: '70%', height: '80px', maxWidth: 200 }} />
  </Box>
  <Typography sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    Punto de venta
  </Typography>
  {usuario && (
    <Typography variant="body2" sx={{ mt: 1, color: '#9ca3af', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      👤 {usuario.email} ({usuario.rol})
    </Typography>
  )}
</Box>

      <Divider sx={{ borderColor: '#374151' }} />

      <List sx={{ flexGrow: 1 }}>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/dashboard" sx={{ px: 3, py: 1.5, color: '#d1d5db' }}>
            <Box sx={{ mr: 2 }}><DashboardIcon /></Box>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>

        {/* Productos */}
        <ListItemButton onClick={() => toggleMenu('productos')} sx={{ px: 3, py: 1.5, color: '#d1d5db' }}>
          <Box sx={{ mr: 2 }}><InventoryIcon /></Box>
          <ListItemText primary="Productos" />
          {openMenus.productos ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={openMenus.productos} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton component={Link} to="/" sx={{ pl: 5, py: 1, color: '#d1d5db' }}>
              <ListItemText primary="Ver Productos" />
            </ListItemButton>
            <ListItemButton component={Link} to="/crear" sx={{ pl: 5, py: 1, color: '#d1d5db' }}>
              <ListItemText primary="Crear Producto" />
            </ListItemButton>
            <ListItemButton component={Link} to="/crear-categoria" sx={{ pl: 5, py: 1, color: '#d1d5db' }}>
              <ListItemText primary="Crear Categoría" />
            </ListItemButton>
          </List>
        </Collapse>

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
            <ListItemText primary="Historial" />
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
        {usuario?.rol === 'admin' && (
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
                <ListItemButton component={Link} to="/historial-cajas" sx={{ pl: 5, py: 1, color: '#d1d5db' }}>
                  <ListItemText primary="Historial de Cajas" />
                </ListItemButton>
              </List>
            </Collapse>

            {/* Usuarios */}
            <ListItemButton onClick={() => toggleMenu('usuarios')} sx={{ px: 3, py: 1.5, color: '#d1d5db' }}>
              <Box sx={{ mr: 2 }}><PeopleAltIcon /></Box>
              <ListItemText primary="Usuarios" />
              {openMenus.usuarios ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={openMenus.usuarios} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton component={Link} to="/usuarios" sx={{ pl: 5, py: 1, color: '#d1d5db' }}>
                  <ListItemText primary="Ver Usuarios" />
                </ListItemButton>
                <ListItemButton component={Link} to="/crear-usuario" sx={{ pl: 5, py: 1, color: '#d1d5db' }}>
                  <ListItemText primary="Crear Usuario" />
                </ListItemButton>
              </List>
            </Collapse>
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
            onClick={logout}
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
        }
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
