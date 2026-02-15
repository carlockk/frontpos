/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

const CarritoContext = createContext();

export const useCarrito = () => useContext(CarritoContext);

const normalizarAgregados = (agregados) => {
  if (!Array.isArray(agregados)) return [];
  return agregados
    .map((agg) => {
      if (!agg) return null;
      const agregadoId = agg.agregadoId || agg._id || null;
      const nombre = (agg.nombre || '').toString().trim();
      if (!nombre) return null;
      const precio = Number(agg.precio);
      return {
        agregadoId,
        nombre,
        precio: Number.isFinite(precio) && precio > 0 ? precio : 0
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
};

const buildKey = (productoId, varianteId, agregados = []) => {
  const addonsKey = normalizarAgregados(agregados)
    .map((agg) => agg.agregadoId || agg.nombre)
    .join('|');
  return `${productoId}-${varianteId || 'base'}-${addonsKey || 'sin-agregados'}`;
};

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

const calcularPrecioAgregados = (agregados = []) =>
  agregados.reduce((acc, agg) => acc + (Number(agg.precio) || 0), 0);

export function CarritoProvider({ children }) {
  const [carrito, setCarrito] = useState([]);

  const agregarProducto = (producto, variante = null, opciones = {}) => {
    setCarrito((prev) => {
      const productoId = producto._id || producto.productoId;
      const varianteId = variante?._id || null;
      const agregados = normalizarAgregados(opciones?.agregados);
      const key = buildKey(productoId, varianteId, agregados);
      const stockDisponible = obtenerStockDisponible(producto, variante);
      const precioBase =
        variante && variante.precio !== undefined && variante.precio !== null
          ? variante.precio
          : producto.precio;
      const precioBaseNumerico = Number(precioBase) || 0;
      const precioAgregados = calcularPrecioAgregados(agregados);
      const precio = precioBaseNumerico + precioAgregados;

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
          agregados,
          precioBase: precioBaseNumerico,
          precioAgregados,
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
        const agregados = normalizarAgregados(p.agregados);
        const precio = Number(p.precio ?? p.precio_unitario) || 0;
        const precioAgregados = calcularPrecioAgregados(agregados);
        return {
          idCarrito: buildKey(productoId, varianteId, agregados),
          _id: productoId,
          nombre: p.nombre,
          varianteId,
          varianteNombre: p.varianteNombre || '',
          atributos: Array.isArray(p.atributos) ? p.atributos : [],
          agregados,
          precioBase: Number(p.precioBase ?? (precio - precioAgregados)) || 0,
          precioAgregados,
          precio,
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
