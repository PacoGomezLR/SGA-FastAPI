import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../api/api";

function ZonaDetalle() {
  const { id } = useParams();

  const [zona, setZona] = useState(null);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarDatos();
  }, [id]);

  async function cargarDatos() {
    try {
      setCargando(true);
      setError("");

      const [zonasData, ubicacionesData] = await Promise.all([
        apiFetch("/zones/"),
        apiFetch("/locations/")
      ]);

      const zonaEncontrada = zonasData.find(
        (z) => String(z.id) === String(id)
      );

      if (!zonaEncontrada) {
        throw new Error("Zona no encontrada");
      }

      setZona(zonaEncontrada);

      const ubicacionesZona = ubicacionesData.filter(
        (u) => String(u.zona_id) === String(id)
      );

      setUbicaciones(ubicacionesZona);
    } catch (err) {
      setError(err.message || "Error al cargar la zona");
    } finally {
      setCargando(false);
    }
  }

  if (cargando) {
    return <p>Cargando zona...</p>;
  }

  if (error) {
    return <div style={errorBox}>{error}</div>;
  }

  return (
    <div>
      <div style={header}>
        <div>
          <h1 style={{ margin: 0 }}>{zona.nombre}</h1>
          <p style={subtitle}>Detalle de la zona y sus ubicaciones</p>
        </div>

        <Link to={`/almacenes/${zona.almacen_id}`} style={backButton}>
          Volver al almacén
        </Link>
      </div>

      <div style={infoCard}>
        <div style={infoGrid}>
          <div>
            <div style={infoLabel}>Descripción</div>
            <div style={infoValue}>{zona.descripcion || "-"}</div>
          </div>

          <div>
            <div style={infoLabel}>Estado</div>
            <span
              style={{
                ...badge,
                backgroundColor: zona.activo ? "#dcfce7" : "#fee2e2",
                color: zona.activo ? "#166534" : "#991b1b"
              }}
            >
              {zona.activo ? "Activa" : "Inactiva"}
            </span>
          </div>

          <div>
            <div style={infoLabel}>Ubicaciones</div>
            <div style={infoValue}>{ubicaciones.length}</div>
          </div>
        </div>
      </div>

      <div style={section}>
        {/* 🔥 CABECERA CON BOTÓN */}
        <div style={sectionHeader}>
          <h2 style={{ margin: 0 }}>Ubicaciones</h2>

          <Link
            to={`/ubicaciones?nuevo=1&zona_id=${id}`}
            style={createButton}
          >
            + Nueva ubicación
          </Link>
        </div>

        {ubicaciones.length === 0 ? (
          <div style={emptyBox}>No hay ubicaciones en esta zona.</div>
        ) : (
          <div style={grid}>
            {ubicaciones.map((u) => (
              <div key={u.id} style={card}>
                <div style={code}>
                  {u.codigo || `Ubicación ${u.id}`}
                </div>
                <div style={text}>
                  {u.descripcion || "Sin descripción"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ESTILOS */

const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px"
};

const createButton = {
  padding: "10px 14px",
  borderRadius: "8px",
  textDecoration: "none",
  backgroundColor: "#2563eb",
  color: "white",
  fontWeight: "600"
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "24px"
};

const subtitle = {
  margin: "6px 0 0 0",
  color: "#64748b"
};

const backButton = {
  padding: "10px 14px",
  borderRadius: "8px",
  textDecoration: "none",
  backgroundColor: "white",
  border: "1px solid #cbd5e1",
  fontWeight: "600"
};

const infoCard = {
  backgroundColor: "white",
  borderRadius: "12px",
  padding: "20px",
  marginBottom: "24px",
  boxShadow: "0 5px 15px rgba(0,0,0,0.05)"
};

const infoGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "16px"
};

const infoLabel = {
  fontSize: "13px",
  color: "#64748b",
  marginBottom: "6px"
};

const infoValue = {
  fontWeight: "700"
};

const badge = {
  padding: "4px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "700"
};

const section = {
  marginTop: "16px"
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "16px"
};

const card = {
  backgroundColor: "white",
  padding: "16px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0"
};

const code = {
  fontWeight: "700",
  marginBottom: "6px"
};

const text = {
  color: "#64748b"
};

const emptyBox = {
  padding: "16px",
  backgroundColor: "white",
  borderRadius: "10px"
};

const errorBox = {
  padding: "12px",
  backgroundColor: "#fee2e2",
  color: "#991b1b",
  borderRadius: "8px"
};

export default ZonaDetalle;