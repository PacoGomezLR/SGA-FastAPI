import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api/api";

const initialLocationForm = {
  codigo: "",
  descripcion: "",
  activa: true
};

const initialZoneForm = {
  nombre: "",
  descripcion: "",
  activo: true
};

function AlmacenDetalle() {
  const { id } = useParams();

  const [almacen, setAlmacen] = useState(null);
  const [zonas, setZonas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [mostrarFormZona, setMostrarFormZona] = useState(false);
  const [zoneForm, setZoneForm] = useState(initialZoneForm);
  const [guardandoZona, setGuardandoZona] = useState(false);

  const [mostrarModalUbicacion, setMostrarModalUbicacion] = useState(false);
  const [zonaSeleccionada, setZonaSeleccionada] = useState(null);
  const [locationForm, setLocationForm] = useState(initialLocationForm);
  const [guardandoUbicacion, setGuardandoUbicacion] = useState(false);

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

  function abrirFormZona() {
    setMostrarFormZona(true);
    setZoneForm(initialZoneForm);
    setMensaje("");
    setError("");
  }

  function cancelarFormZona() {
    if (guardandoZona) return;

    setMostrarFormZona(false);
    setZoneForm(initialZoneForm);
  }

  function handleZoneChange(e) {
    const { name, value, type, checked } = e.target;

    setZoneForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  async function crearZona(e) {
    e.preventDefault();

    if (!zoneForm.nombre.trim()) {
      setError("El nombre de la zona es obligatorio");
      return;
    }

    try {
      setGuardandoZona(true);
      setError("");
      setMensaje("");

      const payload = {
        almacen_id: Number(id),
        nombre: zoneForm.nombre.trim(),
        descripcion: zoneForm.descripcion.trim() || null,
        activo: zoneForm.activo
      };

      await apiFetch("/zones/", {
        method: "POST",
        body: payload
      });

      setMensaje("Zona creada correctamente");
      setZoneForm(initialZoneForm);
      setMostrarFormZona(false);
      await cargarDetalle();
    } catch (err) {
      setError(err.message || "Error al crear la zona");
    } finally {
      setGuardandoZona(false);
    }
  }

  function abrirModalUbicacion(zona) {
    setZonaSeleccionada(zona);
    setLocationForm(initialLocationForm);
    setMensaje("");
    setError("");
    setMostrarModalUbicacion(true);
  }

  function cerrarModalUbicacion() {
    if (guardandoUbicacion) return;

    setMostrarModalUbicacion(false);
    setZonaSeleccionada(null);
    setLocationForm(initialLocationForm);
  }

  function handleLocationChange(e) {
    const { name, value, type, checked } = e.target;

    setLocationForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  async function crearUbicacion(e) {
    e.preventDefault();

    if (!zonaSeleccionada) {
      setError("No se ha seleccionado ninguna zona");
      return;
    }

    if (!locationForm.codigo.trim()) {
      setError("El código de la ubicación es obligatorio");
      return;
    }

    try {
      setGuardandoUbicacion(true);
      setError("");
      setMensaje("");

      const payload = {
        zona_id: Number(zonaSeleccionada.id),
        codigo: locationForm.codigo.trim(),
        descripcion: locationForm.descripcion.trim() || null,
        activa: locationForm.activa
      };

      await apiFetch("/locations/", {
        method: "POST",
        body: payload
      });

      setMensaje("Ubicación creada correctamente");
      cerrarModalUbicacion();
      await cargarDetalle();
    } catch (err) {
      setError(err.message || "Error al crear la ubicación");
    } finally {
      setGuardandoUbicacion(false);
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

      {mensaje && <div style={successBox}>{mensaje}</div>}
      {error && <div style={errorBox}>{error}</div>}

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
        <div style={sectionHeader}>
          <h2 style={{ margin: 0 }}>Zonas y ubicaciones</h2>

          {!mostrarFormZona && (
            <button type="button" style={createButton} onClick={abrirFormZona}>
              + Nueva zona
            </button>
          )}
        </div>

        {mostrarFormZona && (
          <div style={zoneFormCard}>
            <h3 style={zoneFormTitle}>Nueva zona</h3>

            <form onSubmit={crearZona}>
              <div style={zoneFormGrid}>
                <div style={fieldGroup}>
                  <label style={label}>Nombre</label>
                  <input
                    name="nombre"
                    placeholder="Ej: Recepción, Picking, Reserva..."
                    value={zoneForm.nombre}
                    onChange={handleZoneChange}
                    required
                    style={input}
                    autoFocus
                  />
                </div>

                <div style={fieldGroup}>
                  <label style={label}>Descripción</label>
                  <input
                    name="descripcion"
                    placeholder="Descripción de la zona"
                    value={zoneForm.descripcion}
                    onChange={handleZoneChange}
                    style={input}
                  />
                </div>
              </div>

              <label style={checkboxCard}>
                <input
                  type="checkbox"
                  name="activo"
                  checked={zoneForm.activo}
                  onChange={handleZoneChange}
                />
                <span>Zona activa</span>
              </label>

              <div style={modalActions}>
                <button
                  type="submit"
                  style={primaryButton}
                  disabled={guardandoZona}
                >
                  {guardandoZona ? "Creando..." : "Crear zona"}
                </button>

                <button
                  type="button"
                  style={secondaryButton}
                  onClick={cancelarFormZona}
                  disabled={guardandoZona}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

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
                      <span style={zoneLink}>
                        {zona.nombre}
                      </span>

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

                  <div style={locationsHeader}>
                    <div style={subTitle}>Ubicaciones</div>

                    <button
                      type="button"
                      style={miniCreateButton}
                      onClick={() => abrirModalUbicacion(zona)}
                    >
                      + Nueva ubicación
                    </button>
                  </div>

                  {ubicacionesZona.length === 0 ? (
                    <div style={emptyMiniBox}>
                      No hay ubicaciones en esta zona.
                    </div>
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

      {mostrarModalUbicacion && (
        <div style={modalOverlay} onClick={cerrarModalUbicacion}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={modalTitle}>Nueva ubicación</h2>

            <p style={modalSubtitle}>
              Zona: <strong>{zonaSeleccionada?.nombre}</strong>
            </p>

            <form onSubmit={crearUbicacion}>
              <div style={fieldGroup}>
                <label style={label}>Código</label>
                <input
                  name="codigo"
                  placeholder="Ej: A1, B3, EST-01..."
                  value={locationForm.codigo}
                  onChange={handleLocationChange}
                  required
                  style={input}
                  autoFocus
                />
              </div>

              <div style={fieldGroup}>
                <label style={label}>Descripción</label>
                <input
                  name="descripcion"
                  placeholder="Descripción de la ubicación"
                  value={locationForm.descripcion}
                  onChange={handleLocationChange}
                  style={input}
                />
              </div>

              <label style={checkboxCard}>
                <input
                  type="checkbox"
                  name="activa"
                  checked={locationForm.activa}
                  onChange={handleLocationChange}
                />
                <span>Ubicación activa</span>
              </label>

              <div style={modalActions}>
                <button
                  type="submit"
                  style={primaryButton}
                  disabled={guardandoUbicacion}
                >
                  {guardandoUbicacion ? "Creando..." : "Crear ubicación"}
                </button>

                <button
                  type="button"
                  style={secondaryButton}
                  onClick={cerrarModalUbicacion}
                  disabled={guardandoUbicacion}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  border: "none",
  textDecoration: "none",
  backgroundColor: "#2563eb",
  color: "white",
  fontWeight: "600",
  cursor: "pointer"
};

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

const zoneFormCard = {
  backgroundColor: "white",
  borderRadius: "12px",
  boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
  padding: "20px",
  marginBottom: "20px"
};

const zoneFormTitle = {
  margin: "0 0 16px 0",
  color: "#0f172a"
};

const zoneFormGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "14px"
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

const zoneLink = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#2563eb",
  textDecoration: "none"
};

const zoneDescription = {
  margin: "6px 0 0 0",
  color: "#64748b"
};

const locationsHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  marginBottom: "12px"
};

const subTitle = {
  fontWeight: "700",
  color: "#334155"
};

const miniCreateButton = {
  padding: "6px 10px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#2563eb",
  color: "white",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer"
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

const successBox = {
  padding: "12px",
  backgroundColor: "#dcfce7",
  color: "#166534",
  borderRadius: "8px",
  fontWeight: "500",
  marginBottom: "16px"
};

const errorBox = {
  padding: "12px",
  backgroundColor: "#fee2e2",
  color: "#991b1b",
  borderRadius: "8px",
  fontWeight: "500",
  marginBottom: "16px"
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

const modalOverlay = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(15, 23, 42, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "20px"
};

const modalBox = {
  width: "100%",
  maxWidth: "440px",
  backgroundColor: "white",
  borderRadius: "16px",
  padding: "22px",
  boxShadow: "0 20px 50px rgba(0,0,0,0.20)"
};

const modalTitle = {
  margin: "0 0 6px 0",
  color: "#0f172a"
};

const modalSubtitle = {
  margin: "0 0 18px 0",
  color: "#64748b"
};

const fieldGroup = {
  display: "grid",
  gap: "6px",
  marginBottom: "14px"
};

const label = {
  fontWeight: "600",
  color: "#334155"
};

const input = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  outline: "none",
  backgroundColor: "white",
  boxSizing: "border-box"
};

const checkboxCard = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  marginBottom: "16px"
};

const modalActions = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap"
};

const primaryButton = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#0f172a",
  color: "white",
  fontWeight: "600",
  cursor: "pointer"
};

const secondaryButton = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  backgroundColor: "white",
  color: "#0f172a",
  fontWeight: "600",
  cursor: "pointer"
};

export default AlmacenDetalle;