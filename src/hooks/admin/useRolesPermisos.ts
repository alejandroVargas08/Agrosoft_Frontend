import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { permisosApi, type Permiso } from '../../api/usuarios/permisos';
import { rolesApi, type Rol } from '../../api/usuarios/roles';
import { rolPermisosApi } from '../../api/usuarios/rolPermisos';
import { mensajeError } from '../../api/errores/errores';
import { usePermisos } from '../permisos/usePermisos';

export const PERMISO_GESTIONAR_USUARIOS = 'usuarios.gestionar';

/** Los permisos agrupados por el módulo que va antes del punto. */
export interface GrupoPermisos {
    modulo: string;
    permisos: Permiso[];
}

const agrupar = (permisos: Permiso[]): GrupoPermisos[] => {
    const porModulo = new Map<string, Permiso[]>();
    for (const permiso of permisos) {
        const modulo = permiso.nombre.includes('.') ? permiso.nombre.split('.')[0] : 'otros';
        const lista = porModulo.get(modulo) ?? [];
        lista.push(permiso);
        porModulo.set(modulo, lista);
    }
    return [...porModulo.entries()]
        .map(([modulo, lista]) => ({
            modulo,
            permisos: [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre)),
        }))
        .sort((a, b) => a.modulo.localeCompare(b.modulo));
};

export function useRolesPermisos() {
    const queryClient = useQueryClient();
    const { acceso } = usePermisos();
    const [rolId, setRolId] = useState<number | null>(null);

    const rolesQuery = useQuery({
        queryKey: ['roles'],
        queryFn: async () => (await rolesApi.listar()).data,
    });

    const permisosQuery = useQuery({
        queryKey: ['permisos'],
        queryFn: async () => (await permisosApi.listar()).data,
        staleTime: 1000 * 60 * 10,
    });

    const roles = rolesQuery.data ?? [];
    // Al cargar se selecciona el primero, sin efecto: se deriva en el render
    const rolSeleccionado: Rol | null = roles.find((r) => r.id === rolId) ?? roles[0] ?? null;

    const rolPermisosQuery = useQuery({
        queryKey: ['rol-permisos', rolSeleccionado?.id],
        queryFn: async () => (await rolPermisosApi.porRol(rolSeleccionado!.id)).data,
        enabled: rolSeleccionado !== null,
    });

    const permisoIdsDelRol = new Set((rolPermisosQuery.data ?? []).map((rp) => rp.permisoId));

    const refrescar = () => {
        queryClient.invalidateQueries({ queryKey: ['rol-permisos'] });
        // El propio acceso puede haber cambiado
        queryClient.invalidateQueries({ queryKey: ['mi-acceso'] });
    };

    const alternarMutation = useMutation({
        mutationFn: ({ permisoId, tiene }: { permisoId: number; tiene: boolean }) =>
            tiene
                ? rolPermisosApi.quitar(rolSeleccionado!.id, permisoId)
                : rolPermisosApi.asignar(rolSeleccionado!.id, permisoId),
        onSuccess: refrescar,
    });

    const crearRolMutation = useMutation({
        mutationFn: (data: { nombre: string; descripcion?: string }) => rolesApi.crear(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
    });

    /**
     * Quitarte el permiso de administrar usuarios de tu propio rol te deja sin
     * forma de volver a entrar aquí. El backend no lo impide, así que se
     * bloquea en pantalla.
     */
    const bloqueado = (permiso: Permiso): string | null => {
        const esMiRol = acceso !== null && rolSeleccionado !== null && acceso.rolId === rolSeleccionado.id;
        if (esMiRol && permiso.nombre === PERMISO_GESTIONAR_USUARIOS && permisoIdsDelRol.has(permiso.id)) {
            return 'No puedes quitarte a ti mismo el permiso de administrar usuarios: perderías el acceso a esta pantalla.';
        }
        return null;
    };

    const errorAccion = alternarMutation.error || crearRolMutation.error;

    return {
        roles,
        rolSeleccionado,
        seleccionar: setRolId,
        grupos: agrupar(permisosQuery.data ?? []),
        tienePermiso: (permiso: Permiso) => permisoIdsDelRol.has(permiso.id),
        bloqueado,
        esMiRol: acceso !== null && rolSeleccionado !== null && acceso.rolId === rolSeleccionado.id,
        cargando: rolesQuery.isLoading || permisosQuery.isLoading,
        cargandoPermisosDelRol: rolPermisosQuery.isLoading,
        error: rolesQuery.error
            ? mensajeError(rolesQuery.error, 'No se pudieron cargar los roles.')
            : permisosQuery.error
                ? mensajeError(permisosQuery.error, 'No se pudieron cargar los permisos.')
                : '',
        errorAccion: errorAccion ? mensajeError(errorAccion, 'No se pudo guardar el cambio.') : '',
        procesando: alternarMutation.isPending || crearRolMutation.isPending,
        alternar: (permiso: Permiso) =>
            alternarMutation.mutate({ permisoId: permiso.id, tiene: permisoIdsDelRol.has(permiso.id) }),
        crearRol: (nombre: string, descripcion: string, alTerminar?: () => void) =>
            crearRolMutation.mutate(
                { nombre: nombre.trim(), descripcion: descripcion.trim() || undefined },
                { onSuccess: () => alTerminar?.() },
            ),
    };
}
