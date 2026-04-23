import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import CrudPage from "../components/CrudPage";

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
      cargarCategorias();
    } catch {
      setError("Error al guardar categoría");
    }
  }

  function editar(categoria) {
    setEditingId(categoria.id);
    setForm({
      nombre: categoria.nombre
    });
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
      formContent={
        <>
          <input
            name="nombre"
            placeholder="Nombre de categoría"
            value={form.nombre}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <button type="submit" style={primaryButton}>
            {editingId ? "Actualizar" : "Crear"}
          </button>
        </>
      }
      tableContent={
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Nombre</th>
              <th style={th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categoriasFiltradas.map((c) => (
              <tr key={c.id} style={tr}>
                <td style={td}>{c.nombre}</td>
                <td style={td}>
                  <button style={editButton} onClick={() => editar(c)}>
                    Editar
                  </button>
                  <button style={deleteButton} onClick={() => eliminar(c.id)}>
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

/* ESTILOS */

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

export default Categorias;