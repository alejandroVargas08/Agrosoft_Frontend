import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ESTADO_INICIAL_PRODUCTO_AGRO_FORM, type ActualizarProductoAgroPayload, type CrearProductoAgroPayload, type ProductoAgro, type productoAgroFormState } from "../../types/productosAgro";
import { useState } from "react";
import { productosAgroApi } from "../../api/productosAgro/productosAgro";
import { isAxiosError } from "axios";

interface useProductoAgroFormProps {
    productoEnEdicion?: ProductoAgro | null; 
    onSuccess: () => void;
}

export function useProductoAgroForm({productoEnEdicion, onSuccess}: useProductoAgroFormProps) {
    const queryClient = useQueryClient();

    const [form, setForm] = useState<productoAgroFormState>(() => 
    productoEnEdicion ? {
        nombre: productoEnEdicion.nombre,
        unidadBase: productoEnEdicion.unidadBase,
        descripcion: productoEnEdicion.descripcion ?? '',
        imagen: productoEnEdicion.imagen ?? '',
    } : ESTADO_INICIAL_PRODUCTO_AGRO_FORM,
); 

    const invalidarListado = () =>
        queryClient.invalidateQueries({
            queryKey: ['productos-agro']
        });

    const crearMutation = useMutation({
    mutationFn: (payload: CrearProductoAgroPayload) => productosAgroApi.crear(payload),
    onSuccess: () => {
    setForm(ESTADO_INICIAL_PRODUCTO_AGRO_FORM);
    invalidarListado();
    onSuccess(); },
    });

    const actualizarMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ActualizarProductoAgroPayload }) =>
    productosAgroApi.actualizar(id, payload),
    onSuccess: (res) => {
    invalidarListado();
    queryClient.invalidateQueries({ queryKey: ['productos-agro', res.data.id] });
    onSuccess();},
    });

    const set = (campo: keyof productoAgroFormState) => (valor: string) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

    const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CrearProductoAgroPayload = {
        nombre: form.nombre,
        unidadBase: form.unidadBase,
        descripcion: form.descripcion || undefined,
        imagen: form.imagen || undefined,
    };

    if (productoEnEdicion) {
        actualizarMutation.mutate({ id: productoEnEdicion.id, payload });
    } else {
        crearMutation.mutate(payload);
    }};

    const mutacionActiva = productoEnEdicion ? actualizarMutation : crearMutation;
    const errorForm = mutacionActiva.error
        ? isAxiosError(mutacionActiva.error)
        ? mutacionActiva.error.response?.data?.message ?? 'No se pudo guardar el producto'
        : 'Error inesperado al guardar'
    : null;

    return {
    form,
    set,
    handleFormChange,
    handleSubmit,
    guardando: mutacionActiva.isPending,
    errorForm,
    esEdicion: !!productoEnEdicion,
    };
}