import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

function Salidas() {
  const { token, authFetch } = useAuth();

  const [productos, setProductos] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [stock, setStock] = useState([]);

  const [busquedaProducto, setBusquedaProducto] = useState("");

  const [form, setForm] = useState({
    producto_id: "",
    almacen_id: "",
    zona_id: "",
    ubicacion_origen_id: "",
    cantidad: "",
    motivo: "venta",
    observaciones: ""
  });

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setCargandoDatos(true);

      const [
        productosData,
        almacenesData,
        zonasData,
        ubicacionesData,
        stockData
      ] = await Promise.all([
        authFetch("/products/").then(r => r.json()),
        authFetch("/warehouses/").then(r => r.json()),
        authFetch("/zones/").then(r => r.json()),
        authFetch("/locations/").then(r => r.json()),
        authFetch("/stock?detailed=true").then(r => r.json())
      ]);

      setProductos(Array.isArray(productosData) ? productosData : []);
      setAlmacenes(Array.isArray(almacenesData) ? almacenesData : []);
      setZonas(Array.isArray(zonasData) ? zonasData : []);
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

    if (name === "almacen_id") {
      setForm({
        ...form,
        almacen_id: value,
        zona_id: "",
        ubicacion_origen_id: ""
      });
      return;
    }

    if (name === "zona_id") {
      setForm({
        ...form,
        zona_id: value,
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
      almacen_id: "",
      zona_id: "",
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

  const almacenesDisponibles = almacenes.filter(a =>
    stockProducto.some(s => String(s.almacen_id) === String(a.id))
  );

  const zonasDisponibles = zonas.filter(
    z =>
      String(z.almacen_id) === String(form.almacen_id) &&
      stockProducto.some(s => String(s.zona_id) === String(z.id))
  );

  const ubicacionesDisponibles = ubicaciones.filter(
    u =>
      String(u.zona_id) === String(form.zona_id) &&
      stockProducto.some(s => String(s.ubicacion_id) === String(u.id))
  );

  const stockSeleccionado = stockProducto.find(
    s => String(s.ubicacion_id) === String(form.ubicacion_origen_id)
  );

  async function handleSubmit(e) {
    e.preventDefault();

    setMensaje("");
    setError("");
    setCargando(true);

    const payload = {
      almacen_id: Number(form.almacen_id),
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

      setMensaje("Salida registrada correctamente");

      setBusquedaProducto("");

      setForm({
        producto_id: "",
        almacen_id: "",
        zona_id: "",
        ubicacion_origen_id: "",
        cantidad: "",
        motivo: "venta",
        observaciones: ""
      });

      cargarDatos();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  const input = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    boxSizing: "border-box"
  };

  const label = {
    fontWeight: "700",
    fontSize: "14px",
    marginBottom: "6px"
  };

  const fieldBox = {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  };

  if (cargandoDatos) {
    return <div style={{ padding: "30px" }}>Cargando...</div>;
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ marginTop: 0 }}>Salidas</h1>

      <p style={{ color: "#6b7280", marginBottom: "22px" }}>
        Registra mercancía que abandona el almacén: ventas, mermas, roturas o consumo interno.
      </p>

      {mensaje && (
        <div style={{
          background: "#dcfce7",
          color: "#166534",
          padding: "12px",
          borderRadius: "10px",
          marginBottom: "15px"
        }}>
          {mensaje}
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
          <div style={label}>Producto</div>

          <input
            style={input}
            placeholder="Buscar producto..."
            value={busquedaProducto}
            onChange={(e) => {
              setBusquedaProducto(e.target.value);
              setForm({ ...form, producto_id: "" });
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

        <div style={fieldBox}>
          <div style={label}>Almacén</div>
          <select
            name="almacen_id"
            value={form.almacen_id}
            onChange={handleChange}
            style={input}
            required
          >
            <option value="">Seleccionar</option>
            {almacenesDisponibles.map(a => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        </div>

        <div style={fieldBox}>
          <div style={label}>Motivo</div>
          <select
            name="motivo"
            value={form.motivo}
            onChange={handleChange}
            style={input}
            required
          >
            <option value="venta">Venta</option>
            <option value="merma">Merma</option>
            <option value="rotura">Rotura</option>
            <option value="consumo">Consumo interno</option>
            <option value="muestra">Muestra comercial</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div style={fieldBox}>
          <div style={label}>Zona</div>
          <select
            name="zona_id"
            value={form.zona_id}
            onChange={handleChange}
            style={input}
            required
          >
            <option value="">Seleccionar</option>
            {zonasDisponibles.map(z => (
              <option key={z.id} value={z.id}>{z.nombre}</option>
            ))}
          </select>
        </div>

        <div style={fieldBox}>
          <div style={label}>Observaciones</div>
          <input
            type="text"
            name="observaciones"
            value={form.observaciones}
            onChange={handleChange}
            style={input}
          />
        </div>

        <div style={fieldBox}>
          <div style={label}>Ubicación origen</div>
          <select
            name="ubicacion_origen_id"
            value={form.ubicacion_origen_id}
            onChange={handleChange}
            style={input}
            required
          >
            <option value="">Seleccionar</option>
            {ubicacionesDisponibles.map(u => (
              <option key={u.id} value={u.id}>{u.codigo}</option>
            ))}
          </select>
        </div>

        <div style={fieldBox}>
          <div style={label}>Stock disponible</div>
          <input
            value={stockSeleccionado ? stockSeleccionado.cantidad : ""}
            disabled
            style={{ ...input, background: "#f3f4f6" }}
          />
        </div>

        <div style={fieldBox}>
          <div style={label}>Cantidad</div>
          <input
            type="number"
            name="cantidad"
            value={form.cantidad}
            onChange={handleChange}
            style={input}
            required
          />
        </div>

        <div></div>

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