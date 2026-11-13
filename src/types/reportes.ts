export type PeriodoReporte = 'mensual' | 'trimestral' | 'anual';

export interface ResumenReporte {
    produccionTotalKg: number;
    ingresos: number;
    egresos: number;
    rentabilidad: number;
    unidadesActivas: number;
}

export interface FilaProduccion {
    periodo: string;
    [cultivo: string]: string | number;
}

export interface FilaDistribucion {
    name: string;
    value: number;
}

export interface FilaFinanzas {
    periodo: string;
    ingresos: number;
    egresos: number;
}

export interface ReporteGeneral {
    periodo: PeriodoReporte;
    resumen: ResumenReporte;
    cultivos: string[];
    produccion: FilaProduccion[];
    distribucion: FilaDistribucion[];
    finanzas: FilaFinanzas[];
}
export interface FilaClima {
    periodo: string;
    temperatura: number | null;
    humedad: number | null;
    uv: number | null;
}

/** GET /reportes/clima: promedios de las estaciones y la luz de hoy */
export interface ReporteClima {
    periodo: PeriodoReporte;
    clima: FilaClima[];
    luz: { promedioLux: number | null; horasLuz: number };
}
