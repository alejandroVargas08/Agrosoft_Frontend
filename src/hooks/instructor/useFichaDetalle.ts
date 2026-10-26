import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { misFichasApi, resumenAprendicesApi } from '../../api/instructor';
import { lotesApi } from '../../api/territorio';
import { mensajeError } from '../../api/errores/errores';
import type { ResumenAprendiz } from '../../types/instructor';

export function useFichaDetalle(fichaId: number) {
    const [busqueda, setBusqueda] = useState('');

    const fichasQuery = useQuery({
        queryKey: ['mis-fichas'],
        queryFn: async () => (await misFichasApi.listar()).data,
        staleTime: 1000 * 60 * 5,
    });

    const aprendicesQuery = useQuery({
        queryKey: ['aprendices-resumen', fichaId],
        queryFn: async () => (await resumenAprendicesApi.listar(fichaId)).data,
        enabled: Number.isFinite(fichaId),
    });

    // Los lotes traen programa_formacion_id, así que se filtran aquí: el
    // endpoint de territorio no acepta ese filtro.
    const lotesQuery = useQuery({
        queryKey: ['lotes'],
        queryFn: async () => (await lotesApi.listar()).data,
        staleTime: 1000 * 60 * 5,
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

    const sumar = (campo: 'entregadas' | 'vencidas' | 'horas') =>
        aprendices.reduce((total, a) => total + a[campo], 0);

    return {
        ficha,
        aprendices: visibles,
        totales: {
            aprendices: aprendices.length,
            porRevisar: sumar('entregadas'),
            vencidas: sumar('vencidas'),
            horas: sumar('horas'),
        },
        lotes,
        busqueda,
        setBusqueda,
        cargando: fichasQuery.isLoading || aprendicesQuery.isLoading,
        error: aprendicesQuery.error
            ? mensajeError(aprendicesQuery.error, 'No se pudo cargar la ficha.')
            : '',
        fichaNoEncontrada: !fichasQuery.isLoading && ficha === null,
    };
}
