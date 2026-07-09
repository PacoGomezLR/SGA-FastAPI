import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api/api";
import * as styles from "./AlmacenDetalle.styles";

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
  const [stock, setStock] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [filaSeleccionada, setFilaSeleccionada] = useState(null);

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

      const [almacenData, zonasData, ubicacionesData, stockData] = await Promise.all([
        apiFetch(`/warehouses/${id}`),
        apiFetch("/zones/"),
        apiFetch("/locations/"),
        apiFetch("/stock/", { params: { almacen_id: id } })
      ]);

      setAlmacen(almacenData || null);

      const zonasDelAlmacen = Array.isArray(zonasData)
        ? zonasData.filter((zona) => String(zona.almacen_id) === String(id))
        : [];

      setZonas(zonasDelAlmacen);
      setUbicaciones(Array.isArray(ubicacionesData) ? ubicacionesData : []);
      setStock(Array.isArray(stockData) ? stockData : []);
    } catch (err) {
      setError(err.message || "Error al cargar el detalle del almacén");
      setAlmacen(null);
      setZonas([]);
      setUbicaciones([]);
      setStock([]);
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

  const stockPorUbicacion = useMemo(() => {
    const mapa = new Map();

    stock.forEach((linea) => {
      if (!mapa.has(linea.ubicacion_id)) {
        mapa.set(linea.ubicacion_id, []);
      }
      mapa.get(linea.ubicacion_id).push(linea);
    });

    return mapa;
  }, [stock]);

  const filasPorZona = useMemo(() => {
    const mapa = new Map();

    ubicacionesPorZona.forEach((ubicacionesZona, zonaId) => {
      const filas = new Map();

      ubicacionesZona.forEach((ubicacion) => {
        const clave = ubicacion.eje_x ?? ubicacion.codigo;

        if (!filas.has(clave)) {
          filas.set(clave, { fila: ubicacion.eje_x, ubicaciones: [] });
        }
        filas.get(clave).ubicaciones.push(ubicacion);
      });

      const listaFilas = Array.from(filas.values()).sort((a, b) => {
        if (a.fila == null) return 1;
        if (b.fila == null) return -1;
        return a.fila - b.fila;
      });

      listaFilas.forEach((f) => {
        f.ubicaciones.sort((a, b) => (a.eje_y ?? 0) - (b.eje_y ?? 0));
      });

      mapa.set(zonaId, listaFilas);
    });

    return mapa;
  }, [ubicacionesPorZona]);

  function abrirFila(zona, fila) {
    setFilaSeleccionada({ zona, fila });
  }

  function cerrarFila() {
    setFilaSeleccionada(null);
  }

  if (cargando) {
    return <p>Cargando detalle del almacén...</p>;
  }

  if (!almacen) {
    return <p>No se ha encontrado el almacén.</p>;
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={{ margin: 0 }}>{almacen.nombre}</h1>
          <p style={styles.subtitle}>
            Vista jerárquica del almacén, sus zonas y sus ubicaciones
          </p>
        </div>

        <Link to="/almacenes" style={styles.backButton}>
          Volver a almacenes
        </Link>
      </div>

      {mensaje && <div style={styles.successBox}>{mensaje}</div>}
      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.infoCard}>
        <div style={styles.infoGrid}>
          <div>
            <div style={styles.infoLabel}>Descripción</div>
            <div style={styles.infoValue}>{almacen.descripcion || "-"}</div>
          </div>

          <div>
            <div style={styles.infoLabel}>Dirección</div>
            <div style={styles.infoValue}>{almacen.direccion || "-"}</div>
          </div>

          <div>
            <div style={styles.infoLabel}>Estado</div>
            <span
              style={{
                ...styles.badge,
                backgroundColor: almacen.activo ? "#dcfce7" : "#fee2e2",
                color: almacen.activo ? "#166534" : "#991b1b"
              }}
            >
              {almacen.activo ? "Activo" : "Inactivo"}
            </span>
          </div>

          <div>
            <div style={styles.infoLabel}>Zonas</div>
            <div style={styles.infoValue}>{zonas.length}</div>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={{ margin: 0 }}>Zonas y ubicaciones</h2>

          {!mostrarFormZona && (
            <button type="button" style={styles.createButton} onClick={abrirFormZona}>
              + Nueva zona
            </button>
          )}
        </div>

        {mostrarFormZona && (
          <div style={styles.zoneFormCard}>
            <h3 style={styles.zoneFormTitle}>Nueva zona</h3>

            <form onSubmit={crearZona}>
              <div style={styles.zoneFormGrid}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Nombre</label>
                  <input
                    name="nombre"
                    placeholder="Ej: Recepción, Picking, Reserva..."
                    value={zoneForm.nombre}
                    onChange={handleZoneChange}
                    required
                    style={styles.input}
                    autoFocus
                  />
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Descripción</label>
                  <input
                    name="descripcion"
                    placeholder="Descripción de la zona"
                    value={zoneForm.descripcion}
                    onChange={handleZoneChange}
                    style={styles.input}
                  />
                </div>
              </div>

              <label style={styles.checkboxCard}>
                <input
                  type="checkbox"
                  name="activo"
                  checked={zoneForm.activo}
                  onChange={handleZoneChange}
                />
                <span>Zona activa</span>
              </label>

              <div style={styles.modalActions}>
                <button
                  type="submit"
                  style={styles.primaryButton}
                  disabled={guardandoZona}
                >
                  {guardandoZona ? "Creando..." : "Crear zona"}
                </button>

                <button
                  type="button"
                  style={styles.secondaryButton}
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
          <div style={styles.emptyBox}>Este almacén todavía no tiene zonas.</div>
        ) : (
          <div style={styles.zonesGrid}>
            {zonas.map((zona) => {
              const filasZona = filasPorZona.get(zona.id) || [];

              return (
                <div key={zona.id} style={styles.zoneCard}>
                  <div style={styles.zoneHeader}>
                    <div>
                      <span style={styles.zoneLink}>
                        {zona.nombre}
                      </span>

                      <p style={styles.zoneDescription}>
                        {zona.descripcion || "Sin descripción"}
                      </p>
                    </div>

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

                  <div style={styles.locationsHeader}>
                    <div style={styles.subTitle}>Ubicaciones</div>

                    <button
                      type="button"
                      style={styles.miniCreateButton}
                      onClick={() => abrirModalUbicacion(zona)}
                    >
                      + Nueva ubicación
                    </button>
                  </div>

                  {filasZona.length === 0 ? (
                    <div style={styles.emptyMiniBox}>
                      No hay ubicaciones en esta zona.
                    </div>
                  ) : (
                    <div style={styles.locationsList}>
                      {filasZona.map((f) => (
                        <button
                          type="button"
                          key={f.fila ?? f.ubicaciones[0]?.id}
                          style={styles.locationItemButton}
                          onClick={() => abrirFila(zona, f)}
                        >
                          <div style={styles.locationCode}>
                            {f.fila != null ? `Fila ${f.fila}` : "Sin fila"}
                          </div>
                          <div style={styles.locationText}>
                            {f.ubicaciones.length} altura
                            {f.ubicaciones.length === 1 ? "" : "s"}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {filaSeleccionada && (
        <div style={styles.modalOverlay} onClick={cerrarFila}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>
              {filaSeleccionada.fila.fila != null
                ? `Fila ${filaSeleccionada.fila.fila}`
                : "Sin fila"}
            </h2>

            <p style={styles.modalSubtitle}>
              Zona: <strong>{filaSeleccionada.zona.nombre}</strong>
            </p>

            <div style={styles.locationsList}>
              {filaSeleccionada.fila.ubicaciones.map((ubicacion) => {
                const stockUbicacion = stockPorUbicacion.get(ubicacion.id) || [];

                return (
                  <div key={ubicacion.id} style={styles.locationItem}>
                    <div style={styles.locationCode}>
                      {ubicacion.eje_y != null
                        ? `Altura ${ubicacion.eje_y}`
                        : ubicacion.codigo || `Ubicación ${ubicacion.id}`}
                    </div>

                    {stockUbicacion.length === 0 ? (
                      <div style={styles.locationText}>Sin productos</div>
                    ) : (
                      <div style={styles.locationText}>
                        {stockUbicacion.map((linea) => (
                          <div key={linea.ubicacion_id + "-" + linea.producto_id}>
                            {linea.producto_nombre || `Producto ${linea.producto_id}`}
                            {" — "}
                            {linea.cantidad}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={styles.modalActions}>
              <button type="button" style={styles.secondaryButton} onClick={cerrarFila}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalUbicacion && (
        <div style={styles.modalOverlay} onClick={cerrarModalUbicacion}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Nueva ubicación</h2>

            <p style={styles.modalSubtitle}>
              Zona: <strong>{zonaSeleccionada?.nombre}</strong>
            </p>

            <form onSubmit={crearUbicacion}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Código</label>
                <input
                  name="codigo"
                  placeholder="Ej: A1, B3, EST-01..."
                  value={locationForm.codigo}
                  onChange={handleLocationChange}
                  required
                  style={styles.input}
                  autoFocus
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Descripción</label>
                <input
                  name="descripcion"
                  placeholder="Descripción de la ubicación"
                  value={locationForm.descripcion}
                  onChange={handleLocationChange}
                  style={styles.input}
                />
              </div>

              <label style={styles.checkboxCard}>
                <input
                  type="checkbox"
                  name="activa"
                  checked={locationForm.activa}
                  onChange={handleLocationChange}
                />
                <span>Ubicación activa</span>
              </label>

              <div style={styles.modalActions}>
                <button
                  type="submit"
                  style={styles.primaryButton}
                  disabled={guardandoUbicacion}
                >
                  {guardandoUbicacion ? "Creando..." : "Crear ubicación"}
                </button>

                <button
                  type="button"
                  style={styles.secondaryButton}
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

export default AlmacenDetalle;
