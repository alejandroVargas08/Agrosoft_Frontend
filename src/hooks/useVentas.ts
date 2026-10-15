import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { InicioUsuario } from './useAuth';
import { ventasApi, clientesApi, ventasDetallesApi, loteProduccionApi } from '../api/ventas';

const FORM_VENTA = {
    clienteId: '',
    loteId: '',
    cantidadKg: '',
    precioKg: '',
    descuentoPct: '0',
    ivaPct: '0',
};

const FORM_CLIENTE = {
    nombre: '',
    identificacion: '',
    telefono: '',
    email: '',
};

const num = (v: string) => parseFloat(v) || 0;

export function useVentas() {
    const queryClient = useQueryClient();
    const { user } = InicioUsuario();
    const usuarioId = user?.id;

    const [formVenta, setFormVenta] = useState(FORM_VENTA);
    const [formCliente, setFormCliente] = useState(FORM_CLIENTE);
    const [errorForm, setErrorForm] = useState('');

    const ventasQuery = useQuery({
        queryKey: ['ventas'],
        queryFn: async () => (await ventasApi.listar()).data,
    });

    const clientesQuery = useQuery({
        queryKey: ['clientes'],
        queryFn: async () => (await clientesApi.listar()).data,
    });

    const detallesQuery = useQuery({
        queryKey: ['ventas-detalles'],
        queryFn: async () => (await ventasDetallesApi.listar()).data,
    });

    const lotesQuery = useQuery({
        queryKey: ['lotes-produccion'],
        queryFn: async () => (await loteProduccionApi.listar()).data,
    });

    const ventas = ventasQuery.data ?? [];
    const clientes = clientesQuery.data ?? [];
    const detalles = detallesQuery.data ?? [];
    const lotes = lotesQuery.data ?? [];

    const invalidarTodo = () => {
        queryClient.invalidateQueries({ queryKey: ['ventas'] });
        queryClient.invalidateQueries({ queryKey: ['ventas-detalles'] });
        queryClient.invalidateQueries({ queryKey: ['lotes-produccion'] });
    };

    // ─── Cálculos del formulario de venta ───
    const subtotal = num(formVenta.cantidadKg) * num(formVenta.precioKg);
    const descuento = subtotal * (num(formVenta.descuentoPct) / 100);
    const impuestos = (subtotal - descuento) * (num(formVenta.ivaPct) / 100);
    const total = subtotal - descuento + impuestos;

    const setVenta = (campo: keyof typeof FORM_VENTA) => (valor: string) =>
        setFormVenta((anterior) => ({ ...anterior, [campo]: valor }));

    const setCliente = (campo: keyof typeof FORM_CLIENTE) => (valor: string) =>
        setFormCliente((anterior) => ({ ...anterior, [campo]: valor }));

    // Guardar una venta son tres pasos encadenados
    const crearVentaMutation = useMutation({
        mutationFn: async () => {
            const lote = lotes.find((l) => l.id === Number(formVenta.loteId));

            const { data: venta } = await ventasApi.crear({
                fecha: new Date().toISOString(),
                clienteId: formVenta.clienteId ? Number(formVenta.clienteId) : undefined,
                subtotal,
                impuestos,
                descuento,
                total,
                estado: 'pendiente',
                usuarioId: usuarioId as number,
            });

            if (lote) {
                await ventasDetallesApi.crear({
                    ventaId: venta.id,
                    productoAgroId: lote.productoAgroId,
                    loteProduccionId: lote.id,
                    cultivoId: lote.cultivoId,
                    cantidadKg: num(formVenta.cantidadKg),
                    precioUnitarioKg: num(formVenta.precioKg),
                    costoUnitarioKg: lote.costoUnitarioKg,
                });

                await loteProduccionApi.descontarStock(lote.id, num(formVenta.cantidadKg));
            }

            return venta;
        },
        onSuccess: () => {
            invalidarTodo();
            setFormVenta(FORM_VENTA);
            setErrorForm('');
        },
        onError: () => setErrorForm('No se pudo registrar la venta.'),
    });

    const crearVenta = (alTerminar?: () => void) => {
        if (!usuarioId) {
            setErrorForm('No hay sesión activa.');
            return;
        }
        if (!formVenta.clienteId) {
            setErrorForm('Selecciona un cliente.');
            return;
        }
        if (!formVenta.loteId) {
            setErrorForm('Selecciona un lote de producción.');
            return;
        }
        if (subtotal <= 0) {
            setErrorForm('Indica la cantidad y el precio por kilo.');
            return;
        }

        const lote = lotes.find((l) => l.id === Number(formVenta.loteId));
        if (lote && num(formVenta.cantidadKg) > lote.stockDisponibleKg) {
            setErrorForm(`Solo hay ${lote.stockDisponibleKg} kg disponibles en ese lote.`);
            return;
        }

        crearVentaMutation.mutate(undefined, { onSuccess: () => alTerminar?.() });
    };

    const crearClienteMutation = useMutation({
        mutationFn: () =>
            clientesApi.crear({
                nombre: formCliente.nombre.trim(),
                identificacion: formCliente.identificacion.trim(),
                telefono: formCliente.telefono.trim() || undefined,
                email: formCliente.email.trim() || undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
            setFormCliente(FORM_CLIENTE);
        },
    });

    const crearCliente = (alTerminar?: () => void) => {
        if (!formCliente.nombre.trim() || !formCliente.identificacion.trim()) return;
        crearClienteMutation.mutate(undefined, { onSuccess: () => alTerminar?.() });
    };

    const anularMutation = useMutation({
        mutationFn: (id: number) => ventasApi.anular(id, usuarioId as number),
        onSuccess: invalidarTodo,
    });

    // ─── Datos derivados para las tarjetas de resumen ───
    const pagadas = ventas.filter((v) => v.estado === 'pagada');
    const ingresos = pagadas.reduce((suma, v) => suma + Number(v.total || 0), 0);

    const nombreCliente = (clienteId: number | null) =>
        clientes.find((c) => c.id === clienteId)?.nombre ?? 'Cliente desconocido';

    const productosDe = (ventaId: number) =>
        detalles.filter((d) => d.ventaId === ventaId).length;

    return {
        ventas, clientes, lotes,
        cargando: ventasQuery.isLoading,
        error: ventasQuery.error ? 'No se pudieron cargar las ventas.' : '',

        totalVentas: ventas.length,
        totalPagadas: pagadas.length,
        ingresos,
        nombreCliente,
        productosDe,

        formVenta, setVenta,
        subtotal, descuento, impuestos, total,
        crearVenta,
        creandoVenta: crearVentaMutation.isPending,
        errorForm,

        formCliente, setCliente,
        crearCliente,
        creandoCliente: crearClienteMutation.isPending,

        anular: (id: number) => anularMutation.mutate(id),
    };
}