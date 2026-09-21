import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { lotesApi, sublotesApi } from '../api/territorio';
import type { Punto } from '../types/territorio';

export interface NuevoLoteForm {
    tipo: 'plot' | 'subplot';
    parentId: string;
    nombre: string;
    descripcion: string;
    areaHa: string;
    verticesTexto: string; // una línea por vértice: "lat,lng"
}

const FORM_INICIAL: NuevoLoteForm = {
    tipo: 'plot', parentId: '', nombre: '', descripcion: '', areaHa: '', verticesTexto: '',
};

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

// El centroide es el promedio de los vértices
function calcularCentroide(vertices: Punto[]): Punto {
    return {
        lat: vertices.reduce((a, v) => a + v.lat, 0) / vertices.length,
        lng: vertices.reduce((a, v) => a + v.lng, 0) / vertices.length,
    };
}

export function useNuevoLoteForm({ onSuccess }: { onSuccess: () => void }) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<NuevoLoteForm>(FORM_INICIAL);
    const [errorLocal, setErrorLocal] = useState<string | null>(null);

    const set = (campo: keyof NuevoLoteForm) => (valor: string) =>
        setForm((prev) => ({ ...prev, [campo]: valor }));

    const areaM2 = form.areaHa ? (parseFloat(form.areaHa) * 10000).toFixed(0) : '';

    const crearMutation = useMutation({
        mutationFn: async () => {
            const vertices = parsearVertices(form.verticesTexto);
            const base = {
                nombre: form.nombre,
                vertices,
                centroide: calcularCentroide(vertices),
                areaM2: parseFloat(form.areaHa) * 10000,
                descripcion: form.descripcion || undefined,
            };
            if (form.tipo === 'subplot') {
                return sublotesApi.crear({ ...base, loteId: Number(form.parentId) });
            }
            return lotesApi.crear(base);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lotes'] });
            queryClient.invalidateQueries({ queryKey: ['sublotes'] });
            setForm(FORM_INICIAL);
            onSuccess();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorLocal(null);

        if (form.tipo === 'subplot' && !form.parentId) {
            setErrorLocal('Selecciona el lote padre del sublote');
            return;
        }
        if (!(parseFloat(form.areaHa) > 0)) {
            setErrorLocal('Ingresa un área mayor a 0');
            return;
        }
        const vertices = parsearVertices(form.verticesTexto);
        if (vertices.length < 3 || vertices.some((v) => isNaN(v.lat) || isNaN(v.lng))) {
            setErrorLocal('Ingresa al menos 3 vértices válidos, uno por línea en formato lat,lng');
            return;
        }
        crearMutation.mutate();
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
        set,
        areaM2,
        enviando: crearMutation.isPending,
        errorForm,
        handleSubmit,
    };
}