import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  Stack
} from '@mui/material';
import EmailIcon from '@mui/icons-material/EmailOutlined';
import LockIcon from '@mui/icons-material/LockOutlined';
import { loginUsuario } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../possail.png';

const BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1600&q=80';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await loginUsuario({ email, password });
      login(res.data);
      navigate('/dashboard');
    } catch {
      alert('Credenciales inválidas');
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 4 },
        overflow: 'hidden',
        backgroundColor: '#020617'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${BACKGROUND_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.55)',
          transform: 'scale(1.02)'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(115deg, rgba(2,6,23,0.95), rgba(30,64,175,0.75))'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.45), transparent 70%)',
          top: '-80px',
          right: '-120px',
          filter: 'blur(12px)'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(129,140,248,0.4), transparent 70%)',
          bottom: '-60px',
          left: '-80px',
          filter: 'blur(14px)'
        }}
      />

      <Box sx={{ position: 'relative', width: '100%', maxWidth: 440 }}>
        <Paper
          elevation={12}
          sx={{
            p: { xs: 4, md: 5 },
            borderRadius: 4,
            backgroundColor: 'rgba(15,23,42,0.85)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#f8fafc',
            boxShadow: '0 25px 60px rgba(0,0,0,0.45)'
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              component="img"
              src={logo}
              alt="Logo POS"
              sx={{
                width: 80,
                height: 80,
                objectFit: 'contain',
                mb: 2,
                filter: 'drop-shadow(0 10px 25px rgba(59,130,246,0.45))'
              }}
            />
            <Typography variant="body2" sx={{ textTransform: 'uppercase', letterSpacing: 6, color: '#94a3b8', fontSize: 12 }}>
              POS SAIL
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#f8fafc', mt: 1 }}>
              Sistema de Punto de Venta
            </Typography>
            <Typography variant="body2" sx={{ color: '#cbd5f5', mt: 1 }}>
              Gestiona inventario, tickets y cajas desde un solo lugar.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} sx={{ mb: 4 }} justifyContent="center">
            {['Ventas rápidas', 'Inventario vivo', 'Reportes claros'].map((tag) => (
              <Box
                key={tag}
                sx={{
                  px: 2,
                  py: 0.5,
                  borderRadius: 999,
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  backgroundColor: 'rgba(148,163,184,0.12)',
                  color: '#e2e8f0'
                }}
              >
                {tag}
              </Box>
            ))}
          </Stack>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.5}>
              <TextField
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#60a5fa' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 2,
                    backgroundColor: 'rgba(15,23,42,0.6)',
                    input: { color: '#e2e8f0' }
                  }
                }}
                InputLabelProps={{
                  sx: { color: '#94a3b8', '&.Mui-focused': { color: '#60a5fa' } }
                }}
                required
              />

              <TextField
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#60a5fa' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 2,
                    backgroundColor: 'rgba(15,23,42,0.6)',
                    input: { color: '#e2e8f0' }
                  }
                }}
                InputLabelProps={{
                  sx: { color: '#94a3b8', '&.Mui-focused': { color: '#60a5fa' } }
                }}
                required
              />

              <Button
                type="submit"
                fullWidth
                size="large"
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: 16,
                  textTransform: 'none',
                  color: '#fff',
                  background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                  boxShadow: '0 15px 35px rgba(30,58,138,0.45)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
                    boxShadow: '0 20px 40px rgba(30,64,175,0.55)'
                  }
                }}
              >
                Iniciar sesión
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
