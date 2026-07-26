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
  const [error, setError] = useState("");
  const [resumenRecepcion, setResumenRecepcion] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  const [productos, setProductos] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);

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

    setResumenRecepcion(null);

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "seccion_id" && {
        ubicacion_destino_id: ""
      })
    }));
  }

  const ubicacionesFiltradas = useMemo(() => {
    if (!form.seccion_id) return [];

    return ubicaciones.filter(
      (ubicacion) => String(ubicacion.seccion_id) === String(form.seccion_id)
    );
  }, [ubicaciones, form.seccion_id]);

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

      setResumenRecepcion({
        id: data.id,
        producto: productoSeleccionado?.nombre || "Producto",
        cantidad: form.cantidad,
        seccion: seccionSeleccionada?.nombre || "-",
        ubicacion: ubicacionSeleccionada?.codigo || "-"
      });

      setForm(initialForm);
    } catch (err) {
      setResumenRecepcion(null);
      setError(err.message || "Error al crear y confirmar la recepción");
    } finally {
      setCargando(false);
    }
  }

  function limpiarFormulario() {
    setForm(initialForm);
    setResumenRecepcion(null);
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

      {resumenRecepcion && (
        <div style={styles.resumenCard}>
          <div style={styles.resumenTitulo}>
            ✓ Recepción #{resumenRecepcion.id} creada y confirmada correctamente
          </div>

          <div style={styles.resumenGrid}>
            <div>
              <div style={styles.resumenLabel}>Producto</div>
              <div style={styles.resumenValor}>{resumenRecepcion.producto}</div>
            </div>

            <div>
              <div style={styles.resumenLabel}>Cantidad</div>
              <div style={styles.resumenValor}>{resumenRecepcion.cantidad}</div>
            </div>

            <div>
              <div style={styles.resumenLabel}>Sección</div>
              <div style={styles.resumenValor}>{resumenRecepcion.seccion}</div>
            </div>

            <div>
              <div style={styles.resumenLabel}>Ubicación</div>
              <div style={styles.resumenValor}>{resumenRecepcion.ubicacion}</div>
            </div>
          </div>
        </div>
      )}

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
              <label htmlFor="ubicacion_destino_id" style={styles.label}>
                Ubicación
              </label>
              <select
                id="ubicacion_destino_id"
                name="ubicacion_destino_id"
                value={form.ubicacion_destino_id}
                onChange={handleChange}
                required
                style={styles.input}
                disabled={!form.seccion_id || cargandoDatos || cargando}
              >
                <option value="">Selecciona una ubicación</option>
                {ubicacionesFiltradas.map((ubicacion) => (
                  <option key={ubicacion.id} value={ubicacion.id}>
                    {ubicacion.codigo}
                  </option>
                ))}
              </select>
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
    </div>
  );
}

export default Recepciones;
