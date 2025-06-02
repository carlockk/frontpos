import { createContext, useContext, useEffect, useState } from 'react';
import { obtenerHistorialCaja } from '../services/api';

const CajaContext = createContext();

export const useCaja = () => useContext(CajaContext);

export function CajaProvider({ children }) {
  const [cajaAbierta, setCajaAbierta] = useState(false);

  useEffect(() => {
    async function verificarCaja() {
      try {
        const { data } = await obtenerHistorialCaja();
        const abierta = data.find(c => !c.cierre);
        setCajaAbierta(!!abierta);
      } catch (error) {
        console.error('Error al verificar caja en contexto:', error);
      }
    }

    verificarCaja();
  }, []);

  return (
    <CajaContext.Provider value={{ cajaAbierta, setCajaAbierta }}>
      {children}
    </CajaContext.Provider>
  );
}
