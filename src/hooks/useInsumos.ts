import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { insumosApi, almacenesApi, categoriasApi, proveedoresApi } from '../api/inventario';
import type { EstadoInsumo } from '../types/inventario';

export function useInsumos() {
    const [filtroEstado, setFiltroEstado] = useState<'Todos' | EstadoInsumo>('Todos');
    const [soloBajoStock, setSoloBajoStock] = useState(false);

    const {
        data: insumos = [],
        isLoading: loading,
        error,
    } = useQuery({
        queryKey: ['insumos', soloBajoStock ? 'bajo-stock' : 'todos'],
        queryFn: async () =>
        (soloBajoStock ? await insumosApi.listarBajoStock() : await insumosApi.listar()).data,
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

    const nombreAlmacen = (id: number) => almacenes.find((a) => a.id === id)?.nombre ?? `#${id}`;
    const nombreCategoria = (id: number) => categorias.find((c) => c.id === id)?.nombre ?? `#${id}`;
    const nombreProveedor = (id: number) => proveedores.find((p) => p.id === id)?.nombre ?? `#${id}`;

    const insumosFiltrados = insumos.filter(
        (i) => filtroEstado === 'Todos' || i.estado === filtroEstado,
    );

    return {
        insumos: insumosFiltrados,
        loading,
        error: error ? 'No se pudo cargar el listado de insumos' : null,
        filtroEstado,
        setFiltroEstado,
        soloBajoStock,
        setSoloBajoStock,
        nombreAlmacen,
        nombreCategoria,
        nombreProveedor,
    };
}