import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

function Movimientos() {
  const { token } = useAuth();

  const [form, setForm] = useState({
    producto_id: "",
    ubicacion_origen_id: "",
    ubicacion_destino_id: "",
    cantidad: "",
    tipo_movimiento: "traslado",
    origen_tipo: "manual",
    origen_id: "1",
    observaciones: ""
  });

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setMensaje("");
    setError("");
    setCargando(true);

    const payload = {
      producto_id: Number(form.producto_id),
      ubicacion_origen_id: form.ubicacion_origen_id
        ? Number(form.ubicacion_origen_id)
        : null,
      ubicacion_destino_id: form.ubicacion_destino_id
        ? Number(form.ubicacion_destino_id)
        : null,
      cantidad: Number(form.cantidad),
      tipo_movimiento: form.tipo_movimiento,
      origen_tipo: form.origen_tipo,
      origen_id: Number(form.origen_id),
      observaciones: form.observaciones || null
    };

    try {
      const response = await fetch(`${API_BASE_URL}/movements/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Error al registrar el movimiento");
      }

      setMensaje(`Movimiento registrado correctamente con ID ${data.id}`);

      setForm({
        producto_id: "",
        ubicacion_origen_id: "",
        ubicacion_destino_id: "",
        cantidad: "",
        tipo_movimiento: "traslado",
        origen_tipo: "manual",
        origen_id: "1",
        observaciones: ""
      });
    } catch (err) {
      setError(err.message || "Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <h1>Movimientos internos</h1>

      {mensaje && (
        <div style={{ color: "green", marginBottom: "10px" }}>
          {mensaje}
        </div>
      )}

      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          marginTop: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          maxWidth: "420px"
        }}
      >
        <input
          type="number"
          name="producto_id"
          placeholder="ID Producto"
          value={form.producto_id}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="ubicacion_origen_id"
          placeholder="ID Ubicación origen"
          value={form.ubicacion_origen_id}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="ubicacion_destino_id"
          placeholder="ID Ubicación destino"
          value={form.ubicacion_destino_id}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="cantidad"
          placeholder="Cantidad"
          value={form.cantidad}
          onChange={handleChange}
          required
        />

        <select
          name="tipo_movimiento"
          value={form.tipo_movimiento}
          onChange={handleChange}
          required
        >
          <option value="traslado">traslado</option>
          <option value="entrada">entrada</option>
          <option value="salida">salida</option>
          <option value="ajuste">ajuste</option>
        </select>

        <select
          name="origen_tipo"
          value={form.origen_tipo}
          onChange={handleChange}
          required
        >
          <option value="manual">manual</option>
          <option value="recepcion">recepcion</option>
          <option value="salida">salida</option>
          <option value="movimiento">movimiento</option>
          <option value="inventario">inventario</option>
          <option value="legacy">legacy</option>
        </select>

        <input
          type="number"
          name="origen_id"
          placeholder="Origen ID"
          value={form.origen_id}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="observaciones"
          placeholder="Observaciones"
          value={form.observaciones}
          onChange={handleChange}
        />

        <button type="submit" disabled={cargando}>
          {cargando ? "Registrando..." : "Registrar movimiento"}
        </button>
      </form>
    </div>
  );
}

export default Movimientos;