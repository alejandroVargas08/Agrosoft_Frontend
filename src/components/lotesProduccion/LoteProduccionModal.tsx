import { Btn, Input, Modal, Select } from '../ui/AgroUI';
import { useLoteProduccionForm } from '../../hooks/useLoteProduccionForm';
import type { loteProduccion } from '../../types/lotesProduccion';
import type { ProductoAgro } from '../../types/productosAgro';
import type { Lote, SubLote } from '../../types/territorio';

const cop = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const CALIDADES = ['A', 'B', 'C'];
interface Props {
    lote: loteProduccion | null;
    onClose: () => void;
}

export function LoteProduccionModal({ lote, onClose }: Props) {
    const {
        form, set, productos, lotesTerreno, cultivos, sublotes, actividades,
        costoTotalEstimado, handleSubmit, guardando, errorForm, esEdicion,
    } = useLoteProduccionForm({ loteEnEdicion: lote, onSuccess: onClose });

const calidades = [...new Set([...CALIDADES, form.calidad].filter(Boolean))];

return (
    <Modal open onClose={onClose} title={esEdicion ? 'Editar lote de producción' : 'Nuevo lote de producción'}>
        <form onSubmit={handleSubmit} className="space-y-4">
        {errorForm && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errorForm}</div>
        )}

        <Select
            label="Producto"
            value={form.productoAgroId}
            onChange={set('productoAgroId')}
            options={[
            { value: '', label: productos.length ? 'Seleccione...' : 'Primero registra un producto agro' },
            ...productos.map((p: ProductoAgro) => ({ value: String(p.id), label: `${p.nombre} (${p.unidadBase})` })),
            ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
            label="Lote"
            value={form.loteId}
            onChange={set('loteId')}
            options={[
                { value: '', label: 'Seleccione...' },
                ...lotesTerreno.map((l: Lote) => ({ value: String(l.id), label: l.nombre })),
                ]}
            />

            <Select
            label="Sublote (opcional)"
            value={form.subLoteId}
            onChange={set('subLoteId')}
            options={[
                { value: '', label: form.loteId ? 'Ninguno' : 'Primero elige un lote' },
                ...sublotes.map((s: SubLote) => ({ value: String(s.id), label: s.nombre })),
            ]}
            />
        </div>

        <Select
            label="Cultivo"
            value={form.cultivoId}
            onChange={set('cultivoId')}
            options={[
            { value: '', label: form.loteId ? 'Seleccione...' : 'Primero elige un lote' },
            ...cultivos.map((c) => ({ value: String(c.id), label: c.nombreCultivo })),
            ]}
        />

        <Select
            label="Actividad de cosecha (opcional)"
            value={form.actividadesCosechaId}
            onChange={set('actividadesCosechaId')}
            options={[
            { value: '', label: form.cultivoId ? 'Ninguna' : 'Primero elige un cultivo' },
            ...actividades.map((a) => ({
                value: String(a.id),
                label: `${a.tipo}${a.subtipo ? ` — ${a.subtipo}` : ''} · ${a.fecha}`,
            })),
            ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
            label="Calidad"
            value={form.calidad}
            onChange={set('calidad')}
            options={[
                { value: '', label: 'Seleccione...' },
                ...calidades.map((c) => ({ value: c, label: c.length === 1 ? `Calidad ${c}` : c })),
            ]}
        />
            <Input label="Cantidad (kg)" type="number" step="any" required value={form.cantidadKg} onChange={set('cantidadKg')} />
            <Input
            label="Stock disponible (kg)" type="number" step="any"
            placeholder="= cantidad" value={form.stockDisponibleKg} onChange={set('stockDisponibleKg')}
        />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Costo unitario (COP/kg)" type="number" step="any" required value={form.costoUnitarioKg} onChange={set('costoUnitarioKg')} />
            <Input label="Precio sugerido (COP/kg)" type="number" step="any" required value={form.precioSugeridoKg} onChange={set('precioSugeridoKg')} />
        </div>

        <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-sm text-primary">
            Costo total estimado: <strong>{cop(costoTotalEstimado)}</strong>
            <span className="text-muted-foreground"> · el sistema lo recalcula (cantidad × costo unitario)</span>
        </div>

        <div className="flex gap-3 pt-2">
            <Btn type="submit" disabled={guardando} className="flex-1 justify-center">
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear lote'}
            </Btn>
            <Btn variant="outline" onClick={onClose}>Cancelar</Btn>
        </div>
        </form>
    </Modal>
    );
}