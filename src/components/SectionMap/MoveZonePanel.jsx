import { useState } from "react";
import { apiFetch } from "../../api/api";
import * as styles from "./SectionMap.styles";

function ubicacionActualTexto(zona) {
  if (zona.numero_pasillo == null) {
    return "En espera";
  }

  const ladoTxt = zona.lado ? ` lado ${zona.lado}` : "";
  return `Pasillo ${zona.numero_pasillo}${ladoTxt}`;
}

function MoveZonePanel({ zonas, secciones, onMoved }) {
  const [zonaId, setZonaId] = useState("");
  const [destino, setDestino] = useState("espera");
  const [numeroPasillo, setNumeroPasillo] = useState("");
  const [lado, setLado] = useState("D");
  const [filaInicio, setFilaInicio] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const seccionesPorId = new Map(secciones.map((s) => [s.id, s]));

  const zonasOrdenadas = [...zonas].sort((a, b) => {
    const nombreA = seccionesPorId.get(a.seccion_id)?.nombre || "";
    const nombreB = seccionesPorId.get(b.seccion_id)?.nombre || "";
    return nombreA.localeCompare(nombreB);
  });

  function limpiarResultado() {
    setMensaje("");
    setError("");
  }

  async function handleMover(e) {
    e.preventDefault();
    limpiarResultado();

    if (!zonaId) {
      setError("Selecciona una zona para mover");
      return;
    }

    const body =
      destino === "espera"
        ? { numero_pasillo: null }
        : {
            numero_pasillo: Number(numeroPasillo),
            lado,
            fila_inicio: Number(filaInicio)
          };

    try {
      setGuardando(true);
      await apiFetch(`/section-layout/zones/${zonaId}/move`, {
        method: "POST",
        body
      });

      setMensaje("Zona movida correctamente");
      setZonaId("");
      setDestino("espera");
      setNumeroPasillo("");
      setFilaInicio("");
      onMoved();
    } catch (err) {
      setError(err.message || "Error al mover la zona");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleMover} style={styles.movePanel}>
      <div style={styles.movePanelTitle}>Mover sección</div>

      {mensaje && <div style={styles.moveSuccess}>{mensaje}</div>}
      {error && <div style={styles.moveError}>{error}</div>}

      <div style={styles.moveRow}>
        <select
          value={zonaId}
          onChange={(e) => {
            setZonaId(e.target.value);
            limpiarResultado();
          }}
          style={styles.moveSelect}
        >
          <option value="">Selecciona una zona...</option>
          {zonasOrdenadas.map((zona) => {
            const seccion = seccionesPorId.get(zona.seccion_id);
            return (
              <option key={zona.id} value={zona.id}>
                {seccion ? seccion.nombre : `Sección ${zona.seccion_id}`} — {zona.nombre} (
                {ubicacionActualTexto(zona)})
              </option>
            );
          })}
        </select>

        <select
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          style={styles.moveSelect}
        >
          <option value="espera">Enviar a zona de espera</option>
          <option value="destino">Mover a un pasillo</option>
        </select>
      </div>

      {destino === "destino" && (
        <div style={styles.moveRow}>
          <input
            type="number"
            min="1"
            placeholder="Nº pasillo"
            value={numeroPasillo}
            onChange={(e) => setNumeroPasillo(e.target.value)}
            style={styles.moveInput}
            required
          />

          <select value={lado} onChange={(e) => setLado(e.target.value)} style={styles.moveSelect}>
            <option value="D">Lado D</option>
            <option value="I">Lado I</option>
          </select>

          <input
            type="number"
            min="1"
            placeholder="Fila inicio"
            value={filaInicio}
            onChange={(e) => setFilaInicio(e.target.value)}
            style={styles.moveInput}
            required
          />
        </div>
      )}

      <button type="submit" disabled={guardando} style={styles.moveButton}>
        {guardando ? "Moviendo..." : "Mover"}
      </button>
    </form>
  );
}

export default MoveZonePanel;
