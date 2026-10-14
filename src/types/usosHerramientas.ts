export interface UsoHerramienta {
    id: number;
    actividadId: number;
    insumoId: number;
    horasUsadas: number;
    depreciacionGenerada: number;
    valorLibroAntes: number;
    valorLibrosDespues: number;
    fechaUso: string;
}

export interface RegistrarUsoHerramientaPayload {
    insumoId: number;
    horasUsadas: number;
    tasaDepreciacionHora: number;
    valorLibroAntes?: number;
}

export interface UsoHerramientaFormState {
    insumoId: string;
    horasUsadas: string;
    tasaDepreciacionHora: string;
    valorLibrosAntes: string;
}

export const ESTADO_INICIAL_USO_HERRAMIENTA_FORM: UsoHerramientaFormState = {
    insumoId: '',
    horasUsadas: '',
    tasaDepreciacionHora: '',
    valorLibrosAntes: '',
}; 

