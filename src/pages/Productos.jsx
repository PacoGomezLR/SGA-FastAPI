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
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const { confirm } = useConfirm();

  async function cargarProductos() {
    const data = await apiFetch("/products/");
    setProductos(Array.isArray(data) ? data : []);
  }

  async function cargarCategorias() {
    const data = await apiFetch("/categories/");
    setCategorias(Array.isArray(data) ? data : []);
  }

  async function cargarDatos() {
    try {
      setCargando(true);
      setError("");

      await Promise.all([cargarProductos(), cargarCategorias()]);
    } catch (err) {
      setError(err.message || "Error al cargar productos");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
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
    setMostrarFormulario(false);
  }

  function nuevoProducto() {
    setForm(initialForm);
    setEditingId(null);
    setError("");
    setMensaje("");
    setMostrarFormulario(true);
  }

  function editarProducto(producto) {
    setEditingId(producto.id);
    setMensaje("");
    setError("");
    setMostrarFormulario(true);

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
        categoria_id: Number(form.categoria_id),
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

      setForm(initialForm);
      setEditingId(null);
      setMostrarFormulario(false);
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
      String(p.descripcion ?? "").toLowerCase().includes(texto) ||
      String(p.categoria_nombre ?? "").toLowerCase().includes(texto) ||
      String(p.unidad_medida ?? "").toLowerCase().includes(texto)
    );
  });

  const tablaProductos =
    productosFiltrados.length === 0 ? null : (
      <table style={table}>
        <thead>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>Nombre</th>
            <th style={th}>Categoría</th>
            <th style={th}>Unidad</th>
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
              <td style={td}>{p.categoria_nombre || "-"}</td>
              <td style={td}>{p.unidad_medida || "-"}</td>
              <td style={td}>{p.sku}</td>
              <td style={td}>{p.stock_minimo ?? 0}</td>
              <td style={td}>
                <span style={p.activo ? badgeActivo : badgeInactivo}>
                  {p.activo ? "Sí" : "No"}
                </span>
              </td>
              <td style={td}>
                <div style={accionesTabla}>
                  <button
                    type="button"
                    style={secondaryButton}
                    onClick={() => editarProducto(p)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    style={dangerButton}
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
          <div style={accionesSuperiores}>
            {!mostrarFormulario ? (
              <button type="button" style={primaryButton} onClick={nuevoProducto}>
                Crear producto
              </button>
            ) : (
              <button
                type="button"
                style={secondaryButton}
                onClick={limpiarFormulario}
              >
                Ocultar formulario
              </button>
            )}
          </div>

          {mostrarFormulario && (
            <div style={formWrapper}>
              <div style={bloque}>
                <div style={bloqueTitulo}>Datos principales</div>

                <div style={campo}>
                  <label style={label}>Nombre</label>
                  <input
                    name="nombre"
                    placeholder="Ej: Guitarra Fender Stratocaster"
                    value={form.nombre}
                    onChange={handleChange}
                    required
                    style={input}
                  />
                </div>

                <div style={campo}>
                  <label style={label}>SKU</label>
                  <input
                    name="sku"
                    placeholder="Se genera automáticamente si lo dejas vacío"
                    value={form.sku}
                    onChange={handleChange}
                    style={input}
                  />
                </div>

                <div style={campo}>
                  <label style={label}>Descripción</label>
                  <textarea
                    name="descripcion"
                    placeholder="Añade una descripción breve del producto"
                    value={form.descripcion}
                    onChange={handleChange}
                    rows="4"
                    style={textarea}
                  />
                </div>
              </div>

              <div style={bloque}>
                <div style={bloqueTitulo}>Configuración</div>

                <div style={dosColumnas}>
                  <div style={campo}>
                    <label style={label}>Categoría</label>
                    <select
                      name="categoria_id"
                      value={form.categoria_id}
                      onChange={handleChange}
                      style={select}
                      required
                    >
                      <option value="" disabled>
                        Selecciona una categoría
                      </option>
                      {categorias.map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={campo}>
                    <label style={label}>Unidad de medida</label>
                    <input
                      name="unidad_medida"
                      placeholder="Ej: unidad, kg, caja..."
                      value={form.unidad_medida}
                      onChange={handleChange}
                      required
                      style={input}
                    />
                  </div>
                </div>

                <div style={dosColumnas}>
                  <div style={campo}>
                    <label style={label}>Stock mínimo</label>
                    <input
                      type="number"
                      name="stock_minimo"
                      placeholder="Cantidad mínima para alerta"
                      value={form.stock_minimo}
                      onChange={handleChange}
                      min="0"
                      required
                      style={input}
                    />
                  </div>

                  <div style={campo}>
                    <label style={label}>Estado</label>
                    <label style={checkboxCard}>
                      <input
                        type="checkbox"
                        name="activo"
                        checked={form.activo}
                        onChange={handleChange}
                      />
                      <span>Producto activo</span>
                    </label>
                  </div>
                </div>
              </div>

              <div style={accionesFormulario}>
                <button type="submit" disabled={guardando} style={primaryButton}>
                  {guardando
                    ? "Guardando..."
                    : editingId
                      ? "Actualizar producto"
                      : "Crear producto"}
                </button>

                <button
                  type="button"
                  onClick={limpiarFormulario}
                  style={secondaryButton}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </>
      }
      tableContent={tablaProductos}
    />
  );
}

const accionesSuperiores = {
  marginBottom: "6px"
};

const formWrapper = {
  display: "grid",
  gap: "18px"
};

const bloque = {
  display: "grid",
  gap: "14px",
  padding: "18px",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  backgroundColor: "#f8fafc"
};

const bloqueTitulo = {
  fontWeight: "700",
  color: "#0f172a"
};

const dosColumnas = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px"
};

const campo = {
  display: "grid",
  gap: "6px"
};

const label = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#334155"
};

const input = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  backgroundColor: "white",
  outline: "none",
  boxSizing: "border-box"
};

const select = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  backgroundColor: "white",
  outline: "none",
  boxSizing: "border-box"
};

const textarea = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  backgroundColor: "white",
  outline: "none",
  resize: "vertical",
  boxSizing: "border-box"
};

const checkboxCard = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minHeight: "46px",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  backgroundColor: "white",
  boxSizing: "border-box"
};

const accionesFormulario = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap"
};

const primaryButton = {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "none",
  backgroundColor: "#0f172a",
  color: "white",
  fontWeight: "600",
  cursor: "pointer"
};

const secondaryButton = {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  backgroundColor: "white",
  color: "#0f172a",
  fontWeight: "600",
  cursor: "pointer"
};

const dangerButton = {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "1px solid #fecaca",
  backgroundColor: "#fff1f2",
  color: "#b91c1c",
  fontWeight: "600",
  cursor: "pointer"
};

const accionesTabla = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap"
};

const badgeActivo = {
  display: "inline-block",
  padding: "4px 8px",
  borderRadius: "999px",
  backgroundColor: "#dcfce7",
  color: "#166534",
  fontSize: "12px",
  fontWeight: "700"
};

const badgeInactivo = {
  display: "inline-block",
  padding: "4px 8px",
  borderRadius: "999px",
  backgroundColor: "#fee2e2",
  color: "#991b1b",
  fontSize: "12px",
  fontWeight: "700"
};

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