import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/api";

const initialForm = {
  almacen_id: "",
  observaciones: "",
  producto_id: "",
  cantidad: "",
  ubicacion_destino_id: ""
};

function Recepciones() {
  const [form, setForm] = useState(initialForm);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  const [almacenes, setAlmacenes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);

  useEffect(() => {
    cargarDatosFormulario();
  }, []);

  async function cargarDatosFormulario() {
    try {
      setCargandoDatos(true);
      setError("");

      const [almacenesData, productosData, ubicacionesData] = await Promise.all([
        apiFetch("/warehouses/"),
        apiFetch("/products/"),
        apiFetch("/locations/")
      ]);

      setAlmacenes(Array.isArray(almacenesData) ? almacenesData : []);
      setProductos(Array.isArray(productosData) ? productosData : []);
      setUbicaciones(Array.isArray(ubicacionesData) ? ubicacionesData : []);
    } catch (err) {
      setError(err.message || "Error al cargar los datos del formulario");
      setAlmacenes([]);
      setProductos([]);
      setUbicaciones([]);
    } finally {
      setCargandoDatos(false);
    }
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

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
          ubicacion_destino_id: form.ubicacion_destino_id
            ? Number(form.ubicacion_destino_id)
            : null,
          observaciones: null
        }
      ]
    };

    try {
      const data = await apiFetch("/receptions/", {
        method: "POST",
        body: payload
      });

      setMensaje(`Recepción creada correctamente con ID ${data.id}`);
      setForm(initialForm);
    } catch (err) {
      setError(err.message || "Error al crear la recepción");
    } finally {
      setCargando(false);
    }
  }

  const ubicacionesFiltradas = useMemo(() => {
    if (!form.almacen_id) {
      return ubicaciones;
    }

    return ubicaciones.filter(
      (ubicacion) => String(ubicacion.almacen_id) === String(form.almacen_id)
    );
  }, [ubicaciones, form.almacen_id]);

  const almacenSeleccionado = useMemo(() => {
    return almacenes.find(
      (almacen) => String(almacen.id) === String(form.almacen_id)
    );
  }, [almacenes, form.almacen_id]);

  const productoSeleccionado = useMemo(() => {
    return productos.find(
      (producto) => String(producto.id) === String(form.producto_id)
    );
  }, [productos, form.producto_id]);

  const ubicacionSeleccionada = useMemo(() => {
    return ubicaciones.find(
      (ubicacion) => String(ubicacion.id) === String(form.ubicacion_destino_id)
    );
  }, [ubicaciones, form.ubicacion_destino_id]);

  const resumen = useMemo(() => {
    return {
      almacen: almacenSeleccionado?.nombre || "-",
      producto: productoSeleccionado?.nombre || "-",
      cantidad: form.cantidad || "-",
      ubicacion: ubicacionSeleccionada?.codigo || "Sin indicar"
    };
  }, [almacenSeleccionado, productoSeleccionado, ubicacionSeleccionada, form.cantidad]);

  return (
    <div>
      <div style={header}>
        <div>
          <h1 style={{ margin: 0 }}>Recepciones</h1>
          <p style={subtitle}>
            Registra la entrada de un producto en un almacén y define su cantidad
            y ubicación de destino.
          </p>
        </div>
      </div>

      {mensaje && <div style={successBox}>{mensaje}</div>}
      {error && <div style={errorBox}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={sectionsGrid}>
          <section style={card}>
            <h2 style={cardTitle}>1. Datos de la recepción</h2>

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
            <h2 style={cardTitle}>2. Línea de recepción</h2>

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
              <label htmlFor="ubicacion_destino_id" style={label}>
                Ubicación destino
              </label>
              <select
                id="ubicacion_destino_id"
                name="ubicacion_destino_id"
                value={form.ubicacion_destino_id}
                onChange={handleChange}
                style={input}
                disabled={cargandoDatos || cargando}
              >
                <option value="">Sin indicar</option>
                {ubicacionesFiltradas.map((ubicacion) => (
                  <option key={ubicacion.id} value={ubicacion.id}>
                    {ubicacion.codigo}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section style={card}>
            <h2 style={cardTitle}>3. Resumen y acción</h2>

            <div style={summaryBox}>
              <div style={summaryRow}>
                <span style={summaryLabel}>Almacén</span>
                <span style={summaryValue}>{resumen.almacen}</span>
              </div>

              <div style={summaryRow}>
                <span style={summaryLabel}>Producto</span>
                <span style={summaryValue}>{resumen.producto}</span>
              </div>

              <div style={summaryRow}>
                <span style={summaryLabel}>Cantidad</span>
                <span style={summaryValue}>{resumen.cantidad}</span>
              </div>

              <div style={summaryRow}>
                <span style={summaryLabel}>Ubicación destino</span>
                <span style={summaryValue}>{resumen.ubicacion}</span>
              </div>
            </div>

            <div style={actions}>
              <button
                type="submit"
                disabled={cargando || cargandoDatos}
                style={{
                  ...primaryButton,
                  backgroundColor: cargando || cargandoDatos ? "#94a3b8" : "#0f172a",
                  cursor: cargando || cargandoDatos ? "not-allowed" : "pointer"
                }}
              >
                {cargando ? "Creando..." : "Crear recepción"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setForm(initialForm);
                  setMensaje("");
                  setError("");
                }}
                style={secondaryButton}
                disabled={cargando}
              >
                Limpiar
              </button>
            </div>
          </section>
        </div>
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

const sectionsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "20px",
  alignItems: "start"
};

const card = {
  backgroundColor: "white",
  borderRadius: "14px",
  boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
  padding: "22px"
};

const cardTitle = {
  marginTop: 0,
  marginBottom: "18px",
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
  fontWeight: "600",
  color: "#334155"
};

const input = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  outline: "none",
  backgroundColor: "#fff"
};

const textarea = {
  ...input,
  resize: "vertical",
  minHeight: "100px"
};

const summaryBox = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  padding: "16px",
  backgroundColor: "#f8fafc",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  marginBottom: "18px"
};

const summaryRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  borderBottom: "1px solid #e2e8f0",
  paddingBottom: "10px"
};

const summaryLabel = {
  color: "#64748b",
  fontWeight: "600"
};

const summaryValue = {
  color: "#0f172a",
  fontWeight: "700"
};

const actions = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap"
};

const primaryButton = {
  padding: "10px 14px",
  border: "none",
  borderRadius: "8px",
  color: "white",
  fontWeight: "600"
};

const secondaryButton = {
  padding: "10px 14px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  backgroundColor: "white",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: "600"
};

export default Recepciones;