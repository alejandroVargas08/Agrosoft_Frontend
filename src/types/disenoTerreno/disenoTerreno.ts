import type { Punto } from '../territorio';

export const PERMISOS_TERRENO = {
    VER: 'terreno.ver',
    EVALUAR: 'terreno.evaluar',
} as const;

export type EstadoEvaluacion = 'PENDIENTE' | 'PROCESANDO' | 'COMPLETADO' | 'ERROR';
export type EtapaEvaluacion = 'TOPOGRAFIA' | 'CLIMA_Y_SUELO' | 'COBERTURA' | 'APTITUD' | 'DISENO';
export type ClaseAptitud = 'ALTA' | 'MODERADA' | 'MARGINAL' | 'NO_APTO' | 'SIN_DATOS';
export type SistemaTrazado = 'SURCOS_RECTOS' | 'CURVAS_DE_NIVEL' | 'CURVAS_CON_BARRERAS' | 'TERRAZAS' | 'NO_RECOMENDADO';

export interface Topografia {
    altitudPromedioM: number;
    altitudMinM: number;
    altitudMaxM: number;
    pendientePct: number;
    azimutBajadaGrados: number | null;
    fuente: string;
}

export interface Clima {
    temperaturaMediaC: number;
    temperaturaMinMediaC: number;
    temperaturaMaxMediaC: number;
    precipitacionAnualMm: number;
    fuente: string;
}

export interface Suelo {
    ph: number | null;
    arcillaPct: number | null;
    arenaPct: number | null;
    limoPct: number | null;
    carbonoOrganicoGKg: number | null;
    textura: string | null;
    fuente: string;
}

export type TipoZona = 'NO_SEMBRABLE' | 'BOSQUE' | 'YA_SEMBRADO' | 'LIBRE';

export interface ZonaExcluida {
    centro: Punto;
    radioM: number;
    motivo: string;
    tipo?: TipoZona;
}

export interface CultivoExistente {
    nombre: string;
    capturas: number;
}

export type TipoObjeto = 'CONSTRUCCION' | 'VIA' | 'AGUA' | 'BOSQUE' | 'ARBOL';
export type FuenteObjeto = 'OSM' | 'MICROSOFT' | 'IA_DRON';

export interface ObjetoTerreno {
    tipo: TipoObjeto;
    forma: 'POLIGONO' | 'LINEA' | 'PUNTO';
    puntos: Punto[];
    anchoM: number;
    nombre: string | null;
    fuente?: FuenteObjeto;
}

export interface ResumenObjetos {
    porcentajes: Partial<Record<TipoObjeto, number>>;
    porcentajeOcupado: number;
    conteo: Partial<Record<TipoObjeto, number>>;
}

export interface Cobertura {
    fuente: 'DRON' | 'SATELITE' | 'DRON_Y_SATELITE' | 'MAPA';
    porcentajes: Record<string, number>;
    porcentajeSembrable: number;
    areaVerificadaPct?: number;
    observaciones: string[];
    zonas?: ZonaExcluida[];
    zonasExcluidas: ZonaExcluida[];
    cultivosExistentes?: CultivoExistente[];
    referencia: string | null;
}

export interface PerfilTerreno {
    ubicacion: Punto;
    areaM2: number;
    topografia: Topografia | null;
    clima: Clima | null;
    suelo: Suelo | null;
    cobertura: Cobertura | null;
    objetos?: ObjetoTerreno[];
    resumenObjetos?: ResumenObjetos | null;
    fuentesFallidas: string[];
}

export interface FactorEvaluado {
    factor: string;
    valor: number | string | null;
    rangoOptimo: string;
    puntaje: number | null;
    limitante: boolean;
    mensaje: string;
}

export interface AptitudCultivo {
    codigo: string;
    nombre: string;
    puntaje: number;
    clase: ClaseAptitud;
    confianzaPct: number;
    factores: FactorEvaluado[];
    limitantes: string[];
}

export interface DisenoSiembra {
    cultivoCodigo: string;
    cultivoNombre: string;
    areaTotalM2: number;
    areaSembrableM2: number;
    areaEfectivaM2: number;
    porcentajeCaminos: number;
    distanciaSurcosM: number;
    distanciaPlantasM: number;
    densidadPlantasHa: number;
    plantasEstimadas: number;
    surcosEstimados: number;
    longitudSurcosM: number;
    sistemaTrazado: SistemaTrazado;
    orientacionSurcosGrados: number;
    recomendaciones: string[];
    surcos: Punto[][];
    surcosPorLinea: number;
    zonasExcluidas: ZonaExcluida[];
    porcentajeYaSembrado?: number;
}

export interface EvaluacionTerreno {
    id: number;
    loteId: number | null;
    vueloId?: number | null;
    areaDelVuelo?: boolean;
    nombre: string;
    poligono: Punto[];
    estado: EstadoEvaluacion;
    etapa: EtapaEvaluacion | null;
    progreso: number;
    perfil: PerfilTerreno | null;
    ranking: AptitudCultivo[] | null;
    disenos: DisenoSiembra[] | null;
    advertencias: string[];
    mensajeError: string | null;
    creadoEn: string;
    finalizadoEn: string | null;
}

export interface ResumenEvaluacion {
    id: number;
    loteId: number | null;
    nombre: string;
    estado: EstadoEvaluacion;
    progreso: number;
    mejorCultivo: { codigo: string; nombre: string; puntaje: number; clase: ClaseAptitud } | null;
    creadoEn: string;
}

export interface SolicitudEvaluacion {
    loteId?: number;
    poligono?: Punto[];
    nombre?: string;
    cultivoPreferido?: string;
    vueloId?: number;
    soloAreaVuelo?: boolean;
    usarDron?: boolean;
    usarSatelite?: boolean;
}
