import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/api";
import * as styles from "./Stock.styles";

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
      <div style={styles.header}>
        <div>
          <h1 style={{ margin: 0 }}>Stock</h1>
          <p style={styles.subtitle}>
            Consulta de existencias por producto, almacén, zona y ubicación.
          </p>
        </div>
      </div>

      <section style={styles.filtersCard}>
        <label style={styles.checkboxFilter}>
          <input
            type="checkbox"
            checked={soloBajo}
            onChange={(e) => setSoloBajo(e.target.checked)}
          />
          Solo stock bajo
        </label>

        <div style={styles.filterGroup}>
          <label htmlFor="almacen" style={styles.filterLabel}>
            Almacén
          </label>
          <select
            id="almacen"
            value={almacenId}
            onChange={(e) => setAlmacenId(e.target.value)}
            style={styles.select}
          >
            <option value="">Todos</option>
            {almacenes.map((almacen) => (
              <option key={almacen.id} value={almacen.id}>
                {almacen.nombre}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label htmlFor="categoria" style={styles.filterLabel}>
            Categoría
          </label>
          <select
            id="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            style={styles.select}
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
          style={styles.searchInput}
        />
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}

      <section style={styles.tableCard}>
        {cargando ? (
          <div style={styles.emptyBox}>Cargando stock...</div>
        ) : stockFiltrado.length === 0 ? (
          <div style={styles.emptyBox}>No hay registros de stock</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Producto</th>
                <th style={styles.th}>Categoría</th>
                <th style={styles.th}>Almacén</th>
                <th style={styles.th}>Zona</th>
                <th style={styles.th}>Ubicación</th>
                <th style={styles.th}>Cantidad</th>
                <th style={styles.th}>Stock mínimo</th>
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
                  <td style={styles.td}>{item.producto_nombre || item.producto_id}</td>
                  <td style={styles.td}>{item.categoria_nombre || "-"}</td>
                  <td style={styles.td}>{item.almacen_nombre || "-"}</td>
                  <td style={styles.td}>{item.zona_nombre || "-"}</td>
                  <td style={styles.td}>{item.ubicacion_nombre || "-"}</td>

                  <td style={styles.tdCantidad}>
                    <span
                      style={{
                        ...styles.cantidadTexto,
                        color: item.bajo_stock ? "#dc2626" : "#0f172a"
                      }}
                    >
                      {formatearCantidad(item.cantidad)}
                    </span>

                    <span style={styles.badgeWrapper}>
                      {item.bajo_stock && <span style={styles.badgeBajo}>BAJO</span>}
                    </span>
                  </td>

                  <td style={styles.td}>{formatearCantidad(item.stock_minimo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default Stock;