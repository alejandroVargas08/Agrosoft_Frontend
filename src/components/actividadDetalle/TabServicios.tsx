import { useState } from 'react';
import { Clock, Plus, Trash2, Truck } from 'lucide-react';
import { useActividadServicios } from '../../hooks/Actividades/useActividadServicios';
import { useQuery } from '@tanstack/react-query';
import { proveedoresApi } from '../../api/inventario';
import { Btn, Card, EmptyState, Input, Modal, Select } from '../ui/AgroUI';

const pesos = (valor: number) =>
    '$ ' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(valor || 0);

const FORM_VACIO = { nombreServicio: '', proveedorId: '', maquinariaId: '', horas: '', precioHora: '' };

/** Los servicios contratados para la actividad: maquinaria alquilada, mano de obra externa. */
export function TabServicio({ actividadId }: { actividadId: number | undefined }) {
    const {
        servicios, loading, error,
        registrar, registrando, errorRegistrar,
        actualizarHoras, actualizando,
        eliminar, eliminando,
    } = useActividadServicios(actividadId);

    // Para que no haya que escribir el id del proveedor a mano.
    const proveedoresQuery = useQuery({
        queryKey: ['proveedores'],
        queryFn: async () => (await proveedoresApi.listar()).data,
    });
    const proveedores = proveedoresQuery.data ?? [];
    const nombreProveedor = (id: number) =>
        proveedores.find((p) => p.id === id)?.nombre ?? 'Proveedor #' + id;

    const [modalAbierto, setModalAbierto] = useState(false);
    const [form, setForm] = useState(FORM_VACIO);
    const cambiar = (campo: keyof typeof FORM_VACIO) => (valor: string) =>
        setForm((anterior) => ({ ...anterior, [campo]: valor }));

    // Reestimar las horas de un servicio ya registrado.
    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [horasNuevas, setHorasNuevas] = useState('');

    const abrirModal = () => { setForm(FORM_VACIO); setModalAbierto(true); };

    const guardar = () => {
        registrar({
            nombreServicio: form.nombreServicio.trim(),
            proveedorId: Number(form.proveedorId),
            maquinariaId: Number(form.maquinariaId) || 0,
            horas: Number(form.horas),
            precioHora: Number(form.precioHora),
        });
        setModalAbierto(false);
    };

    const guardarHoras = () => {
        if (editandoId !== null && Number(horasNuevas) > 0) {
            actualizarHoras(editandoId, Number(horasNuevas));
        }
        setEditandoId(null);
    };

    const puedeGuardar =
        form.nombreServicio.trim().length > 0 &&
        form.proveedorId !== '' &&
        Number(form.horas) > 0 &&
        Number(form.precioHora) > 0;

    const costoEstimado = (Number(form.horas) || 0) * (Number(form.precioHora) || 0);

    if (loading) {
        return <p className="py-6 text-center text-sm text-muted-foreground">Cargando los servicios...</p>;
    }

    return (
        <div className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}

            {servicios.length === 0 ? (
                <EmptyState
                    icon={Truck}
                    title="Sin servicios"
                    description="No se contrataron servicios para esta actividad"
                />
            ) : (
                <div className="space-y-3">
                    {servicios.map((s) => (
                        <Card key={s.id}>
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate font-medium text-foreground">{s.nombreServicio}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {s.horas}h × {pesos(s.precioHora)}/h · {nombreProveedor(s.proveedorId)}
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    <span className="font-semibold text-primary">{pesos(s.costo)}</span>
                                    <button
                                        type="button"
                                        title="Reestimar horas"
                                        disabled={actualizando}
                                        onClick={() => { setEditandoId(s.id); setHorasNuevas(String(s.horas)); }}
                                        className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                                    >
                                        <Clock size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        title="Eliminar"
                                        disabled={eliminando}
                                        onClick={() => eliminar(s.id)}
                                        className="cursor-pointer rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Btn variant="outline" onClick={abrirModal}>
                <Plus size={14} />Registrar servicio
            </Btn>

            <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title="Registrar servicio">
                <div className="space-y-3">
                    <Input
                        label="Servicio"
                        value={form.nombreServicio}
                        onChange={cambiar('nombreServicio')}
                        placeholder="Ej: Alquiler de tractor"
                        required
                    />

                    <Select
                        label="Proveedor"
                        value={form.proveedorId}
                        onChange={cambiar('proveedorId')}
                        options={[
                            { value: '', label: 'Seleccionar proveedor...' },
                            ...proveedores.map((p) => ({ value: String(p.id), label: p.nombre })),
                        ]}
                    />

                    <div>
                        <Input
                            label="Maquinaria"
                            value={form.maquinariaId}
                            onChange={cambiar('maquinariaId')}
                            type="number"
                            placeholder="0"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                            Todavía no hay catálogo de maquinaria, así que va el número a mano. Déjalo en 0 si no aplica.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Horas" value={form.horas} onChange={cambiar('horas')} type="number" step="0.01" placeholder="8" required />
                        <Input label="Precio por hora" value={form.precioHora} onChange={cambiar('precioHora')} type="number" step="0.01" placeholder="25000" required />
                    </div>

                    {costoEstimado > 0 && (
                        <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/10 p-2">
                            <p className="text-sm font-bold text-primary">Costo</p>
                            <span className="font-bold text-primary">{pesos(costoEstimado)}</span>
                        </div>
                    )}

                    {errorRegistrar && <p className="text-sm text-red-600">{errorRegistrar}</p>}

                    <div className="flex gap-3 pt-1">
                        <Btn className="flex-1 justify-center" disabled={!puedeGuardar || registrando} onClick={guardar}>
                            {registrando ? 'Guardando...' : 'Guardar'}
                        </Btn>
                        <Btn variant="outline" onClick={() => setModalAbierto(false)}>Cancelar</Btn>
                    </div>
                </div>
            </Modal>

            <Modal open={editandoId !== null} onClose={() => setEditandoId(null)} title="Reestimar horas">
                <div className="space-y-3">
                    <Input label="Horas" value={horasNuevas} onChange={setHorasNuevas} type="number" step="0.01" required />
                    <p className="text-xs text-muted-foreground">El costo se recalcula con el precio por hora ya registrado.</p>
                    <div className="flex gap-3 pt-1">
                        <Btn className="flex-1 justify-center" disabled={Number(horasNuevas) <= 0 || actualizando} onClick={guardarHoras}>
                            Guardar
                        </Btn>
                        <Btn variant="outline" onClick={() => setEditandoId(null)}>Cancelar</Btn>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
