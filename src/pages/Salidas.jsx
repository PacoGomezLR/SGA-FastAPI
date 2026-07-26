import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useIsMobile } from "../hooks/useMediaQuery";
import * as styles from "./Salidas.styles";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

const MOTIVOS_LABEL = {
  venta: "Venta",
  merma: "Merma",
  rotura: "Rotura",
  consumo: "Consumo interno",
  muestra: "Muestra comercial",
  otro: "Otro"
};

function Salidas() {
  const { token, authFetch } = useAuth();
  const esMobile = useIsMobile();
  const paddingPagina = esMobile ? "16px" : "30px";

  const [productos, setProductos] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [stock, setStock] = useState([]);

  const [busquedaProducto, setBusquedaProducto] = useState("");

  const [form, setForm] = useState({
    producto_id: "",
    seccion_id: "",
    ubicacion_origen_id: "",
    cantidad: "",
    motivo: "venta",
    observaciones: ""
  });

  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [resumenSalida, setResumenSalida] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setCargandoDatos(true);

      const [
        productosData,
        seccionesData,
        ubicacionesData,
        stockData
      ] = await Promise.all([
        authFetch("/products/").then(r => r.json()),
        authFetch("/sections/").then(r => r.json()),
        authFetch("/locations/").then(r => r.json()),
        authFetch("/stock?detailed=true").then(r => r.json())
      ]);

      setProductos(Array.isArray(productosData) ? productosData : []);
      setSecciones(Array.isArray(seccionesData) ? seccionesData : []);
      setUbicaciones(Array.isArray(ubicacionesData) ? ubicacionesData : []);
      setStock(Array.isArray(stockData) ? stockData : []);
    } catch {
      setError("Error al cargar datos");
    } finally {
      setCargandoDatos(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setResumenSalida(null);

    if (name === "seccion_id") {
      setForm({
        ...form,
        seccion_id: value,
        ubicacion_origen_id: ""
      });
      return;
    }

    setForm({
      ...form,
      [name]: value
    });
  }

  function seleccionarProducto(producto) {
    setBusquedaProducto(producto.nombre);

    setForm({
      producto_id: producto.id,
      seccion_id: "",
      ubicacion_origen_id: "",
      cantidad: "",
      motivo: "venta",
      observaciones: ""
    });
  }

  const productosFiltrados = useMemo(() => {
    if (!busquedaProducto.trim()) return [];

    return productos
      .filter(p =>
        p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase())
      )
      .slice(0, 8);
  }, [busquedaProducto, productos]);

  const stockProducto = stock.filter(
    s =>
      String(s.producto_id) === String(form.producto_id) &&
      Number(s.cantidad) > 0
  );

  const seccionesDisponibles = secciones.filter(a =>
    stockProducto.some(s => String(s.seccion_id) === String(a.id))
  );

  const ubicacionesDisponibles = ubicaciones
    .filter(
      u =>
        String(u.seccion_id) === String(form.seccion_id) &&
        stockProducto.some(s => String(s.ubicacion_id) === String(u.id))
    )
    .map(u => {
      const lineaStock = stockProducto.find(s => String(s.ubicacion_id) === String(u.id));
      return { ...u, cantidadDisponible: lineaStock?.cantidad ?? 0 };
    });

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setCargando(true);

    const payload = {
      seccion_id: Number(form.seccion_id),
      observaciones:
        `${form.motivo.toUpperCase()}${form.observaciones ? " | " + form.observaciones : ""}`,
      lineas: [
        {
          producto_id: Number(form.producto_id),
          ubicacion_origen_id: Number(form.ubicacion_origen_id),
          cantidad: Number(form.cantidad),
          observaciones: null
        }
      ]
    };

    try {
      const response = await fetch(`${API_BASE_URL}/shipments/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Error al registrar salida");
      }

      const producto = productos.find(p => String(p.id) === String(form.producto_id));
      const seccion = secciones.find(s => String(s.id) === String(form.seccion_id));
      const ubicacion = ubicaciones.find(u => String(u.id) === String(form.ubicacion_origen_id));

      setResumenSalida({
        producto: producto?.nombre || "Producto",
        cantidad: form.cantidad,
        motivo: MOTIVOS_LABEL[form.motivo] || form.motivo,
        origen: `${seccion?.nombre || "-"} · ${ubicacion?.codigo || "-"}`
      });

      setBusquedaProducto("");

      setForm({
        producto_id: "",
        seccion_id: "",
        ubicacion_origen_id: "",
        cantidad: "",
        motivo: "venta",
        observaciones: ""
      });

      cargarDatos();
    } catch (err) {
      setResumenSalida(null);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  if (cargandoDatos) {
    return <div style={{ padding: paddingPagina }}>Cargando...</div>;
  }

  return (
    <div style={{ padding: paddingPagina }}>
      <h1 style={{ marginTop: 0 }}>Salidas</h1>

      <p style={{ color: "#6b7280", marginBottom: "22px" }}>
        Registra mercancía que abandona el almacén: ventas, mermas, roturas o consumo interno.
      </p>

      {resumenSalida && (
        <div style={styles.resumenCard}>
          <div style={styles.resumenTitulo}>✓ Salida registrada correctamente</div>

          <div style={styles.resumenGrid}>
            <div>
              <div style={styles.resumenLabel}>Producto</div>
              <div style={styles.resumenValor}>{resumenSalida.producto}</div>
            </div>

            <div>
              <div style={styles.resumenLabel}>Cantidad</div>
              <div style={styles.resumenValor}>{resumenSalida.cantidad}</div>
            </div>

            <div>
              <div style={styles.resumenLabel}>Motivo</div>
              <div style={styles.resumenValor}>{resumenSalida.motivo}</div>
            </div>

            <div>
              <div style={styles.resumenLabel}>Origen</div>
              <div style={styles.resumenValor}>{resumenSalida.origen}</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          background: "#fee2e2",
          color: "#991b1b",
          padding: "12px",
          borderRadius: "10px",
          marginBottom: "15px"
        }}>
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          padding: "28px",
          borderRadius: "16px",
          border: "1px solid #e5e7eb",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "18px",
          maxWidth: "950px"
        }}
      >
        <div style={{ gridColumn: "1 / -1", position: "relative" }}>
          <div style={styles.label}>Producto</div>

          <input
            style={styles.input}
            placeholder="Buscar producto..."
            value={busquedaProducto}
            onChange={(e) => {
              setBusquedaProducto(e.target.value);
              setForm({ ...form, producto_id: "" });
              setResumenSalida(null);
            }}
            required
          />

          {productosFiltrados.length > 0 && !form.producto_id && (
            <div style={{
              position: "absolute",
              top: "72px",
              left: 0,
              right: 0,
              background: "#fff",
              border: "1px solid #d1d5db",
              borderRadius: "10px",
              zIndex: 10
            }}>
              {productosFiltrados.map(p => (
                <div
                  key={p.id}
                  onClick={() => seleccionarProducto(p)}
                  style={{
                    padding: "10px 14px",
                    cursor: "pointer",
                    borderBottom: "1px solid #f3f4f6"
                  }}
                >
                  {p.nombre}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.fieldBox}>
          <div style={styles.label}>Sección</div>
          <select
            name="seccion_id"
            value={form.seccion_id}
            onChange={handleChange}
            style={styles.input}
            required
          >
            <option value="">Seleccionar</option>
            {seccionesDisponibles.map(a => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        </div>

        <div style={styles.fieldBox}>
          <div style={styles.label}>Motivo</div>
          <select
            name="motivo"
            value={form.motivo}
            onChange={handleChange}
            style={styles.input}
            required
          >
            {Object.entries(MOTIVOS_LABEL).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>{etiqueta}</option>
            ))}
          </select>
        </div>

        <div style={styles.fieldBox}>
          <div style={styles.label}>Observaciones</div>
          <input
            type="text"
            name="observaciones"
            value={form.observaciones}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        <div style={styles.fieldBox}>
          <div style={styles.label}>Ubicación origen</div>
          <select
            name="ubicacion_origen_id"
            value={form.ubicacion_origen_id}
            onChange={handleChange}
            style={styles.input}
            required
          >
            <option value="">Seleccionar</option>
            {ubicacionesDisponibles.map(u => (
              <option key={u.id} value={u.id}>
                {u.codigo} ({u.cantidadDisponible} unidades)
              </option>
            ))}
          </select>
        </div>

        <div style={styles.fieldBox}>
          <div style={styles.label}>Cantidad</div>
          <input
            type="number"
            name="cantidad"
            value={form.cantidad}
            onChange={handleChange}
            style={styles.input}
            required
          />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <button
            type="submit"
            disabled={cargando}
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "10px",
              background: "#111827",
              color: "#fff",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            {cargando ? "Registrando..." : "Registrar salida"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Salidas;
