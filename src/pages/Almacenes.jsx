import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/api";
import { useConfirm } from "../context/ConfirmContext";
import CrudPage from "../components/CrudPage";

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
  }

  function editarAlmacen(almacen) {
    setEditingId(almacen.id);
    setMensaje("");
    setError("");
    setPasillos([]);

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
      <div style={tableWrapper}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>Nombre</th>
              <th style={th}>Descripción</th>
              <th style={th}>Dirección</th>
              <th style={th}>Estado</th>
              <th style={th}>Detalle</th>
              <th style={th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {almacenesFiltrados.map((a) => (
              <tr key={a.id} style={row}>
                <td style={td}>{a.id}</td>
                <td style={tdStrong}>{a.nombre}</td>
                <td style={td}>{a.descripcion || "-"}</td>
                <td style={td}>{a.direccion || "-"}</td>
                <td style={td}>
                  <span
                    style={{
                      ...badge,
                      backgroundColor: a.activo ? "#dcfce7" : "#fee2e2",
                      color: a.activo ? "#166534" : "#991b1b"
                    }}
                  >
                    {a.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td style={td}>
                  <Link to={`/almacenes/${a.id}`} style={detailLink}>
                    Ver detalle
                  </Link>
                </td>
                <td style={td}>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => editarAlmacen(a)}
                      style={secondaryButton}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => solicitarEliminacion(a)}
                      style={dangerButton}
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
      formContent={
        <>
          <div style={sectionTitle}>Datos principales</div>

          <input
            name="nombre"
            placeholder="Nombre del almacén"
            value={form.nombre}
            onChange={handleChange}
            required
            style={input}
          />

          <textarea
            name="descripcion"
            placeholder="Descripción"
            value={form.descripcion}
            onChange={handleChange}
            rows="3"
            style={{ ...input, resize: "vertical", minHeight: "90px" }}
          />

          <input
            name="direccion"
            placeholder="Dirección o referencia"
            value={form.direccion}
            onChange={handleChange}
            style={input}
          />

          <label style={checkboxLabel}>
            <input
              type="checkbox"
              name="activo"
              checked={form.activo}
              onChange={handleChange}
            />
            Activo
          </label>

          {!editingId && (
            <div style={pasillosSection}>
              <div style={sectionTitle}>Pasillos (opcional)</div>

              {pasillos.map((p, index) => (
                <div key={index} style={pasilloRow}>
                  <input
                    name="numero_pasillo"
                    type="number"
                    min="1"
                    placeholder="Nº pasillo"
                    value={p.numero_pasillo}
                    onChange={(e) => handlePasilloChange(index, e)}
                    style={{ ...input, width: "110px" }}
                    required
                  />

                  <label style={checkboxLabelInline}>
                    <input
                      type="checkbox"
                      name="lado_d"
                      checked={p.lado_d}
                      onChange={(e) => handlePasilloChange(index, e)}
                    />
                    Lado D
                  </label>

                  <label style={checkboxLabelInline}>
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
                    placeholder="Filas (Y)"
                    value={p.eje_y_max}
                    onChange={(e) => handlePasilloChange(index, e)}
                    style={{ ...input, width: "110px" }}
                    required
                  />

                  <input
                    name="eje_x_max"
                    type="number"
                    min="1"
                    placeholder="Columnas (X)"
                    value={p.eje_x_max}
                    onChange={(e) => handlePasilloChange(index, e)}
                    style={{ ...input, width: "120px" }}
                    required
                  />

                  <button
                    type="button"
                    onClick={() => quitarPasillo(index)}
                    style={dangerButton}
                  >
                    Quitar
                  </button>
                </div>
              ))}

              <button type="button" onClick={agregarPasillo} style={secondaryButton}>
                + Añadir pasillo
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button type="submit" disabled={guardando} style={primaryButton}>
              {guardando ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
            </button>

            {editingId && (
              <button type="button" onClick={limpiarFormulario} style={secondaryButton}>
                Cancelar
              </button>
            )}
          </div>
        </>
      }
      tableContent={
        <>
          <div style={statsGrid}>
            <Card title="Total almacenes" value={almacenes.length} />
            <Card title="Activos" value={totalActivos} />
            <Card title="Inactivos" value={totalInactivos} />
          </div>
          {tablaAlmacenes}
        </>
      }
    >
      <div style={statsGrid}>
        <Card title="Total almacenes" value={almacenes.length} />
        <Card title="Activos" value={totalActivos} />
        <Card title="Inactivos" value={totalInactivos} />
      </div>

      {tablaAlmacenes}
    </CrudPage>
  );
}

function Card({ title, value }) {
  return (
    <div style={card}>
      <h3 style={{ margin: 0, color: "#334155", fontSize: "16px" }}>{title}</h3>
      <p
        style={{
          fontSize: "32px",
          fontWeight: "700",
          margin: "10px 0 0 0",
          color: "#0f172a"
        }}
      >
        {value}
      </p>
    </div>
  );
}

const card = {
  padding: "20px",
  backgroundColor: "white",
  borderRadius: "12px",
  boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
  minWidth: "220px"
};

const statsGrid = {
  display: "flex",
  gap: "20px",
  flexWrap: "wrap",
  marginBottom: "24px"
};

const sectionTitle = {
  gridColumn: "1 / -1",
  fontWeight: "700",
  color: "#334155",
  marginBottom: "-4px"
};

const input = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  outline: "none",
  backgroundColor: "#fff"
};

const checkboxLabel = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontWeight: "500",
  color: "#334155"
};

const checkboxLabelInline = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontWeight: "500",
  color: "#334155",
  whiteSpace: "nowrap"
};

const pasillosSection = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  padding: "14px",
  border: "1px dashed #cbd5e1",
  borderRadius: "10px"
};

const pasilloRow = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap"
};

const tableWrapper = {
  backgroundColor: "white",
  borderRadius: "12px",
  boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
  overflow: "hidden"
};

const table = {
  width: "100%",
  borderCollapse: "collapse"
};

const th = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid #e2e8f0",
  backgroundColor: "#f8fafc",
  color: "#0f172a"
};

const td = {
  padding: "12px",
  borderBottom: "1px solid #eee",
  verticalAlign: "top",
  color: "#334155"
};

const tdStrong = {
  ...td,
  fontWeight: "700",
  color: "#0f172a"
};

const row = {
  backgroundColor: "white"
};

const badge = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "700"
};

const detailLink = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 12px",
  borderRadius: "8px",
  textDecoration: "none",
  backgroundColor: "#eff6ff",
  color: "#1d4ed8",
  fontWeight: "600"
};

const primaryButton = {
  padding: "10px 14px",
  border: "none",
  borderRadius: "8px",
  backgroundColor: "#2563eb",
  color: "white",
  cursor: "pointer",
  fontWeight: "600"
};

const secondaryButton = {
  padding: "10px 14px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  backgroundColor: "white",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: "600"
};

const dangerButton = {
  padding: "10px 14px",
  border: "none",
  borderRadius: "8px",
  backgroundColor: "#dc2626",
  color: "white",
  cursor: "pointer",
  fontWeight: "600"
};

export default Almacenes;