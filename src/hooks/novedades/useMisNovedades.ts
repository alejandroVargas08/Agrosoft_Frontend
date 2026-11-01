import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { misNovedadesApi } from '../../api/novedades';
import { insumosApi } from '../../api/inventario';
import { misTareasApi } from '../../api/instructor';
import { mensajeError } from '../../api/errores/errores';
import type { ReportarNovedadPayload } from '../../types/novedades';

export function useMisNovedades() {
    const queryClient = useQueryClient();
    const [abierto, setAbierto] = useState(false);

    const novedadesQuery = useQuery({
        queryKey: ['mis-novedades'],
        queryFn: async () => (await misNovedadesApi.listar()).data,
    });

    // Los catálogos del formulario se piden solo cuando se abre el modal
    const insumosQuery = useQuery({
        queryKey: ['insumos', 'todos'],
        queryFn: async () => (await insumosApi.listar()).data,
        enabled: abierto,
        staleTime: 1000 * 60 * 5,
    });

    const tareasQuery = useQuery({
        queryKey: ['mis-tareas'],
        queryFn: async () => (await misTareasApi.listar()).data,
        enabled: abierto,
        staleTime: 1000 * 60 * 5,
    });

    const insumos = insumosQuery.data ?? [];

    const reportarMutation = useMutation({
        mutationFn: (data: ReportarNovedadPayload) => misNovedadesApi.reportar(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mis-novedades'] }),
    });

    const abrir = useCallback(() => setAbierto(true), []);

    return {
        novedades: novedadesQuery.data ?? [],
        // Consumibles para "se está acabando"; herramientas para "se dañó"
        consumibles: insumos.filter((i) => i.tipoInsumo !== 'herramienta'),
        herramientas: insumos.filter((i) => i.tipoInsumo === 'herramienta'),
        // Solo las tareas abiertas: una novedad se reporta sobre algo en curso
        tareas: (tareasQuery.data ?? [])
            .filter((t) => ['ASIGNADA', 'EN_PROGRESO', 'DEVUELTA'].includes(t.estado) && t.actividad)
            .map((t) => ({ id: t.actividad!.id, nombre: t.actividad!.nombre })),
        abierto,
        abrir,
        cerrar: () => { setAbierto(false); reportarMutation.reset(); },
        cargando: novedadesQuery.isLoading,
        error: novedadesQuery.error
            ? mensajeError(novedadesQuery.error, 'No se pudieron cargar tus novedades.')
            : '',
        errorEnvio: reportarMutation.error
            ? mensajeError(reportarMutation.error, 'No se pudo enviar la novedad.')
            : '',
        enviando: reportarMutation.isPending,
        reportar: (data: ReportarNovedadPayload, alTerminar?: () => void) =>
            reportarMutation.mutate(data, { onSuccess: () => alTerminar?.() }),
    };
}
