import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

function Salidas() {
  const { token } = useAuth();

  const [form, setForm] = useState({
    almacen_id: "",
    observaciones: "",
    producto_id: "",
    ubicacion_origen_id: "",
    cantidad: ""
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
      almacen_id: Number(form.almacen_id),
      observaciones: form.observaciones || null,
      lineas: [
        {
          producto_id: Number(form.producto_id),
          ubicacion_origen_id: Number(form.ubicacion_origen_id),
          cantidad: Number(form.cantidad),
          observaciones: null
        }
      ]
    };

    try {
      const response = await fetch(`${API_BASE_URL}/shipments/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Error al registrar la salida");
      }

      setMensaje(`Salida registrada correctamente con ID ${data.id}`);

      setForm({
        almacen_id: "",
        observaciones: "",
        producto_id: "",
        ubicacion_origen_id: "",
        cantidad: ""
      });
    } catch (err) {
      setError(err.message || "Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <h1>Salidas</h1>

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
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "400px"
        }}
      >
        <input
          type="number"
          name="almacen_id"
          placeholder="ID Almacén"
          value={form.almacen_id}
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
          placeholder="Ubicación origen"
          value={form.ubicacion_origen_id}
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

        <button type="submit" disabled={cargando}>
          {cargando ? "Registrando..." : "Registrar salida"}
        </button>
      </form>
    </div>
  );
}

export default Salidas;