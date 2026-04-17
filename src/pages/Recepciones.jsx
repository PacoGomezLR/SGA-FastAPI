import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

function Recepciones() {
  const { token } = useAuth();

  const [form, setForm] = useState({
    almacen_id: "",
    observaciones: "",
    producto_id: "",
    cantidad: "",
    ubicacion_destino_id: ""
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
          cantidad: Number(form.cantidad),
          ubicacion_destino_id: form.ubicacion_destino_id
            ? Number(form.ubicacion_destino_id)
            : null,
          observaciones: null
        }
      ]
    };

    try {
      const response = await fetch(`${API_BASE_URL}/receptions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Error al crear la recepción");
      }

      setMensaje(`Recepción creada correctamente con ID ${data.id}`);

      setForm({
        almacen_id: "",
        observaciones: "",
        producto_id: "",
        cantidad: "",
        ubicacion_destino_id: ""
      });
    } catch (err) {
      setError(err.message || "Error de conexión con el backend");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <h1>Recepciones</h1>

      {mensaje && (
        <div
          style={{
            backgroundColor: "#dcfce7",
            color: "#166534",
            border: "1px solid #86efac",
            padding: "10px 12px",
            borderRadius: "8px",
            marginTop: "16px",
            marginBottom: "16px"
          }}
        >
          {mensaje}
        </div>
      )}

      {error && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            border: "1px solid #fca5a5",
            padding: "10px 12px",
            borderRadius: "8px",
            marginTop: "16px",
            marginBottom: "16px"
          }}
        >
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
          name="cantidad"
          placeholder="Cantidad"
          value={form.cantidad}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="ubicacion_destino_id"
          placeholder="ID Ubicación destino"
          value={form.ubicacion_destino_id}
          onChange={handleChange}
        />

        <button
          type="submit"
          disabled={cargando}
          style={{
            padding: "10px 12px",
            border: "none",
            borderRadius: "8px",
            backgroundColor: cargando ? "#94a3b8" : "#0f172a",
            color: "white",
            cursor: cargando ? "not-allowed" : "pointer",
            fontWeight: "600"
          }}
        >
          {cargando ? "Creando..." : "Crear recepción"}
        </button>
      </form>
    </div>
  );
}

export default Recepciones;