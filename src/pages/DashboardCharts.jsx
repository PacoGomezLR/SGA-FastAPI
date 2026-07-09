import { useEffect, useMemo, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
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

function DashboardCharts() {
  const [ocupacion, setOcupacion] = useState([]);
  const [entradasPorDia, setEntradasPorDia] = useState([]);
  const [salidasPorDia, setSalidasPorDia] = useState([]);
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
        apiFetch("/warehouses/occupancy"),
        apiFetch("/receptions/"),
        apiFetch("/shipments/")
      ]);

      setOcupacion(Array.isArray(occupancyData) ? occupancyData : []);
      setEntradasPorDia(
        agruparPorDia(Array.isArray(recepcionesData) ? recepcionesData : [])
      );
      setSalidasPorDia(
        agruparPorDia(Array.isArray(salidasData) ? salidasData : [])
      );
    } catch (err) {
      setError(err.message || "Error al cargar los gráficos");
    } finally {
      setCargando(false);
    }
  }

  const dataOcupacion = useMemo(
    () => ({
      labels: ocupacion.map((a) => a.almacen_nombre),
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
    <div style={styles.chartsGrid}>
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Ocupación por almacén</h3>
        {ocupacion.length === 0 ? (
          <p style={styles.emptyChartMessage}>No hay almacenes con ubicaciones.</p>
        ) : (
          <div style={styles.chartWrapper}>
            <Bar data={dataOcupacion} options={optionsOcupacion} />
          </div>
        )}
      </div>

      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Entradas de producto (últimos 14 días)</h3>
        <div style={styles.chartWrapper}>
          <Line
            data={construirLineData(entradasPorDia, "Entradas", COLOR_ENTRADAS)}
            options={optionsLinea}
          />
        </div>
      </div>

      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Salidas de producto (últimos 14 días)</h3>
        <div style={styles.chartWrapper}>
          <Line
            data={construirLineData(salidasPorDia, "Salidas", COLOR_SALIDAS)}
            options={optionsLinea}
          />
        </div>
      </div>
    </div>
  );
}

export default DashboardCharts;
