import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Beaker, Plus, Trash2 } from 'lucide-react';
import { insumosApi } from '../../api/inventario';
import { useActividadInsumos } from '../../hooks/Actividades/useActividadInsumos';
import { Btn, Card, EmptyState, Input, Modal, Select } from '../ui/AgroUI';

const FORM_VACIO = { insumoId: '', cantidadUsada: '', unidad: '', costoUnitario: '' };

const pesos = (valor: number) =>
    '$ ' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(valor || 0);

const numero = (valor: number) =>
    new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(valor || 0);

export function TabInsumos({ actividadId }: { actividadId: number | undefined }) {
    const {
        insumos, loading, error,
        registrar, registrando, errorRegistrar,
        eliminar, eliminando,
    } = useActividadInsumos(actividadId);

    const [abierto, setAbierto] = useState(false);
    const [form, setForm] = useState(FORM_VACIO);

    // El catálogo resuelve el nombre: el endpoint solo devuelve insumoId
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

    const campo = (clave: keyof typeof FORM_VACIO) => (valor: string) =>
        setForm((previo) => ({ ...previo, [clave]: valor }));

    /** Al elegir el insumo se traen su unidad y su costo del inventario */
    const elegirInsumo = (valor: string) => {
        const insumo = porId.get(Number(valor));
        setForm((previo) => ({
            ...previo,
            insumoId: valor,
            unidad: insumo?.unidadUso ?? previo.unidad,
            costoUnitario:
                insumo && insumo.stockUso > 0
                    ? String(Math.round(insumo.valorInventario / insumo.stockUso))
                    : previo.costoUnitario,
        }));
    };

    const cerrar = () => { setAbierto(false); setForm(FORM_VACIO); };

    const completo =
        form.insumoId !== '' && Number(form.cantidadUsada) > 0 && form.unidad.trim() !== '';

    const guardar = (e: React.FormEvent) => {
        e.preventDefault();
        if (!completo) return;
        registrar(
            {
                insumoId: Number(form.insumoId),
                cantidadUsada: Number(form.cantidadUsada),
                unidad: form.unidad.trim(),
                costoUnitario: Number(form.costoUnitario) || 0,
            },
            { onSuccess: cerrar },
        );
    };

    return (
        <div className="space-y-3">
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            {loading ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Cargando insumos…</p>
            ) : insumos.length === 0 ? (
                <EmptyState
                    icon={Beaker}
                    title="Sin insumos"
                    description="No se registraron insumos para esta actividad."
                />
            ) : (
                insumos.map((i) => (
                    <Card key={i.id}>
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="font-medium text-foreground">{nombreInsumo(i.insumoId)}</p>
                                <p className="text-xs text-muted-foreground">
                                    {numero(i.cantidadUsada)} {i.unidad}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-3">
                                <span className="font-semibold text-primary">{pesos(i.costoTotal)}</span>
                                <button
                                    type="button"
                                    title="Quitar insumo"
                                    disabled={eliminando}
                                    onClick={() => eliminar(i.id)}
                                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
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
                <Plus size={14} />Agregar insumo
            </Btn>

            <Modal open={abierto} onClose={cerrar} title="Agregar insumo">
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
                            ...catalogo.map((i) => ({
                                value: String(i.id),
                                label: `${i.nombre} · ${numero(i.stockDisponible)} ${i.unidadUso} disponibles`,
                            })),
                        ]}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Cantidad usada" type="number" step="0.01" required
                            value={form.cantidadUsada} onChange={campo('cantidadUsada')} placeholder="0"
                        />
                        <Input
                            label="Unidad" required
                            value={form.unidad} onChange={campo('unidad')} placeholder="kg"
                        />
                    </div>

                    <div>
                        <Input
                            label="Costo unitario" type="number" step="0.01"
                            value={form.costoUnitario} onChange={campo('costoUnitario')} placeholder="0"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                            Se propone el costo promedio del inventario. Puedes cambiarlo.
                        </p>
                    </div>

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
