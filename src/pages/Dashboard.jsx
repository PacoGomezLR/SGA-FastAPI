import { useEffect, useState } from "react";
import { AlertTriangle, Boxes, Package, Warehouse } from "lucide-react";
import { apiFetch } from "../api/api";
import * as styles from "./Dashboard.styles";
import DashboardCharts from "./DashboardCharts";

function Dashboard() {
  const [totalProductos, setTotalProductos] = useState(0);
  const [totalAlmacenes, setTotalAlmacenes] = useState(0);
  const [stockTotal, setStockTotal] = useState(0);
  const [productosEnRiesgo, setProductosEnRiesgo] = useState(0);

  const [ultimosMovimientos, setUltimosMovimientos] = useState([]);
  const [alertasStock, setAlertasStock] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setCargando(true);
      setError("");

      const [productos, almacenes, stock, movimientos] = await Promise.all([
        apiFetch("/products/"),
        apiFetch("/warehouses/"),
        apiFetch("/stock?detailed=true"),
        apiFetch("/movements/")
      ]);

      const productosArray = Array.isArray(productos) ? productos : [];
      const almacenesArray = Array.isArray(almacenes) ? almacenes : [];
      const stockArray = Array.isArray(stock) ? stock : [];
      const movimientosArray = Array.isArray(movimientos) ? movimientos : [];

      setTotalProductos(productosArray.length);
      setTotalAlmacenes(almacenesArray.length);

      const totalStock = stockArray.reduce(
        (acc, item) => acc + Number(item.cantidad || 0),
        0
      );

      setStockTotal(totalStock);

      const riesgo = stockArray.filter((item) => item.bajo_stock === true);

      setProductosEnRiesgo(riesgo.length);
      setAlertasStock(riesgo.slice(0, 6));

      const ultimos = movimientosArray
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 8);

      setUltimosMovimientos(ultimos);
    } catch (err) {
      setError(err.message || "Error al cargar datos");
    } finally {
      setCargando(false);
    }
  }

  function colorTipo(tipo) {
    if (tipo === "entrada") return "#166534";
    if (tipo === "salida") return "#991b1b";
    if (tipo === "traslado") return "#1d4ed8";
    if (tipo === "ajuste") return "#92400e";
    return "#374151";
  }

  function signoMovimiento(mov) {
    if (mov.tipo_movimiento === "entrada") return "+";
    if (mov.tipo_movimiento === "salida") return "-";
    return "";
  }

  if (cargando) {
    return (
      <div style={{ padding: "30px" }}>
        <h1>Resumen Almacén</h1>
        <div style={styles.cardBase}>Cargando datos...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ marginTop: 0, marginBottom: "8px" }}>Resumen Almacén</h1>

      <p style={{ color: "#6b7280", marginBottom: "24px" }}>
        Vista general del estado actual del almacén.
      </p>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "12px",
            borderRadius: "10px",
            marginBottom: "18px"
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "18px",
          marginBottom: "24px"
        }}
      >
        <Card
          title="Total productos"
          value={totalProductos}
          icon={Package}
          color="#2a78d6"
        />
        <Card
          title="Total almacenes"
          value={totalAlmacenes}
          icon={Warehouse}
          color="#1baf7a"
        />
        <Card
          title="Stock total"
          value={stockTotal}
          icon={Boxes}
          color="#eda100"
        />
        <Card
          title="Productos en riesgo"
          value={productosEnRiesgo}
          icon={AlertTriangle}
          color="#991b1b"
        />
      </div>

      <DashboardCharts />

      <div style={{ ...styles.cardBase, marginBottom: "24px" }}>
        <h3 style={{ marginTop: 0, marginBottom: "16px" }}>
          Alertas de stock bajo
        </h3>

        {alertasStock.length === 0 ? (
          <p style={{ margin: 0, color: "#6b7280" }}>
            No hay productos en riesgo.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: "0",
                minWidth: "760px",
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                borderRadius: "10px",
                overflow: "hidden"
              }}
            >
              <thead>
                <tr>
                  <th style={styles.alertTh}>Producto</th>
                  <th style={styles.alertThCenter}>Stock</th>
                  <th style={styles.alertThCenter}>Mínimo</th>
                  <th style={styles.alertThCenter}>Ubicación</th>
                </tr>
              </thead>

              <tbody>
                {alertasStock.map((item, index) => (
                  <tr key={index}>
                    <td style={styles.alertTdStrong}>{item.producto_nombre}</td>
                    <td style={styles.alertTdCenter}>{item.cantidad}</td>
                    <td style={styles.alertTdCenter}>{item.stock_minimo}</td>
                    <td style={styles.alertTdCenter}>{item.ubicacion_nombre || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={styles.cardBase}>
        <h3 style={{ marginTop: 0, marginBottom: "16px" }}>
          Últimos movimientos
        </h3>

        {ultimosMovimientos.length === 0 ? (
          <p style={{ color: "#6b7280", margin: 0 }}>
            No hay movimientos recientes.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "950px"
              }}
            >
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Producto</th>
                  <th style={styles.th}>Cantidad</th>
                  <th style={styles.th}>Tipo</th>
                  <th style={styles.th}>Origen</th>
                  <th style={styles.th}>Destino</th>
                  <th style={styles.th}>Usuario</th>
                </tr>
              </thead>

              <tbody>
                {ultimosMovimientos.map((mov) => (
                  <tr key={mov.id}>
                    <td style={styles.td}>{new Date(mov.fecha).toLocaleString()}</td>
                    <td style={styles.td}>{mov.producto_nombre || mov.producto_id}</td>

                    <td
                      style={{
                        ...styles.td,
                        fontWeight: "700",
                        color:
                          mov.tipo_movimiento === "salida"
                            ? "#991b1b"
                            : "#166534"
                      }}
                    >
                      {signoMovimiento(mov)}
                      {mov.cantidad}
                    </td>

                    <td style={styles.td}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "999px",
                          background: "#f3f4f6",
                          color: colorTipo(mov.tipo_movimiento),
                          fontWeight: "700",
                          fontSize: "13px"
                        }}
                      >
                        {mov.tipo_movimiento}
                      </span>
                    </td>

                    <td style={styles.td}>{mov.ubicacion_origen_nombre || "-"}</td>
                    <td style={styles.td}>{mov.ubicacion_destino_nombre || "-"}</td>
                    <td style={styles.td}>{mov.usuario_nombre || mov.usuario_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, value, color = "#0f172a", icon: Icon }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "14px",
        padding: "20px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "12px"
      }}
    >
      <div>
        <div style={{ color: "#6b7280", fontSize: "14px", marginBottom: "8px" }}>
          {title}
        </div>

        <div style={{ fontSize: "34px", fontWeight: "700", color }}>{value}</div>
      </div>

      {Icon && (
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            backgroundColor: `${color}1a`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <Icon size={22} color={color} strokeWidth={2} />
        </div>
      )}
    </div>
  );
}

export default Dashboard;