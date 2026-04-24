import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/api";

function Stock() {
  const [stock, setStock] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [soloBajo, setSoloBajo] = useState(false);
  const [almacenId, setAlmacenId] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargarStock() {
    try {
      setCargando(true);
      setError("");

      const params = new URLSearchParams();

      if (soloBajo) {
        params.append("low", "true");
      }

      if (almacenId !== "") {
        params.append("almacen_id", almacenId);
      }

      const endpoint = params.toString() ? `/stock?${params.toString()}` : "/stock";
      const data = await apiFetch(endpoint);

      setStock(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Error al cargar el stock");
      setStock([]);
    } finally {
      setCargando(false);
    }
  }

  async function cargarAlmacenes() {
    try {
      const data = await apiFetch("/warehouses/");
      setAlmacenes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError((prev) => prev || err.message || "Error al cargar almacenes");
      setAlmacenes([]);
    }
  }

  async function cargarCategorias() {
    try {
      const data = await apiFetch("/categories/");
      setCategorias(Array.isArray(data) ? data : []);
    } catch (err) {
      setError((prev) => prev || err.message || "Error al cargar categorías");
      setCategorias([]);
    }
  }

  useEffect(() => {
    cargarAlmacenes();
    cargarCategorias();
  }, []);

  useEffect(() => {
    cargarStock();
  }, [soloBajo, almacenId]);

  const stockFiltrado = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return stock.filter((item) => {
      const coincideBusqueda =
        texto === "" ||
        (item.producto_nombre || "").toLowerCase().includes(texto) ||
        String(item.producto_id || "").includes(texto) ||
        (item.ubicacion_nombre || "").toLowerCase().includes(texto) ||
        (item.almacen_nombre || "").toLowerCase().includes(texto) ||
        (item.categoria_nombre || "").toLowerCase().includes(texto);

      const coincideCategoria =
        categoria === "" || String(item.categoria_nombre || "") === categoria;

      return coincideBusqueda && coincideCategoria;
    });
  }, [stock, busqueda, categoria]);

  const totalUnidades = useMemo(() => {
    return stockFiltrado.reduce((acc, item) => acc + (item.cantidad || 0), 0);
  }, [stockFiltrado]);

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
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: "20px"
        }}
      >
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

        <div
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
          <label htmlFor="almacen">Almacén</label>
          <select
            id="almacen"
            value={almacenId}
            onChange={(e) => setAlmacenId(e.target.value)}
          >
            <option value="">Todos</option>
            {almacenes.map((almacen) => (
              <option key={almacen.id} value={almacen.id}>
                {almacen.nombre}
              </option>
            ))}
          </select>
        </div>

        <div
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
          <label htmlFor="categoria">Categoría</label>
          <select
            id="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">Todas</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.nombre}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          placeholder="Buscar producto, almacén o ubicación..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={searchInput}
        />
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
        <Card title="Registros" value={stockFiltrado.length} />
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
        ) : stockFiltrado.length === 0 ? (
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
                <th style={th}>Categoría</th>
                <th style={th}>Almacén</th>
                <th style={th}>Ubicación</th>
                <th style={th}>Cantidad</th>
                <th style={th}>Stock mínimo</th>
              </tr>
            </thead>
            <tbody>
              {stockFiltrado.map((item) => (
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
                    {item.categoria_nombre || "-"}
                  </td>
                  <td style={td}>
                    {item.almacen_nombre || item.almacen_id || "-"}
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

const searchInput = {
  minWidth: "260px",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  outline: "none",
  backgroundColor: "white",
  boxShadow: "0 5px 15px rgba(0,0,0,0.05)"
};

export default Stock;