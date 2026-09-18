import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { insumosApi, almacenesApi, categoriasApi, proveedoresApi } from '../api/inventario';
import { ESTADO_INICIAL_INSUMO_FORM } from '../types/inventario';
import type { InsumoFormState, CrearInsumoPayload } from '../types/inventario';
import { usuarioActualId } from './usuarioActual';

interface UseInsumoFormProps {
    isModalOpen: boolean;
    onSuccess: () => void;
    }

    export function useInsumoForm({ isModalOpen, onSuccess }: UseInsumoFormProps) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<InsumoFormState>(ESTADO_INICIAL_INSUMO_FORM);

    const { data: almacenes = [] } = useQuery({
        queryKey: ['almacenes'],
        queryFn: async () => (await almacenesApi.listar()).data,
        enabled: isModalOpen,
    });
    const { data: categorias = [] } = useQuery({
        queryKey: ['categorias'],
        queryFn: async () => (await categoriasApi.listar()).data,
        enabled: isModalOpen,
    });
    const { data: proveedores = [] } = useQuery({
        queryKey: ['proveedores'],
        queryFn: async () => (await proveedoresApi.listar()).data,
        enabled: isModalOpen,
    });

    const crearMutation = useMutation({
        mutationFn: (payload: CrearInsumoPayload) => insumosApi.crear(payload),
        onSuccess: () => {
        setForm(ESTADO_INICIAL_INSUMO_FORM);
        queryClient.invalidateQueries({ queryKey: ['insumos'] });
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
        const payload: CrearInsumoPayload = {
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        presentacionTipo: form.presentacionTipo,
        presentacionCantidad: Number(form.presentacionCantidad),
        presentacionUnidad: form.presentacionUnidad,
        unidadUso: form.unidadUso,
        factorConversionUso: Number(form.factorConversionUso),
        stockPresentacion: Number(form.stockPresentacion),
        stockUso: Number(form.stockUso),
        stockMinimo: Number(form.stockMinimo),
        precioUnitarioPresentacion: Number(form.precioUnitarioPresentacion),
        precioUnitarioUso: Number(form.precioUnitarioUso),
        almacenId: Number(form.almacenId),
        proveedorId: Number(form.proveedorId),
        categoriaId: Number(form.categoriaId),
        tipoInsumo: form.tipoInsumo,
        creadoPorUsuarioId: usuarioActualId(),
        };
        crearMutation.mutate(payload);
    };

    const errorForm =
        crearMutation.error && isAxiosError(crearMutation.error)
        ? crearMutation.error.response?.data?.message ?? 'No se pudo guardar el insumo'
        : crearMutation.error
            ? 'Error inesperado al guardar'
            : null;

    return {
        form,
        almacenes,
        categorias,
        proveedores,
        enviando: crearMutation.isPending,
        errorForm,
        handleFormChange,
        handleCreateSubmit,
    };
    }