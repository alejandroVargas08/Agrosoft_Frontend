export interface Actividad {
    id: number;
    nombre: string;
    tipo: string; 
    subtipo?: string; 
    estado: 'pendiente' | 'en_progreso' | 'completada'; 
    fecha: string; 
    horasActividad: number; 
    precioHoraActividad: number;
    descripcion?: string;
}

export interface ActividadFormState {
    nombre: string; 
    tipo: string; 
    subtipo: string; 
    loteId: string; 
    subLoteId: string;
    cultivoId: string;
    productoAgroId: string;
    fecha: string;
    horasActividad: string;
    precioHoraActividad: string;
    descripcion: string;
}

export interface CrearActividadPayLoad {
    nombre: string;
    tipo: string;
    subtipo?: string;
    loteId: number;
    subLoteId?: number;
    cultivoId: number;
    productoAgroId?: number;
    fecha: string;
    horasActividad: number;
    precioHoraActividad: number;
    descripcion?: string;
    creadoPorUsuarioId: number;
}

export const ESTADO_INICIAL_FORM: ActividadFormState = {
    nombre: '',
    tipo: 'Siembra',
    subtipo: '',
    loteId: '',
    subLoteId: '',
    cultivoId: '',
    productoAgroId: '',
    fecha: '',
    horasActividad: '',
    precioHoraActividad: '',
    descripcion: '',
};