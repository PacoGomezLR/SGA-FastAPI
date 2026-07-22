import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../api/api";
import * as styles from "./ZonaDetalle.styles";

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
    return <div style={styles.errorBox}>{error}</div>;
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={{ margin: 0 }}>{zona.nombre}</h1>
          <p style={styles.subtitle}>Detalle de la zona y sus ubicaciones</p>
        </div>

        <Link to={`/secciones/${zona.seccion_id}`} style={styles.backButton}>
          Volver a la sección
        </Link>
      </div>

      <div style={styles.infoCard}>
        <div style={styles.infoGrid}>
          <div>
            <div style={styles.infoLabel}>Descripción</div>
            <div style={styles.infoValue}>{zona.descripcion || "-"}</div>
          </div>

          <div>
            <div style={styles.infoLabel}>Estado</div>
            <span
              style={{
                ...styles.badge,
                backgroundColor: zona.activo ? "#dcfce7" : "#fee2e2",
                color: zona.activo ? "#166534" : "#991b1b"
              }}
            >
              {zona.activo ? "Activa" : "Inactiva"}
            </span>
          </div>

          <div>
            <div style={styles.infoLabel}>Ubicaciones</div>
            <div style={styles.infoValue}>{ubicaciones.length}</div>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        {/* 🔥 CABECERA CON BOTÓN */}
        <div style={styles.sectionHeader}>
          <h2 style={{ margin: 0 }}>Ubicaciones</h2>

          <Link
            to={`/ubicaciones?nuevo=1&zona_id=${id}`}
            style={styles.createButton}
          >
            + Nueva ubicación
          </Link>
        </div>

        {ubicaciones.length === 0 ? (
          <div style={styles.emptyBox}>No hay ubicaciones en esta zona.</div>
        ) : (
          <div style={styles.grid}>
            {ubicaciones.map((u) => (
              <div key={u.id} style={styles.card}>
                <div style={styles.code}>
                  {u.codigo || `Ubicación ${u.id}`}
                </div>
                <div style={styles.text}>
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

export default ZonaDetalle;