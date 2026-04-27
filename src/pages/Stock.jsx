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

      if (soloBajo) params.append("low", "true");
      if (almacenId !== "") params.append("almacen_id", almacenId);

      const endpoint = params.toString()
        ? `/stock?${params.toString()}`
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
        (item.zona_nombre || "").toLowerCase().includes(texto) ||
        (item.almacen_nombre || "").toLowerCase().includes(texto) ||
        (item.categoria_nombre || "").toLowerCase().includes(texto);

      const coincideCategoria =
        categoria === "" || String(item.categoria_nombre || "") === categoria;

      return coincideBusqueda && coincideCategoria;
    });
  }, [stock, busqueda, categoria]);

  function formatearCantidad(cantidad) {
    return Number(cantidad || 0);
  }

  return (
    <div>
      <div style={header}>
        <div>
          <h1 style={{ margin: 0 }}>Stock</h1>
          <p style={subtitle}>
            Consulta de existencias por producto, almacén, zona y ubicación.
          </p>
        </div>
      </div>

      <section style={filtersCard}>
        <label style={checkboxFilter}>
          <input
            type="checkbox"
            checked={soloBajo}
            onChange={(e) => setSoloBajo(e.target.checked)}
          />
          Solo stock bajo
        </label>

        <div style={filterGroup}>
          <label htmlFor="almacen" style={filterLabel}>
            Almacén
          </label>
          <select
            id="almacen"
            value={almacenId}
            onChange={(e) => setAlmacenId(e.target.value)}
            style={select}
          >
            <option value="">Todos</option>
            {almacenes.map((almacen) => (
              <option key={almacen.id} value={almacen.id}>
                {almacen.nombre}
              </option>
            ))}
          </select>
        </div>

        <div style={filterGroup}>
          <label htmlFor="categoria" style={filterLabel}>
            Categoría
          </label>
          <select
            id="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            style={select}
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
          placeholder="Buscar producto, almacén, zona o ubicación..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={searchInput}
        />
      </section>

      {error && <div style={errorBox}>{error}</div>}

      <section style={tableCard}>
        {cargando ? (
          <div style={emptyBox}>Cargando stock...</div>
        ) : stockFiltrado.length === 0 ? (
          <div style={emptyBox}>No hay registros de stock</div>
        ) : (
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Producto</th>
                <th style={th}>Categoría</th>
                <th style={th}>Almacén</th>
                <th style={th}>Zona</th>
                <th style={th}>Ubicación</th>
                <th style={th}>Cantidad</th>
                <th style={th}>Stock mínimo</th>
              </tr>
            </thead>

            <tbody>
              {stockFiltrado.map((item, index) => (
                <tr
                  key={`${item.producto_id}-${item.ubicacion_id || "sin"}-${index}`}
                  style={{
                    backgroundColor: item.bajo_stock ? "#fff1f2" : "white"
                  }}
                >
                  <td style={td}>{item.producto_nombre || item.producto_id}</td>
                  <td style={td}>{item.categoria_nombre || "-"}</td>
                  <td style={td}>{item.almacen_nombre || "-"}</td>
                  <td style={td}>{item.zona_nombre || "-"}</td>
                  <td style={td}>{item.ubicacion_nombre || "-"}</td>

                  <td style={tdCantidad}>
                    <span
                      style={{
                        ...cantidadTexto,
                        color: item.bajo_stock ? "#dc2626" : "#0f172a"
                      }}
                    >
                      {formatearCantidad(item.cantidad)}
                    </span>

                    <span style={badgeWrapper}>
                      {item.bajo_stock && <span style={badgeBajo}>BAJO</span>}
                    </span>
                  </td>

                  <td style={td}>{formatearCantidad(item.stock_minimo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
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

const filtersCard = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  alignItems: "center",
  backgroundColor: "white",
  borderRadius: "14px",
  padding: "16px",
  marginBottom: "20px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 5px 15px rgba(15, 23, 42, 0.05)"
};

const checkboxFilter = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontWeight: "700",
  color: "#0f172a"
};

const filterGroup = {
  display: "flex",
  alignItems: "center",
  gap: "8px"
};

const filterLabel = {
  fontWeight: "700",
  color: "#334155"
};

const select = {
  padding: "9px 10px",
  borderRadius: "9px",
  border: "1px solid #cbd5e1",
  backgroundColor: "white",
  color: "#0f172a",
  outline: "none"
};

const searchInput = {
  minWidth: "330px",
  padding: "10px 12px",
  borderRadius: "9px",
  border: "1px solid #cbd5e1",
  outline: "none",
  backgroundColor: "white"
};

const errorBox = {
  marginBottom: "16px",
  padding: "12px 14px",
  backgroundColor: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fca5a5",
  borderRadius: "10px",
  fontWeight: "600"
};

const tableCard = {
  backgroundColor: "white",
  borderRadius: "14px",
  boxShadow: "0 5px 15px rgba(15, 23, 42, 0.05)",
  border: "1px solid #e2e8f0",
  overflow: "hidden"
};

const emptyBox = {
  padding: "20px",
  color: "#64748b",
  fontWeight: "600"
};

const table = {
  width: "100%",
  borderCollapse: "collapse"
};

const th = {
  textAlign: "left",
  padding: "14px 12px",
  borderBottom: "1px solid #e2e8f0",
  backgroundColor: "#f8fafc",
  color: "#0f172a",
  fontWeight: "800"
};

const td = {
  padding: "13px 12px",
  borderBottom: "1px solid #f1f5f9",
  color: "#0f172a"
};

const tdCantidad = {
  ...td,
  whiteSpace: "nowrap"
};

const cantidadTexto = {
  display: "inline-block",
  width: "40px",
  fontFamily: "monospace",
  fontWeight: "800",
  letterSpacing: "1px",
  textAlign: "right"
};

const badgeWrapper = {
  display: "inline-block",
  width: "60px",
  marginLeft: "10px"
};

const badgeBajo = {
  display: "inline-block",
  padding: "3px 7px",
  fontSize: "11px",
  backgroundColor: "#dc2626",
  color: "white",
  borderRadius: "999px",
  fontWeight: "800"
};

export default Stock;