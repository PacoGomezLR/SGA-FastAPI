import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/api";
import CrudPage from "../components/CrudPage";
import { useSearchParams, Link } from "react-router-dom";
import * as styles from "./Ubicaciones.styles";

const initialForm = {
  codigo: "",
  descripcion: "",
  seccion_id: ""
};

function Ubicaciones() {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  const [searchParams] = useSearchParams();
  const seccionIdFromUrl = searchParams.get("seccion_id");

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (seccionIdFromUrl) {
      setForm((prev) => ({
        ...prev,
        seccion_id: seccionIdFromUrl
      }));
    }
  }, [seccionIdFromUrl]);

  async function cargarDatos() {
    try {
      setCargando(true);

      const [ubicacionesData, seccionesData] = await Promise.all([
        apiFetch("/locations/"),
        apiFetch("/sections/")
      ]);

      setUbicaciones(ubicacionesData);
      setSecciones(seccionesData);
    } catch {
      setError("Error al cargar ubicaciones");
    } finally {
      setCargando(false);
    }
  }

  const seccionesPorId = useMemo(() => {
    const mapa = new Map();
    secciones.forEach((s) => mapa.set(s.id, s));
    return mapa;
  }, [secciones]);

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
        seccion_id: Number(form.seccion_id || seccionIdFromUrl)
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
      seccion_id: u.seccion_id
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
      <div style={styles.header}>
        <div>
          <h1 style={{ margin: 0 }}>Ubicaciones</h1>
          <p style={styles.subtitle}>
            Gestión de ubicaciones dentro de la sección
          </p>
        </div>

        {seccionIdFromUrl && (
          <Link to={`/secciones/${seccionIdFromUrl}`} style={styles.backButton}>
            Volver a sección
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
              placeholder="Código (Ej: C1-F1...)"
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

            {!seccionIdFromUrl && (
              <select
                name="seccion_id"
                value={form.seccion_id}
                onChange={handleChange}
                required
                style={styles.inputStyle}
              >
                <option value="">Selecciona sección</option>
                {secciones.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
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
                <th style={styles.th}>Sección</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ubicacionesFiltradas.map((u) => (
                <tr key={u.id} style={styles.tr}>
                  <td style={styles.td}>{u.codigo}</td>
                  <td style={styles.td}>{u.descripcion}</td>
                  <td style={styles.td}>{seccionesPorId.get(u.seccion_id)?.nombre || "-"}</td>
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
