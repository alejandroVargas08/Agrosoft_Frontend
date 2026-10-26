import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usuarioApi, type ActualizarUsuario, type Usuario } from '../../api/usuarios/usuarios';
import { rolesApi } from '../../api/usuarios/roles';
import { fichasACargoApi, programasFormacionApi } from '../../api/programa_formacion/programasFormacion';
import { solicitudesApi } from '../../api/usuarios/solicitudes';
import { mensajeError } from '../../api/errores/errores';

export interface FiltrosUsuarios {
    texto: string;
    rolId: string;
    estado: string;
    programaId: string;
}

const FILTROS_VACIOS: FiltrosUsuarios = { texto: '', rolId: '', estado: '', programaId: '' };

export function useUsuarios() {
    const queryClient = useQueryClient();
    const [filtros, setFiltros] = useState(FILTROS_VACIOS);

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
        queryKey: ['programas-todos'],
        queryFn: async () => (await programasFormacionApi.listarTodos()).data,
        staleTime: 1000 * 60 * 5,
    });

    const roles = rolesQuery.data ?? [];
    const programas = programasQuery.data ?? [];

    const nombreRol = (rolId: number) => roles.find((r) => r.id === rolId)?.nombre ?? 'Rol #' + rolId;
    const fichaDe = (programaId: number | null) =>
        programaId === null ? null : programas.find((p) => p.id === programaId)?.ficha ?? String(programaId);
    const nombrePrograma = (programaId: number | null) =>
        programaId === null ? null : programas.find((p) => p.id === programaId)?.nombre ?? null;

    const texto = filtros.texto.trim().toLowerCase();
    const usuarios = (usuariosQuery.data ?? []).filter((u) => {
        if (texto && !(u.nombre + ' ' + u.apellido).toLowerCase().includes(texto) &&
            !u.correo.toLowerCase().includes(texto) && !u.identificacion.includes(texto)) return false;
        if (filtros.rolId && u.rolId !== Number(filtros.rolId)) return false;
        if (filtros.estado && u.estado !== filtros.estado) return false;
        if (filtros.programaId && u.programaFormacionId !== Number(filtros.programaId)) return false;
        return true;
    });

    const refrescar = () => {
        for (const clave of [['usuarios'], ['solicitudes-acceso'], ['aprendices'], ['programas-resumen'], ['mis-fichas']]) {
            queryClient.invalidateQueries({ queryKey: clave });
        }
    };

    // Cada mutación se declara entera: envolver useMutation en un ayudante
    // rompe las reglas de los hooks.
    const actualizarMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: ActualizarUsuario }) => usuarioApi.actualizar(id, data),
        onSuccess: refrescar,
    });
    const rolMutation = useMutation({
        mutationFn: ({ id, rolId }: { id: number; rolId: number }) => usuarioApi.cambiarRol(id, rolId),
        onSuccess: refrescar,
    });
    const programaMutation = useMutation({
        mutationFn: ({ id, programaId }: { id: number; programaId: number | null }) =>
            usuarioApi.cambiarPrograma(id, programaId),
        onSuccess: refrescar,
    });
    const aprobarMutation = useMutation({
        mutationFn: (id: number) => solicitudesApi.aprobar(id),
        onSuccess: refrescar,
    });
    const rechazarMutation = useMutation({
        mutationFn: ({ id, motivo }: { id: number; motivo: string }) => solicitudesApi.rechazar(id, motivo),
        onSuccess: refrescar,
    });
    const eliminarMutation = useMutation({
        mutationFn: (id: number) => usuarioApi.eliminar(id),
        onSuccess: refrescar,
    });
    const fichasMutation = useMutation({
        mutationFn: ({ usuarioId, programaId, quitar }: { usuarioId: number; programaId: number; quitar: boolean }) =>
            quitar
                ? fichasACargoApi.quitar(usuarioId, programaId)
                : fichasACargoApi.asignar(usuarioId, programaId),
        onSuccess: () => {
            refrescar();
            queryClient.invalidateQueries({ queryKey: ['fichas-a-cargo'] });
        },
    });

    // Esta no invalida nada: lo que importa es la contraseña que devuelve
    const contrasenaMutation = useMutation({
        mutationFn: (id: number) => usuarioApi.restablecerContrasena(id),
    });

    const errorAccion =
        actualizarMutation.error || rolMutation.error || programaMutation.error ||
        aprobarMutation.error || rechazarMutation.error || eliminarMutation.error ||
        fichasMutation.error || contrasenaMutation.error;

    return {
        usuarios,
        total: (usuariosQuery.data ?? []).length,
        roles,
        programas,
        filtros,
        ponerFiltro: (clave: keyof FiltrosUsuarios, valor: string) =>
            setFiltros((f) => ({ ...f, [clave]: valor })),
        nombreRol,
        fichaDe,
        nombrePrograma,
        cargando: usuariosQuery.isLoading,
        error: usuariosQuery.error
            ? mensajeError(usuariosQuery.error, 'No se pudieron cargar los usuarios.')
            : '',
        errorAccion: errorAccion ? mensajeError(errorAccion, 'No se pudo completar la acción.') : '',
        procesando:
            actualizarMutation.isPending || rolMutation.isPending || programaMutation.isPending ||
            aprobarMutation.isPending || rechazarMutation.isPending || eliminarMutation.isPending ||
            fichasMutation.isPending || contrasenaMutation.isPending,

        cambiarEstado: (usuario: Usuario, alTerminar?: () => void) =>
            actualizarMutation.mutate(
                { id: usuario.id, data: { estado: usuario.estado === 'activo' ? 'inactivo' : 'activo' } },
                { onSuccess: () => alTerminar?.() },
            ),
        cambiarRol: (id: number, rolId: number, alTerminar?: () => void) =>
            rolMutation.mutate({ id, rolId }, { onSuccess: () => alTerminar?.() }),
        cambiarPrograma: (id: number, programaId: number | null, alTerminar?: () => void) =>
            programaMutation.mutate({ id, programaId }, { onSuccess: () => alTerminar?.() }),
        aprobar: (id: number, alTerminar?: () => void) =>
            aprobarMutation.mutate(id, { onSuccess: () => alTerminar?.() }),
        rechazar: (id: number, motivo: string, alTerminar?: () => void) =>
            rechazarMutation.mutate({ id, motivo }, { onSuccess: () => alTerminar?.() }),
        eliminar: (id: number, alTerminar?: () => void) =>
            eliminarMutation.mutate(id, { onSuccess: () => alTerminar?.() }),
        cambiarFicha: (usuarioId: number, programaId: number, quitar: boolean) =>
            fichasMutation.mutate({ usuarioId, programaId, quitar }),
        restablecerContrasena: (id: number) => contrasenaMutation.mutate(id),
        contrasenaGenerada: contrasenaMutation.data?.data.contrasenaTemporal ?? null,
        limpiarContrasena: () => contrasenaMutation.reset(),
    };
}

/** Las fichas que ya tiene a cargo un instructor. */
export function useFichasACargo(usuarioId: number | null) {
    const query = useQuery({
        queryKey: ['fichas-a-cargo', usuarioId],
        queryFn: async () => (await fichasACargoApi.listar(usuarioId!)).data,
        enabled: usuarioId !== null,
    });
    return { fichas: query.data ?? [], cargando: query.isLoading };
}
