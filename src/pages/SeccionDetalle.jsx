import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api/api";
import * as styles from "./SeccionDetalle.styles";

function SeccionDetalle() {
  const { id } = useParams();

  const [seccion, setSeccion] = useState(null);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [stock, setStock] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [columnaSeleccionada, setColumnaSeleccionada] = useState(null);

  useEffect(() => {
    cargarDetalle();
  }, [id]);

  async function cargarDetalle() {
    try {
      setCargando(true);
      setError("");

      const [seccionData, ubicacionesData, stockData] = await Promise.all([
        apiFetch(`/sections/${id}`),
        apiFetch("/locations/"),
        apiFetch("/stock/", { params: { seccion_id: id } })
      ]);

      setSeccion(seccionData || null);

      const ubicacionesSeccion = Array.isArray(ubicacionesData)
        ? ubicacionesData.filter((u) => String(u.seccion_id) === String(id))
        : [];

      setUbicaciones(ubicacionesSeccion);
      setStock(Array.isArray(stockData) ? stockData : []);
    } catch (err) {
      setError(err.message || "Error al cargar el detalle de la sección");
      setSeccion(null);
      setUbicaciones([]);
      setStock([]);
    } finally {
      setCargando(false);
    }
  }

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

  const columnas = useMemo(() => {
    const mapa = new Map();

    ubicaciones.forEach((ubicacion) => {
      const clave = ubicacion.columna ?? ubicacion.codigo;

      if (!mapa.has(clave)) {
        mapa.set(clave, { columna: ubicacion.columna, ubicaciones: [] });
      }
      mapa.get(clave).ubicaciones.push(ubicacion);
    });

    const lista = Array.from(mapa.values()).sort((a, b) => {
      if (a.columna == null) return 1;
      if (b.columna == null) return -1;
      return a.columna - b.columna;
    });

    lista.forEach((c) => {
      c.ubicaciones.sort((a, b) => (a.fila ?? 0) - (b.fila ?? 0));
    });

    return lista;
  }, [ubicaciones]);

  function abrirColumna(columna) {
    setColumnaSeleccionada(columna);
  }

  function cerrarColumna() {
    setColumnaSeleccionada(null);
  }

  if (cargando) {
    return <p>Cargando detalle de la sección...</p>;
  }

  if (error) {
    return <p style={{ color: "#991b1b" }}>{error}</p>;
  }

  if (!seccion) {
    return <p>No se ha encontrado la sección.</p>;
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={{ margin: 0 }}>{seccion.nombre}</h1>
          <p style={styles.subtitle}>
            Rejilla de la sección y sus ubicaciones
          </p>
        </div>

        <Link to="/secciones" style={styles.backButton}>
          Volver a secciones
        </Link>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.infoCard}>
        <div style={styles.infoGrid}>
          <div>
            <div style={styles.infoLabel}>Descripción</div>
            <div style={styles.infoValue}>{seccion.descripcion || "-"}</div>
          </div>

          <div>
            <div style={styles.infoLabel}>Dirección</div>
            <div style={styles.infoValue}>{seccion.direccion || "-"}</div>
          </div>

          <div>
            <div style={styles.infoLabel}>Estado</div>
            <span
              style={{
                ...styles.badge,
                backgroundColor: seccion.activo ? "#dcfce7" : "#fee2e2",
                color: seccion.activo ? "#166534" : "#991b1b"
              }}
            >
              {seccion.activo ? "Activo" : "Inactivo"}
            </span>
          </div>

          <div>
            <div style={styles.infoLabel}>Rejilla</div>
            <div style={styles.infoValue}>
              {seccion.num_columnas ?? "?"} columnas × {seccion.num_filas ?? "?"} filas
            </div>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={{ margin: 0 }}>Columnas y ubicaciones</h2>
        </div>

        {columnas.length === 0 ? (
          <div style={styles.emptyBox}>Esta sección todavía no tiene ubicaciones.</div>
        ) : (
          <div style={styles.locationsList}>
            {columnas.map((c) => (
              <button
                type="button"
                key={c.columna ?? c.ubicaciones[0]?.id}
                style={styles.locationItemButton}
                onClick={() => abrirColumna(c)}
              >
                <div style={styles.locationCode}>
                  {c.columna != null ? `Columna ${c.columna}` : "Sin columna"}
                </div>
                <div style={styles.locationText}>
                  {c.ubicaciones.length} fila
                  {c.ubicaciones.length === 1 ? "" : "s"}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {columnaSeleccionada && (
        <div style={styles.modalOverlay} onClick={cerrarColumna}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>
              {columnaSeleccionada.columna != null
                ? `Columna ${columnaSeleccionada.columna}`
                : "Sin columna"}
            </h2>

            <div style={styles.locationsList}>
              {columnaSeleccionada.ubicaciones.map((ubicacion) => {
                const stockUbicacion = stockPorUbicacion.get(ubicacion.id) || [];

                return (
                  <div key={ubicacion.id} style={styles.locationItem}>
                    <div style={styles.locationCode}>
                      {ubicacion.fila != null
                        ? `Fila ${ubicacion.fila}`
                        : ubicacion.codigo || `Ubicación ${ubicacion.id}`}
                    </div>

                    {stockUbicacion.length === 0 ? (
                      <div style={styles.locationText}>Sin productos</div>
                    ) : (
                      <div style={styles.locationText}>
                        {stockUbicacion.map((linea) => (
                          <div key={linea.ubicacion_id + "-" + linea.producto_id}>
                            {linea.producto_nombre || `Producto ${linea.producto_id}`}
                            {" — "}
                            {linea.cantidad}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ ...styles.modalActions, marginTop: "16px" }}>
              <button type="button" style={styles.secondaryButton} onClick={cerrarColumna}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default SeccionDetalle;
