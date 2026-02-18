import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { guardarConfigSocial, obtenerConfigSocial } from '../services/api';

const REDES = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'x', label: 'X (Twitter)' },
  { key: 'whatsapp', label: 'WhatsApp' }
];

const buildEmpty = () =>
  REDES.reduce((acc, red) => {
    acc[red.key] = { enabled: false, url: '' };
    return acc;
  }, {});

export default function SocialConfig() {
  const [socials, setSocials] = useState(buildEmpty());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await obtenerConfigSocial();
        const data = res?.data || {};
        const next = buildEmpty();

        REDES.forEach((red) => {
          const entry = data?.[red.key] || data?.socials?.[red.key] || {};
          next[red.key] = {
            enabled: Boolean(entry.enabled),
            url: entry.url || ''
          };
        });

        setSocials(next);
      } catch (err) {
        setError('No se pudo cargar la configuracion social.');
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  const activos = useMemo(
    () => REDES.filter((red) => socials[red.key]?.enabled && socials[red.key]?.url).length,
    [socials]
  );

  const onToggle = (key, checked) => {
    setSocials((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled: checked
      }
    }));
  };

  const onUrl = (key, value) => {
    setSocials((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        url: value
      }
    }));
  };

  const guardar = async () => {
    setError('');
    setInfo('');
    setSaving(true);
    try {
      const res = await guardarConfigSocial({ socials });
      const data = res?.data || {};
      const next = buildEmpty();
      REDES.forEach((red) => {
        const entry = data?.[red.key] || {};
        next[red.key] = {
          enabled: Boolean(entry.enabled),
          url: entry.url || ''
        };
      });
      setSocials(next);
      setInfo('Configuracion social guardada.');
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo guardar la configuracion social.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Typography sx={{ mt: 4 }}>Cargando configuracion social...</Typography>;
  }

  return (
    <Box sx={{ mt: 4, px: 2 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          maxWidth: 760,
          backgroundColor: 'transparent',
          boxShadow: 'none'
        }}
      >
        <Typography variant="h5" gutterBottom>Social</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Activa redes sociales y define su URL para mostrarlas en el footer de la web.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {info && <Alert severity="success" sx={{ mb: 2 }}>{info}</Alert>}

        <Stack spacing={2}>
          {REDES.map((red) => {
            const entry = socials[red.key] || { enabled: false, url: '' };
            return (
              <Paper key={red.key} variant="outlined" sx={{ p: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(entry.enabled)}
                        onChange={(e) => onToggle(red.key, e.target.checked)}
                      />
                    }
                    label={red.label}
                    sx={{ minWidth: 180 }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label={`URL ${red.label}`}
                    placeholder="https://..."
                    value={entry.url || ''}
                    onChange={(e) => onUrl(red.key, e.target.value)}
                    disabled={!entry.enabled}
                  />
                </Stack>
              </Paper>
            );
          })}

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Redes activas: {activos}
            </Typography>
            <Button variant="contained" onClick={guardar} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar configuracion'}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
