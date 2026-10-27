import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fichasAdminApi, rolesAdminApi, usuariosAdminApi } from '../../api/admin/admin';
import { usePermisos } from '../permisos/usePermisos';
import { PERMISO_ADMIN, ROL_APRENDIZ, ROL_INSTRUCTOR, type FichaResumen, type Rol, type UsuarioAdmin } from '../../types/admin/admin';

export function useEsAdmin() {
    const { puede, cargando, acceso } = usePermisos();
    return { esAdmin: puede(PERMISO_ADMIN), cargando, miId: acceso?.id ?? null };
}

export function useSolicitudesPendientes(habilitado = true) {
    return useQuery({
        queryKey: ['admin', 'solicitudes'],
        queryFn: async () => (await usuariosAdminApi.solicitudes()).data,
        enabled: habilitado,
        refetchInterval: 120000,
    });
}

export function useRefrescarAdmin() {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: ['admin'] });
        queryClient.invalidateQueries({ queryKey: ['mi-acceso'] });
    };
}

export function useDatosAdmin() {
    const { esAdmin } = useEsAdmin();

    const usuarios = useQuery({
        queryKey: ['admin', 'usuarios'],
        queryFn: async () => (await usuariosAdminApi.listar()).data,
        enabled: esAdmin,
    });
    const roles = useQuery({
        queryKey: ['admin', 'roles'],
        queryFn: async () => (await rolesAdminApi.listar()).data,
        enabled: esAdmin,
        staleTime: 1000 * 60 * 5,
    });
    const fichas = useQuery({
        queryKey: ['admin', 'fichas'],
        queryFn: async () => (await fichasAdminApi.resumen()).data,
        enabled: esAdmin,
    });
    const solicitudes = useSolicitudesPendientes(esAdmin);

    const rolPorId = useMemo(() => new Map<number, Rol>((roles.data ?? []).map((r) => [r.id, r])), [roles.data]);
    const fichaPorId = useMemo(() => new Map<number, FichaResumen>((fichas.data ?? []).map((f) => [f.id, f])), [fichas.data]);

    const rolDe = (usuario: UsuarioAdmin) => rolPorId.get(usuario.rolId)?.nombre ?? `Rol ${usuario.rolId}`;
    const rolPorNombre = (nombre: string) => (roles.data ?? []).find((r) => r.nombre.toLowerCase() === nombre.toLowerCase()) ?? null;
    const esRol = (usuario: UsuarioAdmin, nombre: string) => rolDe(usuario).toLowerCase() === nombre.toLowerCase();

    const lista = usuarios.data ?? [];
    const instructores = lista.filter((u) => esRol(u, ROL_INSTRUCTOR) && u.estado === 'activo');
    const aprendices = lista.filter((u) => esRol(u, ROL_APRENDIZ));

    return {
        usuarios,
        roles,
        fichas,
        solicitudes,
        rolPorId,
        fichaPorId,
        rolDe,
        rolPorNombre,
        esRol,
        instructores,
        aprendices,
        cargando: usuarios.isLoading || roles.isLoading || fichas.isLoading,
        error: usuarios.error ?? roles.error ?? fichas.error ?? null,
    };
}

export type DatosAdmin = ReturnType<typeof useDatosAdmin>;
