import { createContext, useContext, useState, useEffect } from 'react';
import { SESSION_EXPIRED_EVENT } from '../services/api';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [selectedLocal, setSelectedLocal] = useState(null);
  const [sessionDeadline, setSessionDeadline] = useState(null);

  const decodeJwtExpMs = (token) => {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const payload = JSON.parse(atob(padded));
      const exp = Number(payload?.exp);
      if (!Number.isFinite(exp)) return null;
      return exp * 1000;
    } catch (_err) {
      return null;
    }
  };

  const clearSessionStorage = () => {
    localStorage.removeItem('usuario');
    localStorage.removeItem('localSeleccionado');
  };

  useEffect(() => {
    const stored = localStorage.getItem('usuario');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (!parsed?.token) {
          clearSessionStorage();
          return;
        }
        const expMs = decodeJwtExpMs(parsed.token);
        if (expMs && expMs <= Date.now()) {
          clearSessionStorage();
          return;
        }
        setUsuario(parsed);
        setSessionDeadline(expMs || null);
        if (parsed?.rol && parsed.rol !== 'superadmin') {
          setSelectedLocal(parsed.local || null);
        } else {
          const storedLocal = localStorage.getItem('localSeleccionado');
          if (storedLocal) {
            setSelectedLocal(JSON.parse(storedLocal));
          }
        }
      } catch (_err) {
        clearSessionStorage();
      }
    }
  }, []);

  const login = (data) => {
    setUsuario(data);
    localStorage.setItem('usuario', JSON.stringify(data)); // ✅ Incluye nombre
    setSessionDeadline(decodeJwtExpMs(data?.token) || null);
    if (data?.rol && data.rol !== 'superadmin') {
      setSelectedLocal(data.local || null);
      localStorage.setItem('localSeleccionado', JSON.stringify(data.local || null));
    } else {
      setSelectedLocal(null);
      localStorage.removeItem('localSeleccionado');
    }
  };

  const seleccionarLocal = (local) => {
    setSelectedLocal(local || null);
    if (local) {
      localStorage.setItem('localSeleccionado', JSON.stringify(local));
    } else {
      localStorage.removeItem('localSeleccionado');
    }
  };

  const logout = () => {
    setUsuario(null);
    clearSessionStorage();
    setSelectedLocal(null);
    setSessionDeadline(null);
  };

  useEffect(() => {
    if (!sessionDeadline) return undefined;
    const msLeft = sessionDeadline - Date.now();
    if (msLeft <= 0) {
      logout();
      return undefined;
    }
    const timeoutId = window.setTimeout(() => {
      logout();
    }, msLeft);
    return () => window.clearTimeout(timeoutId);
  }, [sessionDeadline]);

  useEffect(() => {
    const onSessionExpired = () => logout();
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, login, logout, selectedLocal, seleccionarLocal }}>
      {children}
    </AuthContext.Provider>
  );
}
