import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { actividadesApi } from '../../api/actividades/actividades';
import { useUnidadesProductivas } from '../useUnidadesProductivas';
import { useIncidencias } from '../useIncidencias';
import { useVentas } from '../useVentas';
import { useReportes } from '../useReportes';
import { useSensores } from '../sensores/useSensores';
import type { Actividad } from '../../types/actividades';

export function useInicio() {
    const { unidades, cargando: cargandoUnidades } = useUnidadesProductivas();
    const { incidencias, cargando: cargandoIncidencias } = useIncidencias();
    const { ventas, cargando: cargandoVentas } = useVentas();
    const { reporte, cargando: cargandoReporte } = useReportes();
    const { resumen: resumenSensores, cargando: cargandoSensores } = useSensores();

    const unidadesActivas = unidades.filter((u) => u.estado === 'activo');

    const consultasActividades = useQueries({
        queries: unidadesActivas.map((u) => ({
            queryKey: ['actividades', u.id],
            queryFn: async () => (await actividadesApi.listarPorCultivo(u.id)).data,
        })),
    });

    const actividadesRecientes: Actividad[] = consultasActividades
        .flatMap((c) => c.data ?? [])
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, 3);

    const incidenciasAbiertas = incidencias.filter((i) => i.estado !== 'resolved').length;

    const ventasDelMes = useMemo(() => {
        const hoy = new Date();
        return ventas
            .filter((v) => {
                const f = new Date(v.fecha);
                return (
                    f.getMonth() === hoy.getMonth() &&
                    f.getFullYear() === hoy.getFullYear() &&
                    v.estado?.toLowerCase() !== 'anulada'
                );
            })
            .reduce((suma, v) => suma + Number(v.total || 0), 0);
    }, [ventas]);

    // El Figma pinta una barra por cultivo, asi que las filas van tal cual:
    // cada una trae una clave por cultivo, y `cultivos` dice cuales son
    const produccion = reporte.produccion;
    const cultivos = reporte.cultivos;

    return {
        unidadesActivas: unidadesActivas.length,
        incidenciasAbiertas,
        ventasDelMes,
        sensoresEnLinea: resumenSensores.enLinea,
        sensoresTotal: resumenSensores.total,
        actividadesRecientes,
        produccion,
        cultivos,
        cargandoResumen: cargandoUnidades || cargandoIncidencias || cargandoVentas || cargandoSensores,
        cargandoActividades: cargandoUnidades || consultasActividades.some((c) => c.isLoading),
        cargandoProduccion: cargandoReporte,
    };
}