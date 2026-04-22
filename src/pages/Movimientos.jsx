import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function Movimientos() {
  const { token, authFetch } = useAuth();

  const [form, setForm] = useState({
    producto_id: "",
    ubicacion_origen_id: "",
    ubicacion_destino_id: "",
    cantidad: "",
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

    if (!token) {
      setError("Sesión no válida. Vuelve a iniciar sesión.");
      return;
    }

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
      tipo_movimiento: "traslado",
      origen_tipo: "manual",
      origen_id: 1,
      observaciones: form.observaciones || null
    };

    try {
      const response = await authFetch("/movements/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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