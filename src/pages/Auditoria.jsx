import { useEffect, useMemo, useState } from "react";
import { ArrowDownCircle, ArrowLeftRight, ArrowUpCircle, ListChecks } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useIsMobile } from "../hooks/useMediaQuery";
import * as styles from "./Auditoria.styles";

function Auditoria() {
  const { token, authFetch } = useAuth();
  const esMobile = useIsMobile();
  const paddingPagina = esMobile ? "16px" : "30px";

  const [movements, setMovements] = useState([]);
  const [fechaBusqueda, setFechaBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [busquedaTexto, setBusquedaTexto] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    cargarAuditoria();
  }, [token]);

  async function cargarAuditoria() {
    try {
      setCargando(true);
      setError("");

      const res = await authFetch("/movements/audit");

      if (!res.ok) {
        throw new Error("No se pudo cargar la auditoría");
      }

      const data = await res.json();

      setMovements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Error al cargar auditoría");
    } finally {
      setCargando(false);
    }
  }

  function formatearCambio(movement) {
    if (movement.tipo_movimiento === "entrada") {
      return `+${movement.cantidad}`;
    }

    if (movement.tipo_movimiento === "salida") {
      return `-${movement.cantidad}`;
    }

    if (movement.tipo_movimiento === "ajuste") {
      if (movement.ubicacion_origen_id) {
        return `-${movement.cantidad}`;
      }

      if (movement.ubicacion_destino_id) {
        return `+${movement.cantidad}`;
      }
    }

    return movement.cantidad;
  }

  function colorTipo(tipo) {
    if (tipo === "entrada") return "#166534";
    if (tipo === "salida") return "#991b1b";
    if (tipo === "traslado") return "#1d4ed8";
    if (tipo === "ajuste") return "#92400e";
    return "#374151";
  }

  const movementsFiltrados = useMemo(() => {
    let resultado = [...movements];

    if (fechaBusqueda) {
      resultado = resultado.filter((m) => {
        const fecha = new Date(m.fecha);
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, "0");
        const dia = String(fecha.getDate()).padStart(2, "0");

        return `${año}-${mes}-${dia}` === fechaBusqueda;
      });
    }

    if (tipoFiltro) {
      resultado = resultado.filter(
        (m) => m.tipo_movimiento === tipoFiltro
      );
    }

    if (busquedaTexto.trim()) {
      const texto = busquedaTexto.toLowerCase();

      resultado = resultado.filter((m) =>
        (
          (m.producto_nombre || "") +
          " " +
          (m.usuario_nombre || "") +
          " " +
          (m.observaciones || "") +
          " " +
          (m.ubicacion_origen_nombre || "") +
          " " +
          (m.ubicacion_destino_nombre || "")
        )
          .toLowerCase()
          .includes(texto)
      );
    }

    return resultado;
  }, [movements, fechaBusqueda, tipoFiltro, busquedaTexto]);

  const resumen = useMemo(() => {
    return {
      total: movementsFiltrados.length,
      entradas: movementsFiltrados.filter(
        (m) => m.tipo_movimiento === "entrada"
      ).length,
      salidas: movementsFiltrados.filter(
        (m) => m.tipo_movimiento === "salida"
      ).length,
      traslados: movementsFiltrados.filter(
        (m) => m.tipo_movimiento === "traslado"
      ).length
    };
  }, [movementsFiltrados]);

  return (
    <div style={{ padding: paddingPagina }}>
      <h1 style={{ marginTop: 0 }}>Auditoría</h1>

      <p style={{ color: "#6b7280", marginBottom: "22px" }}>
        Historial completo de movimientos realizados dentro del sistema.
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

      <div style={styles.statsGrid}>
        <Card title="Total" value={resumen.total} icon={ListChecks} color="#374151" />
        <Card title="Entradas" value={resumen.entradas} icon={ArrowDownCircle} color="#166534" />
        <Card title="Salidas" value={resumen.salidas} icon={ArrowUpCircle} color="#991b1b" />
        <Card title="Traslados" value={resumen.traslados} icon={ArrowLeftRight} color="#1d4ed8" />
      </div>

      <div
        style={{
          ...styles.card,
          marginBottom: "20px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center"
        }}
      >
        <input
          type="date"
          value={fechaBusqueda}
          onChange={(e) => setFechaBusqueda(e.target.value)}
          style={styles.input}
        />

        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          style={styles.input}
        >
          <option value="">Todos los tipos</option>
          <option value="entrada">Entrada</option>
          <option value="salida">Salida</option>
          <option value="traslado">Traslado</option>
          <option value="ajuste">Ajuste</option>
        </select>

        <input
          type="text"
          placeholder="Buscar producto, usuario, ubicación..."
          value={busquedaTexto}
          onChange={(e) => setBusquedaTexto(e.target.value)}
          style={{
            ...styles.input,
            minWidth: "280px",
            flex: 1
          }}
        />

        <button
          type="button"
          onClick={() => {
            setFechaBusqueda("");
            setTipoFiltro("");
            setBusquedaTexto("");
          }}
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            border: "none",
            background: "#111827",
            color: "#fff",
            cursor: "pointer",
            fontWeight: "700"
          }}
        >
          Limpiar filtros
        </button>
      </div>

      <div
        style={{
          ...styles.card,
          overflowX: "auto"
        }}
      >
        {cargando ? (
          <div>Cargando...</div>
        ) : movementsFiltrados.length === 0 ? (
          <div style={{ color: "#6b7280" }}>
            No hay movimientos con esos filtros.
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "1100px"
            }}
          >
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Producto</th>
                <th style={styles.th}>Cambio</th>
                <th style={styles.th}>Origen</th>
                <th style={styles.th}>Destino</th>
                <th style={styles.th}>Usuario</th>
                <th style={styles.th}>Descripción</th>
              </tr>
            </thead>

            <tbody>
              {movementsFiltrados.map((m) => (
                <tr key={m.id}>
                  <td style={styles.td}>
                    {new Date(m.fecha).toLocaleString()}
                  </td>

                  <td style={styles.td}>
                    <span
                      style={{
                        background: "#f3f4f6",
                        color: colorTipo(m.tipo_movimiento),
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontWeight: "700",
                        fontSize: "13px"
                      }}
                    >
                      {m.tipo_movimiento}
                    </span>
                  </td>

                  <td style={styles.td}>
                    {m.producto_nombre ?? m.producto_id}
                  </td>

                  <td
                    style={{
                      ...styles.td,
                      fontWeight: "700",
                      color:
                        String(formatearCambio(m)).includes("-")
                          ? "#991b1b"
                          : "#166534"
                    }}
                  >
                    {formatearCambio(m)}
                  </td>

                  <td style={styles.td}>
                    {m.ubicacion_origen_nombre ?? "-"}
                  </td>

                  <td style={styles.td}>
                    {m.ubicacion_destino_nombre ?? "-"}
                  </td>

                  <td style={styles.td}>
                    {m.usuario_nombre ?? m.usuario_id}
                  </td>

                  <td style={styles.td}>
                    {m.observaciones || (
                      <span style={{ color: "#9ca3af" }}>
                        Sin descripción
                      </span>
                    )}
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

function Card({ title, value, color = "#0f172a", icon: Icon }) {
  return (
    <div style={styles.statCard}>
      <div>
        <h3 style={styles.statCardTitle}>{title}</h3>
        <p style={{ ...styles.statCardValue, color }}>{value}</p>
      </div>

      {Icon && (
        <div style={{ ...styles.statCardIconWrapper, backgroundColor: `${color}1a` }}>
          <Icon size={20} color={color} strokeWidth={2} />
        </div>
      )}
    </div>
  );
}

export default Auditoria;