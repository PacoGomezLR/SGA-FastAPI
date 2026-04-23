import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import CrudPage from "../components/CrudPage";
import { useSearchParams, Link } from "react-router-dom";

const initialForm = {
  codigo: "",
  descripcion: "",
  zona_id: ""
};

function Ubicaciones() {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  const [searchParams] = useSearchParams();
  const zonaIdFromUrl = searchParams.get("zona_id");

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (zonaIdFromUrl) {
      setForm((prev) => ({
        ...prev,
        zona_id: zonaIdFromUrl
      }));
    }
  }, [zonaIdFromUrl]);

  async function cargarDatos() {
    try {
      setCargando(true);

      const [ubicacionesData, zonasData] = await Promise.all([
        apiFetch("/locations/"),
        apiFetch("/zones/")
      ]);

      setUbicaciones(ubicacionesData);
      setZonas(zonasData);
    } catch {
      setError("Error al cargar ubicaciones");
    } finally {
      setCargando(false);
    }
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const payload = {
        codigo: form.codigo,
        descripcion: form.descripcion,
        zona_id: Number(form.zona_id || zonaIdFromUrl)
      };

      await apiFetch(editingId ? `/locations/${editingId}` : "/locations/", {
        method: editingId ? "PUT" : "POST",
        body: payload
      });

      setMensaje("Ubicación guardada correctamente");
      setForm(initialForm);
      setEditingId(null);
      cargarDatos();
    } catch {
      setError("Error al guardar ubicación");
    }
  }

  function editar(u) {
    setEditingId(u.id);
    setForm({
      codigo: u.codigo || "",
      descripcion: u.descripcion || "",
      zona_id: u.zona_id
    });
  }

  async function eliminar(id) {
    await apiFetch(`/locations/${id}`, { method: "DELETE" });
    cargarDatos();
  }

  const ubicacionesFiltradas = ubicaciones.filter((u) =>
    (u.codigo || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      {/* 🔥 HEADER CONSISTENTE */}
      <div style={header}>
        <div>
          <h1 style={{ margin: 0 }}>Ubicaciones</h1>
          <p style={subtitle}>
            Gestión de ubicaciones dentro de la zona
          </p>
        </div>

        {zonaIdFromUrl && (
          <Link to={`/zonas/${zonaIdFromUrl}`} style={backButton}>
            Volver a zona
          </Link>
        )}
      </div>

      <CrudPage
        title=""
        message={mensaje}
        error={error}
        cardTitle={editingId ? "Editar ubicación" : "Nueva ubicación"}
        onSubmit={handleSubmit}
        searchValue={busqueda}
        onSearchChange={(e) => setBusqueda(e.target.value)}
        loading={cargando}
        emptyMessage="No hay ubicaciones"
        formContent={
          <>
            <input
              name="codigo"
              placeholder="Código (Ej: A1, B3...)"
              value={form.codigo}
              onChange={handleChange}
              required
              style={inputStyle}
            />

            <input
              name="descripcion"
              placeholder="Descripción"
              value={form.descripcion}
              onChange={handleChange}
              style={inputStyle}
            />

            {!zonaIdFromUrl && (
              <select
                name="zona_id"
                value={form.zona_id}
                onChange={handleChange}
                required
                style={inputStyle}
              >
                <option value="">Selecciona zona</option>
                {zonas.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nombre}
                  </option>
                ))}
              </select>
            )}

            <button type="submit" style={primaryButton}>
              {editingId ? "Actualizar" : "Crear"}
            </button>
          </>
        }
        tableContent={
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Código</th>
                <th style={th}>Descripción</th>
                <th style={th}>Zona</th>
                <th style={th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ubicacionesFiltradas.map((u) => (
                <tr key={u.id} style={tr}>
                  <td style={td}>{u.codigo}</td>
                  <td style={td}>{u.descripcion}</td>
                  <td style={td}>{u.zona_nombre}</td>
                  <td style={td}>
                    <button style={editButton} onClick={() => editar(u)}>
                      Editar
                    </button>
                    <button style={deleteButton} onClick={() => eliminar(u.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      />
    </div>
  );
}

/* 🔥 NUEVOS ESTILOS CONSISTENTES */

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "24px",
  flexWrap: "wrap"
};

const subtitle = {
  margin: "6px 0 0 0",
  color: "#64748b"
};

const backButton = {
  padding: "10px 14px",
  borderRadius: "8px",
  textDecoration: "none",
  backgroundColor: "white",
  border: "1px solid #cbd5e1",
  fontWeight: "600"
};

/* RESTO IGUAL */

const inputStyle = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontSize: "14px",
  width: "100%"
};

const primaryButton = {
  padding: "10px 14px",
  borderRadius: "8px",
  backgroundColor: "#2563eb",
  color: "white",
  border: "none",
  fontWeight: "600",
  cursor: "pointer"
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  backgroundColor: "white",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 5px 15px rgba(0,0,0,0.05)"
};

const th = {
  textAlign: "left",
  padding: "12px",
  backgroundColor: "#f1f5f9"
};

const td = {
  padding: "12px",
  borderTop: "1px solid #e2e8f0"
};

const tr = {
  transition: "background 0.2s"
};

const editButton = {
  padding: "6px 10px",
  marginRight: "6px",
  borderRadius: "6px",
  border: "none",
  backgroundColor: "#f59e0b",
  color: "white",
  cursor: "pointer"
};

const deleteButton = {
  padding: "6px 10px",
  borderRadius: "6px",
  border: "none",
  backgroundColor: "#dc2626",
  color: "white",
  cursor: "pointer"
};

export default Ubicaciones;