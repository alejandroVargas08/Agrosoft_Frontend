import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { lotesApi } from '../api/territorio';
import { ESTADO_INICIAL_LOTE_FORM } from '../types/territorio';
import type { LoteFormState, CrearLotePayload, Punto } from '../types/territorio';

interface UseLoteFormProps {
    onSuccess: () => void;
    }

    // "1.85,-76.05\n1.86,-76.04" → [{lat:1.85,lng:-76.05}, {lat:1.86,lng:-76.04}]
    function parsearVertices(texto: string): Punto[] {
    return texto
        .split('\n')
        .map((linea) => linea.trim())
        .filter((linea) => linea.length > 0)
        .map((linea) => {
        const [lat, lng] = linea.split(',').map(Number);
        return { lat, lng };
        });
    }

    export function useLoteForm({ onSuccess }: UseLoteFormProps) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<LoteFormState>(ESTADO_INICIAL_LOTE_FORM);
    const [errorLocal, setErrorLocal] = useState<string | null>(null);

    const crearMutation = useMutation({
        mutationFn: (payload: CrearLotePayload) => lotesApi.crear(payload),
        onSuccess: () => {
        setForm(ESTADO_INICIAL_LOTE_FORM);
        queryClient.invalidateQueries({ queryKey: ['lotes'] });
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

        const vertices = parsearVertices(form.verticesTexto);
        if (vertices.length < 3 || vertices.some((v) => isNaN(v.lat) || isNaN(v.lng))) {
        setErrorLocal('Ingresa al menos 3 vértices válidos, uno por línea en formato lat,lng');
        return;
        }

        const payload: CrearLotePayload = {
        nombre: form.nombre,
        vertices,
        centroide: { lat: Number(form.centroideLat), lng: Number(form.centroideLng) },
        areaM2: Number(form.areaM2),
        descripcion: form.descripcion || undefined,
        };
        crearMutation.mutate(payload);
    };

    const errorForm =
        errorLocal ??
        (crearMutation.error && isAxiosError(crearMutation.error)
        ? crearMutation.error.response?.data?.message ?? 'No se pudo guardar el lote'
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