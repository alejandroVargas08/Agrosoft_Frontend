import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { sublotesApi } from '../api/territorio';
import { ESTADO_INICIAL_LOTE_FORM } from '../types/territorio';
import type { LoteFormState, CrearSubLotePayload, Punto } from '../types/territorio';

interface UseSubloteFormProps {
    loteId?: number;
    onSuccess: () => void;
    }

    function parsearVertices(texto: string): Punto[] {
    return texto
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => {
        const [lat, lng] = l.split(',').map(Number);
        return { lat, lng };
        });
    }

    export function useSubloteForm({ loteId, onSuccess }: UseSubloteFormProps) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<LoteFormState>(ESTADO_INICIAL_LOTE_FORM);
    const [errorLocal, setErrorLocal] = useState<string | null>(null);

    const crearMutation = useMutation({
        mutationFn: (payload: CrearSubLotePayload) => sublotesApi.crear(payload),
        onSuccess: () => {
        setForm(ESTADO_INICIAL_LOTE_FORM);
        queryClient.invalidateQueries({ queryKey: ['sublotes', loteId] });
        onSuccess();
        },
    });

    const handleFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorLocal(null);

        if (!loteId) {
        setErrorLocal('Selecciona un lote primero');
        return;
        }

        const vertices = parsearVertices(form.verticesTexto);
        if (vertices.length < 3 || vertices.some((v) => isNaN(v.lat) || isNaN(v.lng))) {
        setErrorLocal('Ingresa al menos 3 vértices válidos, uno por línea en formato lat,lng');
        return;
        }

        crearMutation.mutate({
        loteId,
        nombre: form.nombre,
        vertices,
        centroide: { lat: Number(form.centroideLat), lng: Number(form.centroideLng) },
        areaM2: Number(form.areaM2),
        descripcion: form.descripcion || undefined,
        });
    };

    const errorForm =
        errorLocal ??
        (crearMutation.error && isAxiosError(crearMutation.error)
        ? crearMutation.error.response?.data?.message ?? 'No se pudo guardar el sublote'
        : crearMutation.error
            ? 'Error inesperado al guardar'
            : null);

    return {
        form,
        enviando: crearMutation.isPending,
        errorForm,
        handleFormChange,
        handleCreateSubmit,
    };
}