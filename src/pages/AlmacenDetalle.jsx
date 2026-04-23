import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api/api";

function AlmacenDetalle() {
  const { id } = useParams();

  const [almacen, setAlmacen] = useState(null);
  const [zonas, setZonas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarDetalle();
  }, [id]);

  async function cargarDetalle() {
    try {
      setCargando(true);
      setError("");

      const [almacenData, zonasData, ubicacionesData] = await Promise.all([
        apiFetch(`/warehouses/${id}`),
        apiFetch("/zones/"),
        apiFetch("/locations/")
      ]);

      setAlmacen(almacenData || null);

      const zonasDelAlmacen = Array.isArray(zonasData)
        ? zonasData.filter((zona) => String(zona.almacen_id) === String(id))
        : [];

      setZonas(zonasDelAlmacen);
      setUbicaciones(Array.isArray(ubicacionesData) ? ubicacionesData : []);
    } catch (err) {
      setError(err.message || "Error al cargar el detalle del almacén");
      setAlmacen(null);
      setZonas([]);
      setUbicaciones([]);
    } finally {
      setCargando(false);
    }
  }

  const ubicacionesPorZona = useMemo(() => {
    const mapa = new Map();

    zonas.forEach((zona) => {
      mapa.set(zona.id, []);
    });

    ubicaciones.forEach((ubicacion) => {
      if (mapa.has(ubicacion.zona_id)) {
        mapa.get(ubicacion.zona_id).push(ubicacion);
      }
    });

    return mapa;
  }, [zonas, ubicaciones]);

  if (cargando) {
    return <p>Cargando detalle del almacén...</p>;
  }

  if (error) {
    return <div style={errorBox}>{error}</div>;
  }

  if (!almacen) {
    return <p>No se ha encontrado el almacén.</p>;
  }

  return (
    <div>
      <div style={header}>
        <div>
          <h1 style={{ margin: 0 }}>{almacen.nombre}</h1>
          <p style={subtitle}>
            Vista jerárquica del almacén, sus zonas y sus ubicaciones
          </p>
        </div>

        <Link to="/almacenes" style={backButton}>
          Volver a almacenes
        </Link>
      </div>

      <div style={infoCard}>
        <div style={infoGrid}>
          <div>
            <div style={infoLabel}>Descripción</div>
            <div style={infoValue}>{almacen.descripcion || "-"}</div>
          </div>

          <div>
            <div style={infoLabel}>Dirección</div>
            <div style={infoValue}>{almacen.direccion || "-"}</div>
          </div>

          <div>
            <div style={infoLabel}>Estado</div>
            <span
              style={{
                ...badge,
                backgroundColor: almacen.activo ? "#dcfce7" : "#fee2e2",
                color: almacen.activo ? "#166534" : "#991b1b"
              }}
            >
              {almacen.activo ? "Activo" : "Inactivo"}
            </span>
          </div>

          <div>
            <div style={infoLabel}>Zonas</div>
            <div style={infoValue}>{zonas.length}</div>
          </div>
        </div>
      </div>

      <div style={section}>
        <h2 style={sectionTitle}>Zonas y ubicaciones</h2>

        {zonas.length === 0 ? (
          <div style={emptyBox}>Este almacén todavía no tiene zonas.</div>
        ) : (
          <div style={zonesGrid}>
            {zonas.map((zona) => {
              const ubicacionesZona = ubicacionesPorZona.get(zona.id) || [];

              return (
                <div key={zona.id} style={zoneCard}>
                  <div style={zoneHeader}>
                    <div>
                      <h3 style={{ margin: 0 }}>{zona.nombre}</h3>
                      <p style={zoneDescription}>
                        {zona.descripcion || "Sin descripción"}
                      </p>
                    </div>

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

                  <div style={subTitle}>Ubicaciones</div>

                  {ubicacionesZona.length === 0 ? (
                    <div style={emptyMiniBox}>No hay ubicaciones en esta zona.</div>
                  ) : (
                    <div style={locationsList}>
                      {ubicacionesZona.map((ubicacion) => (
                        <div key={ubicacion.id} style={locationItem}>
                          <div style={locationCode}>
                            {ubicacion.codigo || `Ubicación ${ubicacion.id}`}
                          </div>
                          <div style={locationText}>
                            {ubicacion.descripcion || "Sin descripción"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginBottom: "24px",
  flexWrap: "wrap"
};

const subtitle = {
  margin: "6px 0 0 0",
  color: "#64748b"
};

const backButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 14px",
  borderRadius: "8px",
  textDecoration: "none",
  backgroundColor: "white",
  color: "#0f172a",
  border: "1px solid #cbd5e1",
  fontWeight: "600"
};

const infoCard = {
  backgroundColor: "white",
  borderRadius: "12px",
  boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
  padding: "20px",
  marginBottom: "24px"
};

const infoGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "18px"
};

const infoLabel = {
  fontSize: "13px",
  color: "#64748b",
  marginBottom: "6px",
  fontWeight: "600"
};

const infoValue = {
  color: "#0f172a",
  fontWeight: "700"
};

const section = {
  marginTop: "8px"
};

const sectionTitle = {
  marginTop: 0,
  marginBottom: "16px"
};

const zonesGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "20px"
};

const zoneCard = {
  backgroundColor: "white",
  borderRadius: "12px",
  boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
  padding: "20px"
};

const zoneHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "16px"
};

const zoneDescription = {
  margin: "6px 0 0 0",
  color: "#64748b"
};

const subTitle = {
  fontWeight: "700",
  color: "#334155",
  marginBottom: "12px"
};

const locationsList = {
  display: "flex",
  flexDirection: "column",
  gap: "10px"
};

const locationItem = {
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "12px"
};

const locationCode = {
  fontWeight: "700",
  color: "#0f172a",
  marginBottom: "4px"
};

const locationText = {
  color: "#64748b",
  fontSize: "14px"
};

const badge = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "700",
  whiteSpace: "nowrap"
};

const errorBox = {
  padding: "12px",
  backgroundColor: "#fee2e2",
  color: "#991b1b",
  borderRadius: "8px",
  fontWeight: "500"
};

const emptyBox = {
  backgroundColor: "white",
  borderRadius: "12px",
  padding: "20px",
  color: "#64748b",
  boxShadow: "0 5px 15px rgba(0,0,0,0.05)"
};

const emptyMiniBox = {
  padding: "12px",
  borderRadius: "10px",
  backgroundColor: "#f8fafc",
  color: "#64748b",
  border: "1px solid #e2e8f0"
};

export default AlmacenDetalle;