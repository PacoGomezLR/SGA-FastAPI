export const CELL_WIDTH = 48;
export const CELL_HEIGHT = 48;
export const GAP_SECCIONES = 130;
export const MARGIN = 60;
export const LABEL_HEIGHT = 36;
export const SNAP_GRID = 20;

export function snapToGrid(value) {
  return Math.round(value / SNAP_GRID) * SNAP_GRID;
}

/**
 * Agrupa las ubicaciones de una sección por columna. Dentro de cada
 * columna, las ubicaciones se ordenan por fila (de arriba hacia abajo).
 */
export function agruparPorColumna(seccionId, ubicaciones) {
  const ubicacionesSeccion = ubicaciones.filter(
    (u) => u.seccion_id === seccionId && u.activa
  );

  const columnas = new Map();

  ubicacionesSeccion.forEach((ubicacion) => {
    const clave = ubicacion.columna ?? 0;

    if (!columnas.has(clave)) {
      columnas.set(clave, []);
    }
    columnas.get(clave).push(ubicacion);
  });

  columnas.forEach((lista) => lista.sort((a, b) => (a.fila ?? 0) - (b.fila ?? 0)));

  return Array.from(columnas.entries())
    .sort(([a], [b]) => a - b)
    .map(([columna, ubicacionesColumna]) => ({ columna, ubicaciones: ubicacionesColumna }));
}

/**
 * Construye el layout combinado de varias secciones a la vez. Cada sección
 * es una rejilla rectangular autocontenida (columnas x filas), sin ningún
 * concepto de pasillo o lado compartido con otras secciones.
 */
export function construirLayoutMultiple(secciones, ubicaciones) {
  return secciones
    .map((seccion) => {
      const columnas = agruparPorColumna(seccion.id, ubicaciones);
      return { seccion, columnas };
    })
    .filter((grupo) => grupo.columnas.length > 0);
}

/**
 * Cada sección se dibuja como una rejilla vertical: las columnas se colocan
 * una junto a otra en horizontal, y dentro de cada columna las filas se
 * apilan hacia abajo.
 *
 * Posicionamiento: si una sección tiene pos_x/pos_y guardados (movida
 * manualmente en el modo "Editar disposición"), se dibuja ahí, en una
 * posición libre que replica el almacén real. Si no, se coloca en el
 * layout automático (una junto a otra en fila), para que las secciones
 * todavía no tocadas no salten de sitio.
 */
export function calcularDimensionesMultiple(gruposSeccion) {
  if (gruposSeccion.length === 0) {
    return { width: MARGIN * 2, height: MARGIN * 2, seccionesConPosicion: [] };
  }

  let xAutomatico = MARGIN;
  let hayLibres = false;
  let altoMaximoLibre = 0;

  const dimensiones = gruposSeccion.map((grupo) => {
    const numColumnas = grupo.columnas.length;
    const maxFilas = grupo.columnas.reduce(
      (max, columna) => Math.max(max, columna.ubicaciones.length),
      1
    );

    // rotacion es un número de cuartos de vuelta (0-3). A 90°/270° se
    // intercambian los ejes de dibujo (lo que antes ocupaba ancho en
    // columnas ahora ocupa alto, y viceversa); a 0°/180° las dimensiones son
    // las mismas que sin rotar. Nunca toca la columna/fila real de ninguna
    // ubicación, es puramente visual.
    const ejesIntercambiados = (grupo.seccion.rotacion ?? 0) % 2 === 1;
    const ancho = (ejesIntercambiados ? maxFilas : numColumnas) * CELL_WIDTH;
    const alto = (ejesIntercambiados ? numColumnas : maxFilas) * CELL_HEIGHT + LABEL_HEIGHT;

    return { grupo, ancho, alto };
  });

  dimensiones.forEach(({ grupo, alto }) => {
    const { pos_x: posX, pos_y: posY } = grupo.seccion;
    if (posX != null && posY != null) {
      hayLibres = true;
      altoMaximoLibre = Math.max(altoMaximoLibre, posY + alto);
    }
  });

  const yFilaAutomatica = hayLibres ? altoMaximoLibre + MARGIN : MARGIN;

  const seccionesConPosicion = dimensiones.map(({ grupo, ancho, alto }) => {
    const { pos_x: posX, pos_y: posY } = grupo.seccion;
    const esLibre = posX != null && posY != null;

    // Cada sección se posiciona de forma 100% independiente. El SVG no tiene
    // viewBox (su origen 0,0 es fijo), así que una posición libre nunca
    // puede ser negativa o se recortaría; se limita (clamp) a 0 sin tocar
    // ninguna otra sección.
    const posicionSeccion = {
      seccion: grupo.seccion,
      columnas: grupo.columnas,
      ancho,
      alto,
      esLibre,
      xInicio: esLibre ? Math.max(0, posX) : xAutomatico,
      yInicio: esLibre ? Math.max(0, posY) : yFilaAutomatica
    };

    if (!esLibre) {
      xAutomatico += ancho + GAP_SECCIONES;
    }

    return posicionSeccion;
  });

  const width = Math.max(
    ...seccionesConPosicion.map((s) => s.xInicio + s.ancho + MARGIN)
  );
  const height = Math.max(
    ...seccionesConPosicion.map((s) => s.yInicio + s.alto + MARGIN)
  );

  return { width, height, seccionesConPosicion };
}

export function estadoUbicacion(stockUbicacion) {
  if (!stockUbicacion || stockUbicacion.length === 0) {
    return "vacia";
  }

  if (stockUbicacion.some((linea) => linea.bajo_stock)) {
    return "bajo";
  }

  return "ocupada";
}

export const COLOR_POR_ESTADO = {
  vacia: "#cbd5e1",
  ocupada: "#22c55e",
  bajo: "#ef4444"
};
