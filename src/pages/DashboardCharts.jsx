import { useEffect, useMemo, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { apiFetch } from "../api/api";
import * as styles from "./DashboardCharts.styles";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  ChartDataLabels
);

const COLOR_OCUPACION = "#2a78d6";
const COLOR_ENTRADAS = "#1baf7a";
const COLOR_SALIDAS = "#e34948";
const COLOR_MUTED_TEXT = "#898781";
const COLOR_GRID = "#e1e0d9";

// Paleta categórica validada para "todos contra todos" (donut: cualquier par
// de porciones puede quedar adyacente): azul, naranja, aguamarina, violeta.
// Pasa los 6 chequeos de daltonismo/contraste del sistema de diseño; el 4º
// slot de la paleta general (amarillo) se descartó aquí porque, junto al
// naranja del slot 2, cae por debajo del umbral de distinción en visión
// normal cuando ambos pueden aparecer lado a lado (ver validate_palette.js).
const PALETA_CATEGORICA = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#4a3aa7"
];

const MOTIVOS_LABEL = {
  rotura: "Rotura",
  consumo: "Consumo interno",
  muestra: "Muestra comercial",
  otro: "Otro"
};

const ORDEN_MOTIVOS = ["rotura", "consumo", "muestra", "otro"];

const OPCIONES_PERIODO = [
  { valor: 7, etiqueta: "7 días" },
  { valor: 14, etiqueta: "14 días" },
  { valor: 30, etiqueta: "30 días" },
  { valor: 90, etiqueta: "90 días" }
];

// El motivo de una salida no es un campo estructurado: se guarda al crear
// la salida como "MOTIVO | observaciones libres" dentro de `observaciones`
// (ver Salidas.jsx). Se extrae parseando el texto antes del primer " | ".
function extraerMotivo(observaciones) {
  if (!observaciones) return "otro";

  const clave = observaciones.split(" | ")[0].trim().toLowerCase();
  return ORDEN_MOTIVOS.includes(clave) ? clave : "otro";
}

function claveFechaLocal(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function formatearFechaCorta(claveFecha) {
  const [anio, mes, dia] = claveFecha.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  return fecha.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
}

function agruparPorDia(documentos, dias = 14) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const claves = [];
  const totales = new Map();

  for (let i = dias - 1; i >= 0; i--) {
    const dia = new Date(hoy);
    dia.setDate(dia.getDate() - i);
    const clave = claveFechaLocal(dia);
    claves.push(clave);
    totales.set(clave, 0);
  }

  documentos
    .filter((doc) => doc.estado === "confirmada")
    .forEach((doc) => {
      const clave = claveFechaLocal(new Date(doc.fecha));
      if (!totales.has(clave)) return;

      const cantidadDocumento = (doc.lineas || []).reduce(
        (acc, linea) => acc + Number(linea.cantidad || 0),
        0
      );

      totales.set(clave, totales.get(clave) + cantidadDocumento);
    });

  return claves.map((clave) => ({
    fecha: clave,
    etiqueta: formatearFechaCorta(clave),
    total: totales.get(clave)
  }));
}

// Cuenta las unidades salidas (no documentos) por motivo, dentro de los
// últimos `dias` días, solo salidas confirmadas.
function agruparPorMotivo(salidas, dias = 14) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const desde = new Date(hoy);
  desde.setDate(desde.getDate() - (dias - 1));

  const totales = new Map(ORDEN_MOTIVOS.map((motivo) => [motivo, 0]));

  salidas
    .filter((doc) => doc.estado === "confirmada")
    .forEach((doc) => {
      const fechaDoc = new Date(doc.fecha);
      fechaDoc.setHours(0, 0, 0, 0);
      if (fechaDoc < desde || fechaDoc > hoy) return;

      const motivo = extraerMotivo(doc.observaciones);
      const cantidadDocumento = (doc.lineas || []).reduce(
        (acc, linea) => acc + Number(linea.cantidad || 0),
        0
      );

      totales.set(motivo, totales.get(motivo) + cantidadDocumento);
    });

  return ORDEN_MOTIVOS.map((motivo, index) => ({
    motivo,
    etiqueta: MOTIVOS_LABEL[motivo],
    total: totales.get(motivo),
    color: PALETA_CATEGORICA[index]
  }));
}

