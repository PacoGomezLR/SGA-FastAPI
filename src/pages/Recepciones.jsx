import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/api";
import { useIsMobile } from "../hooks/useMediaQuery";
import * as styles from "./Recepciones.styles";

const initialForm = {
  producto_id: "",
  cantidad: "",
  observaciones: "",
  seccion_id: "",
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
  const [ubicaciones, setUbicaciones] = useState([]);

  const [mostrarSelectorUbicacion, setMostrarSelectorUbicacion] = useState(false);
  const [columnaSeleccionada, setColumnaSeleccionada] = useState(null);

  useEffect(() => {
    cargarDatosFormulario();
  }, []);

  async function cargarDatosFormulario() {
    try {
      setCargandoDatos(true);
      setError("");

      const [productosData, seccionesData, ubicacionesData] =
        await Promise.all([
          apiFetch("/products/"),
          apiFetch("/sections/"),
          apiFetch("/locations/")
        ]);

      setProductos(Array.isArray(productosData) ? productosData : []);
      setSecciones(Array.isArray(seccionesData) ? seccionesData : []);
      setUbicaciones(Array.isArray(ubicacionesData) ? ubicacionesData : []);
    } catch (err) {
      setError(err.message || "Error al cargar los datos del formulario");
      setProductos([]);
      setSecciones([]);
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
        ubicacion_destino_id: ""
      })
    }));
  }

  function abrirSelectorUbicacion() {
    setColumnaSeleccionada(null);
    setMostrarSelectorUbicacion(true);
  }

  function cerrarSelectorUbicacion() {
    setMostrarSelectorUbicacion(false);
    setColumnaSeleccionada(null);
  }

  function elegirUbicacion(ubicacion) {
    setForm((prev) => ({ ...prev, ubicacion_destino_id: ubicacion.id }));
    cerrarSelectorUbicacion();
  }

  const ubicacionesFiltradas = useMemo(() => {
    if (!form.seccion_id) return [];

    return ubicaciones.filter(
      (ubicacion) => String(ubicacion.seccion_id) === String(form.seccion_id)
    );
  }, [ubicaciones, form.seccion_id]);

  const columnasDeSeccion = useMemo(() => {
    const columnas = new Map();

    ubicacionesFiltradas.forEach((ubicacion) => {
      const clave = ubicacion.columna ?? ubicacion.codigo;

      if (!columnas.has(clave)) {
        columnas.set(clave, { columna: ubicacion.columna, ubicaciones: [] });
      }
      columnas.get(clave).ubicaciones.push(ubicacion);
    });

    const lista = Array.from(columnas.values()).sort((a, b) => {
      if (a.columna == null) return 1;
      if (b.columna == null) return -1;
      return a.columna - b.columna;
    });

    lista.forEach((c) => {
      c.ubicaciones.sort((a, b) => (a.fila ?? 0) - (b.fila ?? 0));
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
              <label style={styles.label}>Ubicación</label>
              <button
                type="button"
                style={styles.ubicacionButton}
                onClick={abrirSelectorUbicacion}
                disabled={!form.seccion_id || cargandoDatos || cargando}
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
            {!columnaSeleccionada ? (
              <>
                <h2 style={styles.modalTitle}>Selecciona una columna</h2>
                <p style={styles.modalSubtitle}>
                  Sección: <strong>{seccionSeleccionada?.nombre}</strong>
                </p>

                {columnasDeSeccion.length === 0 ? (
                  <p style={styles.locationText}>
                    Esta sección todavía no tiene ubicaciones.
                  </p>
                ) : (
                  <div style={styles.locationsList}>
                    {columnasDeSeccion.map((c) => (
                      <button
                        type="button"
                        key={c.columna ?? c.ubicaciones[0]?.id}
                        style={styles.locationItemButton}
                        onClick={() => setColumnaSeleccionada(c)}
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
              </>
            ) : (
              <>
                <h2 style={styles.modalTitle}>
                  {columnaSeleccionada.columna != null
                    ? `Columna ${columnaSeleccionada.columna}`
                    : "Sin columna"}
                </h2>
                <p style={styles.modalSubtitle}>
                  Sección: <strong>{seccionSeleccionada?.nombre}</strong>
                </p>

                <div style={styles.locationsList}>
                  {columnaSeleccionada.ubicaciones.map((ubicacion) => (
                    <button
                      type="button"
                      key={ubicacion.id}
                      style={styles.locationItemButton}
                      onClick={() => elegirUbicacion(ubicacion)}
                    >
                      <div style={styles.locationCode}>
                        {ubicacion.fila != null
                          ? `Fila ${ubicacion.fila}`
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
                  columnaSeleccionada
                    ? () => setColumnaSeleccionada(null)
                    : cerrarSelectorUbicacion
                }
              >
                {columnaSeleccionada ? "Volver" : "Cerrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Recepciones;
