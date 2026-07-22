import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import SectionMap from "../components/SectionMap/SectionMap";
import * as styles from "./SeccionMapa.styles";

function SeccionMapa() {
  const [secciones, setSecciones] = useState([]);
  const [seccionId, setSeccionId] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarSecciones();
  }, []);

  async function cargarSecciones() {
    try {
      setCargando(true);
      setError("");

      const data = await apiFetch("/sections/");
      const lista = Array.isArray(data) ? data : [];

      setSecciones(lista);

      if (lista.length > 0) {
        setSeccionId(lista[0].id);
      }
    } catch (err) {
      setError(err.message || "Error al cargar las secciones");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <h1 style={styles.pageTitle}>Mapa 2D de secciones</h1>

      <p style={styles.subtitle}>
        Explora el layout de cada sección: haz zoom para ver las ubicaciones y
        haz clic en una para consultar su stock.
      </p>

      {error && <div style={styles.errorBox}>{error}</div>}

      {cargando ? (
        <p style={styles.infoText}>Cargando secciones...</p>
      ) : secciones.length === 0 ? (
        <p style={styles.infoText}>No hay secciones creadas todavía.</p>
      ) : (
        <>
          <div style={styles.tabs}>
            {secciones.map((seccion) => (
              <button
                key={seccion.id}
                type="button"
                onClick={() => setSeccionId(seccion.id)}
                style={
                  seccion.id === seccionId ? styles.tabActive : styles.tab
                }
              >
                {seccion.nombre}
              </button>
            ))}
          </div>

          {seccionId && <SectionMap seccionId={seccionId} height={620} />}
        </>
      )}
    </div>
  );
}

export default SeccionMapa;
