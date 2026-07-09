import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import CrudPage from "../components/CrudPage";
import { useSearchParams, Link } from "react-router-dom";
import * as styles from "./Ubicaciones.styles";

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
      <div style={styles.header}>
        <div>
          <h1 style={{ margin: 0 }}>Ubicaciones</h1>
          <p style={styles.subtitle}>
            Gestión de ubicaciones dentro de la zona
          </p>
        </div>

        {zonaIdFromUrl && (
          <Link to={`/zonas/${zonaIdFromUrl}`} style={styles.backButton}>
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
              style={styles.inputStyle}
            />

            <input
              name="descripcion"
              placeholder="Descripción"
              value={form.descripcion}
              onChange={handleChange}
              style={styles.inputStyle}
            />

            {!zonaIdFromUrl && (
              <select
                name="zona_id"
                value={form.zona_id}
                onChange={handleChange}
                required
                style={styles.inputStyle}
              >
                <option value="">Selecciona zona</option>
                {zonas.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nombre}
                  </option>
                ))}
              </select>
            )}

            <button type="submit" style={styles.primaryButton}>
              {editingId ? "Actualizar" : "Crear"}
            </button>
          </>
        }
        tableContent={
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Código</th>
                <th style={styles.th}>Descripción</th>
                <th style={styles.th}>Zona</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ubicacionesFiltradas.map((u) => (
                <tr key={u.id} style={styles.tr}>
                  <td style={styles.td}>{u.codigo}</td>
                  <td style={styles.td}>{u.descripcion}</td>
                  <td style={styles.td}>{u.zona_nombre}</td>
                  <td style={styles.td}>
                    <button style={styles.editButton} onClick={() => editar(u)}>
                      Editar
                    </button>
                    <button style={styles.deleteButton} onClick={() => eliminar(u.id)}>
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

export default Ubicaciones;