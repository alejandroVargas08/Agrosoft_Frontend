import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { incidenciasApi } from '../api/incidencias';
import type { EstadoIncidencia, SeveridadIncidencia } from '../types/incidencias';

const FORM_INICIAL = {
    titulo: '',
    tipo: 'Enfermedad fúngica',
    severidad: 'medium' as SeveridadIncidencia,
    cultivoId: '',
    descripcion: '',
};

export function useIncidencias() {
    const queryClient = useQueryClient();
    const [filtro, setFiltro] = useState<EstadoIncidencia | 'Todas'>('Todas');
    const [form, setForm] = useState(FORM_INICIAL);
    const [errorLocal, setErrorLocal] = useState<string | null>(null);

    // LECTURA
    const { data: incidencias = [], isLoading: cargando, error } = useQuery({
        queryKey: ['incidencias'],
        queryFn: async () => (await incidenciasApi.listar()).data,
    });

    const set = (campo: keyof typeof FORM_INICIAL) => (valor: string) =>
        setForm((prev) => ({ ...prev, [campo]: valor }));

    const visibles = incidencias.filter((i) => filtro === 'Todas' || i.estado === filtro);

    // ESCRITURA: crear
    const crearMutation = useMutation({
        mutationFn: () =>
            incidenciasApi.crear({
                titulo: form.titulo,
                tipo: form.tipo,
                severidad: form.severidad,
                cultivoId: form.cultivoId ? Number(form.cultivoId) : undefined,
                descripcion: form.descripcion || undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidencias'] });
            setForm(FORM_INICIAL);
        },
    });

    // ESCRITURA: cambiar estado
    const cambiarEstadoMutation = useMutation({
        mutationFn: ({ id, estado }: { id: number; estado: EstadoIncidencia }) =>
            incidenciasApi.cambiarEstado(id, estado),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidencias'] });
        },
    });

    // ESCRITURA: eliminar
    const eliminarMutation = useMutation({
        mutationFn: (id: number) => incidenciasApi.eliminar(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidencias'] });
        },
    });

    const crear = (onSuccess: () => void) => {
        setErrorLocal(null);
        if (!form.titulo.trim()) {
            setErrorLocal('Escribe un título para la incidencia');
            return;
        }
        crearMutation.mutate(undefined, { onSuccess });
    };

    const errorForm =
        errorLocal ??
        (crearMutation.error && isAxiosError(crearMutation.error)
            ? crearMutation.error.response?.data?.message ?? 'No se pudo guardar la incidencia'
            : crearMutation.error
                ? 'Error inesperado al guardar'
                : null);

    return {
        incidencias: visibles,
        totalIncidencias: incidencias.length,
        cargando,
        error: error ? 'No se pudo cargar las incidencias' : null,
        filtro, setFiltro,
        form, set,
        crear,
        creando: crearMutation.isPending,
        errorForm,
        cambiarEstado: (id: number, estado: EstadoIncidencia) =>
            cambiarEstadoMutation.mutate({ id, estado }),
        eliminar: (id: number) => eliminarMutation.mutate(id),
    };
}