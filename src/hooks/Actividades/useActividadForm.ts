import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { ESTADO_INICIAL_FORM, type ActividadFormState, type CrearActividadPayLoad } from "../../types/actividades";
import { actividadesApi, cultivosApi, lotesApi, productosAgroApi } from "../../api/actividades";
import { isAxiosError } from "axios";

interface UseActividadFormProps {
    isModalOpen: boolean;
    onSuccess: () => void; 
    cultivoIdDefault?: number;
}

export function useActividadForm ({ isModalOpen, onSuccess, cultivoIdDefault = 1 }: UseActividadFormProps) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<ActividadFormState>(ESTADO_INICIAL_FORM);

    // Solo pide el catalogo de lotes, si el modal esta abierto
    const {data: lotes = [] } = useQuery({
        queryKey: ['lotes'],
        queryFn: async () => (await lotesApi.listar()).data,
        enabled: isModalOpen,
    });

    // Catalogo de Porductos, solo si esta abierto
    const { data: productos = [] } = useQuery ({
        queryKey: ['productos-agro'],
        queryFn: async() => (await productosAgroApi.listar()).data,
        enabled: isModalOpen,
    });

    //Buslotes y cultivos dependen del lote que se escoga, por lo cual 
    // se agrega a la querykey, para que cada uno tenga su propi entrada al caché
    const loteIdNum = form.loteId ? Number (form.loteId) : undefined;

    const {data: sublotes = []} = useQuery({
        queryKey: ['sublotes', loteIdNum],
        queryFn: async () => ( await lotesApi.sublotesPorLote(loteIdNum!)).data,
        enabled: !!loteIdNum,
    });

    const { data: cultivos = [] } = useQuery({
        queryKey: ['cultivos', loteIdNum],
        queryFn: async() => (await cultivosApi.listarPorLote(loteIdNum!)).data,
        enabled: !!loteIdNum,
    });

    //Mutación: crear Actividad
    const crearMutation = useMutation({
        mutationFn: (payload: CrearActividadPayLoad) => actividadesApi.crear(payload),
        onSuccess: () => {
            setForm(ESTADO_INICIAL_FORM);

            // Inavlida el cache para refrescar la lista de actividades, del cultivo
            queryClient.invalidateQueries({ queryKey: ['actividadees', cultivoIdDefault] }); //Refresca la tabla
            onSuccess(); // Cierra el modal
        },
    }); 

    const handleFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value}));
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: CrearActividadPayLoad = {
            nombre: form.nombre,
            tipo: form.tipo,
            subtipo: form.subtipo || undefined,
            loteId: Number(form.loteId),
            subLoteId: form.subLoteId ? Number(form.subLoteId) : undefined,
            cultivoId:form.cultivoId ?  Number(form.cultivoId) : cultivoIdDefault,
            productoAgroId: form.productoAgroId ? Number(form.productoAgroId) : undefined,
            fecha: form.fecha,
            horasActividad: Number(form.horasActividad),
            precioHoraActividad: Number (form.precioHoraActividad),
            descripcion: form.descripcion || undefined,
            creadoPorUsuarioId: 1, // Valor por defecto, o el usuario actual
        };
        crearMutation.mutate(payload);
    };

    const errorForm = 
        crearMutation.error && isAxiosError(crearMutation.error)
        ? (crearMutation.error.response?.data as {message?: string})?.message ?? 'No se puede guardar la actividad'
        : crearMutation.error
        ? 'Error inesperado al guardar'
        : null;

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