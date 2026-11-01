import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { lotesApi } from "../../api/territorio";
import { useSensores } from "./useSensores";
import type { Sensor } from "../../types/sensor";

export interface EstacionLote {
    loteId: number | null;
    nombreLote: string;
    sensores: Sensor[];
    enLinea: number;
    alertas: number;
}

/**
 * El Figma agrupa los sensores en estaciones por lote. No hay tabla de
 * estaciones en la base: la estacion es el conjunto de sensores que comparten
 * loteId, asi que el agrupamiento se hace aqui con los datos que ya existen.
 */
export function useSensoresPorLote(intervaloMs = 10_000) {
    const { sensores, resumen, cargando, error, recargar } = useSensores(intervaloMs);

    const lotesQuery = useQuery({
        queryKey: ["lotes"],
        queryFn: async () => (await lotesApi.listar()).data,
        staleTime: 5 * 60_000,
    });

    const estaciones: EstacionLote[] = useMemo(() => {
        const nombrePorLote = new Map((lotesQuery.data ?? []).map((l) => [l.id, l.nombre]));
        const grupos = new Map<number | null, Sensor[]>();

        for (const s of sensores) {
            const clave = s.loteId;
            const lista = grupos.get(clave);
            if (lista) lista.push(s);
            else grupos.set(clave, [s]);
        }

        return [...grupos.entries()]
            .map(([loteId, lista]) => ({
                loteId,
                nombreLote:
                    loteId === null
                        ? "Sin lote asignado"
                        : nombrePorLote.get(loteId) ?? `Lote ${loteId}`,
                sensores: [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
                enLinea: lista.filter((s) => s.enLinea).length,
                alertas: lista.filter((s) => s.alerta).length,
            }))
            .sort((a, b) => {
                // Los sensores sin lote van al final
                if (a.loteId === null) return 1;
                if (b.loteId === null) return -1;
                return a.nombreLote.localeCompare(b.nombreLote, "es");
            });
    }, [sensores, lotesQuery.data]);

    return {
        estaciones,
        resumen,
        cargando: cargando || lotesQuery.isLoading,
        error,
        recargar,
    };
}
