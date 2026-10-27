import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ClipboardList, Coins, Leaf, Plus, Scale, Sprout, TrendingUp } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Btn, Card, EmptyState, Input, Modal, PageHeader, Select, StatCard, StatusBadge } from '../../components/ui/AgroUI';
import { useCultivoDetalle } from '../../hooks/cultivos/useCultivoDetalle';
import { usePermisos } from '../../hooks/permisos/usePermisos';

const GESTIONAR_CULTIVOS = 'cultivos.gestionar';

const pesos = (valor: number) =>
    '$ ' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(valor || 0);

const kilos = (valor: number) =>
    new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(valor || 0) + ' kg';

const fecha = (valor?: string | null) =>
    valor ? new Date(valor).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const FORM_VACIO = { productoAgroId: '', calidad: 'A', cantidadKg: '', costoUnitarioKg: '', precioSugeridoKg: '' };

const CultivoDetalle = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { puede } = usePermisos();
    const {
        cultivo, lote, cosechas, actividades, productos, metricas,
        cargando, error, modalAbierto, abrirModal, cerrarModal,
        registrando, errorRegistro, registrarCosecha,
    } = useCultivoDetalle(id ? Number(id) : undefined);

    const [form, setForm] = useState(FORM_VACIO);
    const campo = (clave: keyof typeof FORM_VACIO) => (valor: string) =>
        setForm((previo) => ({ ...previo, [clave]: valor }));

    const cantidad = Number(form.cantidadKg) || 0;
    const costoKg = Number(form.costoUnitarioKg) || 0;
    const completo = form.productoAgroId !== '' && cantidad > 0;

    const cerrar = () => { cerrarModal(); setForm(FORM_VACIO); };

    const guardar = () => {
        if (!completo || !cultivo) return;
        registrarCosecha({
            productoAgroId: Number(form.productoAgroId),
            cultivoId: cultivo.id,
            loteId: cultivo.loteId,
            ...(cultivo.subLoteId ? { subLoteId: cultivo.subLoteId } : {}),
            calidad: form.calidad,
            cantidadKg: cantidad,
            // Una cosecha nueva entra completa al inventario
            stockDisponibleKg: cantidad,
            costoUnitarioKg: costoKg,
            costoTotal: Math.round(cantidad * costoKg),
            precioSugeridoKg: Number(form.precioSugeridoKg) || 0,
        }, cerrar);
    };

    if (cargando) {
        return (
            <DashboardLayout>
                <div className="max-w-7xl mx-auto p-4 sm:p-6">
                    <p className="text-sm text-muted-foreground">Cargando el cultivo...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!cultivo) {
        return (
            <DashboardLayout>
                <div className="max-w-7xl mx-auto p-4 sm:p-6">
                    <EmptyState
                        icon={Leaf}
                        title="Cultivo no encontrado"
                        description={error || 'Puede que lo hayan eliminado.'}
                        action={<Btn onClick={() => navigate('/cultivos')}>Volver a cultivos</Btn>}
                    />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title={cultivo.nombreCultivo}
                    subtitle={cultivo.tipoCultivo + (lote ? ' · ' + lote.nombre : '')}
                    onBack={() => navigate('/cultivos')}
                    action={puede(GESTIONAR_CULTIVOS)
                        ? <Btn onClick={abrirModal}><Plus className="w-4 h-4" />Registrar cosecha</Btn>
                        : <StatusBadge status={cultivo.estado} />}
                />

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <StatCard icon={Scale} label="Total cosechado" value={kilos(metricas.totalKg)} color="emerald" />
                    <StatCard icon={Sprout} label="Cosechas" value={metricas.cosechas} color="primary" />
                    <StatCard
                        icon={Coins} label="Ingreso estimado" value={pesos(metricas.ingresoEstimado)} color="amber"
                        sub={metricas.precioReferencialKg !== null ? pesos(metricas.precioReferencialKg) + '/kg de referencia' : undefined}
                    />
                    <StatCard
                        icon={TrendingUp} label="Retorno sobre inversión"
                        value={metricas.retornoPorcentaje !== null ? metricas.retornoPorcentaje + '%' : '—'}
                        color={metricas.retornoPorcentaje !== null && metricas.retornoPorcentaje < 0 ? 'red' : 'blue'}
                        sub={metricas.costoTotal > 0 ? 'Costo ' + pesos(metricas.costoTotal) : 'Sin costo registrado'}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Card className="lg:col-span-1">
                        <h3 className="font-semibold text-foreground mb-3">Información del cultivo</h3>
                        <dl className="space-y-2 text-sm">
                            {[
                                ['Tipo', cultivo.tipoCultivo],
                                ['Lote', lote?.nombre ?? 'Lote #' + cultivo.loteId],
                                ['Área del lote', lote?.areaHa ? lote.areaHa.toFixed(2) + ' ha' : '—'],
                                ['Siembra', fecha(cultivo.fechaSiembra)],
                                ['Finalización', fecha(cultivo.fechaFinalizacion)],
                                ['Rendimiento', metricas.rendimientoKgHa !== null ? kilos(metricas.rendimientoKgHa) + '/ha' : '—'],
                                ['Stock disponible', kilos(metricas.stockDisponibleKg)],
                            ].map(([etiqueta, valor]) => (
                                <div key={etiqueta} className="flex justify-between gap-3">
                                    <dt className="text-muted-foreground shrink-0">{etiqueta}</dt>
                                    <dd className="font-medium text-foreground text-right">{valor}</dd>
                                </div>
                            ))}
                            <div className="flex justify-between gap-3 pt-1">
                                <dt className="text-muted-foreground">Estado</dt>
                                <dd><StatusBadge status={cultivo.estado} /></dd>
                            </div>
                        </dl>
                    </Card>

                    <Card className="lg:col-span-2">
                        <h3 className="font-semibold text-foreground mb-3">Cosechas registradas</h3>
                        {cosechas.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-6 text-center">
                                Sin cosechas registradas todavía.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border text-xs text-muted-foreground">
                                            <th className="text-left py-2 pr-3 font-semibold">Calidad</th>
                                            <th className="text-right py-2 px-2 font-semibold">Cosechado</th>
                                            <th className="text-right py-2 px-2 font-semibold">Disponible</th>
                                            <th className="text-right py-2 px-2 font-semibold">Costo/kg</th>
                                            <th className="text-right py-2 pl-2 font-semibold">Precio sugerido</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cosechas.map((c) => (
                                            <tr key={c.id} className="border-b border-border last:border-0">
                                                <td className="py-2 pr-3"><StatusBadge status={c.calidad} /></td>
                                                <td className="py-2 px-2 text-right font-medium">{kilos(c.cantidadKg)}</td>
                                                <td className="py-2 px-2 text-right text-primary font-medium">{kilos(c.stockDisponibleKg)}</td>
                                                <td className="py-2 px-2 text-right text-muted-foreground">{pesos(c.costoUnitarioKg)}</td>
                                                <td className="py-2 pl-2 text-right font-medium">{pesos(c.precioSugeridoKg)}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-muted/50">
                                            <td className="py-2 pr-3 font-bold">Total</td>
                                            <td className="py-2 px-2 text-right font-bold">{kilos(metricas.totalKg)}</td>
                                            <td className="py-2 px-2 text-right font-bold text-primary">{kilos(metricas.stockDisponibleKg)}</td>
                                            <td colSpan={2} className="py-2 pl-2 text-right font-bold">{pesos(metricas.ingresoEstimado)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>

                <Card className="mt-4">
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-primary" />Actividades asociadas
                    </h3>
                    {actividades.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">Sin actividades asociadas.</p>
                    ) : (
                        <div className="space-y-2">
                            {actividades.map((a) => (
                                <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => navigate('/actividades/' + a.id, { state: { actividad: a } })}
                                    className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-muted hover:bg-muted/70 transition-colors text-left cursor-pointer"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {a.tipo}{a.subtipo ? ' — ' + a.subtipo : ''}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{fecha(a.fecha)}</p>
                                    </div>
                                    <StatusBadge status={a.estado} />
                                </button>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            <Modal open={modalAbierto} onClose={cerrar} title="Registrar cosecha">
                <div className="space-y-4">
                    {errorRegistro && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorRegistro}</div>
                    )}

                    <Select
                        label="Producto"
                        value={form.productoAgroId}
                        onChange={campo('productoAgroId')}
                        options={[
                            { value: '', label: 'Selecciona el producto' },
                            ...productos.map((p) => ({ value: String(p.id), label: p.nombre })),
                        ]}
                    />

                    <Select
                        label="Calidad"
                        value={form.calidad}
                        onChange={campo('calidad')}
                        options={[
                            { value: 'A', label: 'A — primera' },
                            { value: 'B', label: 'B — segunda' },
                            { value: 'C', label: 'C — tercera' },
                        ]}
                    />

                    <Input label="Cantidad cosechada (kg)" value={form.cantidadKg} onChange={campo('cantidadKg')} type="number" required placeholder="450" />

                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Costo por kg" value={form.costoUnitarioKg} onChange={campo('costoUnitarioKg')} type="number" placeholder="1800" />
                        <Input label="Precio sugerido por kg" value={form.precioSugeridoKg} onChange={campo('precioSugeridoKg')} type="number" placeholder="3500" />
                    </div>

                    {cantidad > 0 && costoKg > 0 && (
                        <div className="rounded-xl bg-muted p-3 text-sm flex justify-between">
                            <span className="text-muted-foreground">Costo total de la cosecha</span>
                            <span className="font-bold text-foreground">{pesos(cantidad * costoKg)}</span>
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                        La cosecha entra completa al inventario: el stock disponible arranca igual a lo cosechado y
                        se va descontando con cada venta.
                    </p>

                    <div className="flex justify-end gap-2 pt-1">
                        <Btn variant="ghost" onClick={cerrar} disabled={registrando}>Cancelar</Btn>
                        <Btn onClick={guardar} disabled={!completo || registrando}>
                            {registrando ? 'Guardando...' : 'Registrar cosecha'}
                        </Btn>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default CultivoDetalle;
