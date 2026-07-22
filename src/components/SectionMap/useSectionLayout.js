import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../api/api";
import { construirLayout } from "./mapLayout";

export function useSectionLayout(seccionId) {
  const [zonas, setZonas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [stock, setStock] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!seccionId) return;

    let cancelado = false;

    async function cargar() {
      try {
        setCargando(true);
        setError("");

        const [zonasData, ubicacionesData, stockData] = await Promise.all([
          apiFetch("/zones/"),
          apiFetch("/locations/"),
          apiFetch("/stock/", { params: { seccion_id: seccionId } })
        ]);

        if (cancelado) return;

        const zonasSeccion = Array.isArray(zonasData)
          ? zonasData.filter((z) => String(z.seccion_id) === String(seccionId))
          : [];

        setZonas(zonasSeccion);
        setUbicaciones(Array.isArray(ubicacionesData) ? ubicacionesData : []);
        setStock(Array.isArray(stockData) ? stockData : []);
      } catch (err) {
        if (!cancelado) {
          setError(err.message || "Error al cargar el layout de la sección");
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();

    return () => {
      cancelado = true;
    };
  }, [seccionId]);

  const layout = useMemo(() => construirLayout(zonas, ubicaciones), [zonas, ubicaciones]);

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
