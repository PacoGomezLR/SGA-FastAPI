import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api/api";
import * as styles from "./SeccionDetalle.styles";

const initialLocationForm = {
  codigo: "",
  descripcion: "",
  activa: true
};

function SeccionDetalle() {
  const { id } = useParams();

  const [seccion, setSeccion] = useState(null);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [stock, setStock] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [columnaSeleccionada, setColumnaSeleccionada] = useState(null);

  const [mostrarModalUbicacion, setMostrarModalUbicacion] = useState(false);
  const [locationForm, setLocationForm] = useState(initialLocationForm);
  const [guardandoUbicacion, setGuardandoUbicacion] = useState(false);

  const [mostrarModalResize, setMostrarModalResize] = useState(false);
  const [resizeForm, setResizeForm] = useState({ numColumnas: "", numFilas: "" });
  const [guardandoResize, setGuardandoResize] = useState(false);
  const [resizeError, setResizeError] = useState("");

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

  function abrirModalUbicacion() {
    setLocationForm(initialLocationForm);
    setMensaje("");
    setError("");
    setMostrarModalUbicacion(true);
  }

  function cerrarModalUbicacion() {
    if (guardandoUbicacion) return;

    setMostrarModalUbicacion(false);
    setLocationForm(initialLocationForm);
  }

  function handleLocationChange(e) {
    const { name, value, type, checked } = e.target;

    setLocationForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  async function crearUbicacion(e) {
    e.preventDefault();

    if (!locationForm.codigo.trim()) {
      setError("El código de la ubicación es obligatorio");
      return;
    }

    try {
      setGuardandoUbicacion(true);
      setError("");
      setMensaje("");

      const payload = {
        seccion_id: Number(id),
        codigo: locationForm.codigo.trim(),
        descripcion: locationForm.descripcion.trim() || null,
        activa: locationForm.activa
      };

      await apiFetch("/locations/", {
        method: "POST",
        body: payload
      });

      setMensaje("Ubicación creada correctamente");
      cerrarModalUbicacion();
      await cargarDetalle();
    } catch (err) {
      setError(err.message || "Error al crear la ubicación");
    } finally {
      setGuardandoUbicacion(false);
    }
  }

  function abrirModalResize() {
    setResizeForm({
      numColumnas: String(seccion?.num_columnas ?? ""),
      numFilas: String(seccion?.num_filas ?? "")
    });
    setResizeError("");
    setMostrarModalResize(true);
  }

  function cerrarModalResize() {
    if (guardandoResize) return;

    setMostrarModalResize(false);
    setResizeError("");
  }

  function handleResizeChange(e) {
    const { name, value } = e.target;
    setResizeForm((prev) => ({ ...prev, [name]: value }));
  }

  async function enviarResize(e) {
    e.preventDefault();

    try {
      setGuardandoResize(true);
      setResizeError("");

      const body = {
        num_columnas: resizeForm.numColumnas ? Number(resizeForm.numColumnas) : null,
        num_filas: resizeForm.numFilas ? Number(resizeForm.numFilas) : null
      };

      const respuesta = await apiFetch(`/section-layout/${id}/resize`, {
        method: "PATCH",
        body
      });

      setMensaje(respuesta.mensaje || "Sección redimensionada correctamente");
      setMostrarModalResize(false);
      await cargarDetalle();
    } catch (err) {
      setResizeError(err.message || "Error al redimensionar la sección");
    } finally {
      setGuardandoResize(false);
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

      {mensaje && <div style={styles.successBox}>{mensaje}</div>}
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

          <div style={{ display: "flex", gap: "8px" }}>
            {columnas.length > 0 && (
              <button type="button" style={styles.secondaryButton} onClick={abrirModalResize}>
                Redimensionar
              </button>
            )}

            <button type="button" style={styles.createButton} onClick={abrirModalUbicacion}>
              + Nueva ubicación
            </button>
          </div>
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

      {mostrarModalUbicacion && (
        <div style={styles.modalOverlay} onClick={cerrarModalUbicacion}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Nueva ubicación</h2>

            <form onSubmit={crearUbicacion}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Código</label>
                <input
                  name="codigo"
                  placeholder="Ej: C1-F1, EST-01..."
                  value={locationForm.codigo}
                  onChange={handleLocationChange}
                  required
                  style={styles.input}
                  autoFocus
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Descripción</label>
                <input
                  name="descripcion"
                  placeholder="Descripción de la ubicación"
                  value={locationForm.descripcion}
                  onChange={handleLocationChange}
                  style={styles.input}
                />
              </div>

              <label style={styles.checkboxCard}>
                <input
                  type="checkbox"
                  name="activa"
                  checked={locationForm.activa}
                  onChange={handleLocationChange}
                />
                <span>Ubicación activa</span>
              </label>

              <div style={styles.modalActions}>
                <button
                  type="submit"
                  style={styles.primaryButton}
                  disabled={guardandoUbicacion}
                >
                  {guardandoUbicacion ? "Creando..." : "Crear ubicación"}
                </button>

                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={cerrarModalUbicacion}
                  disabled={guardandoUbicacion}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalResize && (
        <div style={styles.modalOverlay} onClick={cerrarModalResize}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Redimensionar sección</h2>

            {resizeError && <div style={styles.errorBox}>{resizeError}</div>}

            <form onSubmit={enviarResize}>
              <div style={styles.zoneFormGrid}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Columnas</label>
                  <input
                    type="number"
                    name="numColumnas"
                    min="1"
                    value={resizeForm.numColumnas}
                    onChange={handleResizeChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Filas</label>
                  <input
                    type="number"
                    name="numFilas"
                    min="1"
                    value={resizeForm.numFilas}
                    onChange={handleResizeChange}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="submit"
                  style={styles.primaryButton}
                  disabled={guardandoResize}
                >
                  {guardandoResize ? "Aplicando..." : "Redimensionar"}
                </button>

                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={cerrarModalResize}
                  disabled={guardandoResize}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SeccionDetalle;
