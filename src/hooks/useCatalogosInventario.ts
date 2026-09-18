import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { almacenesApi, categoriasApi, proveedoresApi } from '../api/inventario';

export function useCatalogosInventario() {
    const queryClient = useQueryClient();

    // ----- Lecturas -----
    const { data: almacenes = [], isLoading: cargandoAlmacenes } = useQuery({
        queryKey: ['almacenes'],
        queryFn: async () => (await almacenesApi.listar()).data,
    });
    const { data: categorias = [], isLoading: cargandoCategorias } = useQuery({
        queryKey: ['categorias'],
        queryFn: async () => (await categoriasApi.listar()).data,
    });
    const { data: proveedores = [], isLoading: cargandoProveedores } = useQuery({
        queryKey: ['proveedores'],
        queryFn: async () => (await proveedoresApi.listar()).data,
    });

    // ----- Formularios (uno por catálogo) -----
    const [formAlmacen, setFormAlmacen] = useState({ nombre: '', ubicacion: '' });
    const [formCategoria, setFormCategoria] = useState({ nombre: '', tipoInsumo: 'consumible' });
    const [formProveedor, setFormProveedor] = useState({ nombre: '' });

    // ----- Mutaciones -----
    const crearAlmacen = useMutation({
        mutationFn: () =>
        almacenesApi.crear({
            nombre: formAlmacen.nombre,
            ubicacion: formAlmacen.ubicacion || undefined,
        }),
        onSuccess: () => {
        setFormAlmacen({ nombre: '', ubicacion: '' });
        queryClient.invalidateQueries({ queryKey: ['almacenes'] });
        },
    });

    const crearCategoria = useMutation({
        mutationFn: () => categoriasApi.crear(formCategoria),
        onSuccess: () => {
        setFormCategoria({ nombre: '', tipoInsumo: 'consumible' });
        queryClient.invalidateQueries({ queryKey: ['categorias'] });
        },
    });

    const crearProveedor = useMutation({
        mutationFn: () => proveedoresApi.crear(formProveedor),
        onSuccess: () => {
        setFormProveedor({ nombre: '' });
        queryClient.invalidateQueries({ queryKey: ['proveedores'] });
        },
    });

    return {
        almacenes, categorias, proveedores,
        cargando: cargandoAlmacenes || cargandoCategorias || cargandoProveedores,
        formAlmacen, setFormAlmacen, crearAlmacen,
        formCategoria, setFormCategoria, crearCategoria,
        formProveedor, setFormProveedor, crearProveedor,
    };
}