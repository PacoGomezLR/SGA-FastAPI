import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import * as styles from "./Inventarios.styles";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

function Inventarios() {
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
    ubicacion_id: "",
    cantidad_real: "",
    observaciones: ""
  });

  const [inventoryId, setInventoryId] = useState(null);

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
        ubicacion_id: "",
        cantidad_real: ""
      });
      return;
    }

    if (name === "zona_id") {
      setForm({
        ...form,
        zona_id: value,
        ubicacion_id: "",
        cantidad_real: ""
      });
      return;
    }

    if (name === "ubicacion_id") {
      setForm({
        ...form,
        ubicacion_id: value,
        cantidad_real: ""
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
      ...form,
      producto_id: producto.id,
      almacen_id: "",
      zona_id: "",
      ubicacion_id: "",
      cantidad_real: ""
    });
  }

  const productosFiltrados = useMemo(() => {
    if (!busquedaProducto.trim()) return [];

    return productos
      .filter(producto =>
        producto.nombre.toLowerCase().includes(busquedaProducto.toLowerCase())
      )
      .slice(0, 8);
  }, [busquedaProducto, productos]);

  const stockProducto = stock.filter(
    item =>
      String(item.producto_id) === String(form.producto_id) &&
      Number(item.cantidad) > 0
  );

  const almacenesDisponibles = almacenes.filter(almacen =>
    stockProducto.some(
      item => String(item.almacen_id) === String(almacen.id)
    )
  );

  const zonasDisponibles = zonas.filter(
    zona =>
      String(zona.almacen_id) === String(form.almacen_id) &&
      stockProducto.some(
        item => String(item.zona_id) === String(zona.id)
      )
  );

  const ubicacionesDisponibles = ubicaciones.filter(
    ubicacion =>
      String(ubicacion.zona_id) === String(form.zona_id) &&
      stockProducto.some(
        item => String(item.ubicacion_id) === String(ubicacion.id)
      )
  );

  const stockSistema = stock.find(
    item =>
      String(item.producto_id) === String(form.producto_id) &&
      String(item.ubicacion_id) === String(form.ubicacion_id)
  );

  const diferencia =
    form.cantidad_real !== "" && stockSistema
      ? Number(form.cantidad_real) - Number(stockSistema.cantidad)
      : "";

  async function handleCreateInventory(e) {
    e.preventDefault();

    setMensaje("");
    setError("");
    setCargando(true);

    try {
      const createPayload = {
        almacen_id: Number(form.almacen_id),
        observaciones: form.observaciones || null,
        lineas: []
      };

      const createResponse = await fetch(`${API_BASE_URL}/inventories/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(createPayload)
      });

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(createData?.detail || "Error al crear inventario");
      }

      const newInventoryId = createData.id;

      const linePayload = {
        producto_id: Number(form.producto_id),
        ubicacion_id: Number(form.ubicacion_id),
        cantidad_real: Number(form.cantidad_real),
        observaciones: null
      };

      const lineResponse = await fetch(
        `${API_BASE_URL}/inventories/${newInventoryId}/lines`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(linePayload)
        }
      );

      const lineData = await lineResponse.json();

      if (!lineResponse.ok) {
        throw new Error(lineData?.detail || "Error al añadir línea");
      }

      setInventoryId(newInventoryId);
      setMensaje(`Inventario creado correctamente con ID ${newInventoryId}`);
    } catch (err) {
      setError(err.message || "Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  if (cargandoDatos) {
    return <div style={{ padding: "30px" }}>Cargando...</div>;
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ marginTop: 0 }}>Inventarios</h1>

      <p style={{ color: "#6b7280", marginBottom: "22px" }}>
        Compara stock real con stock del sistema y corrige diferencias.
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
        onSubmit={handleCreateInventory}
        style={{
          background: "#fff",
          padding: "28px",
          borderRadius: "16px",
          border: "1px solid #e5e7eb",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "22px",
          maxWidth: "1050px"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <div style={styles.label}>Producto</div>

            <div style={{ position: "relative" }}>
              <input
                style={styles.input}
                placeholder="Buscar producto..."
                value={busquedaProducto}
                onChange={(e) => {
                  setBusquedaProducto(e.target.value);

                  setForm({
                    ...form,
                    producto_id: "",
                    almacen_id: "",
                    zona_id: "",
                    ubicacion_id: "",
                    cantidad_real: ""
                  });
                }}
                required
              />

              {productosFiltrados.length > 0 && !form.producto_id && (
                <div style={{
                  position: "absolute",
                  top: "48px",
                  left: 0,
                  right: 0,
                  background: "#fff",
                  border: "1px solid #d1d5db",
                  borderRadius: "10px",
                  zIndex: 10,
                  maxHeight: "220px",
                  overflowY: "auto"
                }}>
                  {productosFiltrados.map(producto => (
                    <div
                      key={producto.id}
                      onClick={() => seleccionarProducto(producto)}
                      style={{
                        padding: "10px 14px",
                        cursor: "pointer",
                        borderBottom: "1px solid #f3f4f6"
                      }}
                    >
                      {producto.nombre}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div style={styles.label}>Almacén</div>
            <select
              name="almacen_id"
              value={form.almacen_id}
              onChange={handleChange}
              style={styles.input}
              required
              disabled={!form.producto_id}
            >
              <option value="">Seleccionar</option>
              {almacenesDisponibles.map(almacen => (
                <option key={almacen.id} value={almacen.id}>
                  {almacen.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={styles.label}>Zona</div>
            <select
              name="zona_id"
              value={form.zona_id}
              onChange={handleChange}
              style={styles.input}
              required
              disabled={!form.almacen_id}
            >
              <option value="">Seleccionar</option>
              {zonasDisponibles.map(zona => (
                <option key={zona.id} value={zona.id}>
                  {zona.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={styles.label}>Ubicación</div>
            <select
              name="ubicacion_id"
              value={form.ubicacion_id}
              onChange={handleChange}
              style={styles.input}
              required
              disabled={!form.zona_id}
            >
              <option value="">Seleccionar</option>
              {ubicacionesDisponibles.map(ubicacion => (
                <option key={ubicacion.id} value={ubicacion.id}>
                  {ubicacion.codigo}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <div style={styles.label}>Stock sistema</div>
            <input
              value={stockSistema ? stockSistema.cantidad : ""}
              disabled
              style={{ ...styles.input, background: "#f3f4f6" }}
            />
          </div>

          <div>
            <div style={styles.label}>Cantidad real</div>
            <input
              type="number"
              name="cantidad_real"
              value={form.cantidad_real}
              onChange={handleChange}
              style={styles.input}
              required
              disabled={!form.ubicacion_id}
            />
          </div>

          <div>
            <div style={styles.label}>Diferencia</div>
            <input
              value={diferencia}
              disabled
              style={{
                ...styles.input,
                background:
                  diferencia > 0
                    ? "#dcfce7"
                    : diferencia < 0
                    ? "#fee2e2"
                    : "#f3f4f6"
              }}
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
            {cargando ? "Procesando..." : "Crear inventario"}
          </button>
        </div>
      </form>

      {inventoryId && (
        <div style={{
          marginTop: "18px",
          color: "#166534",
          fontWeight: "700"
        }}>
          Inventario preparado correctamente.
        </div>
      )}
    </div>
  );
}

export default Inventarios;