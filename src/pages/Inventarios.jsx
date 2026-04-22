import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

function Inventarios() {
  const { token } = useAuth();

  const [form, setForm] = useState({
    almacen_id: "",
    observaciones: "",
    producto_id: "",
    ubicacion_id: "",
    cantidad_real: ""
  });

  const [inventoryId, setInventoryId] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  async function handleCreateInventory(e) {
    e.preventDefault();

    setMensaje("");
    setError("");
    setCargando(true);

    try {
      const createPayload = {
        almacen_id: Number(form.almacen_id),
        observaciones: form.observaciones || null,
        lineas: []
      };

      const createResponse = await fetch(`${API_BASE_URL}/inventories/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(createPayload)
      });

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(createData?.detail || "Error al crear el inventario");
      }

      const newInventoryId = createData.id;

      const linePayload = {
        producto_id: Number(form.producto_id),
        ubicacion_id: Number(form.ubicacion_id),
        cantidad_real: Number(form.cantidad_real),
        observaciones: null
      };

      const lineResponse = await fetch(
        `${API_BASE_URL}/inventories/${newInventoryId}/lines`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(linePayload)
        }
      );

      const lineData = await lineResponse.json();

      if (!lineResponse.ok) {
        throw new Error(lineData?.detail || "Error al añadir la línea");
      }

      setInventoryId(newInventoryId);
      setInventoryData(lineData);
      setMensaje(`Inventario creado correctamente con ID ${newInventoryId}`);
    } catch (err) {
      setError(err.message || "Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  async function marcarComoContado() {
    if (!inventoryId) return;

    setMensaje("");
    setError("");
    setCargando(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/inventories/${inventoryId}/count`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Error al marcar como contado");
      }

      setInventoryData(data);
      setMensaje(`Inventario ${inventoryId} marcado como contado`);
    } catch (err) {
      setError(err.message || "Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  async function aplicarAjuste() {
    if (!inventoryId) return;

    setMensaje("");
    setError("");
    setCargando(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/inventories/${inventoryId}/adjust`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Error al aplicar el ajuste");
      }

      setInventoryData(data);
      setMensaje(`Inventario ${inventoryId} ajustado correctamente`);
    } catch (err) {
      setError(err.message || "Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <h1>Inventarios</h1>

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
        onSubmit={handleCreateInventory}
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
          name="ubicacion_id"
          placeholder="ID Ubicación"
          value={form.ubicacion_id}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="cantidad_real"
          placeholder="Cantidad real"
          value={form.cantidad_real}
          onChange={handleChange}
          required
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
          {cargando ? "Procesando..." : "Crear inventario"}
        </button>
      </form>

      {inventoryId && (
        <div
          style={{
            marginTop: "24px",
            display: "flex",
            gap: "12px",
            flexWrap: "wrap"
          }}
        >
          <button
            type="button"
            onClick={marcarComoContado}
            disabled={cargando}
            style={{
              padding: "10px 12px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: "#1d4ed8",
              color: "white",
              cursor: cargando ? "not-allowed" : "pointer",
              fontWeight: "600"
            }}
          >
            Marcar como contado
          </button>

          <button
            type="button"
            onClick={aplicarAjuste}
            disabled={cargando}
            style={{
              padding: "10px 12px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: "#166534",
              color: "white",
              cursor: cargando ? "not-allowed" : "pointer",
              fontWeight: "600"
            }}
          >
            Aplicar ajuste
          </button>
        </div>
      )}

      {inventoryData && (
        <div
          style={{
            marginTop: "24px",
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "16px",
            maxWidth: "700px"
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "12px" }}>
            Resumen del inventario
          </h2>

          <p><strong>ID:</strong> {inventoryData.id}</p>
          <p><strong>Estado:</strong> {inventoryData.estado}</p>
          <p><strong>Almacén:</strong> {inventoryData.almacen_id}</p>

          {inventoryData.lineas?.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <h3>Líneas</h3>
              {inventoryData.lineas.map((linea) => (
                <div
                  key={linea.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "10px"
                  }}
                >
                  <p><strong>Producto:</strong> {linea.producto_id}</p>
                  <p><strong>Ubicación:</strong> {linea.ubicacion_id}</p>
                  <p><strong>Sistema:</strong> {linea.cantidad_sistema}</p>
                  <p><strong>Real:</strong> {linea.cantidad_real}</p>
                  <p><strong>Diferencia:</strong> {linea.diferencia}</p>
                  <p>
                    <strong>Ajuste aplicado:</strong>{" "}
                    {linea.ajuste_aplicado ? "Sí" : "No"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Inventarios;