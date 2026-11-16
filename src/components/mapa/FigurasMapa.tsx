import { useEffect, useRef } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import type { Punto } from '../../types/territorio';

interface PoligonoProps {
    vertices: Punto[];
    color: string;
    opacidad?: number;
    grosor?: number;
    zIndex?: number;
    onClick?: (punto: Punto) => void;
}

interface EventoClicMapa {
    latLng?: { lat: () => number; lng: () => number } | null;
}

export const Poligono = ({ vertices, color, opacidad = 0.25, grosor = 2, zIndex = 1, onClick }: PoligonoProps) => {
    const map = useMap();
    const maps = useMapsLibrary('maps');

    useEffect(() => {
        if (!map || !maps || vertices.length < 3) return;
        const poligono = new maps.Polygon({
            map,
            paths: vertices,
            strokeColor: color,
            strokeWeight: grosor,
            fillColor: color,
            fillOpacity: opacidad,
            clickable: !!onClick,
            zIndex,
        });
        const listener = onClick
            ? poligono.addListener('click', (e: EventoClicMapa) => {
                if (e.latLng) onClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
            })
            : null;
        return () => {
            listener?.remove();
            poligono.setMap(null);
        };
    }, [map, maps, vertices, color, opacidad, grosor, zIndex, onClick]);

    return null;
};

interface PoligonoEditableProps {
    vertices: Punto[];
    color: string;
    onChange: (vertices: Punto[]) => void;
}

interface PuntoGoogle {
    lat: () => number;
    lng: () => number;
}

export const PoligonoEditable = ({ vertices, color, onChange }: PoligonoEditableProps) => {
    const map = useMap();
    const maps = useMapsLibrary('maps');
    const alCambiar = useRef(onChange);
    const iniciales = useRef(vertices);
    alCambiar.current = onChange;

    useEffect(() => {
        if (!map || !maps || iniciales.current.length < 3) return;
        const poligono = new maps.Polygon({
            map,
            paths: iniciales.current,
            strokeColor: color,
            strokeWeight: 3,
            fillColor: color,
            fillOpacity: 0.25,
            editable: true,
            zIndex: 10,
        });
        const path = poligono.getPath();
        const emitir = () => alCambiar.current(path.getArray().map((p: PuntoGoogle) => ({ lat: p.lat(), lng: p.lng() })));
        const listeners = [
            path.addListener('set_at', emitir),
            path.addListener('insert_at', emitir),
            path.addListener('remove_at', emitir),
            poligono.addListener('contextmenu', (e: { vertex?: number }) => {
                if (e.vertex != null && path.getLength() > 3) path.removeAt(e.vertex);
            }),
        ];
        return () => {
            listeners.forEach((l) => l.remove());
            poligono.setMap(null);
        };
    }, [map, maps, color]);

    return null;
};

interface LineasProps {
    lineas: Punto[][];
    color: string;
    grosor?: number;
    opacidad?: number;
}

export const Lineas = ({ lineas, color, grosor = 1.5, opacidad = 0.9 }: LineasProps) => {
    const map = useMap();
    const maps = useMapsLibrary('maps');

    useEffect(() => {
        if (!map || !maps) return;
        const trazos = lineas.map(
            (path) => new maps.Polyline({ map, path, strokeColor: color, strokeWeight: grosor, strokeOpacity: opacidad, clickable: false }),
        );
        return () => trazos.forEach((t) => t.setMap(null));
    }, [map, maps, lineas, color, grosor, opacidad]);

    return null;
};

interface CirculoProps {
    centro: Punto;
    radioM: number;
    color: string;
    opacidad?: number;
}

export const Circulo = ({ centro, radioM, color, opacidad = 0.35 }: CirculoProps) => {
    const map = useMap();
    const maps = useMapsLibrary('maps');

    useEffect(() => {
        if (!map || !maps) return;
        const circulo = new maps.Circle({
            map,
            center: centro,
            radius: radioM,
            strokeColor: color,
            strokeWeight: 1,
            fillColor: color,
            fillOpacity: opacidad,
            clickable: false,
        });
        return () => circulo.setMap(null);
    }, [map, maps, centro, radioM, color, opacidad]);

    return null;
};

export const AjustarVista = ({ puntos, margen = 40 }: { puntos: Punto[]; margen?: number }) => {
    const map = useMap();
    const clave = puntos.map((p) => `${p.lat},${p.lng}`).join('|');

    useEffect(() => {
        if (!map || puntos.length === 0) return;
        if (puntos.length === 1) {
            map.setCenter(puntos[0]);
            map.setZoom(18);
            return;
        }
        const lats = puntos.map((p) => p.lat);
        const lngs = puntos.map((p) => p.lng);
        map.fitBounds(
            {
                north: Math.max(...lats),
                south: Math.min(...lats),
                east: Math.max(...lngs),
                west: Math.min(...lngs),
            },
            margen,
        );
    }, [map, clave, margen]);

    return null;
};
