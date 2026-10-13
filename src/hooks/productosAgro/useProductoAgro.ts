import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productosAgroApi } from "../../api/actividades/actividades";
import { isAxiosError } from "axios";

export function useProductoAgro() {
    const queryClient = useQueryClient();
    const { data: productos = [], isLoading: loading, error} = useQuery({
        queryKey: ['productos-agro'],
        queryFn: async() => (await productosAgroApi.listar()).data,
    });
    const eliminarMutation = useMutation({
        mutationFn: (id: number) => productosAgroApi.eliminar(id), 
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['productos-agro'] });},
    });
    const handleEliminar = (id: number) => {eliminarMutation.mutate(id); };
    const mensajeError = (err: unknown) =>
        isAxiosError(err) ? err.response?.data?.message ?? 'Ocurrió un error' : 'Error inesperado';
    return { 
    productos, loading,
    error: error ? mensajeError(error) : null,
    handleEliminar,
    eliminando: eliminarMutation.isPending,
    errorEliminar: eliminarMutation.error ? mensajeError(eliminarMutation.error) : null,
    }
}