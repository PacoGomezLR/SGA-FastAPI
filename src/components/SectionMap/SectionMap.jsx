import { useCallback, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useSectionLayout } from "./useSectionLayout";
import LocationPopover from "./LocationPopover";
import {
  CELL_WIDTH,
  CELL_HEIGHT,
  calcularDimensiones,
  estadoUbicacion,
  COLOR_POR_ESTADO
} from "./mapLayout";
import * as styles from "./SectionMap.styles";

const ESCALA_DETALLE = 1.4;

function Columna({ columna, x, alturaMaxima, escala, stockPorUbicacion, onSelectUbicacion }) {
  if (!columna) return null;

  return (
    <>
      {columna.filas.map((fila) =>
        fila.ubicaciones.map((ubicacion, indice) => {
          const y = (alturaMaxima - 1 - indice) * CELL_HEIGHT;
          const stockUbicacion = stockPorUbicacion.get(ubicacion.id) || [];
          const estado = estadoUbicacion(stockUbicacion);
          const mostrarDetalle = escala >= ESCALA_DETALLE;

          return (
            <g
              key={ubicacion.id}
              onClick={mostrarDetalle ? () => onSelectUbicacion(ubicacion, stockUbicacion) : undefined}
              style={{ cursor: mostrarDetalle ? "pointer" : "default" }}
            >
              <rect
                x={x + (fila.fila - 1) * CELL_WIDTH}
                y={y}
                width={CELL_WIDTH - 4}
                height={CELL_HEIGHT - 4}
                rx={4}
                fill={COLOR_POR_ESTADO[estado]}
                stroke="#0f172a"
                strokeWidth={1}
                strokeOpacity={0.15}
              />

              {mostrarDetalle && (
                <text
                  x={x + (fila.fila - 1) * CELL_WIDTH + (CELL_WIDTH - 4) / 2}
                  y={y + (CELL_HEIGHT - 4) / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fill="#0f172a"
                  fontWeight="600"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {ubicacion.codigo}
                </text>
              )}
            </g>
          );
        })
      )}
    </>
  );
}

function SectionMap({ seccionId, height = 480 }) {
  const { layout, stockPorUbicacion, cargando, error, tieneLayout } = useSectionLayout(seccionId);
  const [escala, setEscala] = useState(1);
  const [seleccion, setSeleccion] = useState(null);
  const frameRef = useRef(null);

  const handleTransform = useCallback((_, state) => {
    if (frameRef.current) return;

    frameRef.current = requestAnimationFrame(() => {
      setEscala(state.scale);
      frameRef.current = null;
    });
  }, []);

  function seleccionarUbicacion(ubicacion, stockUbicacion) {
    setSeleccion({ ubicacion, stockUbicacion });
  }

  if (cargando) {
    return <div style={styles.mensajeCentro}>Cargando mapa de la sección...</div>;
  }

  if (error) {
    return <div style={{ ...styles.mensajeCentro, color: "#991b1b" }}>{error}</div>;
  }

  if (!tieneLayout) {
    return (
      <div style={styles.mensajeCentro}>
        Esta sección no tiene layout generado.
      </div>
    );
  }

  const { width, height: svgHeight, pasillosConPosicion, alturaMaxima } = calcularDimensiones(layout);

  return (
    <div style={{ ...styles.wrapper, height }}>
      <TransformWrapper
        initialScale={1}
        minScale={0.3}
        maxScale={6}
        centerOnInit
        onTransform={handleTransform}
      >
        <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
          <svg width={width} height={svgHeight} style={styles.svg}>
            {pasillosConPosicion.map((pasillo) => (
              <g key={pasillo.numero}>
                <text
                  x={(pasillo.xD + (pasillo.xI || pasillo.xD) + pasillo.numFilas * CELL_WIDTH) / 2}
                  y={20}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="700"
                  fill="#334155"
                >
                  Pasillo {pasillo.numero}
                </text>

                <g transform={`translate(0, 30)`}>
                  <Columna
                    columna={pasillo.columnaD}
                    x={pasillo.xD}
                    alturaMaxima={alturaMaxima}
                    escala={escala}
                    stockPorUbicacion={stockPorUbicacion}
                    onSelectUbicacion={seleccionarUbicacion}
                  />
                  <Columna
                    columna={pasillo.columnaI}
                    x={pasillo.xI}
                    alturaMaxima={alturaMaxima}
                    escala={escala}
                    stockPorUbicacion={stockPorUbicacion}
                    onSelectUbicacion={seleccionarUbicacion}
                  />
                </g>
              </g>
            ))}
          </svg>
        </TransformComponent>
      </TransformWrapper>

      <div style={styles.legend}>
        <span style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: COLOR_POR_ESTADO.vacia }} />
          Vacía
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: COLOR_POR_ESTADO.ocupada }} />
          Con stock
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: COLOR_POR_ESTADO.bajo }} />
          Stock bajo
        </span>
      </div>

      {seleccion && (
        <LocationPopover
          ubicacion={seleccion.ubicacion}
          stockUbicacion={seleccion.stockUbicacion}
          onClose={() => setSeleccion(null)}
        />
      )}
    </div>
  );
}

export default SectionMap;
