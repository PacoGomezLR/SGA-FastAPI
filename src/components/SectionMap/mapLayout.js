export const CELL_WIDTH = 70;
export const CELL_HEIGHT = 40;
export const GAP_LADOS = 40;
export const GAP_PASILLOS = 70;
export const GAP_SECCIONES = 130;
export const MARGIN = 60;
export const LABEL_HEIGHT = 30;

export function agruparPorPasillo(zonas) {
  const mapa = new Map();

  zonas.forEach((zona) => {
    if (zona.numero_pasillo == null) return;

    if (!mapa.has(zona.numero_pasillo)) {
      mapa.set(zona.numero_pasillo, { numero: zona.numero_pasillo, ladoD: null, ladoI: null });
    }

    const pasillo = mapa.get(zona.numero_pasillo);

    if (zona.lado === "D") {
      pasillo.ladoD = zona;
    } else if (zona.lado === "I") {
      pasillo.ladoI = zona;
    } else {
      pasillo.ladoD = zona;
    }
  });

  return Array.from(mapa.values()).sort((a, b) => a.numero - b.numero);
}

/**
 * Agrupa las ubicaciones de una zona por nivel de altura (eje_y), que en la
 * vista vertical se apila de abajo (altura 1) hacia arriba. Dentro de cada
 * nivel, las ubicaciones se ordenan por su posición a lo largo del pasillo
 * (eje_x), que se dibuja en horizontal.
 */
export function agruparNivelesPorZona(zonaId, ubicaciones) {
  const ubicacionesZona = ubicaciones.filter((u) => u.zona_id === zonaId && u.activa);

  const niveles = new Map();

  ubicacionesZona.forEach((ubicacion) => {
    const clave = ubicacion.eje_y ?? 0;

    if (!niveles.has(clave)) {
      niveles.set(clave, []);
    }
    niveles.get(clave).push(ubicacion);
  });

  niveles.forEach((lista) => lista.sort((a, b) => (a.eje_x ?? 0) - (b.eje_x ?? 0)));

  return Array.from(niveles.entries())
    .sort(([a], [b]) => a - b)
    .map(([altura, ubicacionesNivel]) => ({ altura, ubicaciones: ubicacionesNivel }));
}

export function construirLayoutSeccion(zonas, ubicaciones) {
  const pasillos = agruparPorPasillo(zonas);

  return pasillos.map((pasillo) => {
    const columnaD = pasillo.ladoD
      ? { zona: pasillo.ladoD, niveles: agruparNivelesPorZona(pasillo.ladoD.id, ubicaciones) }
      : null;

    const columnaI = pasillo.ladoI
      ? { zona: pasillo.ladoI, niveles: agruparNivelesPorZona(pasillo.ladoI.id, ubicaciones) }
      : null;

    return { numero: pasillo.numero, columnaD, columnaI };
  });
}

/**
 * Construye el layout combinado de varias secciones a la vez.
 * secciones: [{ id, nombre }], zonas y ubicaciones ya filtradas a las secciones dadas.
 */
export function construirLayoutMultiple(secciones, zonas, ubicaciones) {
  return secciones
    .map((seccion) => {
      const zonasSeccion = zonas.filter((z) => z.seccion_id === seccion.id);
      const pasillos = construirLayoutSeccion(zonasSeccion, ubicaciones);

      return { seccion, pasillos };
    })
    .filter((grupo) => grupo.pasillos.length > 0);
}

function anchoColumnaEnCeldas(columna) {
  if (!columna) return 0;

  return columna.niveles.reduce((max, nivel) => Math.max(max, nivel.ubicaciones.length), 0);
}

function alturaColumnaEnNiveles(columna) {
  if (!columna) return 0;

  return columna.niveles.length;
}

/**
 * Orientación vertical (como una estantería real vista de perfil): cada
 * pasillo es una columna que crece hacia abajo. Dentro del pasillo, lado D y
 * lado I se dibujan uno junto al otro en horizontal (como dos estanterías
 * caminables una frente a la otra). Cada nivel de altura es una franja
 * horizontal apilada de abajo hacia arriba, y dentro de esa franja las
 * ubicaciones (posiciones a lo largo del pasillo) se colocan en horizontal.
 */
export function calcularDimensionesMultiple(gruposSeccion) {
  if (gruposSeccion.length === 0) {
    return { width: MARGIN * 2, height: MARGIN * 2, seccionesConPosicion: [] };
  }

  let xAcumulado = MARGIN;
  let alturaMaxima = 0;

  const seccionesConPosicion = gruposSeccion.map((grupo) => {
    let xPasillo = xAcumulado;
    let anchoSeccion = 0;

    const pasillosConPosicion = grupo.pasillos.map((pasillo) => {
      const celdasD = anchoColumnaEnCeldas(pasillo.columnaD);
      const celdasI = anchoColumnaEnCeldas(pasillo.columnaI);
      const anchoEnCeldas = Math.max(celdasD, celdasI, 1);

      const nivelesD = alturaColumnaEnNiveles(pasillo.columnaD);
      const nivelesI = alturaColumnaEnNiveles(pasillo.columnaI);
      const maxNiveles = Math.max(nivelesD, nivelesI, 1);

      const tieneAmbosLados = Boolean(pasillo.columnaD && pasillo.columnaI);
      const anchoColumnaPx = anchoEnCeldas * CELL_WIDTH;

      const xOffsetD = 0;
      const xOffsetI = tieneAmbosLados ? anchoColumnaPx + GAP_LADOS : 0;

      const anchoPasillo = tieneAmbosLados ? anchoColumnaPx * 2 + GAP_LADOS : anchoColumnaPx;
      const alturaPasillo = maxNiveles * CELL_HEIGHT;

      alturaMaxima = Math.max(alturaMaxima, alturaPasillo);

      const posicion = {
        ...pasillo,
        x: xPasillo,
        xOffsetD,
        xOffsetI,
        maxNiveles,
        alturaPasillo
      };

      xPasillo += anchoPasillo + GAP_PASILLOS;
      anchoSeccion += anchoPasillo + GAP_PASILLOS;

      return posicion;
    });

    anchoSeccion -= GAP_PASILLOS;

    const posicionSeccion = {
      seccion: grupo.seccion,
      pasillos: pasillosConPosicion,
      xInicio: xAcumulado,
      ancho: anchoSeccion
    };

    xAcumulado += anchoSeccion + GAP_SECCIONES;

    return posicionSeccion;
  });

  const width = xAcumulado - GAP_SECCIONES + MARGIN;
  const height = alturaMaxima + MARGIN * 2 + LABEL_HEIGHT * 2;

  return { width, height, seccionesConPosicion, alturaMaxima };
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
