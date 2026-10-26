import { useQuery } from '@tanstack/react-query';
import { aprendicesApi, misFichasApi, revisionApi } from '../../api/instructor';
import { mensajeError } from '../../api/errores/errores';
import { usePermisos } from '../permisos/usePermisos';
import { PERMISO_REVISAR_ACTIVIDADES } from './permisos';
import type { Aprendiz, Ficha } from '../../types/instructor';

/** Una ficha con los contadores que de verdad se pueden calcular. */
export interface FichaConResumen extends Ficha {
    aprendices: number;
    porRevisar: number;
}

export function useMisFichas() {
    const { puede } = usePermisos();
    const puedeRevisar = puede(PERMISO_REVISAR_ACTIVIDADES);

    const fichasQuery = useQuery({
        queryKey: ['mis-fichas'],
        queryFn: async () => (await misFichasApi.listar()).data,
    });

    // Se piden todos los aprendices de una sola vez y se agrupan por ficha,
    // en lugar de una consulta por ficha.
    const aprendicesQuery = useQuery({
        queryKey: ['aprendices'],
        queryFn: async () => (await aprendicesApi.listar()).data,
    });

    // Solo si el usuario puede revisar; si no, el backend responde 403
    const porRevisarQuery = useQuery({
        queryKey: ['asignaciones-por-revisar'],
        queryFn: async () => (await revisionApi.porRevisar()).data,
        enabled: puedeRevisar,
    });

    const aprendices = aprendicesQuery.data ?? [];

    // aprendizId -> fichaId, para poder atribuir cada entrega a su ficha
    const fichaDeAprendiz = new Map<number, number>();
    for (const a of aprendices) {
        if (a.programaFormacionId !== null) fichaDeAprendiz.set(a.id, a.programaFormacionId);
    }

    const porRevisarPorFicha = new Map<number, number>();
    for (const asignacion of porRevisarQuery.data ?? []) {
        const aprendizId = asignacion.aprendiz?.id;
        if (aprendizId === undefined) continue;
        const fichaId = fichaDeAprendiz.get(aprendizId);
        if (fichaId === undefined) continue;
        porRevisarPorFicha.set(fichaId, (porRevisarPorFicha.get(fichaId) ?? 0) + 1);
    }

    const contarAprendices = (fichaId: number) =>
        aprendices.filter((a: Aprendiz) => a.programaFormacionId === fichaId).length;

    const fichas: FichaConResumen[] = (fichasQuery.data ?? []).map((ficha) => ({
        ...ficha,
        aprendices: contarAprendices(ficha.id),
        porRevisar: porRevisarPorFicha.get(ficha.id) ?? 0,
    }));

    return {
        fichas,
        total: fichas.length,
        cargando: fichasQuery.isLoading || aprendicesQuery.isLoading,
        error: fichasQuery.error
            ? mensajeError(fichasQuery.error, 'No se pudieron cargar tus fichas.')
            : '',
        puedeRevisar,
    };
}
