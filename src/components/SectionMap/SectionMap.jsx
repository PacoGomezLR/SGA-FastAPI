import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useSectionLayout } from "./useSectionLayout";
import LocationPopover from "./LocationPopover";
import {
  CELL_WIDTH,
  CELL_HEIGHT,
  LABEL_HEIGHT,
  calcularDimensionesMultiple,
  estadoUbicacion,
  COLOR_POR_ESTADO
} from "./mapLayout";
import * as styles from "./SectionMap.styles";

const ESCALA_DETALLE = 1.4;

function Columna({ columna, xOffset, maxNiveles, escala, stockPorUbicacion, onSelectUbicacion }) {
  if (!columna) return null;

  return (
    <>
      {columna.niveles.map((nivel) =>
        nivel.ubicaciones.map((ubicacion, indice) => {
          const x = xOffset + indice * CELL_WIDTH;
          const y = (maxNiveles - nivel.altura) * CELL_HEIGHT;
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
                x={x}
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
                  x={x + (CELL_WIDTH - 4) / 2}
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

function SectionMap({ height = 480 }) {
  const { layout, stockPorUbicacion, cargando, error, tieneLayout } = useSectionLayout();
  const [escala, setEscala] = useState(1);
  const [seleccion, setSeleccion] = useState(null);
  const [anchoContenedor, setAnchoContenedor] = useState(null);
  const frameRef = useRef(null);
  const transformRef = useRef(null);
  const observerRef = useRef(null);

  const wrapperCallbackRef = useCallback((node) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!node) return;

    setAnchoContenedor(node.clientWidth);

    observerRef.current = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setAnchoContenedor(entry.contentRect.width);
    });

    observerRef.current.observe(node);
  }, []);

  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  const { width, height: svgHeight, seccionesConPosicion } = useMemo(
    () => calcularDimensionesMultiple(layout),
    [layout]
  );

  const escalaAjuste = useMemo(() => {
    if (anchoContenedor) {
      return Math.min(1, (anchoContenedor - 20) / width, (height - 20) / svgHeight);
    }
    return Math.min(1, (height - 20) / svgHeight);
  }, [anchoContenedor, width, svgHeight, height]);

  useEffect(() => {
    if (!transformRef.current) return;

    transformRef.current.centerView(escalaAjuste, 0);
  }, [escalaAjuste]);

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
    return <div style={styles.mensajeCentro}>Cargando mapa de secciones...</div>;
  }

  if (error) {
    return <div style={{ ...styles.mensajeCentro, color: "#991b1b" }}>{error}</div>;
  }

  if (!tieneLayout) {
    return (
      <div style={styles.mensajeCentro}>
        Todavía no hay secciones con layout generado.
      </div>
    );
  }

  return (
    <div style={{ ...styles.wrapper, height }} ref={wrapperCallbackRef}>
      <TransformWrapper
        ref={transformRef}
        initialScale={escalaAjuste}
        minScale={escalaAjuste * 0.5}
        maxScale={6}
        centerOnInit
        onTransform={handleTransform}
      >
        <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
          <svg width={width} height={svgHeight} style={styles.svg}>
            {seccionesConPosicion.map((grupo) => (
              <g key={grupo.seccion.id}>
                <text
                  x={grupo.xInicio + grupo.ancho / 2}
                  y={16}
                  textAnchor="middle"
                  fontSize="15"
                  fontWeight="700"
                  fill="#0f172a"
                >
                  {grupo.seccion.nombre}
                </text>

                <g transform={`translate(0, ${LABEL_HEIGHT})`}>
                  {grupo.pasillos.map((pasillo) => (
                    <g key={pasillo.numero} transform={`translate(${pasillo.x}, 0)`}>
                      <text
                        x={(pasillo.xOffsetD + pasillo.xOffsetI + CELL_WIDTH) / 2}
                        y={12}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="600"
                        fill="#64748b"
                      >
                        Pasillo {pasillo.numero}
                      </text>

                      <g transform={`translate(0, ${LABEL_HEIGHT})`}>
                        <Columna
                          columna={pasillo.columnaD}
                          xOffset={pasillo.xOffsetD}
                          maxNiveles={pasillo.maxNiveles}
                          escala={escala}
                          stockPorUbicacion={stockPorUbicacion}
                          onSelectUbicacion={seleccionarUbicacion}
                        />
                        <Columna
                          columna={pasillo.columnaI}
                          xOffset={pasillo.xOffsetI}
                          maxNiveles={pasillo.maxNiveles}
                          escala={escala}
                          stockPorUbicacion={stockPorUbicacion}
                          onSelectUbicacion={seleccionarUbicacion}
                        />
                      </g>
                    </g>
                  ))}
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
