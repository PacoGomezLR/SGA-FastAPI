import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/api";

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
      <div style={header}>
        <div>
          <h1 style={{ margin: 0 }}>Recepciones</h1>
          <p style={subtitle}>
            Registra la entrada de mercancía y confirma automáticamente su stock.
          </p>
        </div>
      </div>

      {mensaje && <div style={successBox}>{mensaje}</div>}
      {error && <div style={errorBox}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={topGrid}>
          <section style={card}>
            <div style={stepBadge}>1</div>
            <h2 style={cardTitle}>Datos de la recepción</h2>

            <div style={fieldGroup}>
              <label htmlFor="producto_id" style={label}>
                Producto
              </label>
              <select
                id="producto_id"
                name="producto_id"
                value={form.producto_id}
                onChange={handleChange}
                required
                style={input}
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

            <div style={fieldGroup}>
              <label htmlFor="cantidad" style={label}>
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
                style={input}
                disabled={cargando}
              />
            </div>

            <div style={fieldGroup}>
              <label htmlFor="observaciones" style={label}>
                Observaciones
              </label>
              <textarea
                id="observaciones"
                name="observaciones"
                placeholder="Observaciones de la recepción"
                value={form.observaciones}
                onChange={handleChange}
                rows="4"
                style={textarea}
                disabled={cargando}
              />
            </div>
          </section>

          <section style={card}>
            <div style={stepBadge}>2</div>
            <h2 style={cardTitle}>Destino</h2>

            <div style={fieldGroup}>
              <label htmlFor="almacen_id" style={label}>
                Almacén
              </label>
              <select
                id="almacen_id"
                name="almacen_id"
                value={form.almacen_id}
                onChange={handleChange}
                required
                style={input}
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

            <div style={fieldGroup}>
              <label htmlFor="zona_id" style={label}>
                Zona
              </label>
              <select
                id="zona_id"
                name="zona_id"
                value={form.zona_id}
                onChange={handleChange}
                required
                style={input}
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

            <div style={fieldGroup}>
              <label htmlFor="ubicacion_destino_id" style={label}>
                Ubicación
              </label>
              <select
                id="ubicacion_destino_id"
                name="ubicacion_destino_id"
                value={form.ubicacion_destino_id}
                onChange={handleChange}
                required
                style={input}
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

        <section style={summaryCard}>
          <div style={stepBadge}>3</div>
          <h2 style={cardTitle}>Resumen</h2>

          <div style={summaryGrid}>
            <div style={summaryItem}>
              <span style={summaryLabel}>Producto</span>
              <strong style={summaryValue}>
                {productoSeleccionado?.nombre || "-"}
              </strong>
            </div>

            <div style={summaryItem}>
              <span style={summaryLabel}>Cantidad</span>
              <strong style={summaryValue}>{form.cantidad || "-"}</strong>
            </div>

            <div style={summaryItem}>
              <span style={summaryLabel}>Almacén</span>
              <strong style={summaryValue}>
                {almacenSeleccionado?.nombre || "-"}
              </strong>
            </div>

            <div style={summaryItem}>
              <span style={summaryLabel}>Zona</span>
              <strong style={summaryValue}>{zonaSeleccionada?.nombre || "-"}</strong>
            </div>

            <div style={summaryItem}>
              <span style={summaryLabel}>Ubicación</span>
              <strong style={summaryValue}>
                {ubicacionSeleccionada?.codigo || "-"}
              </strong>
            </div>
          </div>

          <div style={actions}>
            <button
              type="submit"
              disabled={cargando || cargandoDatos}
              style={{
                ...primaryButton,
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
              style={secondaryButton}
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

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginBottom: "20px",
  flexWrap: "wrap"
};

const subtitle = {
  margin: "6px 0 0 0",
  color: "#64748b"
};

const successBox = {
  backgroundColor: "#dcfce7",
  color: "#166534",
  border: "1px solid #86efac",
  padding: "12px 14px",
  borderRadius: "10px",
  marginBottom: "16px",
  fontWeight: "500"
};

const errorBox = {
  backgroundColor: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fca5a5",
  padding: "12px 14px",
  borderRadius: "10px",
  marginBottom: "16px",
  fontWeight: "500"
};

const topGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  alignItems: "stretch",
  marginBottom: "20px"
};

const card = {
  position: "relative",
  backgroundColor: "white",
  borderRadius: "16px",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
  padding: "28px 24px 24px",
  border: "1px solid #e2e8f0"
};

const summaryCard = {
  position: "relative",
  backgroundColor: "white",
  borderRadius: "16px",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
  padding: "28px 24px 24px",
  border: "1px solid #e2e8f0",
  minHeight: "230px"
};

const stepBadge = {
  position: "absolute",
  top: "-14px",
  left: "20px",
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  backgroundColor: "#0f172a",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "800",
  boxShadow: "0 6px 14px rgba(15, 23, 42, 0.22)"
};

const cardTitle = {
  marginTop: 0,
  marginBottom: "20px",
  fontSize: "24px",
  color: "#0f172a"
};

const fieldGroup = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  marginBottom: "16px"
};

const label = {
  fontWeight: "700",
  color: "#334155"
};

const input = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: "9px",
  border: "1px solid #cbd5e1",
  outline: "none",
  backgroundColor: "#fff",
  color: "#0f172a"
};

const textarea = {
  ...input,
  resize: "vertical",
  minHeight: "108px"
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "14px",
  marginBottom: "22px"
};

const summaryItem = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "14px",
  display: "flex",
  flexDirection: "column",
  gap: "6px"
};

const summaryLabel = {
  color: "#64748b",
  fontSize: "14px",
  fontWeight: "700"
};

const summaryValue = {
  color: "#0f172a",
  fontSize: "17px"
};

const actions = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap"
};

const primaryButton = {
  padding: "11px 16px",
  border: "none",
  borderRadius: "9px",
  color: "white",
  fontWeight: "700"
};

const secondaryButton = {
  padding: "11px 16px",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  backgroundColor: "white",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: "700"
};

export default Recepciones;