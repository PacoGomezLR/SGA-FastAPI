import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Warehouse, XCircle } from "lucide-react";
import { apiFetch } from "../api/api";
import { useConfirm } from "../context/ConfirmContext";
import CrudPage from "../components/CrudPage";
import * as styles from "./Almacenes.styles";

const initialForm = {
  nombre: "",
  descripcion: "",
  direccion: "",
  activo: true
};

const nuevoPasillo = () => ({
  numero_pasillo: "",
  lado_d: false,
  lado_i: false,
  eje_y_max: "",
  eje_x_max: ""
});

function Almacenes() {
  const [almacenes, setAlmacenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [pasillos, setPasillos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

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
    setPasillos([]);
    setError("");
    setMensaje("");
    setMostrarFormulario(false);
  }

  function editarAlmacen(almacen) {
    setEditingId(almacen.id);
    setMensaje("");
    setError("");
    setPasillos([]);
    setMostrarFormulario(true);

    setForm({
      nombre: almacen.nombre ?? "",
      descripcion: almacen.descripcion ?? "",
      direccion: almacen.direccion ?? "",
      activo: almacen.activo ?? true
    });
  }

  function agregarPasillo() {
    setPasillos((prev) => [...prev, nuevoPasillo()]);
  }

  function quitarPasillo(index) {
    setPasillos((prev) => prev.filter((_, i) => i !== index));
  }

  function handlePasilloChange(index, e) {
    const { name, value, type, checked } = e.target;

    setPasillos((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, [name]: type === "checkbox" ? checked : value } : p
      )
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const warehousePayload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        direccion: form.direccion.trim(),
        activo: form.activo
      };

      if (editingId) {
        await apiFetch(`/warehouses/${editingId}`, {
          method: "PUT",
          body: warehousePayload
        });
      } else {
        await apiFetch("/warehouse-layout/", {
          method: "POST",
          body: {
            warehouse: warehousePayload,
            pasillos: pasillos.map((p) => ({
              numero_pasillo: Number(p.numero_pasillo),
              lado_d: p.lado_d,
              lado_i: p.lado_i,
              eje_y_max: Number(p.eje_y_max),
              eje_x_max: Number(p.eje_x_max)
            }))
          }
        });
      }

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

  const totalActivos = useMemo(() => {
    return almacenes.filter((a) => a.activo).length;
  }, [almacenes]);

  const totalInactivos = useMemo(() => {
    return almacenes.filter((a) => !a.activo).length;
  }, [almacenes]);

  const tablaAlmacenes =
    almacenesFiltrados.length === 0 ? null : (
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Nombre</th>
              <th style={styles.th}>Descripción</th>
              <th style={styles.th}>Dirección</th>
              <th style={styles.th}>Estado</th>
              <th style={styles.th}>Detalle</th>
              <th style={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {almacenesFiltrados.map((a) => (
              <tr key={a.id} style={styles.row}>
                <td style={styles.td}>{a.id}</td>
                <td style={styles.tdStrong}>{a.nombre}</td>
                <td style={styles.td}>{a.descripcion || "-"}</td>
                <td style={styles.td}>{a.direccion || "-"}</td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.badge,
                      backgroundColor: a.activo ? "#dcfce7" : "#fee2e2",
                      color: a.activo ? "#166534" : "#991b1b"
                    }}
                  >
                    {a.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td style={styles.td}>
                  <Link to={`/almacenes/${a.id}`} style={styles.detailLink}>
                    Ver detalle
                  </Link>
                </td>
                <td style={styles.td}>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => editarAlmacen(a)}
                      style={styles.secondaryButton}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => solicitarEliminacion(a)}
                      style={styles.dangerButton}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
      showForm={mostrarFormulario}
      onShowForm={() => setMostrarFormulario(true)}
      showFormButtonText="+ Crear almacén"
      formContent={
        <>
          <div style={styles.sectionTitle}>Datos principales</div>

          <input
            name="nombre"
            placeholder="Nombre del almacén"
            value={form.nombre}
            onChange={handleChange}
            required
            style={styles.input}
          />

          <textarea
            name="descripcion"
            placeholder="Descripción"
            value={form.descripcion}
            onChange={handleChange}
            rows="3"
            style={{ ...styles.input, resize: "vertical", minHeight: "90px" }}
          />

          <input
            name="direccion"
            placeholder="Dirección o referencia"
            value={form.direccion}
            onChange={handleChange}
            style={styles.input}
          />

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="activo"
              checked={form.activo}
              onChange={handleChange}
            />
            Activo
          </label>

          {!editingId && (
            <div style={styles.pasillosSection}>
              <div style={styles.sectionTitle}>Pasillos (opcional)</div>

              {pasillos.map((p, index) => (
                <div key={index} style={styles.pasilloRow}>
                  <input
                    name="numero_pasillo"
                    type="number"
                    min="1"
                    placeholder="Nº pasillo"
                    value={p.numero_pasillo}
                    onChange={(e) => handlePasilloChange(index, e)}
                    style={{ ...styles.input, width: "110px" }}
                    required
                  />

                  <label style={styles.checkboxLabelInline}>
                    <input
                      type="checkbox"
                      name="lado_d"
                      checked={p.lado_d}
                      onChange={(e) => handlePasilloChange(index, e)}
                    />
                    Lado D
                  </label>

                  <label style={styles.checkboxLabelInline}>
                    <input
                      type="checkbox"
                      name="lado_i"
                      checked={p.lado_i}
                      onChange={(e) => handlePasilloChange(index, e)}
                    />
                    Lado I
                  </label>

                  <input
                    name="eje_y_max"
                    type="number"
                    min="1"
                    placeholder="Altura (Y)"
                    value={p.eje_y_max}
                    onChange={(e) => handlePasilloChange(index, e)}
                    style={{ ...styles.input, width: "110px" }}
                    required
                  />

                  <input
                    name="eje_x_max"
                    type="number"
                    min="1"
                    placeholder="Fila (X)"
                    value={p.eje_x_max}
                    onChange={(e) => handlePasilloChange(index, e)}
                    style={{ ...styles.input, width: "120px" }}
                    required
                  />

                  <button
                    type="button"
                    onClick={() => quitarPasillo(index)}
                    style={styles.dangerButton}
                  >
                    Quitar
                  </button>
                </div>
              ))}

              <button type="button" onClick={agregarPasillo} style={styles.secondaryButton}>
                + Añadir pasillo
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button type="submit" disabled={guardando} style={styles.primaryButton}>
              {guardando ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
            </button>

            {(editingId || mostrarFormulario) && (
              <button type="button" onClick={limpiarFormulario} style={styles.secondaryButton}>
                Cancelar
              </button>
            )}
          </div>
        </>
      }
      tableContent={
        <>
          <div style={styles.statsGrid}>
            <Card title="Total almacenes" value={almacenes.length} icon={Warehouse} color="#1baf7a" />
            <Card title="Activos" value={totalActivos} icon={CheckCircle2} color="#2a78d6" />
            <Card title="Inactivos" value={totalInactivos} icon={XCircle} color="#991b1b" />
          </div>
          {tablaAlmacenes}
        </>
      }
    />
  );
}

function Card({ title, value, color = "#0f172a", icon: Icon }) {
  return (
    <div style={styles.statCard}>
      <div>
        <h3 style={styles.statCardTitle}>{title}</h3>
        <p style={{ ...styles.statCardValue, color }}>{value}</p>
      </div>

      {Icon && (
        <div style={{ ...styles.statCardIconWrapper, backgroundColor: `${color}1a` }}>
          <Icon size={22} color={color} strokeWidth={2} />
        </div>
      )}
    </div>
  );
}

export default Almacenes;
