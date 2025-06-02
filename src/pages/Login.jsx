import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment
} from '@mui/material';
import EmailIcon from '@mui/icons-material/EmailOutlined';
import LockIcon from '@mui/icons-material/LockOutlined';
import { loginUsuario } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); // ✅ Previene recarga
    try {
      const res = await loginUsuario({ email, password });
      login(res.data);
      navigate('/dashboard');
    } catch {
      alert('❌ Credenciales inválidas');
    }
  };

  return (
    <Box sx={{ mt: 8, px: 2 }}>
      <Paper elevation={4} sx={{ maxWidth: 400, mx: 'auto', p: 4 }}>
        <Typography variant="h5" gutterBottom align="center">
          🔐 Iniciar Sesión
        </Typography>

        {/* ✅ FORMULARIO */}
        <form onSubmit={handleSubmit} autoComplete="off">
          <TextField
            fullWidth
            label="Email"
            type="email"
            name="email"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="primary" />
                </InputAdornment>
              )
            }}
          />

          <TextField
            fullWidth
            label="Contraseña"
            type="password"
            name="password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="primary" />
                </InputAdornment>
              )
            }}
          />

          <Button type="submit" variant="contained" color="primary" fullWidth>
            Entrar
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
