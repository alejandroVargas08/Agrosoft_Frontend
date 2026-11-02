import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Plus, Trash2, Wrench } from 'lucide-react';
import { insumosApi } from '../../api/inventario';
import { useActividadHerramientas } from '../../hooks/Actividades/useActividadHerramientas';
import { Btn, Card, EmptyState, Input, Modal, Select } from '../ui/AgroUI';

const FORM_VACIO = { insumoId: '', activoFijoId: '', horasEstimadas: '' };

const pesos = (valor: number) =>
    '$ ' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(valor || 0);

const numero = (valor: number) =>
    new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(valor || 0);

export function TabHerramientas({ actividadId }: { actividadId: number | undefined }) {
    const {
        herramientas, loading, error,
        asignar, asignado, errorAsignar,
        reestimar, reestimando,
        quitar, quitando,
    } = useActividadHerramientas(actividadId);

    const [abierto, setAbierto] = useState(false);
    const [form, setForm] = useState(FORM_VACIO);

    // Para re-estimar: id de la herramienta y horas nuevas
    const [porReestimar, setPorReestimar] = useState<{ id: number; horas: string } | null>(null);

    const catalogoQuery = useQuery({
        queryKey: ['insumos'],
        queryFn: async () => (await insumosApi.listar()).data,
        staleTime: 60_000,
    });

    const catalogo = useMemo(
        () => (catalogoQuery.data ?? []).filter((i) => i.tipoInsumo === 'herramienta'),
        [catalogoQuery.data],
    );

    const porId = useMemo(
        () => new Map((catalogoQuery.data ?? []).map((i) => [i.id, i])),
        [catalogoQuery.data],
    );

    const nombreHerramienta = (id: number) => porId.get(id)?.nombre ?? 'Herramienta #' + id;

    /**
     * Depreciación lineal, igual que en la pestaña de Costos:
     * (costo de adquisición − valor residual) / vida útil × horas.
     * Sin esos datos en la ficha del insumo no se puede calcular.
     */
    const depreciacion = (insumoId: number, horas: number): number | null => {
        const insumo = porId.get(insumoId);
        const vidaUtil = insumo?.vidaUtilHoras ?? 0;
        if (!insumo || vidaUtil <= 0 || insumo.costoAdquisicion === undefined) return null;
        const porHora = (insumo.costoAdquisicion - (insumo.valorResidual ?? 0)) / vidaUtil;
        return porHora * horas;
    };

    const campo = (clave: keyof typeof FORM_VACIO) => (valor: string) =>
        setForm((previo) => ({ ...previo, [clave]: valor }));

    const cerrar = () => { setAbierto(false); setForm(FORM_VACIO); };

    const completo = form.insumoId !== '' && Number(form.horasEstimadas) > 0;

    const guardar = (e: React.FormEvent) => {
        e.preventDefault();
        if (!completo) return;
        asignar(
            {
                insumoId: Number(form.insumoId),
                activoFijoId: form.activoFijoId ? Number(form.activoFijoId) : undefined,
                horasEstimadas: Number(form.horasEstimadas),
            },
            { onSuccess: cerrar },
        );
    };

    const confirmarReestimar = () => {
        if (!porReestimar) return;
        const horas = Number(porReestimar.horas);
        if (horas <= 0) return;
        reestimar(porReestimar.id, horas);
        setPorReestimar(null);
    };

    return (
        <div className="space-y-3">
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            {loading ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Cargando herramientas…</p>
            ) : herramientas.length === 0 ? (
                <EmptyState
                    icon={Wrench}
                    title="Sin herramientas"
                    description="No se asignaron herramientas a esta actividad."
                />
            ) : (
                herramientas.map((h) => {
                    const costo = depreciacion(h.insumoId, h.horasEstimadas || 0);
                    return (
                        <Card key={h.id}>
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-medium text-foreground">{nombreHerramienta(h.insumoId)}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {numero(h.horasEstimadas)}h de uso
                                        {h.activoFijoId ? ` · activo fijo #${h.activoFijoId}` : ''}
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">Depreciación/h</p>
                                        {costo === null ? (
                                            <p
                                                className="text-xs text-muted-foreground"
                                                title="Falta el costo de adquisición o la vida útil en la ficha del insumo"
                                            >
                                                Sin datos
                                            </p>
                                        ) : (
                                            <p className="font-semibold text-[#F16C07]">{pesos(costo)}</p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        title="Re-estimar horas"
                                        onClick={() => setPorReestimar({ id: h.id, horas: String(h.horasEstimadas) })}
                                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-[#F16C07]"
                                    >
                                        <Clock size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        title="Quitar herramienta"
                                        disabled={quitando}
                                        onClick={() => quitar(h.id)}
                                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    );
                })
            )}

            <Btn
                variant="outline"
                onClick={() => setAbierto(true)}
                disabled={!actividadId}
                className="w-full justify-center"
            >
                <Plus size={14} />Asignar herramienta
            </Btn>

            <Modal open={abierto} onClose={cerrar} title="Asignar herramienta">
                <form onSubmit={guardar} className="space-y-3">
                    {errorAsignar && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {errorAsignar}
                        </div>
                    )}

                    <Select
                        label="Herramienta"
                        value={form.insumoId}
                        onChange={campo('insumoId')}
                        options={[
                            { value: '', label: 'Seleccionar herramienta...' },
                            ...catalogo.map((i) => ({ value: String(i.id), label: i.nombre })),
                        ]}
                    />

                    <Input
                        label="Horas estimadas" type="number" step="0.5" required
                        value={form.horasEstimadas} onChange={campo('horasEstimadas')} placeholder="8"
                    />

                    <div>
                        <Input
                            label="Activo fijo (opcional)" type="number"
                            value={form.activoFijoId} onChange={campo('activoFijoId')} placeholder="Sin activo fijo"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                            Todavía no hay catálogo de activos fijos: va por número.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-1">
                        <Btn type="submit" disabled={!completo || asignado} className="flex-1 justify-center">
                            {asignado ? 'Asignando…' : 'Asignar'}
                        </Btn>
                        <Btn variant="outline" onClick={cerrar}>Cancelar</Btn>
                    </div>
                </form>
            </Modal>

            <Modal open={porReestimar !== null} onClose={() => setPorReestimar(null)} title="Re-estimar horas">
                {porReestimar && (
                    <div className="space-y-3">
                        <Input
                            label="Horas estimadas" type="number" step="0.5"
                            value={porReestimar.horas}
                            onChange={(v) => setPorReestimar({ ...porReestimar, horas: v })}
                        />
                        <div className="flex gap-3 pt-1">
                            <Btn
                                onClick={confirmarReestimar}
                                disabled={Number(porReestimar.horas) <= 0 || reestimando}
                                className="flex-1 justify-center"
                            >
                                {reestimando ? 'Guardando…' : 'Guardar'}
                            </Btn>
                            <Btn variant="outline" onClick={() => setPorReestimar(null)}>Cancelar</Btn>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
