import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/api";
import * as styles from "./Recepciones.styles";

const initialForm = {
  producto_id: "",
  cantidad: "",
  observaciones: "",
  almacen_id: "",
  zona_id: "",
  ubicacion_destino_id: ""
};

function Recepciones() {
  const [form, setForm] = useState(initialForm);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  const [productos, setProductos] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);

  useEffect(() => {
    cargarDatosFormulario();
  }, []);

  async function cargarDatosFormulario() {
    try {
      setCargandoDatos(true);
      setError("");

      const [productosData, almacenesData, zonasData, ubicacionesData] =
        await Promise.all([
          apiFetch("/products/"),
          apiFetch("/warehouses/"),
          apiFetch("/zones/"),
          apiFetch("/locations/")
        ]);

      setProductos(Array.isArray(productosData) ? productosData : []);
      setAlmacenes(Array.isArray(almacenesData) ? almacenesData : []);
      setZonas(Array.isArray(zonasData) ? zonasData : []);
      setUbicaciones(Array.isArray(ubicacionesData) ? ubicacionesData : []);
    } catch (err) {
      setError(err.message || "Error al cargar los datos del formulario");
      setProductos([]);
      setAlmacenes([]);
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
      ...(name === "almacen_id" && {
        zona_id: "",
        ubicacion_destino_id: ""
      }),
      ...(name === "zona_id" && {
        ubicacion_destino_id: ""
      })
    }));
  }

  const zonasFiltradas = useMemo(() => {
    if (!form.almacen_id) return [];

    return zonas.filter(
      (zona) => String(zona.almacen_id) === String(form.almacen_id)
    );
  }, [zonas, form.almacen_id]);

  const ubicacionesFiltradas = useMemo(() => {
    if (!form.zona_id) return [];

    return ubicaciones.filter(
      (ubicacion) => String(ubicacion.zona_id) === String(form.zona_id)
    );
  }, [ubicaciones, form.zona_id]);

  const productoSeleccionado = useMemo(() => {
    return productos.find(
      (producto) => String(producto.id) === String(form.producto_id)
    );
  }, [productos, form.producto_id]);

  const almacenSeleccionado = useMemo(() => {
    return almacenes.find(
      (almacen) => String(almacen.id) === String(form.almacen_id)
    );
  }, [almacenes, form.almacen_id]);

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
    setCargando(true);

    const payload = {
      almacen_id: Number(form.almacen_id),
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
        <div style={styles.topGrid}>
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
              <label htmlFor="almacen_id" style={styles.label}>
                Almacén
              </label>
              <select
                id="almacen_id"
                name="almacen_id"
                value={form.almacen_id}
                onChange={handleChange}
                required
                style={styles.input}
                disabled={cargandoDatos || cargando}
              >
                <option value="">Selecciona un almacén</option>
                {almacenes.map((almacen) => (
                  <option key={almacen.id} value={almacen.id}>
                    {almacen.nombre}
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
                disabled={!form.almacen_id || cargandoDatos || cargando}
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
                disabled={!form.zona_id || cargandoDatos || cargando}
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
              <span style={styles.summaryLabel}>Almacén</span>
              <strong style={styles.summaryValue}>
                {almacenSeleccionado?.nombre || "-"}
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
    </div>
  );
}

export default Recepciones;