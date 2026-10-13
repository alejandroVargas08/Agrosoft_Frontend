export interface ProductoAgro {
    id: number; 
    nombre: string; 
    unidadBase: string;
    descripcion?: string |  null;
    imagen?: string | null; 
    createdAt: string;
    updateAt: string;
    deleteAt?: string | null; 
}

export interface CrearProductoAgroPayload {
    nombre: string; 
    unidadBase: string;
    descripcion?: string;
    imagen?: string
}

export type ActualizarProductoAgroPayload = Partial<CrearProductoAgroPayload>;
export interface productoAgroFormState {
    nombre: string;
    unidadBase: string;
    descripcion?: string;
    imagen: string;
}

export const ESTADO_INICIAL_PRODUCTO_AGRO_FORM: productoAgroFormState = {
    nombre: '',
    unidadBase: '',
    descripcion: '',
    imagen: '',
};
