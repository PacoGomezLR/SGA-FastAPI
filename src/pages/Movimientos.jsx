import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import * as styles from "./Movimientos.styles";

function Movimientos() {
  const { token, authFetch } = useAuth();

  const [productos, setProductos] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [stock, setStock] = useState([]);

  const [busquedaProducto, setBusquedaProducto] = useState("");

  const [form, setForm] = useState({
    producto_id: "",
    almacen_origen_id: "",
    zona_origen_id: "",
    ubicacion_origen_id: "",
    almacen_destino_id: "",
    zona_destino_id: "",
    ubicacion_destino_id: "",
    cantidad: "",
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

    if (name === "almacen_origen_id") {
      setForm({
        ...form,
        almacen_origen_id: value,
        zona_origen_id: "",
        ubicacion_origen_id: ""
      });
      return;
    }

    if (name === "zona_origen_id") {
      setForm({
        ...form,
        zona_origen_id: value,
        ubicacion_origen_id: ""
      });
      return;
    }

    if (name === "almacen_destino_id") {
      setForm({
        ...form,
        almacen_destino_id: value,
        zona_destino_id: "",
        ubicacion_destino_id: ""
      });
      return;
    }

    if (name === "zona_destino_id") {
      setForm({
        ...form,
        zona_destino_id: value,
        ubicacion_destino_id: ""
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
      almacen_origen_id: "",
      zona_origen_id: "",
      ubicacion_origen_id: "",
      almacen_destino_id: "",
      zona_destino_id: "",
      ubicacion_destino_id: "",
      cantidad: "",
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

  const almacenesOrigen = almacenes.filter(a =>
    stockProducto.some(s => String(s.almacen_id) === String(a.id))
  );

  const zonasOrigen = zonas.filter(
    z =>
      String(z.almacen_id) === String(form.almacen_origen_id) &&
      stockProducto.some(s => String(s.zona_id) === String(z.id))
  );

  const ubicacionesOrigen = ubicaciones.filter(
    u =>
      String(u.zona_id) === String(form.zona_origen_id) &&
      stockProducto.some(s => String(s.ubicacion_id) === String(u.id))
  );

  const zonasDestino = zonas.filter(
    z => String(z.almacen_id) === String(form.almacen_destino_id)
  );

  const ubicacionesDestino = ubicaciones.filter(
    u => String(u.zona_id) === String(form.zona_destino_id)
  );

  async function handleSubmit(e) {
    e.preventDefault();

    if (!token) {
      setError("Sesión no válida");
      return;
    }

    setMensaje("");
    setError("");
    setCargando(true);

    try {
      const payload = {
        producto_id: Number(form.producto_id),
        ubicacion_origen_id: Number(form.ubicacion_origen_id),
        ubicacion_destino_id: Number(form.ubicacion_destino_id),
        cantidad: Number(form.cantidad),
        tipo_movimiento: "traslado",
        origen_tipo: "manual",
        origen_id: 1,
        observaciones: form.observaciones || null
      };

      const response = await authFetch("/movements/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Error al registrar movimiento");
      }

      setMensaje("Movimiento registrado correctamente");

      cargarDatos();

      setBusquedaProducto("");

      setForm({
        producto_id: "",
        almacen_origen_id: "",
        zona_origen_id: "",
        ubicacion_origen_id: "",
        almacen_destino_id: "",
        zona_destino_id: "",
        ubicacion_destino_id: "",
        cantidad: "",
        observaciones: ""
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  if (cargandoDatos) {
    return <div style={{ padding: "30px" }}>Cargando...</div>;
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Movimientos internos</h1>

      {mensaje && <div style={{ color: "green", marginBottom: "15px" }}>{mensaje}</div>}
      {error && <div style={{ color: "red", marginBottom: "15px" }}>{error}</div>}

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
          <div style={styles.label}>Nombre producto</div>

          <input
            style={styles.input}
            value={busquedaProducto}
            onChange={(e) => {
              setBusquedaProducto(e.target.value);
              setForm({ ...form, producto_id: "" });
            }}
            placeholder="Buscar producto..."
            required
          />

          {productosFiltrados.length > 0 && !form.producto_id && (
            <div style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "72px",
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

        <div><strong>ORIGEN</strong></div>
        <div><strong>DESTINO</strong></div>

        <div>
          <div style={styles.label}>Almacén origen</div>
          <select
            name="almacen_origen_id"
            value={form.almacen_origen_id}
            onChange={handleChange}
            style={styles.input}
            required
          >
            <option value="">Seleccionar</option>
            {almacenesOrigen.map(a => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <div style={styles.label}>Almacén destino</div>
          <select
            name="almacen_destino_id"
            value={form.almacen_destino_id}
            onChange={handleChange}
            style={styles.input}
            required
          >
            <option value="">Seleccionar</option>
            {almacenes.map(a => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <div style={styles.label}>Zona origen</div>
          <select
            name="zona_origen_id"
            value={form.zona_origen_id}
            onChange={handleChange}
            style={styles.input}
            required
          >
            <option value="">Seleccionar</option>
            {zonasOrigen.map(z => (
              <option key={z.id} value={z.id}>{z.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <div style={styles.label}>Zona destino</div>
          <select
            name="zona_destino_id"
            value={form.zona_destino_id}
            onChange={handleChange}
            style={styles.input}
            required
          >
            <option value="">Seleccionar</option>
            {zonasDestino.map(z => (
              <option key={z.id} value={z.id}>{z.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <div style={styles.label}>Ubicación origen</div>
          <select
            name="ubicacion_origen_id"
            value={form.ubicacion_origen_id}
            onChange={handleChange}
            style={styles.input}
            required
          >
            <option value="">Seleccionar</option>
            {ubicacionesOrigen.map(u => (
              <option key={u.id} value={u.id}>{u.codigo}</option>
            ))}
          </select>
        </div>

        <div>
          <div style={styles.label}>Ubicación destino</div>
          <select
            name="ubicacion_destino_id"
            value={form.ubicacion_destino_id}
            onChange={handleChange}
            style={styles.input}
            required
          >
            <option value="">Seleccionar</option>
            {ubicacionesDestino.map(u => (
              <option key={u.id} value={u.id}>{u.codigo}</option>
            ))}
          </select>
        </div>

        <div>
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

        <div>
          <div style={styles.label}>Observaciones</div>
          <input
            type="text"
            name="observaciones"
            value={form.observaciones}
            onChange={handleChange}
            style={styles.input}
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
              fontWeight: "700"
            }}
          >
            {cargando ? "Registrando..." : "Registrar movimiento"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Movimientos;