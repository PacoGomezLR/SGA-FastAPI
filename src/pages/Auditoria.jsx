import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

function Auditoria() {
  const { token, authFetch } = useAuth();
  const [movements, setMovements] = useState([]);
  const [fechaBusqueda, setFechaBusqueda] = useState("");

  useEffect(() => {
    if (!token) return;

    authFetch("/movements/audit")
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se pudo cargar la auditoría");
        }
        return res.json();
      })
      .then((data) => setMovements(data))
      .catch((err) => console.error(err));
  }, [token, authFetch]);

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

  const movementsFiltrados = useMemo(() => {
    let resultado = movements;

    if (fechaBusqueda) {
      resultado = movements.filter((m) => {
        const fecha = new Date(m.fecha);
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, "0");
        const dia = String(fecha.getDate()).padStart(2, "0");
        const fechaFormateada = `${año}-${mes}-${dia}`;

        return fechaFormateada === fechaBusqueda;
      });
    } else {
      resultado = movements.slice(0, 10);
    }

    return resultado;
  }, [movements, fechaBusqueda]);

  return (
    <div>
      <h1>Auditoría</h1>

      <div
        style={{
          marginBottom: "16px",
          display: "flex",
          gap: "10px",
          alignItems: "center"
        }}
      >
        <label htmlFor="fechaBusqueda">Buscar por fecha:</label>

        <input
          id="fechaBusqueda"
          type="date"
          value={fechaBusqueda}
          onChange={(e) => setFechaBusqueda(e.target.value)}
        />

        <button type="button" onClick={() => setFechaBusqueda("")}>
          Limpiar filtro
        </button>
      </div>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Producto</th>
            <th>Cambio</th>
            <th>Origen</th>
            <th>Destino</th>
            <th>Usuario</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          {movementsFiltrados.map((m) => (
            <tr key={m.id}>
              <td>{new Date(m.fecha).toLocaleString()}</td>
              <td>{m.tipo_movimiento}</td>
              <td>{m.producto_nombre ?? m.producto_id}</td>
              <td>{formatearCambio(m)}</td>
              <td>{m.ubicacion_origen_nombre ?? "-"}</td>
              <td>{m.ubicacion_destino_nombre ?? "-"}</td>
              <td>{m.usuario_nombre ?? m.usuario_id}</td>
              <td>{m.observaciones ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Auditoria;