import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import CrudPage from "../components/CrudPage";

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

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setCargando(true);

      const [zonasData, almacenesData] = await Promise.all([
        apiFetch("/zones/"),
        apiFetch("/warehouses/")
      ]);

      setZonas(zonasData);
      setAlmacenes(almacenesData);
    } catch (err) {
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
        almacen_id: Number(form.almacen_id)
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
      cardTitle="Nueva zona"
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
          />

          <select
            name="almacen_id"
            value={form.almacen_id}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona almacén</option>
            {almacenes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>

          <button type="submit">
            {editingId ? "Actualizar" : "Crear"}
          </button>
        </>
      }
      tableContent={
        <table style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Zona</th>
              <th>Almacén</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {zonasFiltradas.map((z) => (
              <tr key={z.id}>
                <td>{z.nombre}</td>
                <td>{z.almacen_nombre}</td>
                <td>
                  <button onClick={() => editar(z)}>Editar</button>
                  <button onClick={() => eliminar(z.id)}>Eliminar</button>
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