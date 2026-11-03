import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { lotesApi } from "../../api/territorio";
import { useSensores } from "./useSensores";
import type { ResumenEstaciones, Sensor, TipoSensor } from "../../types/sensor";

export type EstadoEstacion = "conectada" | "alerta" | "desconectada";

export interface EstacionLote {
    loteId: number | null;
    nombreLote: string;
    sensores: Sensor[];
    estado: EstadoEstacion;
    enLinea: number;
    alertas: number;
    /** El sensor de esa medida en el lote, si existe. */
    medida: (tipo: TipoSensor) => Sensor | undefined;
}

/**
 * El Figma agrupa los sensores en estaciones por lote. No hay tabla de
 * estaciones en la base: la estacion es el conjunto de sensores que comparten
 * loteId, asi que el agrupamiento se hace aqui con los datos que ya existen.
 */
export function useSensoresPorLote(intervaloMs = 10_000) {
    const { sensores, cargando, error, recargar } = useSensores(intervaloMs);

    const lotesQuery = useQuery({
        queryKey: ["lotes"],
        queryFn: async () => (await lotesApi.listar()).data,
        staleTime: 5 * 60_000,
    });

    const estaciones: EstacionLote[] = useMemo(() => {
        const nombrePorLote = new Map((lotesQuery.data ?? []).map((l) => [l.id, l.nombre]));
        const grupos = new Map<number | null, Sensor[]>();

        for (const s of sensores) {
            const lista = grupos.get(s.loteId);
            if (lista) lista.push(s);
            else grupos.set(s.loteId, [s]);
        }

        return [...grupos.entries()]
            .map(([loteId, lista]) => {
                const ordenados = [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
                const enLinea = lista.filter((s) => s.enLinea).length;
                const alertas = lista.filter((s) => s.alerta).length;

                // Una estacion esta caida cuando ninguno de sus sensores reporta.
                const estado: EstadoEstacion =
                    enLinea === 0 ? "desconectada" : alertas > 0 ? "alerta" : "conectada";

                return {
                    loteId,
                    nombreLote:
                        loteId === null
                            ? "Sin lote asignado"
                            : nombrePorLote.get(loteId) ?? `Lote ${loteId}`,
                    sensores: ordenados,
                    estado,
                    enLinea,
                    alertas,
                    medida: (tipo: TipoSensor) => ordenados.find((s) => s.tipo === tipo),
                };
            })
            .sort((a, b) => {
                // Los sensores sin lote van al final
                if (a.loteId === null) return 1;
                if (b.loteId === null) return -1;
                return a.nombreLote.localeCompare(b.nombreLote, "es");
            });
    }, [sensores, lotesQuery.data]);

    const resumen: ResumenEstaciones = useMemo(() => {
        // El UV promedio solo mira las estaciones que estan reportando.
        const uv = estaciones
            .filter((e) => e.estado !== "desconectada")
            .map((e) => e.medida("uv")?.valor)
            .filter((v): v is number => typeof v === "number");

        return {
            conectadas: estaciones.filter((e) => e.estado === "conectada").length,
            conAlerta: estaciones.filter((e) => e.estado === "alerta").length,
            desconectadas: estaciones.filter((e) => e.estado === "desconectada").length,
            uvPromedio: uv.length > 0 ? uv.reduce((a, b) => a + b, 0) / uv.length : null,
        };
    }, [estaciones]);

    return {
        estaciones,
        resumen,
        cargando: cargando || lotesQuery.isLoading,
        error,
        recargar,
    };
}
