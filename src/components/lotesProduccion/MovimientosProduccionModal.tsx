import { ArrowDown, ArrowUp, Scale } from 'lucide-react';
import { Badge, Btn, Card, EmptyState, Input, Modal, Select, StatCard } from '../ui/AgroUI';
import { useMovimientosProduccion } from '../../hooks/useMovimientosProduccion';
import type { loteProduccion } from '../../types/lotesProduccion';

const cop = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const kg = (n: number) => `${n.toLocaleString('es-CO')} kg`;
const fechaHora = (iso: string) =>
    new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

interface Props {
    lote: loteProduccion;
    nombreProducto: string;
    onClose: () => void;
}

export function MovimientosProduccionModal({ lote, nombreProducto, onClose }: Props) {
    const {
    movimientos, loading, error, totalEntradas, totalSalidas,
    form, set, setTipo, handleSubmit, registrando, errorForm,
    } = useMovimientosProduccion(lote);

return (
    <Modal open onClose={onClose} title={`Movimientos · ${nombreProducto}`}>
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <StatCard icon={ArrowUp} label="Entradas" value={kg(totalEntradas)} color="emerald" />
                <StatCard icon={ArrowDown} label="Salidas" value={kg(totalSalidas)} color="red" />
                <StatCard icon={Scale} label="Neto" value={kg(totalEntradas - totalSalidas)} color="blue" />
            </div>



        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border p-3">
            <p className="text-sm font-semibold text-foreground">Registrar movimiento</p>
            <p className="text-xs text-muted-foreground">
            Esto deja el movimiento en el kárdex del lote; no modifica el «stock disponible». Para descontar stock usa el botón «Descontar stock» del lote.
            </p>
            {errorForm && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errorForm}</div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <Select
                label="Tipo"
                value={form.tipo}
                onChange={setTipo}
                options={[
                { value: 'salida', label: 'Salida' },
                { value: 'entrada', label: 'Entrada' },
                ]}
            />
            <Input label="Cantidad (kg)" type="number" step="any" required value={form.cantidadKg} onChange={set('cantidadKg')} />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Input label="Costo (COP/kg)" type="number" step="any" required value={form.costoUnitarioKg} onChange={set('costoUnitarioKg')} />
                <Input label="Precio (COP/kg)" type="number" step="any" required value={form.precioUnitarioKg} onChange={set('precioUnitarioKg')} />
            </div>

            {form.tipo === 'salida' && (
                <Input
                label="N.º de venta (opcional)" type="number" placeholder="Si es por una venta"
                value={form.ventaId} onChange={set('ventaId')}
            />
            )}

            <Input
                label={form.tipo === 'salida' ? 'Motivo (obligatorio si no hay venta)' : 'Descripción (opcional)'}
                value={form.descripcion} onChange={set('descripcion')}
                placeholder={form.tipo === 'salida' ? 'Ej: merma, obsequio, daño' : 'Ej: cosecha adicional'}
            />

            <Btn type="submit" disabled={registrando} className="w-full justify-center">
                {registrando ? 'Registrando...' : 'Registrar'}
            </Btn>
        </form>

        {loading && <p className="text-sm text-muted-foreground">Cargando movimientos...</p>}
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">{error}</div>}

        <div className="space-y-2">
            {movimientos.map((m) => {
                const esEntrada = m.tipo === 'entrada';
                return (
                <Card key={m.id}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${esEntrada ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {esEntrada ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">{esEntrada ? 'Entrada' : 'Salida'}</p>
                                <p className="text-xs text-muted-foreground">{fechaHora(m.fecha)} · Usuario #{m.usuarioId}</p>
                            {m.descripcion && <p className="text-xs text-muted-foreground">{m.descripcion}</p>}
                            </div>
                        </div>

                        <div className="text-right shrink-0">
                            <p className={`font-bold ${esEntrada ? 'text-emerald-600' : 'text-red-600'}`}>
                                {esEntrada ? '+' : '-'}{kg(m.cantidadKg)}
                            </p>
                            <p className="text-xs text-muted-foreground">Costo {cop(m.costoTotal)}</p>
                        </div>
                    </div>
                {m.ventaId && (
                    <div className="mt-2"><Badge color="info">Venta #{m.ventaId}</Badge></div>
                )}
                </Card>
                );
            })}
        </div>

        {!loading && movimientos.length === 0 && (
            <EmptyState title="Sin movimientos" description="Cuando registres una entrada o una salida de este lote, aparecerá aquí." />
        )}
        </div>
    </Modal>
);
}