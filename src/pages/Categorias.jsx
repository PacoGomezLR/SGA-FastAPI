import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import CrudPage from "../components/CrudPage";
import * as styles from "./Categorias.styles";

const initialForm = {
  nombre: ""
};

function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    cargarCategorias();
  }, []);

  async function cargarCategorias() {
    try {
      setCargando(true);
      const data = await apiFetch("/categories/");
      setCategorias(Array.isArray(data) ? data : []);
    } catch {
      setError("Error al cargar categorías");
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
        nombre: form.nombre
      };

      await apiFetch(editingId ? `/categories/${editingId}` : "/categories/", {
        method: editingId ? "PUT" : "POST",
        body: payload
      });

      setMensaje("Categoría guardada correctamente");
      setForm(initialForm);
      setEditingId(null);
      setMostrarFormulario(false);
      cargarCategorias();
    } catch {
      setError("Error al guardar categoría");
    }
  }

  function editar(categoria) {
    setEditingId(categoria.id);
    setMostrarFormulario(true);
    setForm({
      nombre: categoria.nombre
    });
  }

  function cancelar() {
    setForm(initialForm);
    setEditingId(null);
    setMostrarFormulario(false);
  }

  async function eliminar(id) {
    await apiFetch(`/categories/${id}`, { method: "DELETE" });
    cargarCategorias();
  }

  const categoriasFiltradas = categorias.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <CrudPage
      title="Categorías"
      message={mensaje}
      error={error}
      cardTitle={editingId ? "Editar categoría" : "Nueva categoría"}
      onSubmit={handleSubmit}
      searchValue={busqueda}
      onSearchChange={(e) => setBusqueda(e.target.value)}
      loading={cargando}
      emptyMessage="No hay categorías"
      showForm={mostrarFormulario}
      onShowForm={() => setMostrarFormulario(true)}
      showFormButtonText="+ Crear categoría"
      formContent={
        <>
          <input
            name="nombre"
            placeholder="Nombre de categoría"
            value={form.nombre}
            onChange={handleChange}
            required
            style={styles.inputStyle}
          />

          <div style={styles.formActions}>
            <button type="submit" style={styles.primaryButton}>
              {editingId ? "Actualizar" : "Crear"}
            </button>

            <button type="button" onClick={cancelar} style={styles.secondaryButton}>
              Cancelar
            </button>
          </div>
        </>
      }
      tableContent={
        <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nombre</th>
              <th style={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categoriasFiltradas.map((c) => (
              <tr key={c.id} style={styles.tr}>
                <td style={styles.td}>{c.nombre}</td>
                <td style={styles.td}>
                  <div style={styles.accionesTabla}>
                    <button style={styles.secondaryButton} onClick={() => editar(c)}>
                      Editar
                    </button>
                    <button style={styles.dangerButton} onClick={() => eliminar(c.id)}>
                      Eliminar
                    </button>
                  </div>
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

export default Categorias;