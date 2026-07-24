import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useSectionLayout } from "./useSectionLayout";
import LocationPopover from "./LocationPopover";
import { apiFetch } from "../../api/api";
import {
  CELL_WIDTH,
  CELL_HEIGHT,
  LABEL_HEIGHT,
  MARGIN,
  calcularDimensionesMultiple,
  estadoUbicacion,
  snapToGrid,
  COLOR_POR_ESTADO
} from "./mapLayout";
import * as styles from "./SectionMap.styles";

const ESCALA_DETALLE = 1.4;

function Columna({ columna, indice, numColumnas, numFilas, rotacion, espejo, escala, stockPorUbicacion, onSelectUbicacion }) {
  // rotacion: cuartos de vuelta en sentido horario (0-3). Ninguno de los 4
  // casos toca la columna/fila real de ninguna ubicación, es puramente
  // visual:
  //
  // 0° (normal): columna → franja vertical (x por índice de columna, A1
  //   izquierda); dentro, alturas apiladas hacia abajo (y por índice de
  //   fila, F1 arriba).
  // 90° horario: columna → franja horizontal invertida (y por índice de
  //   columna invertido, A1 abajo); dentro, filas en horizontal (x por
  //   índice de fila, F1 izquierda).
  // 180°: como 0° pero con ambos ejes invertidos (A1 derecha, F1 abajo).
  // 270° horario (90° antihorario): como 90° pero con ambos ejes invertidos
  //   respecto a ese caso (F1 derecha, A1 arriba).
  //
  // El espejo se aplica DESPUÉS de resolver la rotación, siempre como una
  // reflexión sobre el eje horizontal (x) ya calculado — no sobre "el índice
  // de columna" directamente, porque cuál de los dos ejes originales
  // (columna o fila) determina x cambia según la rotación. Sin esta separación
  // de pasos, el espejo terminaría invirtiendo el eje vertical en vez del
  // horizontal cuando la sección está rotada 90°/270°.
  const ejesIntercambiados = rotacion % 2 === 1;
  const anchoEnCeldas = ejesIntercambiados ? numFilas : numColumnas;

  return (
    <>
      {columna.ubicaciones.map((ubicacion, indiceFila) => {
        let x;
        let y;

        if (rotacion === 1) {
          x = indiceFila * CELL_WIDTH;
          y = (numColumnas - 1 - indice) * CELL_HEIGHT;
        } else if (rotacion === 2) {
          x = (numColumnas - 1 - indice) * CELL_WIDTH;
          y = (numFilas - 1 - indiceFila) * CELL_HEIGHT;
        } else if (rotacion === 3) {
          x = (numFilas - 1 - indiceFila) * CELL_WIDTH;
          y = indice * CELL_HEIGHT;
        } else {
          x = indice * CELL_WIDTH;
          y = indiceFila * CELL_HEIGHT;
        }

        if (espejo) {
          x = (anchoEnCeldas - 1) * CELL_WIDTH - x;
        }

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
                fontSize="9"
                fill="#0f172a"
                fontWeight="600"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {ubicacion.codigo}
              </text>
            )}
          </g>
        );
      })}
    </>
  );
}

