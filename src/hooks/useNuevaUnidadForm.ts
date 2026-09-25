import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { unidadesProductivasApi } from '../api/produccion';
import { useTerritorio } from './useTerritorio';

// Campos del diseño (NewProductiveUnitScreen)
const FORM_INICIAL = {
    name: '',
    type: '',
    area: '',
    plotId: '',
    startDate: '',
};

export function useNuevaUnidadForm({ onSuccess }: { onSuccess: () => void }) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState(FORM_INICIAL);
    const [errorLocal, setErrorLocal] = useState<string | null>(null);

    const { lotes } = useTerritorio();

    const set = (campo: keyof typeof FORM_INICIAL) => (valor: string) =>
        setForm((prev) => ({ ...prev, [campo]: valor }));

    const crearMutation = useMutation({
        mutationFn: () =>
            unidadesProductivasApi.crear({
                nombreCultivo: form.name,
                tipoCultivo: form.type,
                loteId: Number(form.plotId),
                fechaSiembra: form.startDate,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['unidades-productivas'] });
            setForm(FORM_INICIAL);
            onSuccess();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorLocal(null);

        if (!form.type) {
            setErrorLocal('Selecciona el tipo de cultivo');
            return;
        }
        if (!form.plotId) {
            setErrorLocal('Selecciona el lote asociado');
            return;
        }
        crearMutation.mutate();
    };

    const errorForm =
        errorLocal ??
        (crearMutation.error && isAxiosError(crearMutation.error)
            ? crearMutation.error.response?.data?.message ?? 'No se pudo guardar la unidad'
            : crearMutation.error
                ? 'Error inesperado al guardar'
                : null);

    return {
        form, set, lotes,
        enviando: crearMutation.isPending,
        errorForm,
        handleSubmit,
    };
}