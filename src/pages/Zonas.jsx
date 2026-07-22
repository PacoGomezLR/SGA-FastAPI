import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import CrudPage from "../components/CrudPage";
import { useSearchParams } from "react-router-dom";
import * as styles from "./Zonas.styles";

const initialForm = {
  nombre: "",
  seccion_id: ""
};

function Zonas() {
  const [zonas, setZonas] = useState([]);
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

      const [zonasData, seccionesData] = await Promise.all([
        apiFetch("/zones/"),
        apiFetch("/sections/")
      ]);

      setZonas(zonasData);
      setSecciones(seccionesData);
    } catch {
      setError("Error al cargar zonas");
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
        nombre: form.nombre,
        seccion_id: Number(form.seccion_id || seccionIdFromUrl)
      };

      await apiFetch(editingId ? `/zones/${editingId}` : "/zones/", {
        method: editingId ? "PUT" : "POST",
        body: payload
      });

      setMensaje("Zona guardada correctamente");
      setForm(initialForm);
      setEditingId(null);
      cargarDatos();
    } catch {
      setError("Error al guardar zona");
    }
  }

  function editar(zona) {
    setEditingId(zona.id);
    setForm({
      nombre: zona.nombre,
      seccion_id: zona.seccion_id
    });
  }

  async function eliminar(id) {
    await apiFetch(`/zones/${id}`, { method: "DELETE" });
    cargarDatos();
  }

  const zonasFiltradas = zonas.filter((z) =>
    z.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <CrudPage
      title="Zonas"
      message={mensaje}
      error={error}
      cardTitle={editingId ? "Editar zona" : "Nueva zona"}
      onSubmit={handleSubmit}
      searchValue={busqueda}
      onSearchChange={(e) => setBusqueda(e.target.value)}
      loading={cargando}
      emptyMessage="No hay zonas"
      formContent={
        <>
          <input
            name="nombre"
            placeholder="Nombre de zona (Ej: Pasillo A)"
            value={form.nombre}
            onChange={handleChange}
            required
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
              {secciones.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
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
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Zona</th>
                <th style={styles.th}>Sección</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {zonasFiltradas.map((z) => (
                <tr key={z.id} style={styles.tr}>
                  <td style={styles.td}>{z.nombre}</td>
                  <td style={styles.td}>{z.seccion_nombre}</td>
                  <td style={styles.td}>
                    <button style={styles.editButton} onClick={() => editar(z)}>
                      Editar
                    </button>
                    <button style={styles.deleteButton} onClick={() => eliminar(z.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    />
  );
}

export default Zonas;
