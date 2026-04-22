import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import { useConfirm } from "../context/ConfirmContext";
import CrudPage from "../components/CrudPage";

const initialForm = {
  nombre: "",
  descripcion: "",
  sku: "",
  categoria_id: "",
  unidad_medida: "",
  stock_minimo: 0,
  activo: true
};

function Productos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const { confirm } = useConfirm();

  async function cargarProductos() {
    try {
      setCargando(true);
      setError("");

      const data = await apiFetch("/products/");
      setProductos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Error al cargar productos");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarProductos();
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

  function editarProducto(producto) {
    setEditingId(producto.id);
    setMensaje("");
    setError("");

    setForm({
      nombre: producto.nombre ?? "",
      descripcion: producto.descripcion ?? "",
      sku: producto.sku ?? "",
      categoria_id:
        producto.categoria_id !== null && producto.categoria_id !== undefined
          ? String(producto.categoria_id)
          : "",
      unidad_medida: producto.unidad_medida ?? "",
      stock_minimo:
        producto.stock_minimo !== null && producto.stock_minimo !== undefined
          ? producto.stock_minimo
          : 0,
      activo: producto.activo ?? true
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
        descripcion: form.descripcion.trim() || null,
        sku: form.sku.trim() || null,
        categoria_id: form.categoria_id === "" ? null : Number(form.categoria_id),
        unidad_medida: form.unidad_medida.trim(),
        stock_minimo: Number(form.stock_minimo),
        activo: form.activo
      };

      await apiFetch(editingId ? `/products/${editingId}` : "/products/", {
        method: editingId ? "PUT" : "POST",
        body: payload
      });

      setMensaje(
        editingId
          ? "Producto actualizado correctamente"
          : "Producto creado correctamente"
      );

      limpiarFormulario();
      await cargarProductos();
    } catch (err) {
      setError(err.message || "Error al guardar el producto");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarProducto(producto) {
    try {
      setError("");
      setMensaje("");

      await apiFetch(`/products/${producto.id}`, {
        method: "DELETE"
      });

      if (editingId === producto.id) {
        limpiarFormulario();
      }

      setMensaje("Producto eliminado correctamente");
      await cargarProductos();
    } catch (err) {
      setError(err.message || "Error al eliminar el producto");
    }
  }

  function solicitarEliminacion(producto) {
    setError("");
    setMensaje("");

    confirm({
      title: "Eliminar producto",
      message: `¿Seguro que quieres eliminar el producto "${producto.nombre}"?`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      onConfirm: () => eliminarProducto(producto)
    });
  }

  const productosFiltrados = productos.filter((p) => {
    const texto = busqueda.toLowerCase().trim();
    if (!texto) return true;

    return (
      String(p.nombre ?? "").toLowerCase().includes(texto) ||
      String(p.sku ?? "").toLowerCase().includes(texto) ||
      String(p.descripcion ?? "").toLowerCase().includes(texto)
    );
  });

  const tablaProductos =
    productosFiltrados.length === 0 ? null : (
      <table style={table}>
        <thead>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>Nombre</th>
            <th style={th}>SKU</th>
            <th style={th}>Stock mínimo</th>
            <th style={th}>Activo</th>
            <th style={th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productosFiltrados.map((p) => (
            <tr key={p.id}>
              <td style={td}>{p.id}</td>
              <td style={td}>{p.nombre}</td>
              <td style={td}>{p.sku}</td>
              <td style={td}>{p.stock_minimo ?? 0}</td>
              <td style={td}>{p.activo ? "Sí" : "No"}</td>
              <td style={td}>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button type="button" onClick={() => editarProducto(p)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => solicitarEliminacion(p)}
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
      title="Productos"
      message={mensaje}
      error={error}
      cardTitle={editingId ? "Editar producto" : "Nuevo producto"}
      onSubmit={handleSubmit}
      searchValue={busqueda}
      onSearchChange={(e) => setBusqueda(e.target.value)}
      loading={cargando}
      emptyMessage="No hay productos"
      formContent={
        <>
          <input
            name="nombre"
            placeholder="Nombre"
            value={form.nombre}
            onChange={handleChange}
            required
          />

          <input
            name="sku"
            placeholder="SKU automático si lo dejas vacío"
            value={form.sku}
            onChange={handleChange}
          />

          <textarea
            name="descripcion"
            placeholder="Descripción"
            value={form.descripcion}
            onChange={handleChange}
            rows="3"
          />

          <input
            type="number"
            name="categoria_id"
            placeholder="ID categoría"
            value={form.categoria_id}
            onChange={handleChange}
            min="1"
          />

          <input
            name="unidad_medida"
            placeholder="Ej: unidad, kg, caja..."
            value={form.unidad_medida}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="stock_minimo"
            placeholder="Stock mínimo (alerta)"
            value={form.stock_minimo}
            onChange={handleChange}
            min="0"
            required
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
      tableContent={tablaProductos}
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
  borderBottom: "1px solid #eee"
};

export default Productos;