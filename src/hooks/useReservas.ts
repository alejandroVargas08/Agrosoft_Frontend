import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { insumosApi, reservasApi } from '../api/inventario';
import type { Reserva, CrearReservaPayload } from '../types/inventario';
import { usuarioActualId } from './usuarioActual';

const FORM_INICIAL = { insumoId: '', cantidad: '', fechaReserva: '', motivo: '' };

export function useReservas() {
    const queryClient = useQueryClient();
    const [form, setForm] = useState(FORM_INICIAL);
    const [reservas, setReservas] = useState<Reserva[]>([]);
    const [errorLocal, setErrorLocal] = useState<string | null>(null);

    const { data: insumos = [] } = useQuery({
        queryKey: ['insumos', 'todos'],
        queryFn: async () => (await insumosApi.listar()).data,
    });

    const actualizarEnLista = (r: Reserva) =>
        setReservas((prev) => prev.map((x) => (x.id === r.id ? r : x)));

    const crearMutation = useMutation({
        mutationFn: (payload: CrearReservaPayload) => reservasApi.crear(payload),
        onSuccess: (res) => {
        setReservas((prev) => [res.data, ...prev]);
        setForm(FORM_INICIAL);
        queryClient.invalidateQueries({ queryKey: ['insumos'] });
        },
    });

    const confirmarMutation = useMutation({
        mutationFn: (id: number) => reservasApi.confirmar(id),
        onSuccess: (res) => {
        actualizarEnLista(res.data);
        queryClient.invalidateQueries({ queryKey: ['insumos'] });
        },
    });

    const cancelarMutation = useMutation({
        mutationFn: (id: number) => reservasApi.cancelar(id),
        onSuccess: (res) => {
        actualizarEnLista(res.data);
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
        crearMutation.mutate({
        insumoId: Number(form.insumoId),
        cantidad: Number(form.cantidad),
        fechaReserva: form.fechaReserva,
        motivo: form.motivo || undefined,
        usuarioId,
        });
    };

    const errorForm =
        errorLocal ??
        (crearMutation.error && isAxiosError(crearMutation.error)
        ? crearMutation.error.response?.data?.message ?? 'No se pudo crear la reserva'
        : crearMutation.error
            ? 'Error inesperado'
            : null);

    const nombreInsumo = (id: number) => insumos.find((i) => i.id === id)?.nombre ?? `#${id}`;

    return {
        form, insumos, reservas,
        enviando: crearMutation.isPending,
        errorForm, handleFormChange, handleSubmit, nombreInsumo,
        confirmar: (id: number) => confirmarMutation.mutate(id),
        cancelar: (id: number) => cancelarMutation.mutate(id),
    };
}