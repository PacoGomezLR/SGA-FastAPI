import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/api";
import { useIsMobile } from "../hooks/useMediaQuery";
import * as styles from "./Recepciones.styles";

const initialForm = {
  producto_id: "",
  cantidad: "",
  observaciones: "",
  seccion_id: "",
  zona_id: "",
  ubicacion_destino_id: ""
};

function Recepciones() {
  const esMobile = useIsMobile();
  const [form, setForm] = useState(initialForm);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  const [productos, setProductos] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);

  const [mostrarSelectorUbicacion, setMostrarSelectorUbicacion] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);

  useEffect(() => {
    cargarDatosFormulario();
  }, []);

  async function cargarDatosFormulario() {
    try {
      setCargandoDatos(true);
      setError("");

      const [productosData, seccionesData, zonasData, ubicacionesData] =
        await Promise.all([
          apiFetch("/products/"),
          apiFetch("/sections/"),
          apiFetch("/zones/"),
          apiFetch("/locations/")
        ]);

      setProductos(Array.isArray(productosData) ? productosData : []);
      setSecciones(Array.isArray(seccionesData) ? seccionesData : []);
      setZonas(Array.isArray(zonasData) ? zonasData : []);
      setUbicaciones(Array.isArray(ubicacionesData) ? ubicacionesData : []);
    } catch (err) {
      setError(err.message || "Error al cargar los datos del formulario");
      setProductos([]);
      setSecciones([]);
      setZonas([]);
      setUbicaciones([]);
    } finally {
      setCargandoDatos(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "seccion_id" && {
        zona_id: "",
        ubicacion_destino_id: ""
      }),
      ...(name === "zona_id" && {
        ubicacion_destino_id: ""
      })
    }));
  }

  function abrirSelectorUbicacion() {
    setFilaSeleccionada(null);
    setMostrarSelectorUbicacion(true);
  }

  function cerrarSelectorUbicacion() {
    setMostrarSelectorUbicacion(false);
    setFilaSeleccionada(null);
  }

  function elegirUbicacion(ubicacion) {
    setForm((prev) => ({ ...prev, ubicacion_destino_id: ubicacion.id }));
    cerrarSelectorUbicacion();
  }

  const zonasFiltradas = useMemo(() => {
    if (!form.seccion_id) return [];

    return zonas.filter(
      (zona) => String(zona.seccion_id) === String(form.seccion_id)
    );
  }, [zonas, form.seccion_id]);

  const ubicacionesFiltradas = useMemo(() => {
    if (!form.zona_id) return [];

    return ubicaciones.filter(
      (ubicacion) => String(ubicacion.zona_id) === String(form.zona_id)
    );
  }, [ubicaciones, form.zona_id]);

  const filasDeZona = useMemo(() => {
    const filas = new Map();

    ubicacionesFiltradas.forEach((ubicacion) => {
      const clave = ubicacion.eje_x ?? ubicacion.codigo;

      if (!filas.has(clave)) {
        filas.set(clave, { fila: ubicacion.eje_x, ubicaciones: [] });
      }
      filas.get(clave).ubicaciones.push(ubicacion);
    });

    const lista = Array.from(filas.values()).sort((a, b) => {
      if (a.fila == null) return 1;
      if (b.fila == null) return -1;
      return a.fila - b.fila;
    });

    lista.forEach((f) => {
      f.ubicaciones.sort((a, b) => (a.eje_y ?? 0) - (b.eje_y ?? 0));
    });

    return lista;
  }, [ubicacionesFiltradas]);

  const productoSeleccionado = useMemo(() => {
    return productos.find(
      (producto) => String(producto.id) === String(form.producto_id)
    );
  }, [productos, form.producto_id]);

  const seccionSeleccionada = useMemo(() => {
    return secciones.find(
      (seccion) => String(seccion.id) === String(form.seccion_id)
    );
  }, [secciones, form.seccion_id]);

  const zonaSeleccionada = useMemo(() => {
    return zonas.find((zona) => String(zona.id) === String(form.zona_id));
  }, [zonas, form.zona_id]);

  const ubicacionSeleccionada = useMemo(() => {
    return ubicaciones.find(
      (ubicacion) => String(ubicacion.id) === String(form.ubicacion_destino_id)
    );
  }, [ubicaciones, form.ubicacion_destino_id]);

  async function handleSubmit(e) {
    e.preventDefault();

    setMensaje("");
    setError("");

    if (!form.ubicacion_destino_id) {
      setError("Debes seleccionar una ubicación de destino");
      return;
    }

    setCargando(true);

    const payload = {
      seccion_id: Number(form.seccion_id),
      observaciones: form.observaciones.trim() || null,
      lineas: [
        {
          producto_id: Number(form.producto_id),
          cantidad: Number(form.cantidad),
          ubicacion_destino_id: Number(form.ubicacion_destino_id),
          observaciones: null
        }
      ]
    };

    try {
      const data = await apiFetch("/receptions/", {
        method: "POST",
        body: payload
      });

      await apiFetch(`/receptions/${data.id}/confirm`, {
        method: "PUT"
      });

      setMensaje(`Recepción creada y confirmada correctamente con ID ${data.id}`);
      setForm(initialForm);
    } catch (err) {
      setError(err.message || "Error al crear y confirmar la recepción");
    } finally {
      setCargando(false);
    }
  }

  function limpiarFormulario() {
    setForm(initialForm);
    setMensaje("");
    setError("");
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={{ margin: 0 }}>Recepciones</h1>
          <p style={styles.subtitle}>
            Registra la entrada de mercancía y confirma automáticamente su stock.
          </p>
        </div>
      </div>

      {mensaje && <div style={styles.successBox}>{mensaje}</div>}
      {error && <div style={styles.errorBox}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={esMobile ? styles.topGridMobile : styles.topGrid}>
          <section style={styles.card}>
            <div style={styles.stepBadge}>1</div>
            <h2 style={styles.cardTitle}>Datos de la recepción</h2>

            <div style={styles.fieldGroup}>
              <label htmlFor="producto_id" style={styles.label}>
                Producto
              </label>
              <select
                id="producto_id"
                name="producto_id"
                value={form.producto_id}
                onChange={handleChange}
                required
                style={styles.input}
                disabled={cargandoDatos || cargando}
              >
                <option value="">Selecciona un producto</option>
                {productos.map((producto) => (
                  <option key={producto.id} value={producto.id}>
                    {producto.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label htmlFor="cantidad" style={styles.label}>
                Cantidad
              </label>
              <input
                id="cantidad"
                type="number"
                name="cantidad"
                placeholder="Ej: 25"
                value={form.cantidad}
                onChange={handleChange}
                required
                min="1"
                style={styles.input}
                disabled={cargando}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label htmlFor="observaciones" style={styles.label}>
                Observaciones
              </label>
              <textarea
                id="observaciones"
                name="observaciones"
                placeholder="Observaciones de la recepción"
                value={form.observaciones}
                onChange={handleChange}
                rows="4"
                style={styles.textarea}
                disabled={cargando}
              />
            </div>
          </section>

          <section style={styles.card}>
            <div style={styles.stepBadge}>2</div>
            <h2 style={styles.cardTitle}>Destino</h2>

            <div style={styles.fieldGroup}>
              <label htmlFor="seccion_id" style={styles.label}>
                Sección
              </label>
              <select
                id="seccion_id"
                name="seccion_id"
                value={form.seccion_id}
                onChange={handleChange}
                required
                style={styles.input}
                disabled={cargandoDatos || cargando}
              >
                <option value="">Selecciona una sección</option>
                {secciones.map((seccion) => (
                  <option key={seccion.id} value={seccion.id}>
                    {seccion.descripcion
                      ? `${seccion.nombre} — ${seccion.descripcion}`
                      : seccion.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label htmlFor="zona_id" style={styles.label}>
                Zona
              </label>
              <select
                id="zona_id"
                name="zona_id"
                value={form.zona_id}
                onChange={handleChange}
                required
                style={styles.input}
                disabled={!form.seccion_id || cargandoDatos || cargando}
              >
                <option value="">Selecciona una zona</option>
                {zonasFiltradas.map((zona) => (
                  <option key={zona.id} value={zona.id}>
                    {zona.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Ubicación</label>
              <button
                type="button"
                style={styles.ubicacionButton}
                onClick={abrirSelectorUbicacion}
                disabled={!form.zona_id || cargandoDatos || cargando}
              >
                {ubicacionSeleccionada?.codigo || "Selecciona una ubicación"}
              </button>
              <input
                type="hidden"
                name="ubicacion_destino_id"
                value={form.ubicacion_destino_id}
              />
            </div>
          </section>
        </div>

        <section style={styles.summaryCard}>
          <div style={styles.stepBadge}>3</div>
          <h2 style={styles.cardTitle}>Resumen</h2>

          <div style={styles.summaryGrid}>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Producto</span>
              <strong style={styles.summaryValue}>
                {productoSeleccionado?.nombre || "-"}
              </strong>
            </div>

            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Cantidad</span>
              <strong style={styles.summaryValue}>{form.cantidad || "-"}</strong>
            </div>

            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Sección</span>
              <strong style={styles.summaryValue}>
                {seccionSeleccionada?.nombre || "-"}
              </strong>
            </div>

            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Zona</span>
              <strong style={styles.summaryValue}>{zonaSeleccionada?.nombre || "-"}</strong>
            </div>

            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Ubicación</span>
              <strong style={styles.summaryValue}>
                {ubicacionSeleccionada?.codigo || "-"}
              </strong>
            </div>
          </div>

          <div style={styles.actions}>
            <button
              type="submit"
              disabled={cargando || cargandoDatos}
              style={{
                ...styles.primaryButton,
                backgroundColor:
                  cargando || cargandoDatos ? "#94a3b8" : "#0f172a",
                cursor: cargando || cargandoDatos ? "not-allowed" : "pointer"
              }}
            >
              {cargando ? "Procesando..." : "Crear y confirmar recepción"}
            </button>

            <button
              type="button"
              onClick={limpiarFormulario}
              style={styles.secondaryButton}
              disabled={cargando}
            >
              Limpiar
            </button>
          </div>
        </section>
      </form>

      {mostrarSelectorUbicacion && (
        <div style={styles.modalOverlay} onClick={cerrarSelectorUbicacion}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            {!filaSeleccionada ? (
              <>
                <h2 style={styles.modalTitle}>Selecciona una fila</h2>
                <p style={styles.modalSubtitle}>
                  Zona: <strong>{zonaSeleccionada?.nombre}</strong>
                </p>

                {filasDeZona.length === 0 ? (
                  <p style={styles.locationText}>
                    Esta zona todavía no tiene ubicaciones.
                  </p>
                ) : (
                  <div style={styles.locationsList}>
                    {filasDeZona.map((f) => (
                      <button
                        type="button"
                        key={f.fila ?? f.ubicaciones[0]?.id}
                        style={styles.locationItemButton}
                        onClick={() => setFilaSeleccionada(f)}
                      >
                        <div style={styles.locationCode}>
                          {f.fila != null ? `Fila ${f.fila}` : "Sin fila"}
                        </div>
                        <div style={styles.locationText}>
                          {f.ubicaciones.length} altura
                          {f.ubicaciones.length === 1 ? "" : "s"}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 style={styles.modalTitle}>
                  {filaSeleccionada.fila != null
                    ? `Fila ${filaSeleccionada.fila}`
                    : "Sin fila"}
                </h2>
                <p style={styles.modalSubtitle}>
                  Zona: <strong>{zonaSeleccionada?.nombre}</strong>
                </p>

                <div style={styles.locationsList}>
                  {filaSeleccionada.ubicaciones.map((ubicacion) => (
                    <button
                      type="button"
                      key={ubicacion.id}
                      style={styles.locationItemButton}
                      onClick={() => elegirUbicacion(ubicacion)}
                    >
                      <div style={styles.locationCode}>
                        {ubicacion.eje_y != null
                          ? `Altura ${ubicacion.eje_y}`
                          : ubicacion.codigo}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            <div style={styles.modalActions}>
              <button
                type="button"
                style={styles.secondaryButton}
                onClick={
                  filaSeleccionada
                    ? () => setFilaSeleccionada(null)
                    : cerrarSelectorUbicacion
                }
              >
                {filaSeleccionada ? "Volver" : "Cerrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Recepciones;