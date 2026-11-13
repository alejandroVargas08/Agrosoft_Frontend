import type { Punto } from '../../types/territorio';

const METROS_POR_GRADO_LAT = 110_540;
const METROS_POR_GRADO_LNG = 111_320;

export function centroide(vertices: Punto[]): Punto {
    return {
        lat: vertices.reduce((a, v) => a + v.lat, 0) / vertices.length,
        lng: vertices.reduce((a, v) => a + v.lng, 0) / vertices.length,
    };
}

export function areaPoligonoM2(vertices: Punto[]): number {
    if (vertices.length < 3) return 0;
    const origen = centroide(vertices);
    const cosLat = Math.cos((origen.lat * Math.PI) / 180);
    const locales = vertices.map((p) => ({
        x: (p.lng - origen.lng) * METROS_POR_GRADO_LNG * cosLat,
        y: (p.lat - origen.lat) * METROS_POR_GRADO_LAT,
    }));
    let doble = 0;
    for (let i = 0; i < locales.length; i++) {
        const a = locales[i];
        const b = locales[(i + 1) % locales.length];
        doble += a.x * b.y - b.x * a.y;
    }
    return Math.abs(doble) / 2;
}