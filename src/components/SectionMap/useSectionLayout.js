import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../api/api";
import { construirLayoutMultiple, extraerZonasEnEspera } from "./mapLayout";

export function useSectionLayout() {
  const [secciones, setSecciones] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [stock, setStock] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setError("");

      const [seccionesData, zonasData, ubicacionesData, stockData] = await Promise.all([
        apiFetch("/sections/"),
        apiFetch("/zones/"),
        apiFetch("/locations/"),
        apiFetch("/stock/")
      ]);

      setSecciones(Array.isArray(seccionesData) ? seccionesData : []);
      setZonas(Array.isArray(zonasData) ? zonasData : []);
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
    () => construirLayoutMultiple(secciones, zonas, ubicaciones),
    [secciones, zonas, ubicaciones]
  );

  const zonasEnEspera = useMemo(
    () => extraerZonasEnEspera(secciones, zonas, ubicaciones),
    [secciones, zonas, ubicaciones]
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
    zonasEnEspera,
    stockPorUbicacion,
    secciones,
    zonas,
    cargando,
    error,
    tieneLayout,
    recargar: cargar
  };
}
