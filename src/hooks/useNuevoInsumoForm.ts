import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { insumosApi, almacenesApi, categoriasApi, proveedoresApi } from '../api/inventario';
import { ESTADO_INICIAL_INSUMO_FORM } from '../types/inventario';
import type { InsumoFormState, CrearInsumoPayload } from '../types/inventario';
import { usuarioActualId } from './usuarioActual';

export function useNuevoInsumoForm({ onSuccess }: { onSuccess: () => void }) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<InsumoFormState>(ESTADO_INICIAL_INSUMO_FORM);

    const set = (campo: keyof InsumoFormState) => (valor: string) =>
        setForm((prev) => ({ ...prev, [campo]: valor }));

    // ----- Catálogos -----
    const { data: almacenes = [] } = useQuery({
        queryKey: ['almacenes'],
        queryFn: async () => (await almacenesApi.listar()).data,
    });
    const { data: categorias = [] } = useQuery({
        queryKey: ['categorias'],
        queryFn: async () => (await categoriasApi.listar()).data,
    });
    const { data: proveedores = [] } = useQuery({
        queryKey: ['proveedores'],
        queryFn: async () => (await proveedoresApi.listar()).data,
    });

    // ----- Crear categoría / proveedor sin salir del formulario -----
    const [nuevaCategoria, setNuevaCategoria] = useState('');
    const crearCategoria = useMutation({
        mutationFn: () =>
            categoriasApi.crear({ nombre: nuevaCategoria, tipoInsumo: form.tipoInsumo }),
        onSuccess: async (res) => {
            setNuevaCategoria('');
            await queryClient.invalidateQueries({ queryKey: ['categorias'] });
            setForm((prev) => ({ ...prev, categoriaId: String(res.data.id) }));
        },
    });

    const [nuevoProveedor, setNuevoProveedor] = useState('');
    const crearProveedor = useMutation({
        mutationFn: () => proveedoresApi.crear({ nombre: nuevoProveedor }),
        onSuccess: async (res) => {
            setNuevoProveedor('');
            await queryClient.invalidateQueries({ queryKey: ['proveedores'] });
            setForm((prev) => ({ ...prev, proveedorId: String(res.data.id) }));
        },
    });

    // ----- Guardar insumo -----
    const crearMutation = useMutation({
        mutationFn: (payload: CrearInsumoPayload) => insumosApi.crear(payload),
        onSuccess: () => {
            setForm(ESTADO_INICIAL_INSUMO_FORM);
            queryClient.invalidateQueries({ queryKey: ['insumos'] });
            onSuccess();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const factor = Number(form.factorConversionUso) || 1;
        const precioPresentacion = Number(form.precioUnitarioPresentacion) || 0;
        const proveedorId = Number(form.proveedorId);

        crearMutation.mutate({
            nombre: form.nombre,
            descripcion: form.descripcion || undefined,
            presentacionTipo: form.presentacionTipo,
            presentacionCantidad: 1,
            presentacionUnidad: form.unidadUso,
            unidadUso: form.unidadUso,
            factorConversionUso: factor,
            stockPresentacion: 0,
            stockUso: 0,
            stockMinimo: Number(form.stockMinimo),
            precioUnitarioPresentacion: precioPresentacion,
            precioUnitarioUso: precioPresentacion / factor,
            almacenId: Number(form.almacenId),
            proveedorId: Number.isNaN(proveedorId) || proveedorId === 0 ? undefined : proveedorId,
            categoriaId: Number(form.categoriaId),
            tipoInsumo: form.tipoInsumo,
            creadoPorUsuarioId: usuarioActualId(),
        });
    };

    const errorForm =
        crearMutation.error && isAxiosError(crearMutation.error)
            ? crearMutation.error.response?.data?.message ?? 'No se pudo guardar el insumo'
            : crearMutation.error
                ? 'Error inesperado al guardar'
                : null;

    return {
        form, set,
        almacenes, categorias, proveedores,
        nuevaCategoria, setNuevaCategoria, crearCategoria,
        nuevoProveedor, setNuevoProveedor, crearProveedor,
        enviando: crearMutation.isPending,
        errorForm,
        handleSubmit,
    };
}