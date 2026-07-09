import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import CrudPage from "../components/CrudPage";
import { useSearchParams } from "react-router-dom";
import * as styles from "./Zonas.styles";

const initialForm = {
  nombre: "",
  almacen_id: ""
};

function Zonas() {
  const [zonas, setZonas] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  const [searchParams] = useSearchParams();
  const almacenIdFromUrl = searchParams.get("almacen_id");

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (almacenIdFromUrl) {
      setForm((prev) => ({
        ...prev,
        almacen_id: almacenIdFromUrl
      }));
    }
  }, [almacenIdFromUrl]);

  async function cargarDatos() {
    try {
      setCargando(true);

      const [zonasData, almacenesData] = await Promise.all([
        apiFetch("/zones/"),
        apiFetch("/warehouses/")
      ]);

      setZonas(zonasData);
      setAlmacenes(almacenesData);
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
        almacen_id: Number(form.almacen_id || almacenIdFromUrl)
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
      almacen_id: zona.almacen_id
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

          {/* 🔥 SOLO SI NO VIENES DE UN ALMACÉN */}
          {!almacenIdFromUrl && (
            <select
              name="almacen_id"
              value={form.almacen_id}
              onChange={handleChange}
              required
              style={styles.inputStyle}
            >
              <option value="">Selecciona almacén</option>
              {almacenes.map((a) => (
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
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Zona</th>
              <th style={styles.th}>Almacén</th>
              <th style={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {zonasFiltradas.map((z) => (
              <tr key={z.id} style={styles.tr}>
                <td style={styles.td}>{z.nombre}</td>
                <td style={styles.td}>{z.almacen_nombre}</td>
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
      }
    />
  );
}

export default Zonas;