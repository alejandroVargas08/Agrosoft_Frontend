import { useQuery } from '@tanstack/react-query';
import { reportesApi } from '../api/reportes';
import { mensajeError } from '../api/errores/errores';
import type { PeriodoReporte } from '../types/reportes';

/** La pestaña Clima de Reportes: promedios por tramo de las lecturas de las estaciones. */
export function useReporteClima(periodo: PeriodoReporte, habilitado: boolean) {
    const query = useQuery({
        queryKey: ['reportes-clima', periodo],
        queryFn: async () => (await reportesApi.clima(periodo)).data,
        enabled: habilitado,
    });
    return {
        clima: query.data?.clima ?? [],
        luz: query.data?.luz ?? { promedioLux: null, horasLuz: 0 },
        cargando: query.isLoading,
        error: query.error ? mensajeError(query.error, 'No se pudo cargar el clima.') : '',
    };
}
