import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../api/api";
import { construirLayoutMultiple } from "./mapLayout";

export function useSectionLayout() {
  const [secciones, setSecciones] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [stock, setStock] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async (opciones = {}) => {
    const { silencioso = false } = opciones;

    try {
      if (!silencioso) setCargando(true);
      setError("");

      const [seccionesData, ubicacionesData, stockData] = await Promise.all([
        apiFetch("/sections/"),
        apiFetch("/locations/"),
        apiFetch("/stock/")
      ]);

      setSecciones(Array.isArray(seccionesData) ? seccionesData : []);
      setUbicaciones(Array.isArray(ubicacionesData) ? ubicacionesData : []);
      setStock(Array.isArray(stockData) ? stockData : []);
    } catch (err) {
      setError(err.message || "Error al cargar el layout de las secciones");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      if (!cancelado) await cargar();
    })();

    return () => {
      cancelado = true;
    };
  }, [cargar]);

  const layout = useMemo(
    () => construirLayoutMultiple(secciones, ubicaciones),
    [secciones, ubicaciones]
  );

  const stockPorUbicacion = useMemo(() => {
    const mapa = new Map();

    stock.forEach((linea) => {
      if (!mapa.has(linea.ubicacion_id)) {
        mapa.set(linea.ubicacion_id, []);
      }
      mapa.get(linea.ubicacion_id).push(linea);
    });

    return mapa;
  }, [stock]);

  const tieneLayout = layout.length > 0;

  return {
    layout,
    stockPorUbicacion,
    secciones,
    cargando,
    error,
    tieneLayout,
    recargar: cargar
  };
}
