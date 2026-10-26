import { useQuery } from '@tanstack/react-query';
import { alertasApi } from '../../api/alertas';
import { aprendicesApi, misFichasApi, revisionApi } from '../../api/instructor';
import { usePermisos } from '../permisos/usePermisos';
import { PERMISO_REVISAR_ACTIVIDADES } from './permisos';

/** Los indicadores del instructor. Solo lo que el backend puede responder de
 *  verdad: el mockup pide además novedades, tareas vencidas y gráficas
 *  semanales, y para eso no hay endpoints. */
export function useInicioInstructor() {
    const { puede } = usePermisos();
    const puedeRevisar = puede(PERMISO_REVISAR_ACTIVIDADES);

    const fichasQuery = useQuery({
        queryKey: ['mis-fichas'],
        queryFn: async () => (await misFichasApi.listar()).data,
        staleTime: 1000 * 60 * 5,
    });

    const aprendicesQuery = useQuery({
        queryKey: ['aprendices'],
        queryFn: async () => (await aprendicesApi.listar()).data,
        staleTime: 1000 * 60 * 5,
    });

    const porRevisarQuery = useQuery({
        queryKey: ['asignaciones-por-revisar'],
        queryFn: async () => (await revisionApi.porRevisar()).data,
        enabled: puedeRevisar,
    });

    const bajoStockQuery = useQuery({
        queryKey: ['insumos-bajo-stock'],
        queryFn: async () => (await alertasApi.insumosBajoStock()).data,
    });

    const sensorAlertasQuery = useQuery({
        queryKey: ['sensor-alertas'],
        queryFn: async () => (await alertasApi.sensorAlertas()).data,
    });

    const porRevisar = porRevisarQuery.data ?? [];
    const alertas = sensorAlertasQuery.data ?? [];

    // Un sensor puede tener varias alertas; lo que importa es cuántos sensores
    // están fuera de rango, no cuántas lecturas malas hay.
    const sensoresConAlerta = new Set(alertas.map((a) => a.sensorId)).size;

    // Las entregas más recientes primero, que es lo que el instructor atiende
    const ultimasEntregas = [...porRevisar]
        .sort((a, b) => {
            const fa = a.entregadaEn ? new Date(a.entregadaEn).getTime() : 0;
            const fb = b.entregadaEn ? new Date(b.entregadaEn).getTime() : 0;
            return fb - fa;
        })
        .slice(0, 5);

    return {
        fichas: fichasQuery.data?.length ?? 0,
        aprendices: aprendicesQuery.data?.length ?? 0,
        porRevisar: porRevisar.length,
        insumosBajos: bajoStockQuery.data?.length ?? 0,
        sensoresConAlerta,
        ultimasEntregas,
        puedeRevisar,
        cargando: fichasQuery.isLoading || aprendicesQuery.isLoading,
    };
}
