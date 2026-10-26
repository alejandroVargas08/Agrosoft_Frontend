export type TipoCamara = 'RGB' | 'MULTIESPECTRAL';
export type EstadoVuelo = 'REGISTRADO' | 'CON_IMAGENES' | 'ANALIZANDO' | 'ANALIZADO' | 'ERROR';
export type EstadoAnalisis = 'PENDIENTE' | 'PROCESANDO' | 'COMPLETADO' | 'ERROR';
export type Banda = 'RGB' | 'G' | 'R' | 'RE' | 'NIR';
export type CapaMapa = 'RGB' | 'NDVI' | 'NDRE' | 'GNDVI' | 'NDWI' | 'CLASIFICACION';
export type ClaseVegetacion = 'SIN_VEGETACION' | 'ESTRES_ALTO' | 'ESTRES_MODERADO' | 'SALUDABLE';
export type Nivel = 'BAJA' | 'MEDIA' | 'ALTA';

export interface Dron {
    id: number;
    nombre: string;
    modelo: string;
    numeroSerie: string | null;
    tipoCamara: TipoCamara;
    tieneRtk: boolean;
    activo: boolean;
    creadoEn?: string;
}

export interface DronPayload {
    nombre: string;
    modelo: string;
    numeroSerie?: string;
    tipoCamara: TipoCamara;
    tieneRtk: boolean;
}

export interface ResumenUltimoAnalisis {
    id: number;
    estado: EstadoAnalisis;
    progreso: number;
    saludablePct: number | null;
    capturasCriticas: number | null;
    finalizadoEn: string | null;
}

export interface Vuelo {
    id: number;
    dronId: number;
    nombre: string;
    fechaVuelo: string;
    alturaVueloM: number | null;
    loteId: number;
    subLoteId: number | null;
    cultivoId: number | null;
    observaciones: string | null;
    estado: EstadoVuelo;
    totalCapturas: number;
    creadoPorUsuarioId: number;
    creadoEn?: string;
    ultimoAnalisis?: ResumenUltimoAnalisis | null;
}

export interface VueloPayload {
    dronId: number;
    nombre: string;
    fechaVuelo: string;
    alturaVueloM?: number;
    loteId: number;
    subLoteId?: number;
    cultivoId?: number;
    observaciones?: string;
}

export interface ArchivoBanda {
    ruta: string;
    nombreOriginal: string;
}

export interface Captura {
    id: number;
    vueloId: number;
    claveCaptura: string;
    numeroCaptura: number;
    ubicacion: { latitud: number; longitud: number } | null;
    altitudRelativaM: number | null;
    inclinacionCamaraGrados: number | null;
    tomadaEn: string | null;
    archivos: Partial<Record<Banda, ArchivoBanda>>;
    completa: boolean;
    bandasFaltantes: Banda[];
}

export interface ResultadoCarga {
    recibidos: number;
    aceptados: number;
    rechazados: { archivo: string; motivo: string }[];
    capturasActualizadas: number;
    capturasCompletas: number;
    totalCapturasVuelo: number;
}

export interface EstadisticasIndice {
    promedio: number;
    minimo: number;
    maximo: number;
    desviacion: number;
    pixelesValidos: number;
}

export interface SintesisVuelo {
    resumen: string;
    hallazgosPrincipales: string[];
    zonasCandidatasSiembra: string;
    recomendaciones: string[];
    advertencias: string[];
}

export interface ResumenAnalisis {
    ndvi: EstadisticasIndice | null;
    ndre: EstadisticasIndice | null;
    gndvi: EstadisticasIndice | null;
    ndwi: EstadisticasIndice | null;
    cobertura: Record<'AGUA' | 'SIN_VEGETACION' | 'VEGETACION', number> | null;
    distribucionNdvi: Record<ClaseVegetacion, number>;
    capturasAnalizadas: number;
    capturasCriticas: number;
    capturasOmitidas: number;
    ia: {
        estado: 'COMPLETADO' | 'PARCIAL' | 'SIN_RESULTADOS' | 'DESACTIVADO';
        capturasInterpretadas: number;
        capturasConError: number;
        sintesis: SintesisVuelo | null;
        mensaje: string | null;
    };
}

export interface Umbrales {
    sinVegetacion: number;
    estresAlto: number;
    saludable: number;
    porcentajeCritico: number;
}

export interface Analisis {
    id: number;
    vueloId: number;
    estado: EstadoAnalisis;
    etapa: 'INDICES' | 'INTERPRETACION_IA' | null;
    umbrales: Umbrales;
    usarIa: boolean;
    contexto: string | null;
    capturasTotales: number;
    capturasProcesadas: number;
    capturasAInterpretar: number;
    capturasInterpretadas: number;
    resumen: ResumenAnalisis | null;
    mensajeError: string | null;
    iniciadoEn: string | null;
    finalizadoEn: string | null;
    progreso: number;
}

export interface SolicitudAnalisis {
    usarIa: boolean;
    contexto?: string;
    umbralSinVegetacion?: number;
    umbralEstresAlto?: number;
    umbralSaludable?: number;
    porcentajeCritico?: number;
}

export interface HallazgoVisual {
    tipo: string;
    severidad: Nivel;
    ubicacionEnImagen: string;
    descripcion: string;
}

