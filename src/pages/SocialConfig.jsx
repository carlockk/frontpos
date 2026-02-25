import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { clonarConfigSocial, guardarConfigSocial, obtenerConfigSocial, obtenerLocales } from '../services/api';
import { useAuth } from '../context/AuthContext';

const REDES = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'x', label: 'X (Twitter)' },
  { key: 'whatsapp', label: 'WhatsApp' }
];

const DIAS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miercoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sabado' }
];

const buildEmpty = () =>
  REDES.reduce((acc, red) => {
    acc[red.key] = { enabled: false, url: '' };
    return acc;
  }, {});

const buildEmptySchedule = () =>
  DIAS.reduce((acc, day) => {
    acc[day.value] = [];
    return acc;
  }, {});

const buildScheduleFromApi = (raw) => {
  const base = buildEmptySchedule();
  if (!Array.isArray(raw)) return base;
  raw.forEach((entry) => {
    const dia = Number(entry?.dia);
    if (!Object.prototype.hasOwnProperty.call(base, dia)) return;
    const tramos = Array.isArray(entry?.tramos) ? entry.tramos : [];
    base[dia] = tramos
      .map((slot) => ({
        inicio: String(slot?.inicio || ''),
        fin: String(slot?.fin || '')
      }))
      .filter((slot) => slot.inicio && slot.fin);
  });
  return base;
};

const buildSchedulePayload = (scheduleByDay) =>
  DIAS.map((day) => ({
    dia: day.value,
    tramos: Array.isArray(scheduleByDay?.[day.value]) ? scheduleByDay[day.value] : []
  })).filter((entry) => entry.tramos.length > 0);

export default function SocialConfig() {
  const { usuario, selectedLocal } = useAuth();
  const [socials, setSocials] = useState(buildEmpty());
  const [horariosWeb, setHorariosWeb] = useState(buildEmptySchedule());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [cloneLoading, setCloneLoading] = useState(false);
  const [locales, setLocales] = useState([]);
  const [targetLocalIds, setTargetLocalIds] = useState([]);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      setError('');
      setSocials(buildEmpty());
      setHorariosWeb(buildEmptySchedule());

      if (usuario?.rol === 'superadmin' && !selectedLocal?._id) {
        setLoading(false);
        return;
      }

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
        setHorariosWeb(buildScheduleFromApi(data?.horarios_web));
      } catch (err) {
        setError('No se pudo cargar la configuracion social.');
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [selectedLocal?._id, usuario?.rol]);

  useEffect(() => {
    if (usuario?.rol !== 'superadmin') return;
    obtenerLocales()
      .then((res) => setLocales(res.data || []))
      .catch(() => setLocales([]));
  }, [usuario?.rol]);

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
      const res = await guardarConfigSocial({
        socials,
        horarios_web: buildSchedulePayload(horariosWeb)
      });
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
      setHorariosWeb(buildScheduleFromApi(data?.horarios_web));
      setInfo('Configuracion social guardada.');
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo guardar la configuracion social.');
    } finally {
      setSaving(false);
    }
  };

  const agregarTramo = (dia) => {
    setHorariosWeb((prev) => ({
      ...prev,
      [dia]: [...(prev[dia] || []), { inicio: '09:00', fin: '18:00' }]
    }));
  };

  const actualizarTramo = (dia, index, key, value) => {
    setHorariosWeb((prev) => ({
      ...prev,
      [dia]: (prev[dia] || []).map((slot, idx) => (idx === index ? { ...slot, [key]: value } : slot))
    }));
  };

  const eliminarTramo = (dia, index) => {
    setHorariosWeb((prev) => ({
      ...prev,
      [dia]: (prev[dia] || []).filter((_, idx) => idx !== index)
    }));
  };

  const abrirClonar = () => {
    setError('');
    setInfo('');
    setTargetLocalIds([]);
    setCloneOpen(true);
  };

  const ejecutarClonado = async () => {
    if (!selectedLocal?._id) {
      setError('Selecciona un local origen para clonar la configuracion.');
      return;
    }
    if (!Array.isArray(targetLocalIds) || targetLocalIds.length === 0) {
      setError('Selecciona al menos un local destino.');
      return;
    }

    try {
      setCloneLoading(true);
      const res = await clonarConfigSocial({
        sourceLocalId: selectedLocal._id,
        targetLocalIds
      });
      const cantidad = Number(res?.data?.cantidad || 0);
      setInfo(`Configuracion social clonada en ${cantidad} local(es).`);
      setCloneOpen(false);
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo clonar la configuracion social.');
    } finally {
      setCloneLoading(false);
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

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Horarios atencion web (pedidos en linea)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Fuera de estos horarios, el cliente no podra avanzar al pago.
            </Typography>

            <Stack spacing={2}>
              {DIAS.map((day) => {
                const slots = horariosWeb?.[day.value] || [];
                return (
                  <Paper key={day.value} variant="outlined" sx={{ p: 1.5 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" fontWeight={600}>
                          {day.label}
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddCircleOutlineIcon />}
                          onClick={() => agregarTramo(day.value)}
                        >
                          Agregar tramo
                        </Button>
                      </Stack>

                      {slots.length === 0 ? (
                        <Typography variant="caption" color="text.secondary">
                          Sin atencion configurada para este dia.
                        </Typography>
                      ) : (
                        slots.map((slot, idx) => (
                          <Stack key={`${day.value}-${idx}`} direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="center">
                            <TextField
                              size="small"
                              type="time"
                              label="Inicio"
                              value={slot.inicio}
                              onChange={(e) => actualizarTramo(day.value, idx, 'inicio', e.target.value)}
                              InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                              size="small"
                              type="time"
                              label="Fin"
                              value={slot.fin}
                              onChange={(e) => actualizarTramo(day.value, idx, 'fin', e.target.value)}
                              InputLabelProps={{ shrink: true }}
                            />
                            <IconButton color="error" onClick={() => eliminarTramo(day.value, idx)}>
                              <DeleteOutlineIcon />
                            </IconButton>
                          </Stack>
                        ))
                      )}
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </Paper>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Redes activas: {activos}
            </Typography>
            <Stack direction="row" spacing={1}>
              {usuario?.rol === 'superadmin' && (
                <Button variant="outlined" onClick={abrirClonar}>
                  Clonar a locales
                </Button>
              )}
              <Button variant="contained" onClick={guardar} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar configuracion'}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      <Dialog open={cloneOpen} onClose={() => setCloneOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Clonar configuracion social</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Local origen"
              value={selectedLocal?.nombre || 'Sin seleccionar'}
              disabled
              fullWidth
            />
            <TextField
              select
              SelectProps={{ multiple: true }}
              label="Locales destino"
              value={targetLocalIds}
              onChange={(e) => setTargetLocalIds(e.target.value)}
              fullWidth
            >
              {locales
                .filter((local) => local._id !== selectedLocal?._id)
                .map((local) => (
                  <MenuItem key={local._id} value={local._id}>
                    {local.nombre}
                  </MenuItem>
                ))}
            </TextField>
            <Typography variant="caption" color="text.secondary">
              Se copiaran redes sociales y logo web cliente al/los locales seleccionados.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloneOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={ejecutarClonado} disabled={cloneLoading}>
            {cloneLoading ? 'Clonando...' : 'Clonar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
