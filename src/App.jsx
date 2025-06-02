import { useState } from 'react';
import {
  AppBar, Toolbar, IconButton, Typography, Box, CssBaseline, useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useAuth } from './context/AuthContext';
import { CajaProvider } from './context/CajaContext';

import Sidebar from './components/Sidebar';
import Productos from './pages/Productos';
import CrearProducto from './pages/CrearProducto';
import CrearCategoria from './pages/CrearCategoria';
import POS from './pages/POS';
import Ticket from './pages/Ticket';
import Historial from './pages/Historial';
import Caja from './pages/Caja';
import HistorialCajas from './pages/HistorialCajas';
import TicketCaja from './pages/TicketCaja';
import CrearUsuario from './pages/CrearUsuario';
import ListaUsuarios from './pages/ListaUsuarios';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import TicketsAbiertos from './pages/TicketsAbiertos'; // ✅ NUEVO

const drawerWidth = 240;

export default function App() {
  const { usuario } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleDrawer = () => setMobileOpen(!mobileOpen);

  return (
    <CajaProvider>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />

        {isMobile && (
          <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
            <Toolbar>
              <IconButton color="inherit" edge="start" onClick={toggleDrawer}>
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" noWrap sx={{ ml: 2 }}>
                POS System
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        <Sidebar mobileOpen={mobileOpen} toggleDrawer={toggleDrawer} />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            mt: isMobile ? 7 : 0,
            width: { sm: `calc(100% - ${drawerWidth}px)` }
          }}
        >
          <Routes>
            <Route path="/login" element={!usuario ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/" element={usuario ? <Productos /> : <Navigate to="/login" />} />
            <Route path="/crear" element={usuario?.rol === 'admin' ? <CrearProducto /> : <Navigate to="/" />} />
            <Route path="/crear-categoria" element={usuario?.rol === 'admin' ? <CrearCategoria /> : <Navigate to="/" />} />
            <Route path="/crear-usuario" element={usuario?.rol === 'admin' ? <CrearUsuario /> : <Navigate to="/" />} />
            <Route path="/usuarios" element={usuario?.rol === 'admin' ? <ListaUsuarios /> : <Navigate to="/" />} />
            <Route path="/pos" element={usuario ? <POS /> : <Navigate to="/login" />} />
            <Route path="/dashboard" element={usuario ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/historial" element={usuario ? <Historial /> : <Navigate to="/login" />} />
            <Route path="/caja" element={usuario?.rol === 'admin' ? <Caja /> : <Navigate to="/" />} />
            <Route path="/historial-cajas" element={usuario?.rol === 'admin' ? <HistorialCajas /> : <Navigate to="/" />} />
            <Route path="/ticket" element={<Ticket />} />
            <Route path="/ticket-caja" element={<TicketCaja />} />
            <Route path="/tickets-abiertos" element={usuario ? <TicketsAbiertos /> : <Navigate to="/login" />} /> {/* ✅ NUEVO */}
          </Routes>
        </Box>
      </Box>
    </CajaProvider>
  );
}
