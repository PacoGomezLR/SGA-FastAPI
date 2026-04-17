import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/api";

function Stock() {
  const [stock, setStock] = useState([]);
  const [soloBajo, setSoloBajo] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargarStock() {
    try {
      setCargando(true);
      setError("");

      const endpoint = soloBajo
        ? "/stock?low=true"
        : "/stock";

      const data = await apiFetch(endpoint);

      setStock(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Error al cargar el stock");
      setStock([]);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarStock();
  }, [soloBajo]);

  const totalUnidades = useMemo(() => {
    return stock.reduce((acc, item) => acc + (item.cantidad || 0), 0);
  }, [stock]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          marginBottom: "20px",
          flexWrap: "wrap"
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Stock</h1>
          <p style={{ margin: "6px 0 0 0", color: "#64748b" }}>
            Consulta de existencias y alertas de stock bajo
          </p>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "white",
            padding: "10px 12px",
            borderRadius: "10px",
            boxShadow: "0 5px 15px rgba(0,0,0,0.05)"
          }}
        >
          <input
            type="checkbox"
            checked={soloBajo}
            onChange={(e) => setSoloBajo(e.target.checked)}
          />
          Solo stock bajo
        </label>
      </div>

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

      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "24px"
        }}
      >
        <Card title="Registros" value={stock.length} />
        <Card title="Unidades totales" value={totalUnidades} />
      </div>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
          overflow: "hidden"
        }}
      >
        {cargando ? (
          <div style={{ padding: "20px" }}>
            <p style={{ margin: 0, color: "#64748b" }}>Cargando stock...</p>
          </div>
        ) : stock.length === 0 ? (
          <div style={{ padding: "20px" }}>
            <p style={{ margin: 0, color: "#64748b" }}>
              No hay registros de stock
            </p>
          </div>
        ) : (
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Producto</th>
                <th style={th}>Ubicación</th>
                <th style={th}>Cantidad</th>
                <th style={th}>Stock mínimo</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    backgroundColor: item.bajo_stock ? "#fef2f2" : "white"
                  }}
                >
                  <td style={td}>
                    {item.producto_nombre || item.producto_id}
                  </td>
                  <td style={td}>
                    {item.ubicacion_nombre || item.ubicacion_id}
                  </td>
                  <td
                    style={{
                      ...td,
                      color: item.bajo_stock ? "#dc2626" : "#0f172a",
                      fontWeight: item.bajo_stock ? "700" : "400"
                    }}
                  >
                    {item.cantidad}
                    {item.bajo_stock && (
                      <span
                        style={{
                          display: "inline-block",
                          marginLeft: "8px",
                          padding: "2px 6px",
                          fontSize: "12px",
                          backgroundColor: "#dc2626",
                          color: "white",
                          borderRadius: "6px"
                        }}
                      >
                        BAJO
                      </span>
                    )}
                  </td>
                  <td style={td}>
                    {item.stock_minimo ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
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
      <h3 style={{ margin: 0, color: "#334155" }}>{title}</h3>

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

const table = {
  width: "100%",
  borderCollapse: "collapse"
};

const th = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid #ddd",
  backgroundColor: "#f8fafc"
};

const td = {
  padding: "12px",
  borderBottom: "1px solid #eee"
};

export default Stock;