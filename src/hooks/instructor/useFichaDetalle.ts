import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { codigoInvitacionApi, misFichasApi, panelInstructorApi, resumenAprendicesApi } from '../../api/instructor';
import { novedadesApi } from '../../api/novedades';
import { lotesApi } from '../../api/territorio';
import { mensajeError } from '../../api/errores/errores';
import type { ResumenAprendiz } from '../../types/instructor';

export function useFichaDetalle(fichaId: number) {
    const [busqueda, setBusqueda] = useState('');
    const clienteConsultas = useQueryClient();
    const fichaValida = Number.isFinite(fichaId);

    const fichasQuery = useQuery({
        queryKey: ['mis-fichas'],
        queryFn: async () => (await misFichasApi.listar()).data,
        staleTime: 1000 * 60 * 5,
    });

    const aprendicesQuery = useQuery({
        queryKey: ['aprendices-resumen', fichaId],
        queryFn: async () => (await resumenAprendicesApi.listar(fichaId)).data,
        enabled: fichaValida,
    });

    const actividadesQuery = useQuery({
        queryKey: ['actividades-de-ficha', fichaId],
        queryFn: async () => (await panelInstructorApi.actividadesDeFicha(fichaId)).data,
        enabled: fichaValida,
    });

    const novedadesQuery = useQuery({
        queryKey: ['novedades', 'pendiente'],
        queryFn: async () => (await novedadesApi.listar('pendiente')).data,
        staleTime: 60_000,
    });

    // Los lotes traen programa_formacion_id, así que se filtran aquí: el
    // endpoint de territorio no acepta ese filtro.
    const lotesQuery = useQuery({
        queryKey: ['lotes'],
        queryFn: async () => (await lotesApi.listar()).data,
        staleTime: 1000 * 60 * 5,
    });

    const codigoQuery = useQuery({
        queryKey: ['codigo-invitacion', fichaId],
        queryFn: async () => (await codigoInvitacionApi.obtener(fichaId)).data,
        enabled: fichaValida,
    });

    const generarCodigo = useMutation({
        mutationFn: async () => (await codigoInvitacionApi.generar(fichaId)).data,
        onSuccess: (nuevo) => clienteConsultas.setQueryData(['codigo-invitacion', fichaId], nuevo),
    });

    const ficha = (fichasQuery.data ?? []).find((f) => f.id === fichaId) ?? null;
    const aprendices = aprendicesQuery.data ?? [];

    const lotes = useMemo(
        () => (lotesQuery.data ?? []).filter((lote) => lote.programaFormacionId === fichaId),
        [lotesQuery.data, fichaId],
    );

    const texto = busqueda.trim().toLowerCase();
    const visibles = texto
        ? aprendices.filter((a: ResumenAprendiz) =>
            (a.nombre + ' ' + a.apellido).toLowerCase().includes(texto) ||
            a.correo.toLowerCase().includes(texto) ||
            a.identificacion.includes(texto))
        : aprendices;

    // Las novedades se atribuyen a la ficha por quien las reportó
    const deLaFicha = new Set(aprendices.map((a) => a.id));
    const novedades = (novedadesQuery.data ?? []).filter(
        (n) => n.reportadaPor !== null && deLaFicha.has(n.reportadaPor.id),
    ).length;

    const sumar = (campo: 'tareas' | 'aprobadas' | 'entregadas') =>
        aprendices.reduce((total, a) => total + a[campo], 0);

    return {
        ficha,
        aprendices: visibles,
        actividades: actividadesQuery.data ?? [],
        totales: {
            aprendices: aprendices.length,
            // Lo que sigue abierto: el total menos lo aprobado y lo que espera revisión
            tareasActivas: Math.max(0, sumar('tareas') - sumar('aprobadas') - sumar('entregadas')),
            porRevisar: sumar('entregadas'),
            novedades,
        },
        lotes,
        busqueda,
        setBusqueda,
        codigo: codigoQuery.data ?? null,
        cargandoCodigo: codigoQuery.isLoading,
        generandoCodigo: generarCodigo.isPending,
        generarCodigo: (alTerminar?: () => void) =>
            generarCodigo.mutate(undefined, { onSuccess: () => alTerminar?.() }),
        errorCodigo: generarCodigo.error
            ? mensajeError(generarCodigo.error, 'No se pudo generar el código.')
            : '',
        cargando: fichasQuery.isLoading || aprendicesQuery.isLoading,
        error: aprendicesQuery.error
            ? mensajeError(aprendicesQuery.error, 'No se pudo cargar la ficha.')
            : '',
        fichaNoEncontrada: !fichasQuery.isLoading && ficha === null,
    };
}
