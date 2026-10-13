import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tratamientosApi } from '../api/tratamientos';
import { incidenciasApi } from '../api/incidencias';
import type { EstadoTratamiento } from '../types/tratamientos';

const FORM_VACIO = {
    incidenciaId: '',
    producto: '',
    dosis: '',
    fecha: '',
    costo: '',
    notas: '',
};

export function useTratamientos() {
    const queryClient = useQueryClient();
    const [form, setForm] = useState(FORM_VACIO);
    const [errorForm, setErrorForm] = useState('');

    const tratamientosQuery = useQuery({
        queryKey: ['tratamientos'],
        queryFn: async () => (await tratamientosApi.listar()).data,
    });

    const incidenciasQuery = useQuery({
        queryKey: ['incidencias'],
        queryFn: async () => (await incidenciasApi.listar()).data,
    });

    const invalidar = () => {
        queryClient.invalidateQueries({ queryKey: ['tratamientos'] });
    };

    const set = (campo: keyof typeof FORM_VACIO) => (valor: string) =>
        setForm((anterior) => ({ ...anterior, [campo]: valor }));

    const crearMutation = useMutation({
        mutationFn: () =>
            tratamientosApi.crear({
                incidenciaId: form.incidenciaId ? Number(form.incidenciaId) : null,
                producto: form.producto.trim(),
                dosis: form.dosis.trim() || null,
                fecha: form.fecha || undefined,
                costo: form.costo ? Number(form.costo) : 0,
                notas: form.notas.trim() || null,
            }),
        onSuccess: () => {
            invalidar();
            setForm(FORM_VACIO);
            setErrorForm('');
        },
        onError: () => setErrorForm('No se pudo guardar el tratamiento.'),
    });

    const crear = (alTerminar?: () => void) => {
        if (!form.producto.trim()) {
            setErrorForm('El producto es obligatorio.');
            return;
        }
        crearMutation.mutate(undefined, { onSuccess: () => alTerminar?.() });
    };

    const cambiarEstadoMutation = useMutation({
        mutationFn: ({ id, estado }: { id: number; estado: EstadoTratamiento }) =>
            tratamientosApi.cambiarEstado(id, estado),
        onSuccess: invalidar,
    });

    const tituloIncidencia = (incidenciaId: number | null) => {
        if (!incidenciaId) return 'Sin incidencia';
        const incidencia = (incidenciasQuery.data ?? []).find((i) => i.id === incidenciaId);
        return incidencia?.titulo ?? 'Sin incidencia';
    };

    return {
        tratamientos: tratamientosQuery.data ?? [],
        incidencias: incidenciasQuery.data ?? [],
        cargando: tratamientosQuery.isLoading,
        error: tratamientosQuery.error ? 'No se pudieron cargar los tratamientos.' : '',
        tituloIncidencia,

        form,
        set,
        crear,
        creando: crearMutation.isPending,
        errorForm,

        cambiarEstado: (id: number, estado: EstadoTratamiento) =>
            cambiarEstadoMutation.mutate({ id, estado }),
    };
}