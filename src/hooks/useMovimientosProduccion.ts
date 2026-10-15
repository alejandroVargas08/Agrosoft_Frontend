import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { usuarioActualId } from './usuarioActual';
import type { loteProduccion} from '../types/lotesProduccion';
import type { MovimientoProduccionFormState, RegistrarMovimientoProduccionPayload,} from '../types/movimientosProduccion';
import { movimientosProduccionApi } from '../api/movimientosProduccion.ts';

// Nest devuelve `message` como texto o como arreglo (errores de class-validator)
const mensajeDe = (err: unknown, porDefecto: string): string | null => {
    if (!err) return null;
    if (isAxiosError(err)) {
    const msg = (err.response?.data as { message?: string | string[] } | undefined)?.message;
    return Array.isArray(msg) ? msg.join(', ') : msg ?? porDefecto;
    }
    return 'Error inesperado';
};

const estadoInicial = (lote: loteProduccion): MovimientoProduccionFormState => ({
    tipo: 'salida',
    cantidadKg: '',
    costoUnitarioKg: String(lote.costoUnitarioKg),
    precioUnitarioKg: String(lote.precioSugeridoKg),
    ventaId: '',
    descripcion: '',
});

export function useMovimientosProduccion(lote: loteProduccion) {
const queryClient = useQueryClient();
const loteId = lote.id;

const [form, setForm] = useState<MovimientoProduccionFormState>(() => estadoInicial(lote));
const [errorLocal, setErrorLocal] = useState<string | null>(null);

const { data: movimientos = [], isLoading: loading, error } = useQuery({
    queryKey: ['movimientos-produccion', loteId],
    queryFn: async () => (await movimientosProduccionApi.listar(loteId)).data,
    select: (data) => [...data].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()),
});

    const totalEntradas = movimientos.filter((m) => m.tipo === 'entrada').reduce((a, m) => a + m.cantidadKg, 0);
    const totalSalidas = movimientos.filter((m) => m.tipo === 'salida').reduce((a, m) => a + m.cantidadKg, 0);

    const registrarMutation = useMutation({
    mutationFn: (payload: RegistrarMovimientoProduccionPayload) =>
        movimientosProduccionApi.registrar(loteId, payload),
    onSuccess: () => {
        setForm(estadoInicial(lote));
        queryClient.invalidateQueries({ queryKey: ['movimientos-produccion', loteId] });
        queryClient.invalidateQueries({ queryKey: ['lotesProduccion'] });
    },
});

const set = (campo: Exclude<keyof MovimientoProduccionFormState, 'tipo'>) => (valor: string) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

const setTipo = (valor: string) => {
    if (valor === 'entrada' || valor === 'salida') setForm((prev) => ({ ...prev, tipo: valor }));
    };

const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    const usuarioId = usuarioActualId();
    if (!usuarioId) return setErrorLocal('No se encontró el usuario autenticado. Vuelve a iniciar sesión.');

    const cantidadKg = Number(form.cantidadKg);
    if (!(cantidadKg > 0)) return setErrorLocal('La cantidad debe ser mayor a 0.');
    if (Number(form.costoUnitarioKg) < 0 || Number(form.precioUnitarioKg) < 0)
        return setErrorLocal('El costo y el precio no pueden ser negativos.');


    if (form.tipo === 'salida' && !form.ventaId && !form.descripcion.trim())
        return setErrorLocal('Una salida requiere una venta asociada o una descripción del motivo.');

    registrarMutation.mutate({
        tipo: form.tipo,
        cantidadKg,
        costoUnitarioKg: Number(form.costoUnitarioKg) || 0,
        precioUnitarioKg: Number(form.precioUnitarioKg) || 0,
        ventaId: form.ventaId ? Number(form.ventaId) : undefined,
        descripcion: form.descripcion.trim() || undefined,
        usuarioId,
    });
    };

return {
    movimientos,
    loading,
    error: error ? 'No se pudieron cargar los movimientos' : null,
    totalEntradas,
    totalSalidas,
    form,
    set,
    setTipo,
    handleSubmit,
    registrando: registrarMutation.isPending,
    errorForm: errorLocal ?? mensajeDe(registrarMutation.error, 'No se pudo registrar el movimiento'),
    };
}