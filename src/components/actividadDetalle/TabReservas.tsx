import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Plus, Trash2 } from 'lucide-react';
import { insumosApi } from '../../api/inventario';
import { useActividadInsumoReserva } from '../../hooks/Actividades/useActividadInsumoReserva';
import { Btn, EmptyState } from '../ui/AgroUI';
import ModalProductos from './ModalProductos';

export function TabReservas({ actividadId }: { actividadId: number | undefined }) {
    const {
        reservas, loading, error,
        reservar, reservando, errorReservar,
        ajustarCantidad, liberar, liberando,
    } = useActividadInsumoReserva(actividadId);

    const [modalAbierto, setModalAbierto] = useState(false);

    // El endpoint devuelve insumoId desnudo: el catalogo resuelve el nombre
    const insumosQuery = useQuery({
        queryKey: ['insumos'],
        queryFn: async () => (await insumosApi.listar()).data,
        staleTime: 60_000,
    });

    const insumoPorId = useMemo(
        () => new Map((insumosQuery.data ?? []).map((i) => [i.id, i])),
        [insumosQuery.data],
    );

    const yaReservados = reservas.map((r) => r.insumoId);

    const confirmar = (seleccion: { insumoId: number; cantidad: number }[]) => {
        // El endpoint reserva un insumo por llamada
        for (const { insumoId, cantidad } of seleccion) {
            reservar({ insumoId, cantidadReservada: cantidad });
        }
        setModalAbierto(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                    Lo que esta actividad tiene apartado del inventario.
                </p>
                <Btn onClick={() => setModalAbierto(true)} disabled={!actividadId}>
                    <Plus className="h-4 w-4" />
                    Productos
                </Btn>
            </div>

            {errorReservar && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {errorReservar}
                </div>
            )}
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    No se pudieron cargar las reservas.
                </div>
            )}

            {loading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Cargando reservas…</p>
            ) : reservas.length === 0 ? (
                <EmptyState
                    icon={Package}
                    title="Sin insumos reservados"
                    description="Usa el botón Productos para apartar insumos del inventario para esta actividad."
                />
            ) : (
                <div className="space-y-2">
                    {reservas.map((r) => {
                        const insumo = insumoPorId.get(r.insumoId);
                        const tope = insumo ? insumo.stockDisponible + r.cantidadReservada : Infinity;

                        return (
                            <div
                                key={r.id}
                                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                            >
                                <div className="shrink-0 rounded-lg bg-icon-bg p-2">
                                    <Package size={16} className="text-primary" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-foreground">
                                        {insumo ? insumo.nombre : 'Insumo #' + r.insumoId}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {r.cantidadReservada} {insumo?.unidadUso ?? ''} reservados
                                        {insumo ? ` · quedan ${insumo.stockDisponible} libres` : ''}
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-1">
                                    <button
                                        onClick={() => ajustarCantidad(r.id, Math.max(1, r.cantidadReservada - 1))}
                                        disabled={r.cantidadReservada <= 1}
                                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-base font-bold leading-none text-foreground transition-colors hover:bg-primary/10 disabled:opacity-40"
                                        aria-label="Reservar uno menos"
                                    >
                                        −
                                    </button>
                                    <span className="w-8 text-center text-sm font-bold text-primary">
                                        {r.cantidadReservada}
                                    </span>
                                    <button
                                        onClick={() => ajustarCantidad(r.id, r.cantidadReservada + 1)}
                                        disabled={r.cantidadReservada >= tope}
                                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-base font-bold leading-none text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
                                        aria-label="Reservar uno más"
                                    >
                                        +
                                    </button>
                                    <button
                                        onClick={() => liberar(r.id)}
                                        disabled={liberando}
                                        className="ml-2 rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
                                        aria-label="Liberar la reserva"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <ModalProductos
                abierto={modalAbierto}
                onCerrar={() => setModalAbierto(false)}
                yaReservados={yaReservados}
                onConfirmar={confirmar}
                guardando={reservando}
            />
        </div>
    );
}
