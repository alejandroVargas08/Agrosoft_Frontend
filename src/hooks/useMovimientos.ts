import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { insumosApi, almacenesApi, movimientosApi } from '../api/inventario';
import type { Movimiento, RegistrarMovimientoPayload, TipoMovimiento } from '../types/inventario';
import { usuarioActualId } from './usuarioActual';

const FORM_INICIAL = {
    insumoId: '',
    tipo: 'entrada' as TipoMovimiento,
    cantidadPresentacion: '',
    descripcion: '',
    almacenOrigenId: '',
    almacenDestinoId: '',
};

export function useMovimientos() {
    const queryClient = useQueryClient();
    const [form, setForm] = useState(FORM_INICIAL);
    const [registrados, setRegistrados] = useState<Movimiento[]>([]);
    const [errorLocal, setErrorLocal] = useState<string | null>(null);

    const { data: insumos = [] } = useQuery({
        queryKey: ['insumos', 'todos'],
        queryFn: async () => (await insumosApi.listar()).data,
    });
    const { data: almacenes = [] } = useQuery({
        queryKey: ['almacenes'],
        queryFn: async () => (await almacenesApi.listar()).data,
    });

    const insumoSeleccionado = insumos.find((i) => i.id === Number(form.insumoId)) ?? null;

    const cantidadUsoCalculada = insumoSeleccionado
        ? Number(form.cantidadPresentacion || 0) * (insumoSeleccionado.factorConversionUso || 1)
        : 0;

    const registrarMutation = useMutation({
        mutationFn: (payload: RegistrarMovimientoPayload) => movimientosApi.registrar(payload),
        onSuccess: (res) => {
        setRegistrados((prev) => [res.data, ...prev]);
        setForm(FORM_INICIAL);
        queryClient.invalidateQueries({ queryKey: ['insumos'] });
        },
    });

    const handleFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorLocal(null);

        const usuarioId = usuarioActualId();
        if (!usuarioId) {
        setErrorLocal('No se encontró el usuario autenticado. Vuelve a iniciar sesión.');
        return;
        }
        if (!insumoSeleccionado) {
        setErrorLocal('Selecciona un insumo.');
        return;
        }
        if (form.tipo === 'traslado' && form.almacenOrigenId === form.almacenDestinoId) {
        setErrorLocal('El almacén de origen y destino deben ser distintos.');
        return;
        }

        registrarMutation.mutate({
        insumoId: insumoSeleccionado.id,
        tipo: form.tipo,
        cantidadPresentacion: Number(form.cantidadPresentacion),
        cantidadUso: cantidadUsoCalculada,
        descripcion: form.descripcion || undefined,
        usuarioId,
        almacenOrigenId: form.almacenOrigenId ? Number(form.almacenOrigenId) : undefined,
        almacenDestinoId: form.almacenDestinoId ? Number(form.almacenDestinoId) : undefined,
        });
    };

    const errorForm =
        errorLocal ??
        (registrarMutation.error && isAxiosError(registrarMutation.error)
        ? registrarMutation.error.response?.data?.message ?? 'No se pudo registrar el movimiento'
        : registrarMutation.error
            ? 'Error inesperado'
            : null);

    const nombreInsumo = (id: number) => insumos.find((i) => i.id === id)?.nombre ?? `#${id}`;

    return {
        form, insumos, almacenes, registrados,
        insumoSeleccionado, cantidadUsoCalculada,
        enviando: registrarMutation.isPending,
        errorForm, handleFormChange, handleSubmit, nombreInsumo,
    };
}