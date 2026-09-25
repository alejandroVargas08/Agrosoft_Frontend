import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { type CultivoFormState, type CrearCultivoPayload, ESTADO_INICIAL_CULTIVO_FORM } from "../../types/cultivos";
import { lotesApi } from "../../api/actividades/actividades";
import { cultivosApi } from "../../api/cultivo/cultivos";
import { isAxiosError } from "axios";

interface UseCultivoFormProps {
    loteId: number | undefined;
    isModalOpen: boolean;
    onSucces: () => void;
}

export function useCultivoForm({ loteId, isModalOpen, onSucces} : UseCultivoFormProps) {
    const queryCliente = useQueryClient();
    const [ form, setForm] = useState<CultivoFormState>(ESTADO_INICIAL_CULTIVO_FORM);

    const { data: sublotes = [] } = useQuery({
        queryKey: ['sublotes', loteId],
        queryFn: async () => (await lotesApi.sublotesPorLote(loteId!)).data,
        enabled: isModalOpen && !!loteId,
    });

    const crearMutation = useMutation({
        mutationFn: (payload: CrearCultivoPayload) => cultivosApi.crear(payload),
        onSuccess: () => {
            setForm(ESTADO_INICIAL_CULTIVO_FORM); 
            queryCliente.invalidateQueries({ queryKey: ['cultivos', loteId] });
            onSucces ();
        },
    });

    const handleFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> ) => {
            setForm((prev) => ({ ...prev, [e.target.name]: e.target.value}) );
        };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!loteId) return;

        const payload: CrearCultivoPayload = {
        nombreCultivo: form.nombreCultivo,
        tipoCultivo: form.tipoCultivo,
        loteId,
        subLoteId: form.subLoteId ? Number(form.subLoteId) : undefined,
        fechaSiembra: form.fechaSiembra, 
        };
        crearMutation.mutate(payload);
    };

    const errorForm = crearMutation.error
    ? isAxiosError(crearMutation.error)
        ? crearMutation.error.response?.data?.message ?? 'No se puede crear el cultivo' : 'Error al crear el cultivo' : null;

    return {
        form,
        sublotes,
        handleFormChange,
        handleCreateSubmit,
        creando: crearMutation.isPending,
        errorForm,
    };
}