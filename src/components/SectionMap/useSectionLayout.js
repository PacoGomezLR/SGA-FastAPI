import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../api/api";
import { construirLayoutMultiple } from "./mapLayout";

export function useSectionLayout() {
  const [secciones, setSecciones] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [stock, setStock] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        setCargando(true);
        setError("");

        const [seccionesData, zonasData, ubicacionesData, stockData] = await Promise.all([
          apiFetch("/sections/"),
          apiFetch("/zones/"),
          apiFetch("/locations/"),
          apiFetch("/stock/")
        ]);

        if (cancelado) return;

        setSecciones(Array.isArray(seccionesData) ? seccionesData : []);
        setZonas(Array.isArray(zonasData) ? zonasData : []);
        setUbicaciones(Array.isArray(ubicacionesData) ? ubicacionesData : []);
        setStock(Array.isArray(stockData) ? stockData : []);
      } catch (err) {
        if (!cancelado) {
          setError(err.message || "Error al cargar el layout de las secciones");
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();

    return () => {
      cancelado = true;
    };
  }, []);

  const layout = useMemo(
    () => construirLayoutMultiple(secciones, zonas, ubicaciones),
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

  return { layout, stockPorUbicacion, cargando, error, tieneLayout };
}
