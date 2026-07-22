export const CELL_WIDTH = 70;
export const CELL_HEIGHT = 40;
export const GAP_LADOS = 40;
export const GAP_PASILLOS = 90;
export const MARGIN = 60;

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

export function agruparFilasPorZona(zonaId, ubicaciones) {
  const ubicacionesZona = ubicaciones.filter((u) => u.zona_id === zonaId && u.activa);

  const filas = new Map();

  ubicacionesZona.forEach((ubicacion) => {
    const clave = ubicacion.eje_x ?? 0;

    if (!filas.has(clave)) {
      filas.set(clave, []);
    }
    filas.get(clave).push(ubicacion);
  });

  filas.forEach((lista) => lista.sort((a, b) => (a.eje_y ?? 0) - (b.eje_y ?? 0)));

  return Array.from(filas.entries())
    .sort(([a], [b]) => a - b)
    .map(([fila, ubicacionesFila]) => ({ fila, ubicaciones: ubicacionesFila }));
}

export function construirLayout(zonas, ubicaciones) {
  const pasillos = agruparPorPasillo(zonas);

  return pasillos.map((pasillo) => {
    const columnaD = pasillo.ladoD
      ? { zona: pasillo.ladoD, filas: agruparFilasPorZona(pasillo.ladoD.id, ubicaciones) }
      : null;

    const columnaI = pasillo.ladoI
      ? { zona: pasillo.ladoI, filas: agruparFilasPorZona(pasillo.ladoI.id, ubicaciones) }
      : null;

    return { numero: pasillo.numero, columnaD, columnaI };
  });
}

function alturaMaxColumna(columna) {
  if (!columna) return 0;

  return columna.filas.reduce((max, fila) => Math.max(max, fila.ubicaciones.length), 0);
}

export function calcularDimensiones(layout) {
  if (layout.length === 0) {
    return { width: MARGIN * 2, height: MARGIN * 2, pasillosConPosicion: [] };
  }

  let anchoAcumulado = MARGIN;
  let alturaMaxima = 0;

  const pasillosConPosicion = layout.map((pasillo) => {
    const filasD = pasillo.columnaD?.filas.length ?? 0;
    const filasI = pasillo.columnaI?.filas.length ?? 0;
    const numFilas = Math.max(filasD, filasI, 1);

    const alturaD = alturaMaxColumna(pasillo.columnaD);
    const alturaI = alturaMaxColumna(pasillo.columnaI);
    const alturaPasillo = Math.max(alturaD, alturaI, 1);

    alturaMaxima = Math.max(alturaMaxima, alturaPasillo);

    const xD = anchoAcumulado;
    const xI = pasillo.columnaD && pasillo.columnaI ? xD + numFilas * CELL_WIDTH + GAP_LADOS : xD;

    const anchoPasillo =
      (pasillo.columnaD && pasillo.columnaI ? numFilas * CELL_WIDTH * 2 + GAP_LADOS : numFilas * CELL_WIDTH);

    const posicion = { ...pasillo, xD, xI, numFilas, alturaPasillo };

    anchoAcumulado += anchoPasillo + GAP_PASILLOS;

    return posicion;
  });

  const width = anchoAcumulado - GAP_PASILLOS + MARGIN;
  const height = alturaMaxima * CELL_HEIGHT + MARGIN * 2 + 30;

  return { width, height, pasillosConPosicion, alturaMaxima };
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
