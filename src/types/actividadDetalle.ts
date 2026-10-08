export interface ActividadInsumo {
    id: number;
    actividadId: number;
    insumoId: number;
    cantidadUsada: number;
    unidad: string;
    costoUnitario: number;
    costoTotal: number;
}
export interface CrearActividadInsumoPayload {
    insumoId: number;
    cantidadUsada: number;
    unidad: string;
    costoUnitario: number;
}


export interface ActividadInsumoReserva {
    id: number;
    actividadId: number;
    insumoId: number;
    cantidadReservada: number;
}
export interface CrearActividadInsumoReservaPayload {
    insumoId: number;
    cantidadReservada: number;
}


export interface ActividadInsumoUso {
    id: number;
    actividadId: number;
    insumoId: number;
    cantidadUso: number;
    costoUnitarioUso: number;
    costoTotal: number;
    movimientoInsumoId: number | null;
}
export interface CrearActividadInsumoUsoPayload {
    insumoId: number;
    cantidadUso: number;
    costoUnitarioUso: number;
}


export interface ActividadEvidencia {
    id: number;
    actividadId: number;
    descripcion: string | null;
    imagenes: string[];
}
export interface CrearActividadEvidenciaPayload {
    descripcion?: string;
    imagenes?: string[];
}


export interface ActividadHerramienta {
    id: number;
    actividadId: number;
    insumoId: number;
    activoFijoId: number | null;
    horasEstimadas: number;
}
export interface CrearActividadHerramientaPayload {
    insumoId: number;
    activoFijoId?: number;
    horasEstimadas: number;
}


export interface ActividadServicio {
    id: number;
    actividadId: number;
    nombreServicio: string;
    proveedorId: number;
    maquinariaId: number;
    horas: number;
    precioHora: number;
    costo: number; 
}
export interface CrearActividadServicioPayload {
    nombreServicio: string;
    proveedorId: number;
    maquinariaId: number;
    horas: number;
    precioHora: number;
}