/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

const CarritoContext = createContext();

export const useCarrito = () => useContext(CarritoContext);

export function CarritoProvider({ children }) {
  const [carrito, setCarrito] = useState([]);

  const agregarProducto = (producto) => {
    setCarrito(prev => {
      const existe = prev.find(p => p._id === producto._id);
      if (existe) {
        return prev.map(p =>
          p._id === producto._id ? { ...p, cantidad: p.cantidad + 1 } : p
        );
      }
      return [...prev, { ...producto, cantidad: 1, observacion: '' }];
    });
  };

  const actualizarCantidad = (id, cantidad) => {
    setCarrito(prev =>
      prev.map(p => p._id === id ? { ...p, cantidad: Math.max(1, cantidad) } : p)
    );
  };

  const actualizarObservacion = (id, texto) => {
    setCarrito(prev =>
      prev.map(p => p._id === id ? { ...p, observacion: texto } : p)
    );
  };

  const vaciarCarrito = () => setCarrito([]);

  const cargarCarrito = (items, reset = false) => {
    const normalizado = items.map(p => ({
      _id: p.productoId || p._id,
      nombre: p.nombre,
      cantidad: p.cantidad || 1,
      observacion: p.observacion || '',
      precio: Number(p.precio ?? p.precio_unitario) || 0
    }));
    if (reset) {
      setCarrito(normalizado); // 🔥 Reemplaza el carrito por completo
    } else {
      setCarrito(prev => [...prev, ...normalizado]); // 🔥 Suma productos al carrito existente
    }
  };

  return (
    <CarritoContext.Provider value={{
      carrito,
      agregarProducto,
      actualizarCantidad,
      actualizarObservacion,
      vaciarCarrito,
      cargarCarrito
    }}>
      {children}
    </CarritoContext.Provider>
  );
}
