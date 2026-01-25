import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [selectedLocal, setSelectedLocal] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('usuario');
    if (stored) {
      const parsed = JSON.parse(stored);
      setUsuario(parsed);
      if (parsed?.rol && parsed.rol !== 'superadmin') {
        setSelectedLocal(parsed.local || null);
      } else {
        const storedLocal = localStorage.getItem('localSeleccionado');
        if (storedLocal) {
          setSelectedLocal(JSON.parse(storedLocal));
        }
      }
    }
  }, []);

  const login = (data) => {
    setUsuario(data);
    localStorage.setItem('usuario', JSON.stringify(data)); // ✅ Incluye nombre
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
    localStorage.removeItem('usuario');
    localStorage.removeItem('localSeleccionado');
    setSelectedLocal(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, selectedLocal, seleccionarLocal }}>
      {children}
    </AuthContext.Provider>
  );
}
