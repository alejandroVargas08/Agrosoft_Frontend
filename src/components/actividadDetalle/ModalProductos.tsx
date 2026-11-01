import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Search, X } from 'lucide-react';
import { categoriasApi, insumosApi } from '../../api/inventario';
import { Btn } from '../ui/AgroUI';
import type { Insumo } from '../../types/inventario';

interface Props {
    abierto: boolean;
    onCerrar: () => void;
    /** Insumos que la actividad ya tiene reservados: no se vuelven a ofrecer */
    yaReservados: number[];
    onConfirmar: (seleccion: { insumoId: number; cantidad: number }[]) => void;
    guardando?: boolean;
}

/**
 * El modal de productos del Figma. Alla lista `INVENTORY` filtrado por
 * `type === 'input'`; aqui son los insumos que no son herramienta.
 *
 * El tope de cada contador es `stockDisponible`, no `stockUso`: lo disponible
 * ya descuenta lo que otras actividades tienen reservado.
 */
export default function ModalProductos({ abierto, onCerrar, yaReservados, onConfirmar, guardando }: Props) {
    const [busqueda, setBusqueda] = useState('');
    const [cantidades, setCantidades] = useState<Record<number, number>>({});

    const insumosQuery = useQuery({
        queryKey: ['insumos'],
        queryFn: async () => (await insumosApi.listar()).data,
        enabled: abierto,
        staleTime: 60_000,
    });

    const categoriasQuery = useQuery({
        queryKey: ['categorias-inventario'],
        queryFn: async () => (await categoriasApi.listar()).data,
        enabled: abierto,
        staleTime: 5 * 60_000,
    });

    const nombreCategoria = useMemo(() => {
        const mapa = new Map((categoriasQuery.data ?? []).map((c) => [c.id, c.nombre]));
        return (id: number) => mapa.get(id) ?? 'Sin categoría';
    }, [categoriasQuery.data]);

    const disponibles = useMemo(
        () =>
            (insumosQuery.data ?? []).filter(
                (i) => i.tipoInsumo !== 'herramienta' && !yaReservados.includes(i.id),
            ),
        [insumosQuery.data, yaReservados],
    );

    const termino = busqueda.trim().toLowerCase();
    const visibles = termino
        ? disponibles.filter((i) => i.nombre.toLowerCase().includes(termino))
        : disponibles;

    const seleccionados = Object.values(cantidades).filter((c) => c > 0).length;

    const ajustar = (insumo: Insumo, delta: number) =>
        setCantidades((previo) => ({
            ...previo,
            [insumo.id]: Math.max(0, Math.min(insumo.stockDisponible, (previo[insumo.id] ?? 0) + delta)),
        }));

    const cerrar = () => { setBusqueda(''); setCantidades({}); onCerrar(); };

    const confirmar = () => {
        const seleccion = Object.entries(cantidades)
            .filter(([, cantidad]) => cantidad > 0)
            .map(([insumoId, cantidad]) => ({ insumoId: Number(insumoId), cantidad }));
        if (seleccion.length > 0) onConfirmar(seleccion);
    };

    if (!abierto) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            <div className="absolute inset-0 bg-black/40" onClick={cerrar} />

            <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-card shadow-2xl sm:max-h-[85vh] sm:max-w-2xl sm:rounded-2xl">
                <header className="flex shrink-0 items-center gap-3 border-b border-border p-4">
                    <h3 className="flex-1 font-semibold text-foreground">Productos</h3>
                    <button
                        onClick={cerrar}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                        aria-label="Cerrar"
                    >
                        <X size={18} />
                    </button>
                </header>

                <div className="shrink-0 border-b border-border px-4 py-3">
                    <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2.5">
                        <Search size={14} className="shrink-0 text-muted-foreground" />
                        <input
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar producto por nombre..."
                            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                            autoFocus
                        />
                        {busqueda && (
                            <button onClick={() => setBusqueda('')} className="text-muted-foreground hover:text-foreground">
                                <X size={13} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto p-4">
                    {insumosQuery.isLoading ? (
                        <p className="py-12 text-center text-sm text-muted-foreground">Cargando insumos…</p>
                    ) : insumosQuery.isError ? (
                        <p className="py-12 text-center text-sm text-red-600">No se pudo cargar el inventario.</p>
                    ) : visibles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Package size={30} className="mb-2 text-muted-foreground/40" />
                            <p className="mb-1 text-sm font-semibold text-foreground">Sin resultados</p>
                            <p className="text-xs text-muted-foreground">
                                {termino
                                    ? `No hay productos con "${busqueda}"`
                                    : 'Todos los insumos del inventario ya están reservados en esta actividad'}
                            </p>
                        </div>
                    ) : (
                        visibles.map((insumo) => {
                            const cantidad = cantidades[insumo.id] ?? 0;
                            const elegido = cantidad > 0;
                            const sinStock = insumo.stockDisponible <= 0;
                            const stockBajo = !sinStock && insumo.stockDisponible < insumo.stockMinimo;

                            return (
                                <div
                                    key={insumo.id}
                                    className={`flex items-center gap-3 rounded-xl border-2 p-3 transition-all ${
                                        elegido ? 'border-primary bg-primary/5' : 'border-border bg-card'
                                    } ${sinStock ? 'pointer-events-none opacity-50' : ''}`}
                                >
                                    <div className="shrink-0 rounded-lg bg-icon-bg p-2">
                                        <Package size={16} className="text-primary" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                                            <p className="text-sm font-semibold leading-tight text-foreground">
                                                {insumo.nombre}
                                            </p>
                                            {sinStock && (
                                                <span className="shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                                                    Sin stock
                                                </span>
                                            )}
                                            {stockBajo && (
                                                <span className="shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                                                    Stock bajo
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {insumo.stockDisponible} {insumo.unidadUso} disponibles ·{' '}
                                            {nombreCategoria(insumo.categoriaId)}
                                        </p>
                                    </div>

                                    <div className="shrink-0">
                                        {elegido ? (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => ajustar(insumo, -1)}
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-base font-bold leading-none text-foreground transition-colors hover:bg-primary/10"
                                                >
                                                    −
                                                </button>
                                                <span className="w-8 text-center text-sm font-bold text-primary">
                                                    {cantidad}
                                                </span>
                                                <button
                                                    onClick={() => ajustar(insumo, 1)}
                                                    disabled={cantidad >= insumo.stockDisponible}
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-base font-bold leading-none text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => ajustar(insumo, 1)}
                                                disabled={sinStock}
                                                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
                                            >
                                                Agregar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <footer className="shrink-0 border-t border-border bg-card p-4">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-foreground">
                                {seleccionados > 0
                                    ? `${seleccionados} producto${seleccionados === 1 ? '' : 's'} seleccionado${seleccionados === 1 ? '' : 's'}`
                                    : 'Ningún producto seleccionado'}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {seleccionados === 0
                                    ? 'Agrega al menos un producto para confirmar'
                                    : 'Se reservarán para esta actividad'}
                            </p>
                        </div>
                        <Btn onClick={confirmar} disabled={seleccionados === 0 || guardando}>
                            {guardando ? 'Reservando…' : 'Confirmar'}
                        </Btn>
                    </div>
                </footer>
            </div>
        </div>
    );
}
