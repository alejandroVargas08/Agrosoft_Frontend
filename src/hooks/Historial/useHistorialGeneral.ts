import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { actividadHistorialApi, historialPreciosLoteApi } from '../../api/historial/historial';
import { actividadesApi } from '../../api/actividades/actividades';
import { usuarioApi } from '../../api/usuarios/usuarios';
import { mensajeError } from '../../api/errores/errores';
import type { cambioRegistrado } from '../../types/historial';

export type FuenteHistorial = 'actividad' | 'precio';

export interface EventoHistorial {
    /** Único entre fuentes: el id se repite entre tablas distintas */
    clave: string;
    fuente: FuenteHistorial;
    fecha: Date;
    usuarioId: number;
    titulo: string;
    motivo: string;
    cambios: cambioRegistrado;
    /** Para navegar al origen del cambio */
    actividadId?: number;
}

const aFecha = (valor: string | Date): Date => (valor instanceof Date ? valor : new Date(valor));

/**
 * Une en una sola línea de tiempo las fuentes de historial que el backend
 * deja listar completas: cambios de actividad y cambios de precio de lote.
 *
 * El historial de cultivo se queda fuera a propósito: `/cultivos/:id/historial`
 * exige un cultivo, así que no hay forma de traerlo todo sin pedir uno por uno.
 */
export function useHistorialGeneral() {
    const actividadesHist = useQuery({
        queryKey: ['historial-actividades'],
        queryFn: async () => (await actividadHistorialApi.listarTodo()).data,
    });

    const preciosHist = useQuery({
        queryKey: ['historial-precios-lote', undefined],
        queryFn: async () => (await historialPreciosLoteApi.listar()).data,
    });

    // Los nombres: el historial solo guarda ids
    const usuariosQuery = useQuery({
        queryKey: ['usuarios'],
        queryFn: async () => (await usuarioApi.listar()).data,
        staleTime: 5 * 60_000,
    });

    const idsActividad = useMemo(
        () => [...new Set((actividadesHist.data ?? []).map((h) => h.actividadId))],
        [actividadesHist.data],
    );

    const consultasActividad = useQueries({
        queries: idsActividad.map((id) => ({
            queryKey: ['actividad', id],
            queryFn: async () => (await actividadesApi.obtenerPorId(id)).data,
            staleTime: 5 * 60_000,
        })),
    });

    const nombreActividad = useMemo(() => {
        const mapa = new Map<number, string>();
        consultasActividad.forEach((c) => {
            const a = c.data as { id?: number; nombre?: string } | undefined;
            if (a?.id && a.nombre) mapa.set(a.id, a.nombre);
        });
        return (id: number) => mapa.get(id) ?? 'Actividad #' + id;
    }, [consultasActividad]);

    const nombreUsuario = useMemo(() => {
        const mapa = new Map<number, string>(
            (usuariosQuery.data ?? []).map((u) => [
                u.id,
                [u.nombre, u.apellido].filter(Boolean).join(' ').trim() || 'Usuario #' + u.id,
            ]),
        );
        return (id: number) => mapa.get(id) ?? 'Usuario #' + id;
    }, [usuariosQuery.data]);

    const eventos: EventoHistorial[] = useMemo(() => {
        const deActividades: EventoHistorial[] = (actividadesHist.data ?? []).map((h) => ({
            clave: 'act-' + h.id,
            fuente: 'actividad',
            fecha: aFecha(h.fechaCreacion),
            usuarioId: h.usuarioId,
            titulo: nombreActividad(h.actividadId),
            motivo: h.motivo,
            cambios: h.cambios,
            actividadId: h.actividadId,
        }));

        const dePrecios: EventoHistorial[] = (preciosHist.data ?? []).map((h) => ({
            clave: 'precio-' + h.id,
            fuente: 'precio',
            fecha: aFecha(h.fecha),
            usuarioId: h.usuarioId,
            titulo: 'Lote de producción #' + h.loteProduccionId,
            motivo: h.razon?.trim() || 'Cambio de precio',
            cambios: {
                'Precio por kg': { anterior: h.precioAnterior, nuevo: h.precioNuevo },
            },
        }));

        return [...deActividades, ...dePrecios].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
    }, [actividadesHist.data, preciosHist.data, nombreActividad]);

    const error = actividadesHist.error ?? preciosHist.error;

    return {
        eventos,
        nombreUsuario,
        cargando: actividadesHist.isLoading || preciosHist.isLoading,
        error: error ? mensajeError(error, 'No se pudo cargar el historial.') : '',
    };
}
