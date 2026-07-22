import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Warehouse, XCircle } from "lucide-react";
import { apiFetch } from "../api/api";
import { useConfirm } from "../context/ConfirmContext";
import CrudPage from "../components/CrudPage";
import * as styles from "./Secciones.styles";

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

function Secciones() {
  const [secciones, setSecciones] = useState([]);
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

  async function cargarSecciones() {
    try {
      setCargando(true);
      setError("");

      const data = await apiFetch("/sections/");
      setSecciones(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Error al cargar secciones");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarSecciones();
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

  function editarSeccion(seccion) {
    setEditingId(seccion.id);
    setMensaje("");
    setError("");
    setPasillos([]);
    setMostrarFormulario(true);

    setForm({
      nombre: seccion.nombre ?? "",
      descripcion: seccion.descripcion ?? "",
      direccion: seccion.direccion ?? "",
      activo: seccion.activo ?? true
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

      const seccionPayload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        direccion: form.direccion.trim(),
        activo: form.activo
      };

      if (editingId) {
        await apiFetch(`/sections/${editingId}`, {
          method: "PUT",
          body: seccionPayload
        });
      } else {
        await apiFetch("/section-layout/", {
          method: "POST",
          body: {
            seccion: seccionPayload,
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
          ? "Sección actualizada correctamente"
          : "Sección creada correctamente"
      );

      limpiarFormulario();
      await cargarSecciones();
    } catch (err) {
      setError(err.message || "Error al guardar la sección");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarSeccion(seccion) {
    try {
      setError("");
      setMensaje("");

      await apiFetch(`/sections/${seccion.id}`, {
        method: "DELETE"
      });

      if (editingId === seccion.id) {
        limpiarFormulario();
      }

      setMensaje("Sección eliminada correctamente");
      await cargarSecciones();
    } catch (err) {
      setError(err.message || "Error al eliminar la sección");
    }
  }

  function solicitarEliminacion(seccion) {
    setError("");
    setMensaje("");

    confirm({
      title: "Eliminar sección",
      message: `¿Seguro que quieres eliminar la sección "${seccion.nombre}"? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      onConfirm: () => eliminarSeccion(seccion)
    });
  }

  const seccionesFiltradas = secciones.filter((s) => {
    const texto = busqueda.toLowerCase().trim();
    if (!texto) return true;

    return (
      String(s.nombre ?? "").toLowerCase().includes(texto) ||
      String(s.descripcion ?? "").toLowerCase().includes(texto) ||
      String(s.direccion ?? "").toLowerCase().includes(texto)
    );
  });

  const totalActivos = useMemo(() => {
    return secciones.filter((s) => s.activo).length;
  }, [secciones]);

  const totalInactivos = useMemo(() => {
    return secciones.filter((s) => !s.activo).length;
  }, [secciones]);

  const tablaSecciones =
    seccionesFiltradas.length === 0 ? null : (
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
            {seccionesFiltradas.map((s) => (
              <tr key={s.id} style={styles.row}>
                <td style={styles.td}>{s.id}</td>
                <td style={styles.tdStrong}>{s.nombre}</td>
                <td style={styles.td}>{s.descripcion || "-"}</td>
                <td style={styles.td}>{s.direccion || "-"}</td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.badge,
                      backgroundColor: s.activo ? "#dcfce7" : "#fee2e2",
                      color: s.activo ? "#166534" : "#991b1b"
                    }}
                  >
                    {s.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td style={styles.td}>
                  <Link to={`/secciones/${s.id}`} style={styles.detailLink}>
                    Ver detalle
                  </Link>
                </td>
                <td style={styles.td}>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => editarSeccion(s)}
                      style={styles.secondaryButton}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => solicitarEliminacion(s)}
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
      title="Secciones"
      message={mensaje}
      error={error}
      cardTitle={editingId ? "Editar sección" : "Nueva sección"}
      onSubmit={handleSubmit}
      searchValue={busqueda}
      onSearchChange={(e) => setBusqueda(e.target.value)}
      loading={cargando}
      emptyMessage="No hay secciones"
      showForm={mostrarFormulario}
      onShowForm={() => setMostrarFormulario(true)}
      showFormButtonText="+ Crear sección"
      headerAction={
        <Link to="/secciones/mapa" style={styles.mapaButton}>
          Mapa 2D
        </Link>
      }
      formContent={
        <>
          <div style={styles.sectionTitle}>Datos principales</div>

          <input
            name="nombre"
            placeholder="Nombre de la sección"
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
            <Card title="Total secciones" value={secciones.length} icon={Warehouse} color="#1baf7a" />
            <Card title="Activas" value={totalActivos} icon={CheckCircle2} color="#2a78d6" />
            <Card title="Inactivas" value={totalInactivos} icon={XCircle} color="#991b1b" />
          </div>
          {tablaSecciones}
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

export default Secciones;
