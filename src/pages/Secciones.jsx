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

const initialLayout = {
  num_columnas: "",
  num_filas: ""
};

function Secciones() {
  const [secciones, setSecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [layout, setLayout] = useState(initialLayout);
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
    setLayout(initialLayout);
    setError("");
    setMensaje("");
    setMostrarFormulario(false);
  }

  function editarSeccion(seccion) {
    setEditingId(seccion.id);
    setMensaje("");
    setError("");
    setLayout({
      num_columnas: seccion.num_columnas != null ? String(seccion.num_columnas) : "",
      num_filas: seccion.num_filas != null ? String(seccion.num_filas) : ""
    });
    setMostrarFormulario(true);

    setForm({
      nombre: seccion.nombre ?? "",
      descripcion: seccion.descripcion ?? "",
      direccion: seccion.direccion ?? "",
      activo: seccion.activo ?? true
    });
  }

  function handleLayoutChange(e) {
    const { name, value } = e.target;
    setLayout((prev) => ({ ...prev, [name]: value }));
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

        const seccionOriginal = secciones.find((s) => s.id === editingId);
        const nuevaColumnas = layout.num_columnas ? Number(layout.num_columnas) : null;
        const nuevaFilas = layout.num_filas ? Number(layout.num_filas) : null;
        const cambioColumnas = nuevaColumnas != null && nuevaColumnas !== seccionOriginal?.num_columnas;
        const cambioFilas = nuevaFilas != null && nuevaFilas !== seccionOriginal?.num_filas;

        if (cambioColumnas || cambioFilas) {
          await apiFetch(`/section-layout/${editingId}/resize`, {
            method: "PATCH",
            body: {
              num_columnas: cambioColumnas ? nuevaColumnas : null,
              num_filas: cambioFilas ? nuevaFilas : null
            }
          });
        }
      } else {
        const tieneLayout = layout.num_columnas && layout.num_filas;

        await apiFetch("/section-layout/", {
          method: "POST",
          body: {
            seccion: seccionPayload,
            layout: tieneLayout
              ? {
                  num_columnas: Number(layout.num_columnas),
                  num_filas: Number(layout.num_filas)
                }
              : null
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

          <div style={styles.pasillosSection}>
            <div style={styles.sectionTitle}>
              {editingId ? "Rejilla de la estantería" : "Rejilla de la estantería (opcional)"}
            </div>

            <div style={styles.pasilloRow}>
              <div style={styles.pasilloFieldGroup}>
                <label htmlFor="num_columnas" style={styles.pasilloLabel}>
                  Columnas
                </label>
                <input
                  id="num_columnas"
                  name="num_columnas"
                  type="number"
                  min="1"
                  placeholder="Nº columnas"
                  value={layout.num_columnas}
                  onChange={handleLayoutChange}
                  style={{ ...styles.input, width: "140px" }}
                />
              </div>

              <div style={styles.pasilloFieldGroup}>
                <label htmlFor="num_filas" style={styles.pasilloLabel}>
                  Filas
                </label>
                <input
                  id="num_filas"
                  name="num_filas"
                  type="number"
                  min="1"
                  placeholder="Nº filas"
                  value={layout.num_filas}
                  onChange={handleLayoutChange}
                  style={{ ...styles.input, width: "140px" }}
                />
              </div>
            </div>
          </div>

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
