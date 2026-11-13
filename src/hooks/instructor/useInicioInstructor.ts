import { useQuery } from '@tanstack/react-query';
import { alertasApi } from '../../api/alertas';
import { vuelosApi, dronesApi } from '../../api/drones/drones';
import { novedadesApi } from '../../api/novedades';
import { panelInstructorApi, resumenAprendicesApi, revisionApi } from '../../api/instructor';
import { lotesApi } from '../../api/territorio';
import { useSensoresPorLote } from '../sensores/useSensoresPorLote';
import { usePermisos } from '../permisos/usePermisos';
import { PERMISO_REVISAR_ACTIVIDADES } from './permisos';

/** El último vuelo con análisis terminado, con los nombres ya resueltos. */
export interface UltimoVuelo {
    id: number;
    nombre: string;
    estado: string;
    fecha: string;
    dron: string;
    lote: string;
    salud: number | null;
}

/**
 * Los indicadores y las tarjetas del panel del instructor, tal como los pide
 * el diseño. Las dos agregaciones que no salían de ningún lado —las próximas
 * fechas límite y las aprobadas por semana— ahora tienen endpoint propio.
 */
export function useInicioInstructor() {
    const { puede } = usePermisos();
    const puedeRevisar = puede(PERMISO_REVISAR_ACTIVIDADES);

    const porRevisarQuery = useQuery({
        queryKey: ['asignaciones-por-revisar'],
        queryFn: async () => (await revisionApi.porRevisar()).data,
        enabled: puedeRevisar,
    });

    // Las vencidas se suman del resumen por aprendiz: el backend ya las cuenta
    // ahí con la misma regla que usa el guard, y así no se inventa una segunda
    const resumenQuery = useQuery({
        queryKey: ['aprendices-resumen'],
        queryFn: async () => (await resumenAprendicesApi.listar()).data,
        staleTime: 60_000,
    });

    const novedadesQuery = useQuery({
        queryKey: ['novedades', 'pendiente'],
        queryFn: async () => (await novedadesApi.listar('pendiente')).data,
        staleTime: 60_000,
    });

    const bajoStockQuery = useQuery({
        queryKey: ['insumos-bajo-stock'],
        queryFn: async () => (await alertasApi.insumosBajoStock()).data,
    });

    const proximasQuery = useQuery({
        queryKey: ['panel-proximas-fechas'],
        queryFn: async () => (await panelInstructorApi.proximasFechas()).data,
        staleTime: 5 * 60_000,
    });

    const semanalQuery = useQuery({
        queryKey: ['panel-aprobadas-semana'],
        queryFn: async () => (await panelInstructorApi.aprobadasPorSemana()).data,
        staleTime: 5 * 60_000,
    });

    const vuelosQuery = useQuery({
        queryKey: ['vuelos'],
        queryFn: async () => (await vuelosApi.listar()).data,
        staleTime: 5 * 60_000,
    });

    const dronesQuery = useQuery({
        queryKey: ['drones'],
        queryFn: async () => (await dronesApi.listar()).data,
        staleTime: 10 * 60_000,
    });

    const lotesQuery = useQuery({
        queryKey: ['lotes'],
        queryFn: async () => (await lotesApi.listar()).data,
        staleTime: 5 * 60_000,
    });

    // Las estaciones las arma el mismo hook que la pantalla de Sensores, para
    // que el panel y esa pantalla nunca digan cosas distintas
    const { estaciones, resumen: resumenEstaciones } = useSensoresPorLote();

    const resumen = resumenQuery.data ?? [];
    const vencidas = resumen.reduce((total, aprendiz) => total + aprendiz.vencidas, 0);

    // El diseño muestra el último vuelo ya analizado
    const analizados = (vuelosQuery.data ?? [])
        .filter((v) => v.estado === 'ANALIZADO')
        .sort((a, b) => new Date(b.fechaVuelo).getTime() - new Date(a.fechaVuelo).getTime());

    const vuelo = analizados[0];
    const nombreDron = new Map((dronesQuery.data ?? []).map((d) => [d.id, d.nombre]));
    const nombreLote = new Map((lotesQuery.data ?? []).map((l) => [l.id, l.nombre]));

    const ultimoVuelo: UltimoVuelo | null = vuelo
        ? {
              id: vuelo.id,
              nombre: vuelo.nombre,
              estado: vuelo.estado,
              fecha: vuelo.fechaVuelo,
              dron: nombreDron.get(vuelo.dronId) ?? 'Dron #' + vuelo.dronId,
              lote: nombreLote.get(vuelo.loteId) ?? 'Lote #' + vuelo.loteId,
              salud: vuelo.ultimoAnalisis?.saludablePct ?? null,
          }
        : null;

    return {
        porRevisar: (porRevisarQuery.data ?? []).length,
        vencidas,
        novedadesAbiertas: (novedadesQuery.data ?? []).length,
        insumosBajos: (bajoStockQuery.data ?? []).length,
        estacionesConAlerta: resumenEstaciones.conAlerta,
        // El diseño solo lista las estaciones que están reportando
        estaciones: estaciones.filter((e) => e.estado !== 'desconectada'),
        proximasFechas: proximasQuery.data ?? [],
        aprobadasPorSemana: semanalQuery.data ?? [],
        ultimoVuelo,
        puedeRevisar,
        cargando: resumenQuery.isLoading || novedadesQuery.isLoading,
    };
}
