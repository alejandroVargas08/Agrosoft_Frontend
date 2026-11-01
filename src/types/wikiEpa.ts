export type TipoEpa = 'ENFERMEDAD' | 'PLAGA' | 'ARVENSE';

export interface Epa {
    id: number;
    nombre: string;
    tipoEpa: TipoEpa;
    descripcion: string;
    sintomas: string;
    manejoYControl: string;
    mesesProbables: number[];
    temporadas: string[];
    notasEstacionalidad: string | null;
    fotosSintomas: string[];
    fotosGenerales: string[];
    etiquetas: string[];
    creadoPorUsuarioId: number;
}
