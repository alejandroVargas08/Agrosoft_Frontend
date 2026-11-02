import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlaskConical, Plus } from 'lucide-react';
import { insumosApi } from '../../api/inventario';
import { useActividadInsumoUso } from '../../hooks/Actividades/useActividadInsumoUso';
import { Btn, Card, EmptyState, Input, Modal, Select } from '../ui/AgroUI';

const FORM_VACIO = { insumoId: '', cantidadUso: '', costoUnitarioUso: '' };

const pesos = (valor: number) =>
    '$ ' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(valor || 0);

const numero = (valor: number) =>
    new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(valor || 0);

export function TabUsos({ actividadId }: { actividadId: number | undefined }) {
    const { usos, loading, error, registrar, registrando, errorRegistrar } =
        useActividadInsumoUso(actividadId);

    const [abierto, setAbierto] = useState(false);
    const [form, setForm] = useState(FORM_VACIO);

    const catalogoQuery = useQuery({
        queryKey: ['insumos'],
        queryFn: async () => (await insumosApi.listar()).data,
        staleTime: 60_000,
    });

    const catalogo = useMemo(
        () => (catalogoQuery.data ?? []).filter((i) => i.tipoInsumo !== 'herramienta'),
        [catalogoQuery.data],
    );

    const porId = useMemo(() => new Map(catalogo.map((i) => [i.id, i])), [catalogo]);
    const nombreInsumo = (id: number) => porId.get(id)?.nombre ?? 'Insumo #' + id;
    const unidadInsumo = (id: number) => porId.get(id)?.unidadUso ?? '';

    const elegido = form.insumoId ? porId.get(Number(form.insumoId)) : undefined;
    const cantidad = Number(form.cantidadUso) || 0;

    // Los dos avisos del diseño, pero contra el stock de verdad
    const superaStock = !!elegido && cantidad > elegido.stockDisponible;
    const quedaBajoMinimo =
        !!elegido && !superaStock && elegido.stockDisponible - cantidad < elegido.stockMinimo;

    const campo = (clave: keyof typeof FORM_VACIO) => (valor: string) =>
        setForm((previo) => ({ ...previo, [clave]: valor }));

    /** Al elegir el insumo se propone su costo promedio del inventario */
    const elegirInsumo = (valor: string) => {
        const insumo = porId.get(Number(valor));
        setForm((previo) => ({
            ...previo,
            insumoId: valor,
            costoUnitarioUso:
                insumo && insumo.stockUso > 0
                    ? String(Math.round(insumo.valorInventario / insumo.stockUso))
                    : previo.costoUnitarioUso,
        }));
    };

    const cerrar = () => { setAbierto(false); setForm(FORM_VACIO); };

    const completo = form.insumoId !== '' && cantidad > 0 && !superaStock;

    const guardar = (e: React.FormEvent) => {
        e.preventDefault();
        if (!completo) return;
        registrar(
            {
                insumoId: Number(form.insumoId),
                cantidadUso: cantidad,
                costoUnitarioUso: Number(form.costoUnitarioUso) || 0,
            },
            { onSuccess: cerrar },
        );
    };

    return (
        <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
                Si hay una reserva activa para este insumo en esta actividad, se descuenta automáticamente.
            </p>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            {loading ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Cargando usos…</p>
            ) : usos.length === 0 ? (
                <EmptyState
                    icon={FlaskConical}
                    title="Sin insumos usados"
                    description="Cuando se registre el consumo de un insumo, aparecerá aquí."
                />
            ) : (
                usos.map((u) => (
                    <Card key={u.id}>
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="font-medium text-foreground">{nombreInsumo(u.insumoId)}</p>
                                <p className="text-xs text-muted-foreground">
                                    {numero(u.cantidadUso)} {unidadInsumo(u.insumoId)}
                                    {u.movimientoInsumoId ? ` · movimiento #${u.movimientoInsumoId}` : ''}
                                </p>
                            </div>
                            <span className="shrink-0 font-semibold text-primary">{pesos(u.costoTotal)}</span>
                        </div>
                    </Card>
                ))
            )}

            <Btn
                variant="outline"
                onClick={() => setAbierto(true)}
                disabled={!actividadId}
                className="w-full justify-center"
            >
                <Plus size={14} />Registrar insumo usado
            </Btn>

            <Modal open={abierto} onClose={cerrar} title="Registrar insumo usado">
                <form onSubmit={guardar} className="space-y-3">
                    {errorRegistrar && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {errorRegistrar}
                        </div>
                    )}

                    <Select
                        label="Insumo"
                        value={form.insumoId}
                        onChange={elegirInsumo}
                        options={[
                            { value: '', label: 'Seleccionar insumo...' },
                            ...catalogo.map((i) => ({ value: String(i.id), label: i.nombre })),
                        ]}
                    />

                    <div>
                        <Input
                            label="Cantidad" type="number" step="0.01" required
                            value={form.cantidadUso} onChange={campo('cantidadUso')} placeholder="0"
                        />
                        {elegido && (
                            <p className="mt-1 text-xs text-muted-foreground">
                                Stock disponible: {numero(elegido.stockDisponible)} {elegido.unidadUso}
                            </p>
                        )}
                        {superaStock && (
                            <p className="mt-1 text-xs font-medium text-red-600">Supera el stock disponible</p>
                        )}
                        {quedaBajoMinimo && (
                            <p className="mt-1 text-xs text-[#F16C07]">Quedará por debajo del mínimo</p>
                        )}
                    </div>

                    <Input
                        label="Costo unitario" type="number" step="0.01"
                        value={form.costoUnitarioUso} onChange={campo('costoUnitarioUso')} placeholder="0"
                    />

                    <div className="flex gap-3 pt-1">
                        <Btn type="submit" disabled={!completo || registrando} className="flex-1 justify-center">
                            {registrando ? 'Guardando…' : 'Guardar'}
                        </Btn>
                        <Btn variant="outline" onClick={cerrar}>Cancelar</Btn>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
