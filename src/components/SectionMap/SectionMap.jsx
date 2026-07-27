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

const ESCALA_CLIC = 0.5;
const ESCALA_ETIQUETA = 0.9;
const PADDING_CARCASA = 10;

function Columna({
  columna,
  indice,
  numColumnas,
  numFilas,
  rotacion,
  espejo,
  escala,
  stockPorUbicacion,
  ubicacionesCoincidentes,
  hayBusquedaActiva,
  onSelectUbicacion,
  onHoverUbicacion,
  onMoveHoverUbicacion,
  onLeaveHoverUbicacion
}) {
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
        const clicHabilitado = escala >= ESCALA_CLIC;
        const mostrarEtiqueta = escala >= ESCALA_ETIQUETA;
        const esCoincidencia = ubicacionesCoincidentes?.has(ubicacion.id);
        const atenuada = hayBusquedaActiva && !esCoincidencia;
        const anchoCelda = CELL_WIDTH - 4;
        const altoCelda = CELL_HEIGHT - 4;

        return (
          <g
            key={ubicacion.id}
            onClick={clicHabilitado ? () => onSelectUbicacion(ubicacion, stockUbicacion) : undefined}
            onMouseEnter={(e) => onHoverUbicacion?.(ubicacion, stockUbicacion, e)}
            onMouseMove={(e) => onMoveHoverUbicacion?.(e)}
            onMouseLeave={() => onLeaveHoverUbicacion?.()}
            style={{
              cursor: clicHabilitado ? "pointer" : "default",
              opacity: atenuada ? 0.3 : 1,
              transition: "opacity 0.15s ease"
            }}
          >
            <rect
              x={x}
              y={y}
              width={anchoCelda}
              height={altoCelda}
              rx={4}
              fill={`url(#grad-${estado})`}
              stroke="#0f172a"
              strokeWidth={1}
              strokeOpacity={0.15}
            />

            {/* Bisel: borde inferior y derecho más oscuros para dar
                sensación de hueco físico en la estantería. */}
            <path
              d={`M ${x + 4} ${y + altoCelda} L ${x + anchoCelda} ${y + altoCelda} L ${x + anchoCelda} ${y + 4}`}
              fill="none"
              stroke="#0f172a"
              strokeWidth={2}
              strokeOpacity={0.18}
              strokeLinecap="round"
              style={{ pointerEvents: "none" }}
            />

            {esCoincidencia && (
              <rect
                x={x - 2}
                y={y - 2}
                width={anchoCelda + 4}
                height={altoCelda + 4}
                rx={6}
                fill="none"
                stroke="#2563eb"
                strokeWidth={2.5}
                style={{ pointerEvents: "none" }}
              />
            )}

            {mostrarEtiqueta && (
              <text
                x={x + anchoCelda / 2}
                y={y + altoCelda / 2}
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

function SectionMap({ height = 480, interactivo = true }) {
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
  const [ubicacionHover, setUbicacionHover] = useState(null);
  const [posicionHoverUbicacion, setPosicionHoverUbicacion] = useState({ x: 0, y: 0 });
  const [busqueda, setBusqueda] = useState("");
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
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

  // Ubicaciones cuyo stock incluye un producto que coincide con la
  // búsqueda, para resaltarlas en el mapa. Vacío si no hay texto de
  // búsqueda, para no calcular ni pintar nada de más en el caso común.
  const ubicacionesCoincidentes = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return new Set();

    const coincidencias = new Set();
    stockPorUbicacion.forEach((lineas, ubicacionId) => {
      const hayCoincidencia = lineas.some((linea) =>
        (linea.producto_nombre || "").toLowerCase().includes(texto)
      );
      if (hayCoincidencia) coincidencias.add(ubicacionId);
    });
    return coincidencias;
  }, [busqueda, stockPorUbicacion]);

  // Nombres de producto únicos que coinciden con el texto escrito, para la
  // lista de sugerencias del buscador. Limitado a 8 para no desbordar el
  // desplegable con catálogos grandes.
  const sugerenciasProducto = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return [];

    const nombres = new Set();
    stockPorUbicacion.forEach((lineas) => {
      lineas.forEach((linea) => {
        if ((linea.producto_nombre || "").toLowerCase().includes(texto)) {
          nombres.add(linea.producto_nombre);
        }
      });
    });
    return Array.from(nombres).sort().slice(0, 8);
  }, [busqueda, stockPorUbicacion]);

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

  function iniciarArrastre(clientX, clientY, grupo) {
    // Si ya hay un arrastre en curso (p. ej. un evento de mousedown/
    // touchstart fantasma disparado por el navegador sobre otra sección
    // mientras el gesto original sigue activo), ignorar el nuevo inicio.
    // Sin esto, la referencia se sobrescribe con el segundo seccionId sin
    // terminar limpiamente el primero, y ambas posiciones a medio mover
    // quedan guardadas en posicionesEditadas y se envían juntas al guardar.
    if (arrastreRef.current) return;

    const pos = posicionActualDe(grupo.seccion.id, grupo.xInicio, grupo.yInicio);

    arrastreRef.current = {
      seccionId: grupo.seccion.id,
      startClientX: clientX,
      startClientY: clientY,
      startX: pos.x,
      startY: pos.y,
      escala
    };
    setArrastrando(grupo.seccion.id);
  }

  function iniciarArrastreMouse(e, grupo) {
    if (!modoEdicion) return;
    e.stopPropagation();
    iniciarArrastre(e.clientX, e.clientY, grupo);
  }

  function iniciarArrastreTactil(e, grupo) {
    if (!modoEdicion) return;
    e.stopPropagation();
    const touch = e.touches[0];
    iniciarArrastre(touch.clientX, touch.clientY, grupo);
  }

  useEffect(() => {
    if (!modoEdicion) return;

    function moverA(clientX, clientY) {
      const info = arrastreRef.current;
      if (!info) return;

      const deltaX = (clientX - info.startClientX) / info.escala;
      const deltaY = (clientY - info.startClientY) / info.escala;

      // Tope en el borde izquierdo/superior real del lienzo (x=0, y=0): el
      // SVG no tiene viewBox, así que una posición negativa se recortaría o
      // (peor) se guardaría como negativa y luego se forzaría a 0 al
      // guardar, haciendo que la sección "salte" de vuelta al borde sin que
      // el usuario lo viera venir durante el arrastre. Aplicar el mismo
      // clamp aquí, en tiempo real, para que el límite se sienta al
      // arrastrar en vez de sorprender al guardar.
      setPosicionesEditadas((prev) => ({
        ...prev,
        [info.seccionId]: {
          x: Math.max(0, snapToGrid(info.startX + deltaX)),
          y: Math.max(0, snapToGrid(info.startY + deltaY))
        }
      }));
    }

    function onMouseMove(e) {
      moverA(e.clientX, e.clientY);
    }

    function onTouchMove(e) {
      if (!arrastreRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      moverA(touch.clientX, touch.clientY);
    }

    function finalizarArrastre() {
      arrastreRef.current = null;
      setArrastrando(null);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", finalizarArrastre);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", finalizarArrastre);
    window.addEventListener("touchcancel", finalizarArrastre);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", finalizarArrastre);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", finalizarArrastre);
      window.removeEventListener("touchcancel", finalizarArrastre);
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
      {!modoEdicion && interactivo && (
        <div style={styles.toolbar}>
          <button type="button" style={styles.secondaryButton} onClick={activarModoEdicion}>
            Editar disposición
          </button>
          <div style={styles.buscadorWrapper}>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onFocus={() => setMostrarSugerencias(true)}
              onBlur={() => setTimeout(() => setMostrarSugerencias(false), 150)}
              placeholder="Buscar producto en el mapa..."
              style={styles.buscadorInput}
            />

            {mostrarSugerencias && sugerenciasProducto.length > 0 && (
              <div style={styles.sugerenciasLista}>
                {sugerenciasProducto.map((nombre) => (
                  <div
                    key={nombre}
                    style={styles.sugerenciaItem}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; }}
                    onClick={() => {
                      setBusqueda(nombre);
                      setMostrarSugerencias(false);
                    }}
                  >
                    {nombre}
                  </div>
                ))}
              </div>
            )}
          </div>
          {busqueda.trim() && (
            <span style={styles.buscadorContador}>
              {ubicacionesCoincidentes.size === 0
                ? "Sin resultados"
                : `${ubicacionesCoincidentes.size} ubicación${ubicacionesCoincidentes.size === 1 ? "" : "es"}`}
            </span>
          )}
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
              : { ...styles.wrapper, height, touchAction: interactivo ? "none" : "pan-y" }
          }
          ref={wrapperCallbackRef}
        >

          <TransformWrapper
            ref={transformRef}
            initialScale={modoEdicion ? escalaEdicion : escalaAjuste}
            minScale={(modoEdicion ? escalaEdicion : escalaAjuste) * 0.15}
            maxScale={6}
            centerOnInit
            disabled={!interactivo}
            onTransform={handleTransform}
            wheel={{ disabled: !interactivo, step: 0.0004 }}
            pinch={{ disabled: !interactivo }}
            panning={{ disabled: !interactivo, excluded: ["seccion-arrastrable"] }}
            zoomAnimation={{ animationTime: 150, animationType: "easeOutCubic" }}
            doubleClick={{ disabled: !interactivo || modoEdicion, step: 0.7, animationTime: 250, animationType: "easeOutCubic" }}
          >
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%", touchAction: interactivo ? "none" : "pan-y" }}>
              <svg
                width={modoEdicion ? width + COLCHON_EDICION * 2 : width}
                height={modoEdicion ? svgHeight + COLCHON_EDICION * 2 : svgHeight}
                style={styles.svg}
              >
                <defs>
                  <linearGradient id="grad-vacia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e2e8f0" />
                    <stop offset="100%" stopColor="#b8c4d4" />
                  </linearGradient>
                  <linearGradient id="grad-ocupada" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                  <linearGradient id="grad-bajo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                  <linearGradient id="grad-estanteria" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f1f5f9" />
                    <stop offset="100%" stopColor="#dbe2ea" />
                  </linearGradient>
                  <filter id="sombra-seccion" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.25" />
                  </filter>
                </defs>

                <g transform={modoEdicion ? `translate(${COLCHON_EDICION}, ${COLCHON_EDICION})` : undefined}>
                  {seccionesConPosicion.map((grupo) => {
                    const pos = posicionActualDe(grupo.seccion.id, grupo.xInicio, grupo.yInicio);
                    const seEstaArrastrando = arrastrando === grupo.seccion.id;
                    const numColumnasVisual = (grupo.seccion.rotacion ?? 0) % 2 === 1
                      ? grupo.columnas.reduce((max, col) => Math.max(max, col.ubicaciones.length), 1)
                      : grupo.columnas.length;
                    const anchoCarcasa = grupo.ancho / numColumnasVisual;

                    return (
                      <g
                        key={grupo.seccion.id}
                        className={modoEdicion ? "seccion-arrastrable" : undefined}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onMouseDown={(e) => iniciarArrastreMouse(e, grupo)}
                        onTouchStart={(e) => iniciarArrastreTactil(e, grupo)}
                        style={{
                          cursor: modoEdicion ? (seEstaArrastrando ? "grabbing" : "grab") : "default",
                          touchAction: modoEdicion ? "none" : undefined
                        }}
                      >
                        <g filter="url(#sombra-seccion)">
                          {/* Carcasa de la estantería: marco de fondo con
                              separadores verticales entre columnas, simulando
                              la estructura física que sostiene las celdas.
                              Las celdas se dibujan desplazadas PADDING_CARCASA
                              a la derecha y abajo (ver el <g> de más abajo);
                              la carcasa sobresale ese mismo margen en los 4
                              lados para que el padding interno sea regular. */}
                          <rect
                            x={0}
                            y={LABEL_HEIGHT}
                            width={grupo.ancho + PADDING_CARCASA * 2 - 4}
                            height={grupo.alto - LABEL_HEIGHT + PADDING_CARCASA * 2 - 4}
                            rx={4}
                            fill="url(#grad-estanteria)"
                            stroke="#94a3b8"
                            strokeWidth={1}
                          />
                          {Array.from({ length: numColumnasVisual - 1 }).map((_, i) => (
                            <line
                              key={i}
                              x1={PADDING_CARCASA + (i + 1) * anchoCarcasa}
                              y1={LABEL_HEIGHT + PADDING_CARCASA}
                              x2={PADDING_CARCASA + (i + 1) * anchoCarcasa}
                              y2={grupo.alto + PADDING_CARCASA * 2 - 4}
                              stroke="#94a3b8"
                              strokeWidth={1}
                              strokeOpacity={0.6}
                            />
                          ))}
                        </g>

                        {modoEdicion && seEstaArrastrando && (
                          <rect
                            x={-8}
                            y={-8}
                            width={grupo.ancho + PADDING_CARCASA * 2 + 16}
                            height={grupo.alto + PADDING_CARCASA + 16}
                            rx={8}
                            fill="#e0f2fe"
                            stroke="#3b82f6"
                            strokeWidth={2}
                          />
                        )}

                        <rect
                          x={0}
                          y={-4}
                          width={grupo.ancho + PADDING_CARCASA * 2}
                          height={28}
                          rx={6}
                          fill="#1e293b"
                        />
                        <text
                          x={(grupo.ancho + PADDING_CARCASA * 2) / 2}
                          y={14}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="14"
                          fontWeight="700"
                          fill="white"
                          style={{ userSelect: "none" }}
                        >
                          {grupo.seccion.nombre}
                        </text>

                        {modoEdicion && (
                          <g
                            transform={`translate(16, -24)`}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
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
                            transform={`translate(${(grupo.ancho + PADDING_CARCASA * 2) / 2}, -24)`}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
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
                            transform={`translate(${grupo.ancho + PADDING_CARCASA * 2 - 16}, -24)`}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
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

                        <g transform={`translate(${PADDING_CARCASA}, ${LABEL_HEIGHT + PADDING_CARCASA})`}>
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
                                ubicacionesCoincidentes={ubicacionesCoincidentes}
                                hayBusquedaActiva={busqueda.trim().length > 0}
                                onSelectUbicacion={seleccionarUbicacion}
                                onHoverUbicacion={(ubicacion, stockUbicacion, evento) => {
                                  if (modoEdicion) return;
                                  setUbicacionHover({ ubicacion, stockUbicacion });
                                  setPosicionHoverUbicacion({ x: evento.clientX, y: evento.clientY });
                                }}
                                onMoveHoverUbicacion={(evento) => {
                                  if (modoEdicion) return;
                                  setPosicionHoverUbicacion({ x: evento.clientX, y: evento.clientY });
                                }}
                                onLeaveHoverUbicacion={() => {
                                  if (modoEdicion) return;
                                  setUbicacionHover(null);
                                }}
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

          {ubicacionHover && (
            <div
              style={{
                ...styles.hoverCard,
                left: posicionHoverUbicacion.x + 16,
                top: posicionHoverUbicacion.y + 16
              }}
            >
              <div style={styles.hoverCardTitle}>{ubicacionHover.ubicacion.codigo}</div>
              {ubicacionHover.stockUbicacion.length === 0 ? (
                <div style={styles.hoverCardDescripcion}>Ubicación vacía</div>
              ) : (
                <div style={styles.hoverCardDescripcion}>
                  {ubicacionHover.stockUbicacion.map((linea) => (
                    <div key={linea.producto_id}>
                      {linea.producto_nombre || `Producto ${linea.producto_id}`}: {linea.cantidad}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
