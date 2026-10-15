import { useState } from 'react';
import { CheckCircle2, DollarSign, Mail, Phone, Plus, ShoppingCart } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Btn, Card, EmptyState, Input, Modal, PageHeader, Select, StatCard, StatusBadge, Tab } from '../components/ui/AgroUI';
import { useVentas } from '../hooks/useVentas';

// El backend guarda los estados en español; el StatusBadge los conoce en inglés
const ESTADO_BADGE: Record<string, string> = {
    pagada: 'paid',
    pendiente: 'pending',
    anulada: 'cancelled',
};

const fmtPesos = (valor: number) =>
    '$ ' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(valor || 0);

const fmtKg = (valor: number) =>
    new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(valor || 0) + ' kg';

const fmtFecha = (iso: string) => {
    if (!iso) return '—';
    const [anio, mes, dia] = iso.slice(0, 10).split('-').map(Number);
    return new Date(anio, mes - 1, dia)
        .toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Ventas = () => {
    const [tab, setTab] = useState('Ventas');
    const [showNew, setShowNew] = useState(false);
    const [showCliente, setShowCliente] = useState(false);

    const {
        ventas, clientes, lotes, cargando, error,
        totalVentas, totalPagadas, ingresos, nombreCliente, productosDe,
        formVenta, setVenta, subtotal, descuento, impuestos, total,
        crearVenta, creandoVenta, errorForm,
        formCliente, setCliente, crearCliente, creandoCliente,
    } = useVentas();

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title="Comercialización"
                    subtitle="Ventas, clientes y producción"
                    action={tab === 'Ventas'
                        ? <Btn size="sm" onClick={() => setShowNew(true)}><Plus size={14} />Nueva Venta</Btn>
                        : undefined}
                />

                <Tab tabs={['Ventas', 'Producción', 'Clientes']} active={tab} onChange={setTab} />

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">{error}</div>
                )}

                {tab === 'Ventas' && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                            <StatCard icon={ShoppingCart} label="Total ventas" value={totalVentas} color="primary" />
                            <StatCard icon={CheckCircle2} label="Pagadas" value={totalPagadas} color="emerald" />
                            <StatCard icon={DollarSign} label="Ingresos" value={fmtPesos(ingresos)} color="amber" />
                        </div>

                        {cargando && <p className="text-sm text-muted-foreground">Cargando ventas...</p>}

                        {!cargando && ventas.length === 0 ? (
                            <EmptyState
                                icon={ShoppingCart}
                                title="Sin ventas"
                                description="Registra tu primera venta"
                                action={<Btn onClick={() => setShowNew(true)}><Plus size={16} />Nueva Venta</Btn>}
                            />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {ventas.map((v) => (
                                    <Card key={v.id} className="p-3">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="p-1.5 bg-primary/10 rounded-lg">
                                                <ShoppingCart size={14} className="text-primary" />
                                            </div>
                                            <StatusBadge status={ESTADO_BADGE[v.estado] ?? v.estado} />
                                        </div>
                                        <p className="font-semibold text-foreground text-sm">{nombreCliente(v.clienteId)}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Venta #{v.id}</p>
                                        <p className="text-xs text-muted-foreground">{fmtFecha(v.fecha)}</p>
                                        <p className="font-bold text-primary mt-2">{fmtPesos(Number(v.total))}</p>
                                        <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                                            <span>{productosDe(v.id)} prod.</span>
                                            {Number(v.descuento) > 0 && <span>-{fmtPesos(Number(v.descuento))}</span>}
                                            {Number(v.impuestos) > 0 && <span>+{fmtPesos(Number(v.impuestos))} IVA</span>}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {tab === 'Producción' && (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground mb-2">Lotes de producción disponibles para venta</p>
                        {lotes.length === 0 ? (
                            <EmptyState icon={ShoppingCart} title="Sin lotes" description="No hay lotes de producción registrados" />
                        ) : (
                            lotes.map((l) => (
                                <Card key={l.id}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-semibold text-foreground">Lote de producción #{l.id}</p>
                                            <p className="text-xs text-muted-foreground">Cultivo #{l.cultivoId}</p>
                                        </div>
                                        <StatusBadge status={l.calidad} />
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                        <div className="p-2 bg-muted rounded-lg text-center">
                                            <p className="text-muted-foreground">Cosechado</p>
                                            <p className="font-bold">{fmtKg(l.cantidadKg)}</p>
                                        </div>
                                        <div className="p-2 bg-muted rounded-lg text-center">
                                            <p className="text-muted-foreground">Disponible</p>
                                            <p className="font-bold text-primary">{fmtKg(l.stockDisponibleKg)}</p>
                                        </div>
                                        <div className="p-2 bg-muted rounded-lg text-center">
                                            <p className="text-muted-foreground">Costo/kg</p>
                                            <p className="font-bold">{fmtPesos(l.costoUnitarioKg)}</p>
                                        </div>
                                        <div className="p-2 bg-emerald-50 rounded-lg text-center">
                                            <p className="text-emerald-600">Precio sugerido</p>
                                            <p className="font-bold text-emerald-700">{fmtPesos(l.precioSugeridoKg)}</p>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {tab === 'Clientes' && (
                    <div className="space-y-3">
                        {clientes.map((c) => (
                            <Card key={c.id}>
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {c.nombre.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-foreground">{c.nombre}</p>
                                        <p className="text-xs text-muted-foreground">NIT/CC: {c.identificacion}</p>
                                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                                            {c.telefono && <span className="flex items-center gap-1"><Phone size={10} />{c.telefono}</span>}
                                            {c.email && <span className="flex items-center gap-1"><Mail size={10} />{c.email}</span>}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        <Btn variant="outline" className="w-full justify-center" onClick={() => setShowCliente(true)}>
                            <Plus size={16} />Nuevo Cliente
                        </Btn>
                    </div>
                )}
            </div>

            {/* Modal: nueva venta */}
            <Modal open={showNew} onClose={() => setShowNew(false)} title="Nueva Venta">
                <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); crearVenta(() => setShowNew(false)); }}>
                    {errorForm && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errorForm}</div>
                    )}

                    <Select
                        label="Cliente" value={formVenta.clienteId} onChange={setVenta('clienteId')}
                        options={[
                            { value: '', label: 'Seleccionar cliente...' },
                            ...clientes.map((c) => ({ value: String(c.id), label: c.nombre })),
                        ]}
                    />
                    <Select
                        label="Lote de producción" value={formVenta.loteId} onChange={setVenta('loteId')}
                        options={[
                            { value: '', label: 'Seleccionar producto...' },
                            ...lotes.map((l) => ({
                                value: String(l.id),
                                label: 'Lote #' + l.id + ' (' + l.stockDisponibleKg + ' kg disp.)',
                            })),
                        ]}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input label="Cantidad (kg)" value={formVenta.cantidadKg} onChange={setVenta('cantidadKg')} type="number" step="any" />
                        <Input label="Precio/kg (COP)" value={formVenta.precioKg} onChange={setVenta('precioKg')} type="number" step="any" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input label="Descuento (%)" value={formVenta.descuentoPct} onChange={setVenta('descuentoPct')} type="number" step="any" />
                        <Input label="IVA (%)" value={formVenta.ivaPct} onChange={setVenta('ivaPct')} type="number" step="any" />
                    </div>

                    {subtotal > 0 && (
                        <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span><span>{fmtPesos(subtotal)}</span>
                            </div>
                            {descuento > 0 && (
                                <div className="flex justify-between text-red-500">
                                    <span>Descuento</span><span>-{fmtPesos(descuento)}</span>
                                </div>
                            )}
                            {impuestos > 0 && (
                                <div className="flex justify-between text-amber-600">
                                    <span>IVA</span><span>+{fmtPesos(impuestos)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-primary border-t border-border pt-1 mt-1">
                                <span>Total</span><span>{fmtPesos(total)}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Btn type="submit" disabled={creandoVenta} className="flex-1 justify-center">
                            {creandoVenta ? 'Guardando...' : 'Guardar Venta'}
                        </Btn>
                        <Btn variant="outline" onClick={() => setShowNew(false)}>Cancelar</Btn>
                    </div>
                </form>
            </Modal>

            {/* Modal: nuevo cliente */}
            <Modal open={showCliente} onClose={() => setShowCliente(false)} title="Nuevo Cliente">
                <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); crearCliente(() => setShowCliente(false)); }}>
                    <Input label="Nombre" value={formCliente.nombre} onChange={setCliente('nombre')} required placeholder="Ej: Distribuidora El Campo" />
                    <Input label="NIT / Cédula" value={formCliente.identificacion} onChange={setCliente('identificacion')} required placeholder="Ej: 900123456-1" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input label="Teléfono" value={formCliente.telefono} onChange={setCliente('telefono')} placeholder="3001234567" />
                        <Input label="Correo" value={formCliente.email} onChange={setCliente('email')} type="email" placeholder="correo@ejemplo.com" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Btn type="submit" disabled={creandoCliente} className="flex-1 justify-center">
                            {creandoCliente ? 'Guardando...' : 'Guardar Cliente'}
                        </Btn>
                        <Btn variant="outline" onClick={() => setShowCliente(false)}>Cancelar</Btn>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
};

export default Ventas;