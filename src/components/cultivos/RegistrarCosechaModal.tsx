import { useEffect, useState } from 'react';
import { Leaf } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Btn, Input, Modal, Select, Textarea } from '../ui/AgroUI';
import { productosAgroApi } from '../../api/actividades/actividades';
import { loteProduccionApi, type CrearLoteProduccionPayload } from '../../api/ventas';
import { mensajeError } from '../../api/errores/errores';
import type { Cultivo } from '../../types/cultivos';

const UNIDADES = [
    { value: 'kg', label: 'kg' },
    { value: 'toneladas', label: 'Toneladas' },
    { value: 'unidades', label: 'Unidades' },
    { value: 'bultos', label: 'Bultos' },
    { value: 'cajas', label: 'Cajas' },
];
const CALIDADES = ['Primera', 'Segunda', 'Tercera', 'No clasificada'];
// Como en el diseño: "No clasificada" se guarda como tercera
const CODIGO_CALIDAD: Record<string, string> = { Primera: 'A', Segunda: 'B', Tercera: 'C', 'No clasificada': 'C' };
const DESTINOS = ['Venta', 'Autoconsumo', 'Almacenamiento', 'Transformación', 'Otro'];

const hoy = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const VACIO = {
    cultivoId: '', fecha: hoy(), cantidad: '', unidad: 'kg', equivalenteKg: '',
    calidad: 'Primera', responsable: '', destino: 'Venta', observaciones: '',
    productoAgroId: '', costoKg: '', precioKg: '',
};

const pesos = (valor: number) =>
    '$ ' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(valor || 0);

interface Props {
    open: boolean;
    onClose: () => void;
    /** Desde el panel del cultivo ya se sabe cuál es */
    cultivoFijo?: Cultivo | null;
    /** Desde la pestaña Cosecha se elige entre estos */
    cultivos?: Cultivo[];
}

/** El formulario "Registrar cosecha" del diseño. Debajo van el producto y los
 *  precios, que el inventario y las ventas necesitan. */
