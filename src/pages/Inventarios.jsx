import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useIsMobile } from "../hooks/useMediaQuery";
import * as styles from "./Inventarios.styles";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

const TODAS_UBICACIONES = "todas";

function Inventarios() {
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
    ubicacion_id: "",
    cantidad_real: "",
    observaciones: ""
  });

  const [cantidadesPorUbicacion, setCantidadesPorUbicacion] = useState({});

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

    if (name === "ubicacion_id") {
      setForm({
        ...form,
        ubicacion_id: value,
        cantidad_real: ""
      });
      setCantidadesPorUbicacion({});
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
      ubicacion_id: "",
      cantidad_real: ""
    });
    setCantidadesPorUbicacion({});
  }

  function handleCantidadUbicacion(ubicacionId, value) {
    setCantidadesPorUbicacion({
      ...cantidadesPorUbicacion,
      [ubicacionId]: value
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

  const ubicacionesConStock = useMemo(() => {
    return stockProducto
      .map(item => {
        const ubicacion = ubicaciones.find(
          u => String(u.id) === String(item.ubicacion_id)
        );
        const seccion = secciones.find(
          s => String(s.id) === String(item.seccion_id)
        );
        if (!ubicacion) return null;
        return {
          ...ubicacion,
          seccion_id: item.seccion_id,
          seccionNombre: seccion?.nombre || "",
          cantidadSistema: item.cantidad
        };
      })
      .filter(Boolean);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stock, ubicaciones, secciones, form.producto_id]);

  const stockSistema = stock.find(
    item =>
      String(item.producto_id) === String(form.producto_id) &&
      String(item.ubicacion_id) === String(form.ubicacion_id)
  );

  const diferencia =
    form.cantidad_real !== "" && stockSistema
      ? Number(form.cantidad_real) - Number(stockSistema.cantidad)
      : "";

  const totalTodasUbicaciones = ubicacionesConStock.reduce((total, ubicacion) => {
    const valor = cantidadesPorUbicacion[ubicacion.id];
    return total + (valor !== undefined && valor !== "" ? Number(valor) : 0);
  }, 0);

  async function crearInventarioConLineas(seccionId, lineas) {
    const createResponse = await fetch(`${API_BASE_URL}/inventories/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        seccion_id: Number(seccionId),
        observaciones: form.observaciones || null,
        lineas: []
      })
    });

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      throw new Error(createData?.detail || "Error al crear inventario");
    }

    const newInventoryId = createData.id;

    for (const linea of lineas) {
      const lineResponse = await fetch(
        `${API_BASE_URL}/inventories/${newInventoryId}/lines`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(linea)
        }
      );

      const lineData = await lineResponse.json();

      if (!lineResponse.ok) {
        throw new Error(lineData?.detail || "Error al añadir línea");
      }
    }

    return newInventoryId;
  }

  async function handleCreateInventory(e) {
    e.preventDefault();

    setMensaje("");
    setError("");
    setCargando(true);

    try {
      if (form.ubicacion_id === TODAS_UBICACIONES) {
        const seccionesImplicadas = [
          ...new Set(ubicacionesConStock.map(u => u.seccion_id))
        ];

        const idsCreados = [];

        for (const seccionId of seccionesImplicadas) {
          const ubicacionesSeccion = ubicacionesConStock.filter(
            u => String(u.seccion_id) === String(seccionId)
          );

          const lineas = ubicacionesSeccion.map(u => ({
            producto_id: Number(form.producto_id),
            ubicacion_id: Number(u.id),
            cantidad_real: Number(cantidadesPorUbicacion[u.id] || 0),
            observaciones: null
          }));

          const nuevoId = await crearInventarioConLineas(seccionId, lineas);
          idsCreados.push(nuevoId);
        }

        setInventoryId(idsCreados[idsCreados.length - 1]);
        setMensaje(
          `Inventario${idsCreados.length > 1 ? "s" : ""} creado${idsCreados.length > 1 ? "s" : ""} correctamente (ID ${idsCreados.join(", ")}). Total contado: ${totalTodasUbicaciones} unidades`
        );
      } else {
        const seccionUbicacion = ubicacionesConStock.find(
          u => String(u.id) === String(form.ubicacion_id)
        );

        const nuevoId = await crearInventarioConLineas(
          seccionUbicacion?.seccion_id,
          [
            {
              producto_id: Number(form.producto_id),
              ubicacion_id: Number(form.ubicacion_id),
              cantidad_real: Number(form.cantidad_real),
              observaciones: null
            }
          ]
        );

        setInventoryId(nuevoId);
        setMensaje(`Inventario creado correctamente con ID ${nuevoId}`);
      }
    } catch (err) {
      setError(err.message || "Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  if (cargandoDatos) {
    return <div style={{ padding: paddingPagina }}>Cargando...</div>;
  }

  return (
    <div style={{ padding: paddingPagina }}>
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
                    ubicacion_id: "",
                    cantidad_real: ""
                  });
                  setCantidadesPorUbicacion({});
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
            <div style={styles.label}>Ubicación</div>
            <select
              name="ubicacion_id"
              value={form.ubicacion_id}
              onChange={handleChange}
              style={styles.input}
              required
              disabled={!form.producto_id}
            >
              <option value="">Seleccionar</option>
              {ubicacionesConStock.map(ubicacion => (
                <option key={ubicacion.id} value={ubicacion.id}>
                  {ubicacion.codigo} · {ubicacion.seccionNombre}
                </option>
              ))}
              {ubicacionesConStock.length > 1 && (
                <option value={TODAS_UBICACIONES}>Todas las ubicaciones</option>
              )}
            </select>
          </div>

          {form.ubicacion_id && form.ubicacion_id !== TODAS_UBICACIONES && (
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
          )}
        </div>

        {form.ubicacion_id === TODAS_UBICACIONES ? (
          <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={styles.label}>Cantidad real por ubicación</div>

            {ubicacionesConStock.map(ubicacion => (
              <div
                key={ubicacion.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "12px",
                  alignItems: "center",
                  padding: "10px 14px",
                  background: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px solid #e5e7eb"
                }}
              >
                <div>
                  <strong>{ubicacion.codigo}</strong> · {ubicacion.seccionNombre}
                </div>
                <div style={{ color: "#6b7280" }}>
                  Stock sistema: {ubicacion.cantidadSistema}
                </div>
                <input
                  type="number"
                  value={cantidadesPorUbicacion[ubicacion.id] ?? ""}
                  onChange={(e) => handleCantidadUbicacion(ubicacion.id, e.target.value)}
                  style={styles.input}
                  required
                  min="0"
                />
              </div>
            ))}

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px",
              background: "#eff6ff",
              borderRadius: "10px",
              border: "1px solid #bfdbfe",
              fontWeight: "700"
            }}>
              <span>Total en almacén</span>
              <span>{totalTodasUbicaciones} unidades</span>
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
        ) : (
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
          </div>
        )}

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