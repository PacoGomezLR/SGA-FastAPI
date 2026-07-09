import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import { useConfirm } from "../context/ConfirmContext";
import CrudPage from "../components/CrudPage";
import * as styles from "./Productos.styles";

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

  const [mostrarModalCategoria, setMostrarModalCategoria] = useState(false);
  const [guardandoCategoria, setGuardandoCategoria] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState("");

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

  function abrirModalCategoria() {
    setNuevaCategoria("");
    setMostrarModalCategoria(true);
  }

  function cerrarModalCategoria() {
    if (guardandoCategoria) return;
    setNuevaCategoria("");
    setMostrarModalCategoria(false);
  }

  async function crearCategoria() {
    const nombreLimpio = nuevaCategoria.trim();

    if (!nombreLimpio) {
      setError('Debes escribir un nombre para la categoría');
      return;
    }

    try {
      setGuardandoCategoria(true);
      setError("");
      setMensaje("");

      const nueva = await apiFetch("/categories/", {
        method: "POST",
        body: {
          nombre: nombreLimpio
        }
      });

      await cargarCategorias();

      if (nueva?.id !== undefined && nueva?.id !== null) {
        setForm((prev) => ({
          ...prev,
          categoria_id: String(nueva.id)
        }));
      }

      setMensaje("Categoría creada correctamente");
      setNuevaCategoria("");
      setMostrarModalCategoria(false);
    } catch (err) {
      setError(err.message || "Error al crear la categoría");
    } finally {
      setGuardandoCategoria(false);
    }
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
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Nombre</th>
            <th style={styles.th}>Categoría</th>
            <th style={styles.th}>Unidad</th>
            <th style={styles.th}>SKU</th>
            <th style={styles.th}>Stock mínimo</th>
            <th style={styles.th}>Activo</th>
            <th style={styles.th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productosFiltrados.map((p) => (
            <tr key={p.id}>
              <td style={styles.td}>{p.id}</td>
              <td style={styles.td}>{p.nombre}</td>
              <td style={styles.td}>{p.categoria_nombre || "-"}</td>
              <td style={styles.td}>{p.unidad_medida || "-"}</td>
              <td style={styles.td}>{p.sku}</td>
              <td style={styles.td}>{p.stock_minimo ?? 0}</td>
              <td style={styles.td}>
                <span style={p.activo ? styles.badgeActivo : styles.badgeInactivo}>
                  {p.activo ? "Sí" : "No"}
                </span>
              </td>
              <td style={styles.td}>
                <div style={styles.accionesTabla}>
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={() => editarProducto(p)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    style={styles.dangerButton}
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
    <>
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
            <div style={styles.accionesSuperiores}>
              {!mostrarFormulario ? (
                <button type="button" style={styles.primaryButton} onClick={nuevoProducto}>
                  Crear producto
                </button>
              ) : (
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={limpiarFormulario}
                >
                  Ocultar formulario
                </button>
              )}
            </div>

            {mostrarFormulario && (
              <div style={styles.formWrapper}>
                <div style={styles.bloque}>
                  <div style={styles.bloqueTitulo}>Datos principales</div>

                  <div style={styles.campo}>
                    <label style={styles.label}>Nombre</label>
                    <input
                      name="nombre"
                      placeholder="Ej: Guitarra Fender Stratocaster"
                      value={form.nombre}
                      onChange={handleChange}
                      required
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.campo}>
                    <label style={styles.label}>SKU</label>
                    <input
                      name="sku"
                      placeholder="Se genera automáticamente si lo dejas vacío"
                      value={form.sku}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.campo}>
                    <label style={styles.label}>Descripción</label>
                    <textarea
                      name="descripcion"
                      placeholder="Añade una descripción breve del producto"
                      value={form.descripcion}
                      onChange={handleChange}
                      rows="4"
                      style={styles.textarea}
                    />
                  </div>
                </div>

                <div style={styles.bloque}>
                  <div style={styles.bloqueTitulo}>Configuración</div>

                  <div style={styles.dosColumnas}>
                    <div style={styles.campo}>
                      <label style={styles.label}>
                        Categoría
                        <button
                          type="button"
                          style={styles.miniButton}
                          onClick={abrirModalCategoria}
                        >
                          + Nueva
                        </button>
                      </label>

                      <select
                        name="categoria_id"
                        value={form.categoria_id}
                        onChange={handleChange}
                        style={styles.select}
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

                    <div style={styles.campo}>
                      <label style={styles.label}>Unidad de medida</label>
                      <input
                        name="unidad_medida"
                        placeholder="Ej: unidad, kg, caja..."
                        value={form.unidad_medida}
                        onChange={handleChange}
                        required
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={styles.dosColumnas}>
                    <div style={styles.campo}>
                      <label style={styles.label}>Stock mínimo</label>
                      <input
                        type="number"
                        name="stock_minimo"
                        placeholder="Cantidad mínima para alerta"
                        value={form.stock_minimo}
                        onChange={handleChange}
                        min="0"
                        required
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.campo}>
                      <label style={styles.label}>Estado</label>
                      <label style={styles.checkboxCard}>
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

                <div style={styles.accionesFormulario}>
                  <button type="submit" disabled={guardando} style={styles.primaryButton}>
                    {guardando
                      ? "Guardando..."
                      : editingId
                        ? "Actualizar producto"
                        : "Crear producto"}
                  </button>

                  <button
                    type="button"
                    onClick={limpiarFormulario}
                    style={styles.secondaryButton}
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

      {mostrarModalCategoria && (
        <div style={styles.modalOverlay} onClick={cerrarModalCategoria}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitulo}>Nueva categoría</div>

            <div style={styles.campo}>
              <label style={styles.label}>Nombre</label>
              <input
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                placeholder="Ej: Guitarras"
                style={styles.input}
                autoFocus
              />
            </div>

            <div style={styles.accionesFormulario}>
              <button
                type="button"
                style={styles.primaryButton}
                onClick={crearCategoria}
                disabled={guardandoCategoria}
              >
                {guardandoCategoria ? "Guardando..." : "Crear categoría"}
              </button>

              <button
                type="button"
                style={styles.secondaryButton}
                onClick={cerrarModalCategoria}
                disabled={guardandoCategoria}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Productos;