import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { type CultivoFormState, type CrearCultivoPayload, ESTADO_INICIAL_CULTIVO_FORM } from "../../types/cultivos";
import { lotesApi } from "../../api/actividades/actividades";
import { cultivosApi } from "../../api/cultivo/cultivos";
import { isAxiosError } from "axios";

interface UseCultivoFormProps {
    isModalOpen: boolean;
    onSucces: (loteidCreado: number) => void;
}

export function useCultivoForm({ isModalOpen, onSucces} : UseCultivoFormProps) {
    const queryCliente = useQueryClient();
    const [ form, setForm] = useState<CultivoFormState>(ESTADO_INICIAL_CULTIVO_FORM);

    const loteIdNum = form.loteId ? Number(form.loteId) : undefined;

    const { data: lotes = [] } = useQuery({
        queryKey: ['lotes'],
        queryFn: async () => (await lotesApi.listar()).data,
        enabled: isModalOpen,
    });

    const {data: sublotes = []} = useQuery({
        queryKey: ['sublotes', loteIdNum],
        queryFn : async () => (await lotesApi.sublotesPorLote(loteIdNum!)).data,
        enabled: isModalOpen && !!loteIdNum,
    });

    const crearMutation = useMutation({
        mutationFn: (payload: CrearCultivoPayload) => cultivosApi.crear(payload),
        onSuccess: (_res, payload) => {
            setForm(ESTADO_INICIAL_CULTIVO_FORM); 
            queryCliente.invalidateQueries({ queryKey: ['cultivos'] });
            onSucces (payload.loteId);
        },
    });

    const handleFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> ) => {

            const { name, value} = e.target;
            setForm((prev) => ({ ...prev, [name]: value,
                ...(name === 'loteId' ? {subLoteId: ''} : {}),
            }));
        };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Datos para el formulario', form);
        console.log('Lote Id', loteIdNum);

        if (!loteIdNum) return;

        

        const payload: CrearCultivoPayload = {
        nombreCultivo: form.nombreCultivo,
        tipoCultivo: form.tipoCultivo,
        loteId: loteIdNum,
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
        lotes,
        sublotes,
        handleFormChange,
        handleCreateSubmit,
        creando: crearMutation.isPending,
        errorForm,
    };
}