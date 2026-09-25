import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, AlertCircle, FlaskConical, Tractor, Warehouse, MapPin,
    ArrowUp, ArrowDown, Minus, Truck,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import {
    Badge, Btn, Card, EmptyState, Input, Modal, PageHeader, SearchBar, Select, Tab,
} from '../components/ui/AgroUI';
import { useInventario } from '../hooks/useInventario';
import type { TipoMovimiento } from '../types/inventario';

const fmt = (n: number, moneda = false) =>
    moneda
        ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
        : n.toLocaleString('es-CO');

const fmtFecha = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

// Ícono y color de cada tipo de movimiento
const MOVIMIENTO_UI = {
    entrada: { icono: ArrowUp, clase: 'bg-emerald-100 text-emerald-700', label: 'Entrada' },
    salida: { icono: ArrowDown, clase: 'bg-red-100 text-red-700', label: 'Salida' },
    ajuste: { icono: Minus, clase: 'bg-amber-100 text-amber-700', label: 'Ajuste' },
    traslado: { icono: Truck, clase: 'bg-blue-100 text-blue-700', label: 'Traslado' },
};

const Inventario = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState('Insumos');
    const [modalAlmacen, setModalAlmacen] = useState(false);
    const [modalMovimiento, setModalMovimiento] = useState(false);

    const {
        insumos, almacenes, movimientos, bajoStock, loading, error,
        busqueda, setBusqueda,
        nombreAlmacen, nombreCategoria, nombreProveedor, nombreInsumo,
        valorPorAlmacen, itemsPorAlmacen,
        formAlmacen, setFormAlmacen, crearAlmacen,
        formMovimiento, setMovimiento, insumoSeleccionado, cantidadUsoCalculada,
        registrarMovimiento, registrandoMovimiento, errorFormMovimiento,
        todosLosInsumos,
    } = useInventario();

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                <PageHeader
                    title="Inventario"
                    subtitle="Insumos, herramientas y almacenes"
                    action={<Btn onClick={() => navigate('/inventario/nuevo')}><Plus size={16} />Nuevo Insumo</Btn>}
                />

                {bajoStock.length > 0 && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                        <AlertCircle size={16} className="text-red-500 shrink-0" />
                        <p className="text-sm text-red-700 font-medium">
                            {bajoStock.length} item(s) bajo el stock mínimo: {bajoStock.map((i) => i.nombre).join(', ')}
                        </p>
                    </div>
                )}

                {loading && <p className="text-sm text-muted-foreground mb-4">Cargando inventario...</p>}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">{error}</div>
                )}

                <Tab tabs={['Insumos', 'Almacenes', 'Movimientos']} active={tab} onChange={setTab} />

                {/* ─── Insumos ─── */}
                {tab === 'Insumos' && (
                    <>
                        <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar insumos..." />
                        <div className="space-y-3 mt-3">
                            {insumos.map((item) => {
                                const esBajo = item.stockDisponible <= item.stockMinimo;
                                const proveedor = nombreProveedor(item.proveedorId);
                                return (
                                    <Card key={item.id} className={esBajo ? 'border-red-200 bg-red-50/30' : ''}>
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${item.tipoInsumo === 'herramienta' ? 'bg-amber-100' : 'bg-primary/10'}`}>
                                                    {item.tipoInsumo === 'herramienta'
                                                        ? <Tractor size={18} className="text-amber-700" />
                                                        : <FlaskConical size={18} className="text-primary" />}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">{item.nombre}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {nombreCategoria(item.categoriaId)} · {nombreAlmacen(item.almacenId)}
                                                    </p>
                                                </div>
                                            </div>
                                            {esBajo && <Badge color="danger">Stock bajo</Badge>}
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                                            <div className="p-2 bg-muted rounded-lg text-center">
                                                <p className="text-muted-foreground">Stock disponible</p>
                                                <p className="font-bold text-foreground">{fmt(item.stockDisponible)} {item.unidadUso}</p>
                                            </div>
                                            <div className="p-2 bg-muted rounded-lg text-center">
                                                <p className="text-muted-foreground">Stock mínimo</p>
                                                <p className="font-bold text-foreground">{fmt(item.stockMinimo)} {item.unidadUso}</p>
                                            </div>
                                            <div className="p-2 bg-muted rounded-lg text-center">
                                                <p className="text-muted-foreground">Valor total</p>
                                                <p className="font-bold text-foreground">{fmt(item.valorInventario, true)}</p>
                                            </div>
                                        </div>
                                        {item.stockReservado > 0 && (
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Reservado: {fmt(item.stockReservado)} {item.unidadUso}
                                            </p>
                                        )}
                                        {proveedor && <p className="text-xs text-muted-foreground mt-2">Proveedor: {proveedor}</p>}
                                    </Card>
                                );
                            })}
                            {!loading && insumos.length === 0 && (
                                <EmptyState
                                    icon={FlaskConical}
                                    title="Sin insumos"
                                    description={busqueda ? 'Ningún insumo coincide con la búsqueda' : 'Registra el primer insumo del inventario'}
                                    action={<Btn onClick={() => navigate('/inventario/nuevo')}><Plus size={16} />Nuevo Insumo</Btn>}
                                />
                            )}
                        </div>
                    </>
                )}

                {/* ─── Almacenes ─── */}
                {tab === 'Almacenes' && (
                    <div className="space-y-3">
                        {almacenes.map((w) => (
                            <Card key={w.id}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-amber-100 rounded-lg"><Warehouse size={18} className="text-amber-700" /></div>
                                    <div>
                                        <p className="font-semibold text-foreground">{w.nombre}</p>
                                        {w.ubicacion && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <MapPin size={10} />{w.ubicacion}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="p-2 bg-muted rounded-lg text-center">
                                        <p className="text-muted-foreground">Items</p>
                                        <p className="font-bold">{itemsPorAlmacen(w.id)}</p>
                                    </div>
                                    <div className="p-2 bg-muted rounded-lg text-center">
                                        <p className="text-muted-foreground">Valor inventario</p>
                                        <p className="font-bold">{fmt(valorPorAlmacen(w.id), true)}</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        {almacenes.length === 0 && (
                            <p className="text-sm text-muted-foreground">Aún no hay almacenes registrados.</p>
                        )}
                        <Btn variant="outline" className="w-full justify-center" onClick={() => setModalAlmacen(true)}>
                            <Plus size={16} />Nuevo Almacén
                        </Btn>
                    </div>
                )}

                {/* ─── Movimientos ─── */}
                {tab === 'Movimientos' && (
                    <div className="space-y-3">
                        {movimientos.map((m) => {
                            const ui = MOVIMIENTO_UI[m.tipo];
                            const Icono = ui.icono;
                            return (
                                <Card key={m.id}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${ui.clase}`}><Icono size={16} /></div>
                                            <div>
                                                <p className="font-medium text-foreground">{nombreInsumo(m.insumoId)}</p>
                                                <p className="text-xs text-muted-foreground">{ui.label} · {fmtFecha(m.fecha)}</p>
                                                {m.descripcion && <p className="text-xs text-muted-foreground">{m.descripcion}</p>}
                                                {m.tipo === 'traslado' && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {nombreAlmacen(m.almacenOrigenId)} → {nombreAlmacen(m.almacenDestinoId)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold ${m.tipo === 'entrada' ? 'text-emerald-600' : m.tipo === 'salida' ? 'text-red-600' : 'text-foreground'}`}>
                                                {m.tipo === 'entrada' ? '+' : m.tipo === 'salida' ? '-' : ''}{fmt(m.cantidadUso)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{fmt(m.costoTotal, true)}</p>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                        {movimientos.length === 0 && (
                            <p className="text-sm text-muted-foreground">Aún no hay movimientos registrados.</p>
                        )}
                        <Btn variant="outline" className="w-full justify-center" onClick={() => setModalMovimiento(true)}>
                            <Plus size={16} />Registrar Movimiento
                        </Btn>
                    </div>
                )}
            </div>

            {/* Modal: nuevo almacén */}
            <Modal open={modalAlmacen} onClose={() => setModalAlmacen(false)} title="Nuevo Almacén">
                <div className="space-y-4">
                    <Input label="Nombre" value={formAlmacen.nombre} required
                        onChange={(v) => setFormAlmacen({ ...formAlmacen, nombre: v })} placeholder="Ej: Bodega Principal" />
                    <Input label="Ubicación" value={formAlmacen.ubicacion}
                        onChange={(v) => setFormAlmacen({ ...formAlmacen, ubicacion: v })} placeholder="Opcional" />
                    {crearAlmacen.isError && <p className="text-sm text-red-600">No se pudo guardar el almacén</p>}
                    <div className="flex gap-3">
                        <Btn className="flex-1 justify-center" disabled={crearAlmacen.isPending || !formAlmacen.nombre}
                            onClick={() => crearAlmacen.mutate(undefined, { onSuccess: () => setModalAlmacen(false) })}>
                            {crearAlmacen.isPending ? 'Guardando...' : 'Guardar almacén'}
                        </Btn>
                        <Btn variant="outline" onClick={() => setModalAlmacen(false)}>Cancelar</Btn>
                    </div>
                </div>
            </Modal>

            {/* Modal: registrar movimiento */}
            <Modal open={modalMovimiento} onClose={() => setModalMovimiento(false)} title="Registrar Movimiento">
                <div className="space-y-4">
                    {errorFormMovimiento && <p className="text-sm text-red-600">{errorFormMovimiento}</p>}

                    <Select
                        label="Insumo" value={formMovimiento.insumoId} onChange={setMovimiento('insumoId')}
                        options={[
                            { value: '', label: 'Seleccione...' },
                            ...todosLosInsumos.map((i) => ({
                                value: String(i.id),
                                label: `${i.nombre} (disp. ${i.stockDisponible} ${i.unidadUso})`,
                            })),
                        ]}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            label="Tipo" value={formMovimiento.tipo}
                            onChange={(v) => setMovimiento('tipo')(v as TipoMovimiento)}
                            options={[
                                { value: 'entrada', label: 'Entrada' },
                                { value: 'salida', label: 'Salida' },
                                { value: 'traslado', label: 'Traslado' },
                                { value: 'ajuste', label: 'Ajuste' },
                            ]}
                        />
                        <Input
                            label={`Cantidad ${insumoSeleccionado ? `(${insumoSeleccionado.presentacionTipo})` : ''}`}
                            type="number" step="any" value={formMovimiento.cantidadPresentacion}
                            onChange={setMovimiento('cantidadPresentacion')}
                        />
                    </div>

                    {insumoSeleccionado && formMovimiento.cantidadPresentacion !== '' && (
                        <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-sm text-primary">
                            Equivale a <strong>{cantidadUsoCalculada}</strong> {insumoSeleccionado.unidadUso}
                            <span className="text-muted-foreground"> · factor {insumoSeleccionado.factorConversionUso}</span>
                        </div>
                    )}

                    {formMovimiento.tipo === 'traslado' && (
                        <div className="grid grid-cols-2 gap-3">
                            <Select
                                label="Almacén origen" value={formMovimiento.almacenOrigenId} onChange={setMovimiento('almacenOrigenId')}
                                options={[{ value: '', label: 'Seleccione...' }, ...almacenes.map((a) => ({ value: String(a.id), label: a.nombre }))]}
                            />
                            <Select
                                label="Almacén destino" value={formMovimiento.almacenDestinoId} onChange={setMovimiento('almacenDestinoId')}
                                options={[{ value: '', label: 'Seleccione...' }, ...almacenes.map((a) => ({ value: String(a.id), label: a.nombre }))]}
                            />
                        </div>
                    )}

                    <Input label="Descripción" value={formMovimiento.descripcion} onChange={setMovimiento('descripcion')}
                        placeholder="Motivo del movimiento (opcional)" />

                    <div className="flex gap-3">
                        <Btn className="flex-1 justify-center" disabled={registrandoMovimiento}
                            onClick={() => registrarMovimiento(() => setModalMovimiento(false))}>
                            {registrandoMovimiento ? 'Registrando...' : 'Registrar'}
                        </Btn>
                        <Btn variant="outline" onClick={() => setModalMovimiento(false)}>Cancelar</Btn>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default Inventario;