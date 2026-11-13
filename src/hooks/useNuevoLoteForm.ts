import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { lotesApi, sublotesApi } from '../api/territorio';
import { mensajeError } from '../api/errores/errores';
import type { Punto } from '../types/territorio';
import { areaPoligonoM2, centroide } from '../utils/geo/geo';

export interface NuevoLoteForm {
    tipo: 'plot' | 'subplot';
    parentId: string;
    nombre: string;
    descripcion: string;
    programaFormacionId: string;
}

const FORM_INICIAL: NuevoLoteForm = {
    tipo: 'plot', parentId: '', nombre: '', descripcion: '', programaFormacionId: '',
};

const AREA_MAXIMA_M2 = 5_000_000;

export function useNuevoLoteForm({ onSuccess }: { onSuccess: () => void }) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<NuevoLoteForm>(FORM_INICIAL);
    const [vertices, setVertices] = useState<Punto[]>([]);
    const [errorLocal, setErrorLocal] = useState<string | null>(null);

    const set = (campo: keyof NuevoLoteForm) => (valor: string) =>
        setForm((prev) => ({ ...prev, [campo]: valor }));

    const agregarVertice = (punto: Punto) => setVertices((prev) => [...prev, punto]);
    const deshacerVertice = () => setVertices((prev) => prev.slice(0, -1));
    const limpiarVertices = () => setVertices([]);

    const areaM2 = Math.round(areaPoligonoM2(vertices));
    const areaHa = areaM2 / 10_000;

    const crearMutation = useMutation({
        mutationFn: async () => {
            const base = {
                nombre: form.nombre,
                vertices,
                centroide: centroide(vertices),
                areaM2,
                descripcion: form.descripcion || undefined,
            };
            if (form.tipo === 'subplot') {
                return sublotesApi.crear({ ...base, loteId: Number(form.parentId) });
            }
            return lotesApi.crear({
                ...base,
                programaFormacionId: form.programaFormacionId ? Number(form.programaFormacionId) : null,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lotes'] });
            queryClient.invalidateQueries({ queryKey: ['sublotes'] });
            setForm(FORM_INICIAL);
            setVertices([]);
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
        if (vertices.length < 3) {
            setErrorLocal('Marca al menos 3 esquinas del terreno haciendo clic en el mapa');
            return;
        }
        if (areaM2 <= 0) {
            setErrorLocal('El polígono no encierra un área válida');
            return;
        }
        if (areaM2 > AREA_MAXIMA_M2) {
            setErrorLocal('El terreno supera 500 ha; revisa las esquinas marcadas');
            return;
        }
        crearMutation.mutate();
    };

    const errorForm =
        errorLocal ??
        (crearMutation.error ? mensajeError(crearMutation.error, 'No se pudo guardar el lote') : null);

    return {
        form,
        set,
        vertices,
        agregarVertice,
        deshacerVertice,
        limpiarVertices,
        areaM2,
        areaHa,
        enviando: crearMutation.isPending,
        errorForm,
        handleSubmit,
    };
}