function SectionMap({ height = 480 }) {
  const {
    layout,
    stockPorUbicacion,
    cargando,
    error,
    tieneLayout,
    recargar
  } = useSectionLayout();
  const [escala, setEscala] = useState(1);
  const [seleccion, setSeleccion] = useState(null);
  const [anchoContenedor, setAnchoContenedor] = useState(null);
  const frameRef = useRef(null);
  const transformRef = useRef(null);
  const observerRef = useRef(null);
  const posicionesAutomaticasRef = useRef(new Map());

  const [modoEdicion, setModoEdicion] = useState(false);
  const [posicionesEditadas, setPosicionesEditadas] = useState({});
  const [arrastrando, setArrastrando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const arrastreRef = useRef(null);

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

  const { width: anchoBase, height: altoBase, seccionesConPosicion } = useMemo(() => {
    const resultado = calcularDimensionesMultiple(layout, posicionesAutomaticasRef.current);

    // Congela la posición (y el ancho actual, necesario para no solapar
    // secciones nuevas que se añadan después) de cada sección en modo
    // automático la primera vez que se calcula, para que voltear/rotar otra
    // sección no la desplace nunca — ver el comentario de la función.
    resultado.seccionesConPosicion.forEach((grupo) => {
      if (!grupo.esLibre) {
        posicionesAutomaticasRef.current.set(grupo.seccion.id, {
          x: grupo.xInicio,
          y: grupo.yInicio,
          ancho: grupo.ancho
        });
      } else {
        posicionesAutomaticasRef.current.delete(grupo.seccion.id);
      }
    });

    return resultado;
  }, [layout]
  );

  // Mientras se arrastra una sección en modo edición, el lienzo debe crecer
  // en tiempo real si esa sección se acerca o sobrepasa el borde derecho o
  // inferior; si no, se corta visualmente al arrastrarla fuera del tamaño
  // calculado antes de empezar a mover nada. Cada sección se mueve de forma
  // independiente, así que mover una nunca desplaza ni afecta a las demás.
  const { width, height: svgHeight } = useMemo(() => {
    let anchoMax = anchoBase;
    let altoMax = altoBase;

    seccionesConPosicion.forEach((grupo) => {
      const editada = posicionesEditadas[grupo.seccion.id];
      if (!editada) return;

      anchoMax = Math.max(anchoMax, editada.x + grupo.ancho + MARGIN);
      altoMax = Math.max(altoMax, editada.y + grupo.alto + MARGIN);
    });

    return { width: anchoMax, height: altoMax };
  }, [anchoBase, altoBase, seccionesConPosicion, posicionesEditadas]);

  // El origen (0,0) del lienzo es fijo: una sección arrastrada a coordenadas
  // negativas (hacia arriba o la izquierda) quedaría recortada por el
  // overflow del contenedor. En modo edición se reserva un colchón fijo y
  // constante alrededor de todo el lienzo (mismo colchón siempre, no depende
  // de qué sección se mueve ni cuánto), así ninguna sección se recorta al
  // moverse en libertad y, al ser un desplazamiento igual para todas, no
  // afecta la posición relativa de ninguna otra. Se probó también un
  // auto-zoom-out al acercarse a un borde, pero se descartó: el margen de
  // activación se medía contra toda la pantalla, así que bastaba con pasar
  // cerca de cualquier borde para que el mapa se achicara de forma
  // permanente y sin que el usuario lo pidiera ("se mueven solos").
  const COLCHON_EDICION = 3000;

  const escalaAjuste = useMemo(() => {
    if (anchoContenedor) {
      return Math.min(1, (anchoContenedor - 20) / anchoBase, (height - 20) / altoBase);
    }
    return Math.min(1, (height - 20) / altoBase);
  }, [anchoContenedor, anchoBase, altoBase, height]);

  // En modo edición interesa ver las secciones lo más grandes posible para
  // poder arrastrarlas con precisión: solo se ajusta por ancho (del layout
  // base, no del lienzo que crece dinámicamente durante el arrastre),
  // permitiendo scroll/pan vertical si el contenido es más alto.
  const escalaEdicion = useMemo(() => {
    if (anchoContenedor) {
      return Math.min(1.5, (anchoContenedor - 20) / anchoBase);
    }
    return 1;
  }, [anchoContenedor, anchoBase]);

  useEffect(() => {
    if (!transformRef.current) return;

    transformRef.current.centerView(modoEdicion ? escalaEdicion : escalaAjuste, 0);
    // Se recentra al cambiar de escala base o al entrar/salir de modo
    // edición; mientras se arrastra dentro del modo edición, ninguna de
    // estas dependencias cambia, así que no se reajusta en cada frame.
  }, [escalaAjuste, escalaEdicion, modoEdicion]);

  const handleTransform = useCallback((_, state) => {
    if (frameRef.current) return;

    frameRef.current = requestAnimationFrame(() => {
      setEscala(state.scale);
      frameRef.current = null;
    });
  }, []);

  function seleccionarUbicacion(ubicacion, stockUbicacion) {
    if (modoEdicion) return;
    setSeleccion({ ubicacion, stockUbicacion });
  }

  function posicionActualDe(seccionId, xInicio, yInicio) {
    const editada = posicionesEditadas[seccionId];
    if (editada) return editada;
    return { x: xInicio, y: yInicio };
  }

  function iniciarArrastre(e, grupo) {
    if (!modoEdicion) return;
    e.stopPropagation();

    const pos = posicionActualDe(grupo.seccion.id, grupo.xInicio, grupo.yInicio);

    arrastreRef.current = {
      seccionId: grupo.seccion.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: pos.x,
      startY: pos.y,
      escala
    };
    setArrastrando(grupo.seccion.id);
  }

  useEffect(() => {
    if (!modoEdicion) return;

    function onMouseMove(e) {
      const info = arrastreRef.current;
      if (!info) return;

      const deltaX = (e.clientX - info.startClientX) / info.escala;
      const deltaY = (e.clientY - info.startClientY) / info.escala;

      setPosicionesEditadas((prev) => ({
        ...prev,
        [info.seccionId]: {
          x: snapToGrid(info.startX + deltaX),
          y: snapToGrid(info.startY + deltaY)
        }
      }));
    }

    function onMouseUp() {
      arrastreRef.current = null;
      setArrastrando(null);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [modoEdicion]);

  function activarModoEdicion() {
    setPosicionesEditadas({});
    setModoEdicion(true);
  }

  async function voltearSeccion(seccion) {
    await apiFetch(`/sections/${seccion.id}/mirror`, {
      method: "PATCH",
      body: { espejo: !seccion.espejo }
    });
    await recargar({ silencioso: true });
  }

  async function rotarSeccion(seccion, direccion) {
    await apiFetch(`/sections/${seccion.id}/rotation`, {
      method: "PATCH",
      body: { direccion }
    });
    await recargar({ silencioso: true });
  }

  function cancelarModoEdicion() {
    setPosicionesEditadas({});
    setModoEdicion(false);
  }

  async function guardarDisposicion() {
    const entradas = Object.entries(posicionesEditadas);

    if (entradas.length === 0) {
      setModoEdicion(false);
      return;
    }

    try {
      setGuardando(true);

      // Al guardar se normaliza a no-negativo: el colchón de edición (ver
      // COLCHON_EDICION) solo existe mientras se está arrastrando, así que
      // la posición persistida no debe depender de él. Durante el arrastre
      // en sí no se limita, para permitir libertad total de movimiento.
      await Promise.all(
        entradas.map(([seccionId, pos]) =>
          apiFetch(`/sections/${seccionId}/position`, {
            method: "PATCH",
            body: { pos_x: Math.max(0, pos.x), pos_y: Math.max(0, pos.y) }
          })
        )
      );

      setPosicionesEditadas({});
      setModoEdicion(false);
      await recargar({ silencioso: true });
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return <div style={styles.mensajeCentro}>Cargando mapa de secciones...</div>;
  }

  if (error) {
    return <div style={{ ...styles.mensajeCentro, color: "#991b1b" }}>{error}</div>;
  }

  return (
    <div>
      {!modoEdicion && (
        <div style={styles.toolbar}>
          <button type="button" style={styles.secondaryButton} onClick={activarModoEdicion}>
            Editar disposición
          </button>
        </div>
      )}

      {modoEdicion && (
        <div style={styles.toolbarFullscreen}>
          <button
            type="button"
            style={styles.primaryButton}
            onClick={guardarDisposicion}
            disabled={guardando}
          >
            {guardando ? "Guardando..." : "Guardar disposición"}
          </button>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={cancelarModoEdicion}
            disabled={guardando}
          >
            Cancelar
          </button>
          <span style={styles.editHint}>Arrastra cada sección a su sitio</span>
        </div>
      )}

      {!tieneLayout ? (
        <div style={styles.mensajeCentro}>
          Todavía no hay secciones con layout generado.
        </div>
      ) : (
        <div
          style={
            modoEdicion
              ? { ...styles.wrapperFullscreen, paddingTop: "64px" }
              : { ...styles.wrapper, height }
          }
          ref={wrapperCallbackRef}
        >

          <TransformWrapper
            ref={transformRef}
            initialScale={modoEdicion ? escalaEdicion : escalaAjuste}
            minScale={(modoEdicion ? escalaEdicion : escalaAjuste) * 0.15}
            maxScale={6}
            centerOnInit
            onTransform={handleTransform}
            wheel={{ step: 0.0004 }}
            panning={{ excluded: ["seccion-arrastrable"] }}
            zoomAnimation={{ animationTime: 150, animationType: "easeOutCubic" }}
            doubleClick={{ disabled: modoEdicion, step: 0.7, animationTime: 250, animationType: "easeOutCubic" }}
          >
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
              <svg
                width={modoEdicion ? width + COLCHON_EDICION * 2 : width}
                height={modoEdicion ? svgHeight + COLCHON_EDICION * 2 : svgHeight}
                style={styles.svg}
              >
                <g transform={modoEdicion ? `translate(${COLCHON_EDICION}, ${COLCHON_EDICION})` : undefined}>
                  {seccionesConPosicion.map((grupo) => {
                    const pos = posicionActualDe(grupo.seccion.id, grupo.xInicio, grupo.yInicio);
                    const seEstaArrastrando = arrastrando === grupo.seccion.id;

                    return (
                      <g
                        key={grupo.seccion.id}
                        className={modoEdicion ? "seccion-arrastrable" : undefined}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onMouseDown={(e) => iniciarArrastre(e, grupo)}
                        style={{ cursor: modoEdicion ? (seEstaArrastrando ? "grabbing" : "grab") : "default" }}
                      >
                        {modoEdicion && (
                          <rect
                            x={-8}
                            y={-8}
                            width={grupo.ancho + 16}
                            height={grupo.alto + 16}
                            rx={8}
                            fill={seEstaArrastrando ? "#e0f2fe" : "transparent"}
                            stroke="#3b82f6"
                            strokeWidth={seEstaArrastrando ? 2 : 1}
                            strokeDasharray="6 4"
                          />
                        )}

                        <text
                          x={grupo.ancho / 2}
                          y={20}
                          textAnchor="middle"
                          fontSize="19"
                          fontWeight="700"
                          fill="#0f172a"
                          style={{ userSelect: "none" }}
                        >
                          {grupo.seccion.nombre}
                        </text>

                        {modoEdicion && (
                          <g
                            transform={`translate(16, -24)`}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={() => rotarSeccion(grupo.seccion, -1)}
                            style={{ cursor: "pointer" }}
                          >
                            <circle r={14} fill="white" stroke="#3b82f6" strokeWidth={1.5} />
                            <text
                              textAnchor="middle"
                              dominantBaseline="middle"
                              y={1}
                              fontSize="14"
                              style={{ userSelect: "none", pointerEvents: "none" }}
                            >
                              ⟲
                            </text>
                          </g>
                        )}

                        {modoEdicion && (
                          <g
                            transform={`translate(${grupo.ancho / 2}, -24)`}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={() => voltearSeccion(grupo.seccion)}
                            style={{ cursor: "pointer" }}
                          >
                            <circle r={14} fill="white" stroke="#3b82f6" strokeWidth={1.5} />
                            <text
                              textAnchor="middle"
                              dominantBaseline="middle"
                              y={1}
                              fontSize="14"
                              style={{ userSelect: "none", pointerEvents: "none" }}
                            >
                              ⇋
                            </text>
                          </g>
                        )}

                        {modoEdicion && (
                          <g
                            transform={`translate(${grupo.ancho - 16}, -24)`}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={() => rotarSeccion(grupo.seccion, 1)}
                            style={{ cursor: "pointer" }}
                          >
                            <circle r={14} fill="white" stroke="#3b82f6" strokeWidth={1.5} />
                            <text
                              textAnchor="middle"
                              dominantBaseline="middle"
                              y={1}
                              fontSize="14"
                              style={{ userSelect: "none", pointerEvents: "none" }}
                            >
                              ⟳
                            </text>
                          </g>
                        )}

                        <g transform={`translate(0, ${LABEL_HEIGHT})`}>
                          {grupo.columnas.map((columna, indice) => {
                            const numColumnas = grupo.columnas.length;
                            const numFilas = grupo.columnas.reduce(
                              (max, col) => Math.max(max, col.ubicaciones.length),
                              1
                            );

                            return (
                              <Columna
                                key={columna.columna}
                                columna={columna}
                                indice={indice}
                                numColumnas={numColumnas}
                                numFilas={numFilas}
                                rotacion={grupo.seccion.rotacion ?? 0}
                                espejo={grupo.seccion.espejo}
                                escala={escala}
                                stockPorUbicacion={stockPorUbicacion}
                                onSelectUbicacion={seleccionarUbicacion}
                              />
                            );
                          })}
                        </g>
                      </g>
                    );
                  })}
                </g>
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
      )}
    </div>
  );
}

export default SectionMap;