function DashboardCharts() {
  const [ocupacion, setOcupacion] = useState([]);
  const [recepciones, setRecepciones] = useState([]);
  const [salidas, setSalidas] = useState([]);
  const [periodo, setPeriodo] = useState(14);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setCargando(true);
      setError("");

      const [occupancyData, recepcionesData, salidasData] = await Promise.all([
        apiFetch("/sections/occupancy"),
        apiFetch("/receptions/"),
        apiFetch("/shipments/")
      ]);

      setOcupacion(Array.isArray(occupancyData) ? occupancyData : []);
      setRecepciones(Array.isArray(recepcionesData) ? recepcionesData : []);
      setSalidas(Array.isArray(salidasData) ? salidasData : []);
    } catch (err) {
      setError(err.message || "Error al cargar los gráficos");
    } finally {
      setCargando(false);
    }
  }

  const entradasPorDia = useMemo(
    () => agruparPorDia(recepciones, periodo),
    [recepciones, periodo]
  );

  const salidasPorDia = useMemo(
    () => agruparPorDia(salidas, periodo),
    [salidas, periodo]
  );

  const salidasPorMotivo = useMemo(
    () => agruparPorMotivo(salidas, periodo),
    [salidas, periodo]
  );

  const dataOcupacion = useMemo(
    () => ({
      labels: ocupacion.map((a) => a.seccion_nombre),
      datasets: [
        {
          label: "Ocupación (%)",
          data: ocupacion.map((a) => a.porcentaje_ocupacion),
          backgroundColor: COLOR_OCUPACION,
          borderRadius: 4,
          maxBarThickness: 40,
          minBarLength: 3
        }
      ]
    }),
    [ocupacion]
  );

  const optionsOcupacion = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      layout: {
        padding: { right: 36 }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.parsed.x}% ocupado`
          }
        },
        datalabels: {
          anchor: "end",
          align: "end",
          color: "#0f172a",
          font: { weight: "700" },
          formatter: (value) => `${value}%`
        }
      },
      scales: {
        x: {
          min: 0,
          max: 100,
          grid: { color: COLOR_GRID },
          ticks: { color: COLOR_MUTED_TEXT, callback: (v) => `${v}%` }
        },
        y: {
          grid: { display: false },
          ticks: { color: COLOR_MUTED_TEXT }
        }
      }
    }),
    []
  );

  function construirLineData(serie, label, color) {
    return {
      labels: serie.map((d) => d.etiqueta),
      datasets: [
        {
          label,
          data: serie.map((d) => d.total),
          borderColor: color,
          backgroundColor: `${color}33`,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: color
        }
      ]
    };
  }

  const optionsLinea = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { mode: "index", intersect: false },
        datalabels: { display: false }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: COLOR_MUTED_TEXT }
        },
        y: {
          beginAtZero: true,
          grid: { color: COLOR_GRID },
          ticks: { color: COLOR_MUTED_TEXT, precision: 0 }
        }
      }
    }),
    []
  );

  const dataSalidasPorMotivo = useMemo(
    () => ({
      labels: salidasPorMotivo.map((m) => m.etiqueta),
      datasets: [
        {
          data: salidasPorMotivo.map((m) => m.total),
          backgroundColor: salidasPorMotivo.map((m) => m.color),
          borderColor: "#fff",
          borderWidth: 2
        }
      ]
    }),
    [salidasPorMotivo]
  );

  const totalSalidasPorMotivo = useMemo(
    () => salidasPorMotivo.reduce((acc, m) => acc + m.total, 0),
    [salidasPorMotivo]
  );

  const optionsDonut = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#0f172a", boxWidth: 12, padding: 12 }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = totalSalidasPorMotivo || 1;
              const pct = ((ctx.parsed / total) * 100).toFixed(1);
              return `${ctx.label}: ${ctx.parsed} (${pct}%)`;
            }
          }
        },
        datalabels: {
          color: "#fff",
          font: { weight: "700", size: 11 },
          formatter: (value, ctx) => {
            if (!value) return "";
            const total = totalSalidasPorMotivo || 1;
            const pct = (value / total) * 100;
            // Etiqueta solo en porciones lo bastante grandes para que el
            // texto quepa; el resto se lee en la leyenda/tooltip.
            return pct >= 8 ? `${Math.round(pct)}%` : "";
          }
        }
      }
    }),
    [totalSalidasPorMotivo]
  );

  if (cargando) {
    return (
      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>Cargando gráficos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.periodoSelector}>
        <span style={styles.periodoLabel}>Periodo:</span>
        {OPCIONES_PERIODO.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            onClick={() => setPeriodo(opcion.valor)}
            style={
              periodo === opcion.valor
                ? styles.periodoBotonActivo
                : styles.periodoBoton
            }
          >
            {opcion.etiqueta}
          </button>
        ))}
      </div>

      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Ocupación por sección</h3>
          {ocupacion.length === 0 ? (
            <p style={styles.emptyChartMessage}>No hay secciones con ubicaciones.</p>
          ) : (
            <div style={styles.chartWrapper}>
              <Bar data={dataOcupacion} options={optionsOcupacion} />
            </div>
          )}
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Entradas de producto (últimos {periodo} días)</h3>
          <div style={styles.chartWrapper}>
            <Line
              data={construirLineData(entradasPorDia, "Entradas", COLOR_ENTRADAS)}
              options={optionsLinea}
            />
          </div>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Salidas de producto (últimos {periodo} días)</h3>
          <div style={styles.chartWrapper}>
            <Line
              data={construirLineData(salidasPorDia, "Salidas", COLOR_SALIDAS)}
              options={optionsLinea}
            />
          </div>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Salidas por motivo (últimos {periodo} días)</h3>
          {totalSalidasPorMotivo === 0 ? (
            <p style={styles.emptyChartMessage}>No hay salidas confirmadas en este periodo.</p>
          ) : (
            <div style={styles.chartWrapper}>
              <Doughnut data={dataSalidasPorMotivo} options={optionsDonut} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardCharts;
