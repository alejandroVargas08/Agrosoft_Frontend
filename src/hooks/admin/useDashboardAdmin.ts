import { useQuery } from '@tanstack/react-query';
import { usuarioApi } from '../../api/usuarios/usuarios';
import { rolesApi } from '../../api/usuarios/roles';
import { programasFormacionApi } from '../../api/programa_formacion/programasFormacion';
import { mensajeError } from '../../api/errores/errores';

/** Los indicadores del administrador. Todo sale de contar lo que ya devuelven
 *  los endpoints de usuarios, roles y programas: no hay endpoint de métricas. */
export function useDashboardAdmin() {
    const usuariosQuery = useQuery({
        queryKey: ['usuarios'],
        queryFn: async () => (await usuarioApi.listar()).data,
    });

    const rolesQuery = useQuery({
        queryKey: ['roles'],
        queryFn: async () => (await rolesApi.listar()).data,
        staleTime: 1000 * 60 * 10,
    });

    const programasQuery = useQuery({
        queryKey: ['programas-resumen'],
        queryFn: async () => (await programasFormacionApi.resumen()).data,
    });

    const usuarios = usuariosQuery.data ?? [];
    const roles = rolesQuery.data ?? [];
    const programas = programasQuery.data ?? [];

    const nombreRol = (rolId: number) => roles.find((r) => r.id === rolId)?.nombre ?? 'Rol #' + rolId;

    const porEstado = (estado: string) => usuarios.filter((u) => u.estado === estado).length;

    // Cuántos usuarios hay de cada rol, de mayor a menor
    const porRol = roles
        .map((rol) => ({
            rol: rol.nombre,
            total: usuarios.filter((u) => u.rolId === rol.id).length,
        }))
        .filter((fila) => fila.total > 0)
        .sort((a, b) => b.total - a.total);

    const pendientes = usuarios
        .filter((u) => u.estado === 'pendiente')
        .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());

    const fichasSinInstructor = programas.filter(
        (p) => p.estado === 'activo' && p.instructores.length === 0,
    );

    return {
        totales: {
            usuarios: usuarios.length,
            activos: porEstado('activo'),
            pendientes: pendientes.length,
            rechazados: porEstado('rechazado'),
            inactivos: porEstado('inactivo') + porEstado('suspendido'),
            fichas: programas.length,
            fichasActivas: programas.filter((p) => p.estado === 'activo').length,
            aprendices: programas.reduce((total, p) => total + p.totalAprendices, 0),
        },
        porRol,
        pendientes: pendientes.slice(0, 5),
        fichasSinInstructor,
        nombreRol,
        cargando: usuariosQuery.isLoading || programasQuery.isLoading,
        error: usuariosQuery.error
            ? mensajeError(usuariosQuery.error, 'No se pudieron cargar los indicadores.')
            : '',
    };
}
