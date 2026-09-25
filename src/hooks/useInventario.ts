import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
    insumosApi, almacenesApi, categoriasApi, proveedoresApi, movimientosApi,
} from '../api/inventario';
import type { RegistrarMovimientoPayload, TipoMovimiento } from '../types/inventario';
import { usuarioActualId } from './usuarioActual';

const FORM_ALMACEN_INICIAL = { nombre: '', ubicacion: '' };
const FORM_MOVIMIENTO_INICIAL = {
    insumoId: '',
    tipo: 'entrada' as TipoMovimiento,
    cantidadPresentacion: '',
    descripcion: '',
    almacenOrigenId: '',
    almacenDestinoId: '',
};

export function useInventario() {
    const queryClient = useQueryClient();
    const [busqueda, setBusqueda] = useState('');

    // ----- Lecturas -----
    const { data: insumos = [], isLoading: loading, error } = useQuery({
        queryKey: ['insumos', 'todos'],
        queryFn: async () => (await insumosApi.listar()).data,
    });
    const { data: almacenes = [] } = useQuery({
        queryKey: ['almacenes'],
        queryFn: async () => (await almacenesApi.listar()).data,
    });
    const { data: categorias = [] } = useQuery({
        queryKey: ['categorias'],
        queryFn: async () => (await categoriasApi.listar()).data,
    });
    const { data: proveedores = [] } = useQuery({
        queryKey: ['proveedores'],
        queryFn: async () => (await proveedoresApi.listar()).data,
    });
    const { data: movimientos = [] } = useQuery({
        queryKey: ['movimientos'],
        queryFn: async () => (await movimientosApi.listar()).data,
    });

    const nombreAlmacen = (id?: number) =>
        almacenes.find((a) => a.id === id)?.nombre ?? (id ? `#${id}` : '—');
    const nombreCategoria = (id: number) => categorias.find((c) => c.id === id)?.nombre ?? `#${id}`;
    const nombreProveedor = (id?: number) => proveedores.find((p) => p.id === id)?.nombre;
    const nombreInsumo = (id: number) => insumos.find((i) => i.id === id)?.nombre ?? `#${id}`;

    const insumosFiltrados = insumos.filter((i) =>
        i.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()),
    );
    const bajoStock = insumos.filter((i) => i.stockDisponible <= i.stockMinimo);

    const valorPorAlmacen = (almacenId: number) =>
        insumos.filter((i) => i.almacenId === almacenId).reduce((a, i) => a + i.valorInventario, 0);
    const itemsPorAlmacen = (almacenId: number) =>
        insumos.filter((i) => i.almacenId === almacenId).length;

    // ----- Nuevo almacén -----
    const [formAlmacen, setFormAlmacen] = useState(FORM_ALMACEN_INICIAL);
    const crearAlmacen = useMutation({
        mutationFn: () =>
            almacenesApi.crear({
                nombre: formAlmacen.nombre,
                ubicacion: formAlmacen.ubicacion || undefined,
            }),
        onSuccess: () => {
            setFormAlmacen(FORM_ALMACEN_INICIAL);
            queryClient.invalidateQueries({ queryKey: ['almacenes'] });
        },
    });

    // ----- Registrar movimiento -----
    const [formMovimiento, setFormMovimiento] = useState(FORM_MOVIMIENTO_INICIAL);
    const [errorMovimiento, setErrorMovimiento] = useState<string | null>(null);

    const setMovimiento = (campo: keyof typeof FORM_MOVIMIENTO_INICIAL) => (valor: string) =>
        setFormMovimiento((prev) => ({ ...prev, [campo]: valor }));

    const insumoSeleccionado = insumos.find((i) => i.id === Number(formMovimiento.insumoId)) ?? null;
    const cantidadUsoCalculada = insumoSeleccionado
        ? Number(formMovimiento.cantidadPresentacion || 0) * (insumoSeleccionado.factorConversionUso || 1)
        : 0;

    const registrarMovimientoMutation = useMutation({
        mutationFn: (payload: RegistrarMovimientoPayload) => movimientosApi.registrar(payload),
        onSuccess: () => {
            setFormMovimiento(FORM_MOVIMIENTO_INICIAL);
            queryClient.invalidateQueries({ queryKey: ['insumos'] });
            queryClient.invalidateQueries({ queryKey: ['movimientos'] });
        },
    });

    const registrarMovimiento = (onSuccess: () => void) => {
        setErrorMovimiento(null);
        const usuarioId = usuarioActualId();
        if (!usuarioId) {
            setErrorMovimiento('No se encontró el usuario autenticado. Vuelve a iniciar sesión.');
            return;
        }
        if (!insumoSeleccionado) {
            setErrorMovimiento('Selecciona un insumo.');
            return;
        }
        if (!(Number(formMovimiento.cantidadPresentacion) > 0)) {
            setErrorMovimiento('La cantidad debe ser mayor a 0.');
            return;
        }
        if (formMovimiento.tipo === 'traslado' &&
            formMovimiento.almacenOrigenId === formMovimiento.almacenDestinoId) {
            setErrorMovimiento('El almacén de origen y destino deben ser distintos.');
            return;
        }
        registrarMovimientoMutation.mutate(
            {
                insumoId: insumoSeleccionado.id,
                tipo: formMovimiento.tipo,
                cantidadPresentacion: Number(formMovimiento.cantidadPresentacion),
                cantidadUso: cantidadUsoCalculada,
                descripcion: formMovimiento.descripcion || undefined,
                usuarioId,
                almacenOrigenId: formMovimiento.almacenOrigenId ? Number(formMovimiento.almacenOrigenId) : undefined,
                almacenDestinoId: formMovimiento.almacenDestinoId ? Number(formMovimiento.almacenDestinoId) : undefined,
            },
            { onSuccess },
        );
    };

    const errorFormMovimiento =
        errorMovimiento ??
        (registrarMovimientoMutation.error && isAxiosError(registrarMovimientoMutation.error)
            ? registrarMovimientoMutation.error.response?.data?.message ?? 'No se pudo registrar el movimiento'
            : registrarMovimientoMutation.error
                ? 'Error inesperado'
                : null);

    return {
        insumos: insumosFiltrados,
        todosLosInsumos: insumos,
        almacenes, categorias, proveedores, movimientos,
        bajoStock,
        loading,
        error: error ? 'No se pudo cargar el inventario' : null,
        busqueda, setBusqueda,
        nombreAlmacen, nombreCategoria, nombreProveedor, nombreInsumo,
        valorPorAlmacen, itemsPorAlmacen,
        // nuevo almacén
        formAlmacen, setFormAlmacen, crearAlmacen,
        // movimiento
        formMovimiento, setMovimiento, insumoSeleccionado, cantidadUsoCalculada,
        registrarMovimiento,
        registrandoMovimiento: registrarMovimientoMutation.isPending,
        errorFormMovimiento,
    };
}