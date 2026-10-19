import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/axios';

export interface MiAcceso {
    id: number;
    correo: string;
    rolId: number;
    permisos: string[];
    verTodo: boolean;
    programasPermitidos: number[];
}

export function usePermisos() {
    const { data, isLoading } = useQuery({
        queryKey: ['mi-acceso'],
        queryFn: async () => (await api.get<MiAcceso>('/mi-acceso')).data,
        staleTime: 1000 * 60 * 5,
        enabled: !!localStorage.getItem('token'),
    });

    const permisos = data?.permisos ?? [];

    return {
        acceso: data ?? null,
        cargando: isLoading,
        puede: (permiso: string) => permisos.includes(permiso),
    };
}