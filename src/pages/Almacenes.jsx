import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import { useConfirm } from "../context/ConfirmContext";
import CrudPage from "../components/CrudPage";

const initialForm = {
  nombre: "",
  descripcion: "",
  direccion: "",
  activo: true
};

function Almacenes() {
  const [almacenes, setAlmacenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const { confirm } = useConfirm();

  async function cargarAlmacenes() {
    try {
      setCargando(true);
      setError("");

      const data = await apiFetch("/warehouses/");
      setAlmacenes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Error al cargar almacenes");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarAlmacenes();
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  function limpiarFormulario() {
    setForm(initialForm);
    setEditingId(null);
    setError("");
    setMensaje("");
  }

  function editarAlmacen(almacen) {
    setEditingId(almacen.id);
    setMensaje("");
    setError("");

    setForm({
      nombre: almacen.nombre ?? "",
      descripcion: almacen.descripcion ?? "",
      direccion: almacen.direccion ?? "",
      activo: almacen.activo ?? true
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        direccion: form.direccion.trim(),
        activo: form.activo
      };

      await apiFetch(editingId ? `/warehouses/${editingId}` : "/warehouses/", {
        method: editingId ? "PUT" : "POST",
        body: payload
      });

      setMensaje(
        editingId
          ? "Almacén actualizado correctamente"
          : "Almacén creado correctamente"
      );

      limpiarFormulario();
      await cargarAlmacenes();
    } catch (err) {
      setError(err.message || "Error al guardar el almacén");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarAlmacen(almacen) {
    try {
      setError("");
      setMensaje("");

      await apiFetch(`/warehouses/${almacen.id}`, {
        method: "DELETE"
      });

      if (editingId === almacen.id) {
        limpiarFormulario();
      }

      setMensaje("Almacén eliminado correctamente");
      await cargarAlmacenes();
    } catch (err) {
      setError(err.message || "Error al eliminar el almacén");
    }
  }

  function solicitarEliminacion(almacen) {
    setError("");
    setMensaje("");

    confirm({
      title: "Eliminar almacén",
      message: `¿Seguro que quieres eliminar el almacén "${almacen.nombre}"? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      onConfirm: () => eliminarAlmacen(almacen)
    });
  }

  const almacenesFiltrados = almacenes.filter((a) => {
    const texto = busqueda.toLowerCase().trim();
    if (!texto) return true;

    return (
      String(a.nombre ?? "").toLowerCase().includes(texto) ||
      String(a.descripcion ?? "").toLowerCase().includes(texto) ||
      String(a.direccion ?? "").toLowerCase().includes(texto)
    );
  });

  const tablaAlmacenes =
    almacenesFiltrados.length === 0 ? null : (
      <table style={table}>
        <thead>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>Nombre</th>
            <th style={th}>Descripción</th>
            <th style={th}>Dirección</th>
            <th style={th}>Activo</th>
            <th style={th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {almacenesFiltrados.map((a) => (
            <tr key={a.id}>
              <td style={td}>{a.id}</td>
              <td style={td}>{a.nombre}</td>
              <td style={td}>{a.descripcion || "-"}</td>
              <td style={td}>{a.direccion || "-"}</td>
              <td style={td}>{a.activo ? "Sí" : "No"}</td>
              <td style={td}>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button type="button" onClick={() => editarAlmacen(a)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => solicitarEliminacion(a)}
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );

  return (
    <CrudPage
      title="Almacenes"
      message={mensaje}
      error={error}
      cardTitle={editingId ? "Editar almacén" : "Nuevo almacén"}
      onSubmit={handleSubmit}
      searchValue={busqueda}
      onSearchChange={(e) => setBusqueda(e.target.value)}
      loading={cargando}
      emptyMessage="No hay almacenes"
      formContent={
        <>
          <input
            name="nombre"
            placeholder="Nombre"
            value={form.nombre}
            onChange={handleChange}
            required
          />

          <textarea
            name="descripcion"
            placeholder="Descripción"
            value={form.descripcion}
            onChange={handleChange}
            rows="3"
          />

          <input
            name="direccion"
            placeholder="Dirección"
            value={form.direccion}
            onChange={handleChange}
          />

          <label style={{ display: "flex", gap: "8px" }}>
            <input
              type="checkbox"
              name="activo"
              checked={form.activo}
              onChange={handleChange}
            />
            Activo
          </label>

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" disabled={guardando}>
              {guardando ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
            </button>

            {editingId && (
              <button type="button" onClick={limpiarFormulario}>
                Cancelar
              </button>
            )}
          </div>
        </>
      }
      tableContent={tablaAlmacenes}
    />
  );
}

const table = {
  width: "100%",
  borderCollapse: "collapse"
};

const th = {
  textAlign: "left",
  padding: "10px",
  borderBottom: "1px solid #ddd"
};

const td = {
  padding: "10px",
  borderBottom: "1px solid #eee",
  verticalAlign: "top"
};

export default Almacenes;