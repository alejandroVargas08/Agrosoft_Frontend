import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapaSatelital } from '../mapa/MapaSatelital';
import { AjustarVista, Circulo, Poligono } from '../mapa/FigurasMapa';
import { lotesApi, sublotesApi } from '../../api/territorio';
import { CLASE_VEGETACION, type ClaseVegetacion, type ResultadoCaptura } from '../../types/drones/drones';
import type { Punto } from '../../types/territorio';

const RADIO_PUNTO_M = 4;
const DISTANCIA_MINIMA_CLIC_M = 25;
const ORDEN_CLASES: ClaseVegetacion[] = ['SALUDABLE', 'ESTRES_MODERADO', 'ESTRES_ALTO', 'SIN_VEGETACION'];

const distanciaM = (a: Punto, b: Punto) => {
    const x = (b.lng - a.lng) * 111320 * Math.cos((a.lat * Math.PI) / 180);
    const y = (b.lat - a.lat) * 110540;
    return Math.hypot(x, y);
};

interface PuntoCaptura {
    id: number;
    punto: Punto;
    color: string;
}

interface MapaVueloProps {
    loteId: number;
    subLoteId: number | null;
    resultados: ResultadoCaptura[];
    seleccion: number | null;
    onSeleccionar: (id: number) => void;
    huellaM: number;
}

export const MapaVuelo = ({ loteId, subLoteId, resultados, seleccion, onSeleccionar, huellaM }: MapaVueloProps) => {
    const lote = useQuery({
        queryKey: ['lote', loteId],
        queryFn: async () => (await lotesApi.obtener(loteId)).data,
    });

    const sublotes = useQuery({
        queryKey: ['sublotes', loteId],
        queryFn: async () => (await sublotesApi.porLote(loteId)).data,
        enabled: subLoteId != null,
    });

    const sublote = sublotes.data?.find((s) => s.id === subLoteId);

    const puntos = useMemo<PuntoCaptura[]>(
        () =>
            resultados
                .filter((r) => r.ubicacion)
                .map((r) => ({
                    id: r.id,
                    punto: { lat: r.ubicacion!.latitud, lng: r.ubicacion!.longitud },
                    color: CLASE_VEGETACION[r.clasificacion].color,
                })),
        [resultados],
    );

    const encuadre = useMemo(() => [...(lote.data?.vertices ?? []), ...puntos.map((p) => p.punto)], [lote.data, puntos]);
    const actual = puntos.find((p) => p.id === seleccion);

    const alHacerClic = (clic: Punto) => {
        let cercano: PuntoCaptura | null = null;
        let menor = Infinity;
        for (const p of puntos) {
            const d = distanciaM(clic, p.punto);
            if (d < menor) {
                menor = d;
                cercano = p;
            }
        }
        if (cercano && menor <= Math.max(DISTANCIA_MINIMA_CLIC_M, huellaM)) onSeleccionar(cercano.id);
    };

    if (puntos.length === 0) {
        return (
            <p className="text-sm text-muted-foreground py-6 text-center">
                Las fotos de este vuelo no traen coordenadas GPS, por eso no se pueden ubicar en el mapa.
            </p>
        );
    }

    return (
        <div className="space-y-2">
            <div className="rounded-xl overflow-hidden border border-border">
                <MapaSatelital alto={420} onClickMapa={alHacerClic}>
                    <AjustarVista puntos={encuadre} />
                    {lote.data && <Poligono vertices={lote.data.vertices} color="#ffffff" opacidad={0.08} />}
                    {sublote && <Poligono vertices={sublote.vertices} color="#facc15" opacidad={0.12} zIndex={2} />}
                    {actual && <Circulo centro={actual.punto} radioM={huellaM} color="#ffffff" opacidad={0.18} />}
                    {puntos.map((p) => (
                        <Circulo
                            key={p.id}
                            centro={p.punto}
                            radioM={p.id === seleccion ? RADIO_PUNTO_M * 2 : RADIO_PUNTO_M}
                            color={p.color}
                            opacidad={0.95}
                        />
                    ))}
                </MapaSatelital>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {ORDEN_CLASES.map((c) => (
                    <span key={c} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CLASE_VEGETACION[c].color }} />
                        {CLASE_VEGETACION[c].texto}
                    </span>
                ))}
                <span>· Toca un punto para ver esa foto. El círculo blanco es el área que cubre la foto.</span>
            </div>
        </div>
    );
};
