import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    fichasACargoApi,
    programasFormacionApi,
    type ActualizarPrograma,
    type CrearPrograma,
} from '../../api/programa_formacion/programasFormacion';
import { usuarioApi } from '../../api/usuarios/usuarios';
import { rolesApi } from '../../api/usuarios/roles';
import { aprendicesApi } from '../../api/instructor';
import { mensajeError } from '../../api/errores/errores';

const ROL_INSTRUCTOR = 'Instructor';

export function useProgramas() {
    const queryClient = useQueryClient();
    const [busqueda, setBusqueda] = useState('');

    const programasQuery = useQuery({
        queryKey: ['programas-resumen'],
        queryFn: async () => (await programasFormacionApi.resumen()).data,
    });

    // Para el selector de instructor: hay que cruzar usuarios con roles,
    // porque GET /usuarios no filtra por rol.
    const usuariosQuery = useQuery({
        queryKey: ['usuarios'],
        queryFn: async () => (await usuarioApi.listar()).data,
        staleTime: 1000 * 60 * 5,
    });
    const rolesQuery = useQuery({
        queryKey: ['roles'],
        queryFn: async () => (await rolesApi.listar()).data,
        staleTime: 1000 * 60 * 10,
    });

    const rolInstructor = (rolesQuery.data ?? []).find((r) => r.nombre === ROL_INSTRUCTOR);
    const instructores = (usuariosQuery.data ?? []).filter(
        (u) => rolInstructor !== undefined && u.rolId === rolInstructor.id && u.estado === 'activo',
    );

    const texto = busqueda.trim().toLowerCase();
    const programas = (programasQuery.data ?? []).filter(
        (p) => !texto || p.nombre.toLowerCase().includes(texto) || p.ficha.includes(texto),
    );

    const refrescar = () => {
        queryClient.invalidateQueries({ queryKey: ['programas-resumen'] });
        queryClient.invalidateQueries({ queryKey: ['mis-fichas'] });
    };

    const crearMutation = useMutation({
        mutationFn: (data: CrearPrograma) => programasFormacionApi.crear(data),
        onSuccess: refrescar,
    });

    const actualizarMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: ActualizarPrograma }) =>
            programasFormacionApi.actualizar(id, data),
        onSuccess: refrescar,
    });

    const asignarInstructorMutation = useMutation({
        mutationFn: ({ usuarioId, programaId }: { usuarioId: number; programaId: number }) =>
            fichasACargoApi.asignar(usuarioId, programaId),
        onSuccess: refrescar,
    });

    const quitarInstructorMutation = useMutation({
        mutationFn: ({ usuarioId, programaId }: { usuarioId: number; programaId: number }) =>
            fichasACargoApi.quitar(usuarioId, programaId),
        onSuccess: refrescar,
    });

    const errorAccion =
        crearMutation.error ||
        actualizarMutation.error ||
        asignarInstructorMutation.error ||
        quitarInstructorMutation.error;

    return {
        programas,
        total: (programasQuery.data ?? []).length,
        instructores,
        busqueda,
        setBusqueda,
        cargando: programasQuery.isLoading,
        error: programasQuery.error
            ? mensajeError(programasQuery.error, 'No se pudieron cargar los programas.')
            : '',
        errorAccion: errorAccion ? mensajeError(errorAccion, 'No se pudo completar la acción.') : '',
        procesando:
            crearMutation.isPending ||
            actualizarMutation.isPending ||
            asignarInstructorMutation.isPending ||
            quitarInstructorMutation.isPending,
        crear: (data: CrearPrograma, alTerminar?: () => void) =>
            crearMutation.mutate(data, { onSuccess: () => alTerminar?.() }),
        actualizar: (id: number, data: ActualizarPrograma, alTerminar?: () => void) =>
            actualizarMutation.mutate({ id, data }, { onSuccess: () => alTerminar?.() }),
        // Cerrar una ficha es marcarla finalizada
        cerrar: (id: number, alTerminar?: () => void) =>
            actualizarMutation.mutate({ id, data: { estado: 'finalizado' } }, { onSuccess: () => alTerminar?.() }),
        asignarInstructor: (usuarioId: number, programaId: number, alTerminar?: () => void) =>
            asignarInstructorMutation.mutate({ usuarioId, programaId }, { onSuccess: () => alTerminar?.() }),
        quitarInstructor: (usuarioId: number, programaId: number, alTerminar?: () => void) =>
            quitarInstructorMutation.mutate({ usuarioId, programaId }, { onSuccess: () => alTerminar?.() }),
    };
}

/** Los aprendices de una ficha, para el modal que los lista. */
export function useAprendicesDeFicha(programaId: number | null) {
    const query = useQuery({
        queryKey: ['aprendices', programaId],
        queryFn: async () => (await aprendicesApi.listar(programaId ?? undefined)).data,
        enabled: programaId !== null,
    });

    return {
        aprendices: query.data ?? [],
        cargando: query.isLoading,
    };
}
