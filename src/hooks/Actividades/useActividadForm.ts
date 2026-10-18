import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { ESTADO_INICIAL_FORM, type ActividadFormState, type CrearActividadPayLoad } from "../../types/actividades";
import { lotesApi, sublotesApi } from "../../api/territorio";
import { actividadesApi, cultivosApi, productosAgroApi } from "../../api/actividades/actividades";
import { mensajeError } from "../../api/errores/errores";

interface UseActividadFormProps {
    isModalOpen: boolean;
    onSuccess: () => void;
    cultivoIdDefault?: number;
}

export function useActividadForm({ isModalOpen, onSuccess, cultivoIdDefault }: UseActividadFormProps) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<ActividadFormState>(ESTADO_INICIAL_FORM);
    const [errorLocal, setErrorLocal] = useState<string | null>(null);

    const { data: lotes = [] } = useQuery({
        queryKey: ['lotes'],
        queryFn: async () => (await lotesApi.listar()).data,
        enabled: isModalOpen,
    });

    const { data: productos = [] } = useQuery({
        queryKey: ['productos-agro'],
        queryFn: async () => (await productosAgroApi.listar()).data,
        enabled: isModalOpen,
    });

    const loteIdNum = form.loteId ? Number(form.loteId) : undefined;
    const { data: sublotes = [] } = useQuery({
        queryKey: ['sublotes', loteIdNum],
        queryFn: async () => (await sublotesApi.porLote(loteIdNum!)).data,
        enabled: !!loteIdNum,
    });

    const { data: cultivos = [] } = useQuery({
        queryKey: ['cultivos', loteIdNum],
        queryFn: async () => (await cultivosApi.listarPorLote(loteIdNum!)).data,
        enabled: !!loteIdNum,
    });

    const crearMutation = useMutation({
        mutationFn: (payload: CrearActividadPayLoad) => actividadesApi.crear(payload),
        onSuccess: (_res, payload) => {
            setForm(ESTADO_INICIAL_FORM);
            queryClient.invalidateQueries({ queryKey: ['cultivos'] });
            queryClient.invalidateQueries({ queryKey: ['cultivos', payload.loteId] });
            queryClient.invalidateQueries({ queryKey: ['actividades'] });
            onSuccess();
        },
    });

    const handleFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
            ...(name === 'loteId' ? { subLoteId: '', cultivoId: '' } : {}),
        }));
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorLocal(null);

        const cultivoId = form.cultivoId ? Number(form.cultivoId) : cultivoIdDefault;
        if (!form.loteId) {
            setErrorLocal('Selecciona el lote de la actividad');
            return;
        }
        if (!cultivoId) {
            setErrorLocal('Selecciona el cultivo de la actividad');
            return;
        }

        const payload: CrearActividadPayLoad = {
            nombre: form.nombre || form.tipo,
            tipo: form.tipo,
            subtipo: form.subtipo || undefined,
            loteId: Number(form.loteId),
            subLoteId: form.subLoteId ? Number(form.subLoteId) : undefined,
            cultivoId,
            productoAgroId: form.productoAgroId ? Number(form.productoAgroId) : undefined,
            fecha: form.fecha,
            horasActividad: Number(form.horasActividad),
            precioHoraActividad: Number(form.precioHoraActividad),
            descripcion: form.descripcion || undefined,
        };
        crearMutation.mutate(payload);
    };

    const errorForm =
        errorLocal ??
        (crearMutation.error ? mensajeError(crearMutation.error, 'No se puede guardar la actividad') : null);

    return {
        form,
        lotes,
        sublotes,
        cultivos,
        productos,
        enviando: crearMutation.isPending,
        errorForm,
        handleFormChange,
        handleCreateSubmit,
    };
}