export interface InterpretacionCaptura {
    coberturas: { tipo: string; porcentajeAproximado: number; descripcion: string }[];
    cultivosVisibles: string[];
    hallazgos: HallazgoVisual[];
    zonaCandidataSiembra: { hayZonas: boolean; descripcion: string };
    recomendacion: string;
    confianza: Nivel;
}

export interface ResultadoCaptura {
    id: number;
    analisisId: number;
    capturaId: number;
    ubicacion: { latitud: number; longitud: number } | null;
    ndvi: EstadisticasIndice;
    ndre: EstadisticasIndice;
    gndvi: EstadisticasIndice;
    ndwi: EstadisticasIndice | null;
    distribucionNdvi: Record<ClaseVegetacion, number>;
    clasificacion: ClaseVegetacion;
    esCritica: boolean;
    interpretacionIa: InterpretacionCaptura | null;
}

export const PERMISOS_DRONES = {
    VER_DRONES: 'drones.ver',
    GESTIONAR_DRONES: 'drones.gestionar',
    VER_VUELOS: 'vuelos.ver',
    GESTIONAR_VUELOS: 'vuelos.gestionar',
    CARGAR_IMAGENES: 'vuelos.cargar_imagenes',
    SOLICITAR_ANALISIS: 'analisis.solicitar',
} as const;

export const ESTADO_VUELO: Record<EstadoVuelo, { texto: string; clases: string }> = {
    REGISTRADO: { texto: 'Registrado', clases: 'bg-muted text-muted-foreground' },
    CON_IMAGENES: { texto: 'Con imágenes', clases: 'bg-blue-100 text-blue-700' },
    ANALIZANDO: { texto: 'Analizando', clases: 'bg-amber-100 text-amber-700' },
    ANALIZADO: { texto: 'Analizado', clases: 'bg-emerald-100 text-emerald-700' },
    ERROR: { texto: 'Error', clases: 'bg-red-100 text-red-700' },
};

export const CLASE_VEGETACION: Record<ClaseVegetacion, { texto: string; color: string }> = {
    SALUDABLE: { texto: 'Saludable', color: '#10B981' },
    ESTRES_MODERADO: { texto: 'Estrés moderado', color: '#F59E0B' },
    ESTRES_ALTO: { texto: 'Estrés alto', color: '#DC2626' },
    SIN_VEGETACION: { texto: 'Sin vegetación', color: '#9CA3AF' },
};

export const CAPAS: { valor: CapaMapa; texto: string; descripcion: string }[] = [
    { valor: 'RGB', texto: 'RGB', descripcion: 'Foto a color, como la ve el ojo' },
    { valor: 'NDVI', texto: 'NDVI', descripcion: 'Vigor general de la vegetación' },
    { valor: 'NDRE', texto: 'NDRE', descripcion: 'Clorofila y nitrógeno en cultivos densos' },
    { valor: 'GNDVI', texto: 'GNDVI', descripcion: 'Actividad fotosintética y nutrición' },
    { valor: 'NDWI', texto: 'NDWI', descripcion: 'Contenido de agua de la planta' },
    { valor: 'CLASIFICACION', texto: 'Clasificación', descripcion: 'Zonas por nivel de salud' },
];

export const LEYENDA_CAPA: Record<Exclude<CapaMapa, 'RGB' | 'CLASIFICACION'>, { minimo: number; maximo: number; colores: string[]; bajo: string; alto: string }> = {
    NDVI: { minimo: -0.1, maximo: 0.9, colores: ['#d73027', '#fc8d59', '#fee08b', '#91cf60', '#1a9850'], bajo: 'Sin vigor', alto: 'Vigor alto' },
    GNDVI: { minimo: -0.1, maximo: 0.9, colores: ['#d73027', '#fc8d59', '#fee08b', '#91cf60', '#1a9850'], bajo: 'Baja actividad', alto: 'Alta actividad' },
    NDRE: { minimo: -0.05, maximo: 0.6, colores: ['#d73027', '#fc8d59', '#fee08b', '#91cf60', '#1a9850'], bajo: 'Poca clorofila', alto: 'Mucha clorofila' },
    NDWI: { minimo: -0.6, maximo: 0.4, colores: ['#a6611a', '#dfc27d', '#f5f5f5', '#80cdc1', '#2c7bb6'], bajo: 'Seco', alto: 'Húmedo' },
};

export const TIPO_HALLAZGO: Record<string, string> = {
    ESTRES_VEGETAL: 'Estrés vegetal',
    AMARILLAMIENTO: 'Amarillamiento',
    ZONA_SECA: 'Zona seca',
    MALEZA: 'Maleza',
    ENCHARCAMIENTO: 'Encharcamiento',
    EROSION: 'Erosión',
    FALLA_SIEMBRA: 'Falla de siembra',
    POSIBLE_PLAGA_O_ENFERMEDAD: 'Posible plaga o enfermedad',
    OTRO: 'Otro',
};

export const NIVEL_TEXTO: Record<Nivel, string> = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta' };

export const NIVEL_CLASES: Record<Nivel, string> = {
    BAJA: 'bg-blue-100 text-blue-700',
    MEDIA: 'bg-amber-100 text-amber-700',
    ALTA: 'bg-red-100 text-red-700',
};
