import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('usuario');
    if (stored) setUsuario(JSON.parse(stored));
  }, []);

  const login = (data) => {
    setUsuario(data);
    localStorage.setItem('usuario', JSON.stringify(data)); // ✅ Incluye nombre
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('usuario');
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
