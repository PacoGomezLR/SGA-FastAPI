import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";

function Dashboard() {
  const [totalProductos, setTotalProductos] = useState(0);
  const [totalAlmacenes, setTotalAlmacenes] = useState(0);
  const [stockTotal, setStockTotal] = useState(0);
  const [productosEnRiesgo, setProductosEnRiesgo] = useState(0);

  const [ultimosMovimientos, setUltimosMovimientos] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarDatos() {
      try {
        setCargando(true);
        setError("");

        const [productos, almacenes, stock, movimientos] = await Promise.all([
          apiFetch("/products/"),
          apiFetch("/warehouses/"),
          apiFetch("/stock/"),
          apiFetch("/movements/")
        ]);

        const productosArray = Array.isArray(productos) ? productos : [];
        const almacenesArray = Array.isArray(almacenes) ? almacenes : [];
        const stockArray = Array.isArray(stock) ? stock : [];
        const movimientosArray = Array.isArray(movimientos) ? movimientos : [];

        setTotalProductos(productosArray.length);
        setTotalAlmacenes(almacenesArray.length);

        const totalStock = stockArray.reduce(
          (acc, item) => acc + (item.cantidad || 0),
          0
        );
        setStockTotal(totalStock);

        const stockPorProducto = stockArray.reduce((acc, item) => {
          const productoId = item.producto_id;
          const cantidad = item.cantidad || 0;

          acc[productoId] = (acc[productoId] || 0) + cantidad;
          return acc;
        }, {});

        const totalProductosEnRiesgo = productosArray.filter((producto) => {
          const stockActual = stockPorProducto[producto.id] || 0;
          const stockMinimo = producto.stock_minimo || 0;

          return stockActual <= stockMinimo;
        }).length;

        setProductosEnRiesgo(totalProductosEnRiesgo);

        const ultimos = movimientosArray
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
          .slice(0, 5);

        setUltimosMovimientos(ultimos);
      } catch (err) {
        setError(err.message || "Error al cargar datos");
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: "20px" }}>Dashboard</h1>

      {error && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px",
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            borderRadius: "8px",
            fontWeight: "500"
          }}
        >
          {error}
        </div>
      )}

      {cargando ? (
        <div
          style={{
            padding: "20px",
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
            maxWidth: "300px"
          }}
        >
          <p style={{ margin: 0, color: "#64748b" }}>
            Cargando datos...
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
              marginBottom: "30px"
            }}
          >
            <Card title="Total productos" value={totalProductos} />
            <Card title="Total almacenes" value={totalAlmacenes} />
            <Card title="Stock total" value={stockTotal} />
            <Card title="Productos en riesgo" value={productosEnRiesgo} />
          </div>

          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 5px 15px rgba(0,0,0,0.05)"
            }}
          >
            <h3 style={{ marginBottom: "16px", color: "#334155" }}>
              Últimos movimientos
            </h3>

            {ultimosMovimientos.length === 0 ? (
              <p style={{ color: "#64748b" }}>No hay movimientos recientes</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#64748b" }}>
                    <th>Fecha</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosMovimientos.map((mov) => (
                    <tr key={mov.id}>
                      <td>{new Date(mov.fecha).toLocaleString()}</td>
                      <td>{mov.producto_id}</td>
                      <td>{mov.cantidad}</td>
                      <td>{mov.tipo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
        minWidth: "220px"
      }}
    >
      <h3 style={{ margin: 0, color: "#334155" }}>
        {title}
      </h3>

      <p
        style={{
          fontSize: "32px",
          fontWeight: "700",
          marginTop: "10px",
          color: "#0f172a"
        }}
      >
        {value}
      </p>
    </div>
  );
}

export default Dashboard;