const RegistrarCosechaModal = ({ open, onClose, cultivoFijo = null, cultivos = [] }: Props) => {
    const queryClient = useQueryClient();
    const [form, setForm] = useState(VACIO);
    const poner = (clave: keyof typeof VACIO) => (valor: string) => setForm((f) => ({ ...f, [clave]: valor }));

    const productosQuery = useQuery({
        queryKey: ['productos-agro'],
        queryFn: async () => (await productosAgroApi.listar()).data,
        enabled: open,
        staleTime: 1000 * 60 * 5,
    });
    const productos = productosQuery.data ?? [];

    const activos = cultivos.filter((c) => c.estado === 'activo');
    const cultivo = cultivoFijo ?? activos.find((c) => String(c.id) === form.cultivoId) ?? null;

    useEffect(() => {
        if (open) setForm({ ...VACIO, fecha: hoy() });
    }, [open]);

    // Se propone el producto cuyo nombre coincide con el tipo del cultivo
    useEffect(() => {
        if (!cultivo || form.productoAgroId || productos.length === 0) return;
        const tipo = cultivo.tipoCultivo.toLowerCase();
        const parecido = productos.find((p) => p.nombre.toLowerCase().includes(tipo) || tipo.includes(p.nombre.toLowerCase()));
        if (parecido) setForm((f) => ({ ...f, productoAgroId: String(parecido.id) }));
    }, [cultivo, productos, form.productoAgroId]);

    const mutation = useMutation({
        mutationFn: (data: CrearLoteProduccionPayload) => loteProduccionApi.crear(data),
        onSuccess: (_r, data) => {
            queryClient.invalidateQueries({ queryKey: ['cosechas-cultivo', data.cultivoId] });
            queryClient.invalidateQueries({ queryKey: ['lotes-produccion'] });
            toast.success('Cosecha registrada exitosamente');
            onClose();
        },
    });

    const cantidad = Number(form.cantidad) || 0;
    // Inventario y ventas trabajan en kg: lo que no se convierte solo, se pregunta
    const convertible = form.unidad === 'kg' || form.unidad === 'toneladas';
    const kg = form.unidad === 'kg' ? cantidad : form.unidad === 'toneladas' ? cantidad * 1000 : Number(form.equivalenteKg) || 0;
    const costoKg = Number(form.costoKg) || 0;

    const completo = cultivo !== null && form.fecha !== '' && cantidad > 0 && kg > 0 && form.productoAgroId !== '';

    const guardar = () => {
        if (!completo || !cultivo) return;
        mutation.mutate({
            productoAgroId: Number(form.productoAgroId),
            cultivoId: cultivo.id,
            loteId: cultivo.loteId,
            ...(cultivo.subLoteId ? { subLoteId: cultivo.subLoteId } : {}),
            calidad: CODIGO_CALIDAD[form.calidad],
            fechaCosecha: form.fecha,
            cantidad,
            unidad: form.unidad,
            cantidadKg: kg,
            // Una cosecha nueva entra completa al inventario
            stockDisponibleKg: kg,
            costoUnitarioKg: costoKg,
            costoTotal: Math.round(kg * costoKg),
            precioSugeridoKg: Number(form.precioKg) || 0,
            destino: form.destino,
            ...(form.responsable.trim() ? { responsable: form.responsable.trim() } : {}),
            ...(form.observaciones.trim() ? { observaciones: form.observaciones.trim() } : {}),
        });
    };

    const cerrar = () => { mutation.reset(); onClose(); };

    return (
        <Modal open={open} onClose={cerrar} title="Registrar cosecha">
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); guardar(); }}>
                {cultivoFijo ? (
                    <div className="flex items-center gap-2 p-2.5 bg-primary/5 border border-primary/10 rounded-lg">
                        <Leaf size={14} className="text-primary shrink-0" />
                        <span className="text-sm font-semibold text-foreground">{cultivoFijo.nombreCultivo}</span>
                    </div>
                ) : (
                    <Select
                        label="Cultivo"
                        value={form.cultivoId}
                        onChange={(v) => setForm((f) => ({ ...f, cultivoId: v, productoAgroId: '' }))}
                        options={[
                            { value: '', label: 'Seleccionar cultivo...' },
                            ...activos.map((c) => ({ value: String(c.id), label: c.nombreCultivo })),
                        ]}
                    />
                )}

                <Input label="Fecha de cosecha" value={form.fecha} onChange={poner('fecha')} type="date" required />

                <div className="grid grid-cols-2 gap-3">
                    <Input label="Cantidad" value={form.cantidad} onChange={poner('cantidad')} type="number" required placeholder="0" />
                    <Select label="Unidad" value={form.unidad} onChange={poner('unidad')} options={UNIDADES} />
                </div>
                {!convertible && (
                    <Input
                        label="Equivale a (kg)"
                        value={form.equivalenteKg}
                        onChange={poner('equivalenteKg')}
                        type="number"
                        required
                        placeholder="Peso total en kg"
                    />
                )}

                <Select label="Calidad" value={form.calidad} onChange={poner('calidad')} options={CALIDADES} />
                <Input label="Responsable" value={form.responsable} onChange={poner('responsable')} placeholder="Nombre del responsable" />
                <Select label="Destino" value={form.destino} onChange={poner('destino')} options={DESTINOS} />
                <Textarea label="Observaciones" value={form.observaciones} onChange={poner('observaciones')} rows={2} />

                <div className="pt-2 border-t border-border space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Inventario y ventas</p>
                    <Select
                        label="Producto"
                        value={form.productoAgroId}
                        onChange={poner('productoAgroId')}
                        options={[
                            { value: '', label: 'Seleccionar producto...' },
                            ...productos.map((p) => ({ value: String(p.id), label: p.nombre })),
                        ]}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Costo por kg" value={form.costoKg} onChange={poner('costoKg')} type="number" placeholder="1800" />
                        <Input label="Precio sugerido por kg" value={form.precioKg} onChange={poner('precioKg')} type="number" placeholder="3500" />
                    </div>
                    {kg > 0 && costoKg > 0 && (
                        <div className="rounded-xl bg-muted p-3 text-sm flex justify-between">
                            <span className="text-muted-foreground">Costo de la cosecha ({kg.toLocaleString('es-CO')} kg)</span>
                            <span className="font-bold text-foreground">{pesos(kg * costoKg)}</span>
                        </div>
                    )}
                </div>

                {mutation.error && (
                    <p className="text-sm text-red-600">{mensajeError(mutation.error, 'No se pudo registrar la cosecha.')}</p>
                )}

                <div className="flex gap-3 pt-2">
                    <Btn type="submit" disabled={!completo || mutation.isPending} className="flex-1 justify-center">
                        {mutation.isPending ? 'Guardando...' : 'Registrar cosecha'}
                    </Btn>
                    <Btn variant="outline" onClick={cerrar}>Cancelar</Btn>
                </div>
            </form>
        </Modal>
    );
};

export default RegistrarCosechaModal;
