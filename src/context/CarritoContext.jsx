/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

const CarritoContext = createContext();

export const useCarrito = () => useContext(CarritoContext);

const buildKey = (productoId, varianteId) => `${productoId}-${varianteId || 'base'}`;

const construirAtributos = (variante, atributos) => {
  if (Array.isArray(atributos) && atributos.length > 0) {
    return atributos;
  }
  const detalle = [];
  if (variante?.color) detalle.push({ nombre: 'Color', valor: variante.color });
  if (variante?.talla) detalle.push({ nombre: 'Talla', valor: variante.talla });
  return detalle;
};

const obtenerStockDisponible = (producto, variante) => {
  if (variante && typeof variante.stock === 'number') {
    return variante.stock;
  }
  if (typeof producto?.stock === 'number') return producto.stock;
  return null;
};

const mergeItems = (items) => {
  const mapa = new Map();
  items.forEach((item) => {
    if (mapa.has(item.idCarrito)) {
      const existente = mapa.get(item.idCarrito);
      mapa.set(item.idCarrito, {
        ...existente,
        cantidad: existente.cantidad + item.cantidad,
        observacion: existente.observacion || item.observacion,
        stockDisponible:
          typeof existente.stockDisponible === 'number'
            ? existente.stockDisponible
            : item.stockDisponible
      });
    } else {
      mapa.set(item.idCarrito, { ...item });
    }
  });
  return Array.from(mapa.values());
};

export function CarritoProvider({ children }) {
  const [carrito, setCarrito] = useState([]);

  const agregarProducto = (producto, variante = null) => {
    setCarrito((prev) => {
      const productoId = producto._id || producto.productoId;
      const varianteId = variante?._id || null;
      const key = buildKey(productoId, varianteId);
      const stockDisponible = obtenerStockDisponible(producto, variante);
      const precioBase =
        variante && variante.precio !== undefined && variante.precio !== null
          ? variante.precio
          : producto.precio;
      const precio = Number(precioBase) || 0;

      const existente = prev.find((p) => p.idCarrito === key);
      if (existente) {
        const max = typeof existente.stockDisponible === 'number' ? existente.stockDisponible : Infinity;
        if (existente.cantidad >= max) {
          return prev;
        }
        return prev.map((p) =>
          p.idCarrito === key
            ? { ...p, cantidad: Math.min(max, p.cantidad + 1) }
            : p
        );
      }

      return [
        ...prev,
        {
          idCarrito: key,
          _id: productoId,
          nombre: producto.nombre,
          varianteId,
          varianteNombre: variante?.nombre || '',
          atributos: construirAtributos(variante),
          precio,
          cantidad: 1,
          observacion: '',
          stockDisponible
        }
      ];
    });
  };

  const actualizarCantidad = (id, cantidad) => {
    setCarrito((prev) =>
      prev.map((item) => {
        if (item.idCarrito !== id) return item;
        const max = typeof item.stockDisponible === 'number' ? item.stockDisponible : Infinity;
        const nuevaCantidad = Math.min(Math.max(1, cantidad), max);
        return { ...item, cantidad: nuevaCantidad };
      })
    );
  };

  const actualizarObservacion = (id, texto) => {
    setCarrito((prev) =>
      prev.map((item) =>
        item.idCarrito === id ? { ...item, observacion: texto } : item
      )
    );
  };

  const vaciarCarrito = () => setCarrito([]);

  const cargarCarrito = (items, reset = false) => {
    const normalizado = mergeItems(
      (items || []).map((p) => {
        const productoId = p.productoId || p._id;
        const varianteId = p.varianteId || null;
        return {
          idCarrito: buildKey(productoId, varianteId),
          _id: productoId,
          nombre: p.nombre,
          varianteId,
          varianteNombre: p.varianteNombre || '',
          atributos: Array.isArray(p.atributos) ? p.atributos : [],
          precio: Number(p.precio ?? p.precio_unitario) || 0,
          cantidad: p.cantidad || 1,
          observacion: p.observacion || '',
          stockDisponible: typeof p.stockDisponible === 'number' ? p.stockDisponible : null
        };
      })
    );

    if (reset) {
      setCarrito(normalizado);
    } else {
      setCarrito((prev) => mergeItems([...prev, ...normalizado]));
    }
  };

  return (
    <CarritoContext.Provider
      value={{
        carrito,
        agregarProducto,
        actualizarCantidad,
        actualizarObservacion,
        vaciarCarrito,
        cargarCarrito
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
}
