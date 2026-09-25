export type EstadoInsumo = 'activo' | 'inactivo' | 'agotado' | 'de_baja';
export type TipoInsumo = 'consumible' | 'herramienta' | 'materia_prima';
export type TipoMovimiento = 'entrada' | 'salida' | 'traslado' | 'ajuste';

// ---------- Catálogos ----------
export interface Almacen {
    id: number;
    nombre: string;
    descripcion?: string;
    ubicacion?: string;
    }
export interface CrearAlmacenPayload {
    nombre: string;
    descripcion?: string;
    ubicacion?: string;
    }

export interface Categoria {
    id: number;
    nombre: string;
    descripcion?: string;
    tipoInsumo: string;
}
export interface CrearCategoriaPayload {
    nombre: string;
    descripcion?: string;
    tipoInsumo: string;
}

export interface Proveedor {
    id: number;
    nombre: string;
}
export interface CrearProveedorPayload {
    nombre: string;
}

// ---------- Insumos ----------
export interface Insumo {
    id: number;
    nombre: string;
    presentacionTipo: string;
    unidadUso: string;
    factorConversionUso: number;
    stockPresentacion: number;
    stockUso: number;
    stockReservado: number;
    stockDisponible: number;
    stockMinimo: number;
    estado: EstadoInsumo;
    tipoInsumo: TipoInsumo;
    almacenId: number;
    proveedorId: number;
    categoriaId: number;
    valorInventario: number;
}

export interface CrearInsumoPayload {
    nombre: string;
    descripcion?: string;
    fotoUrl?: string;
    presentacionTipo: string;
    presentacionCantidad: number;
    presentacionUnidad: string;
    unidadUso: string;
    tipoMateria?: string;
    factorConversionUso: number;
    stockPresentacion: number;
    stockUso: number;
    stockMinimo: number;
    precioUnitarioPresentacion: number;
    precioUnitarioUso: number;
    almacenId: number;
    proveedorId?: number;
    categoriaId: number;
    tipoInsumo: TipoInsumo;
    costoAdquisicion?: number;
    valorResidual?: number;
    vidaUtilHoras?: number;
    creadoPorUsuarioId?: number;
}

export interface InsumoFormState {
    nombre: string;
    descripcion: string;
    presentacionTipo: string;
    presentacionCantidad: string;
    presentacionUnidad: string;
    unidadUso: string;
    factorConversionUso: string;
    stockPresentacion: string;
    stockUso: string;
    stockMinimo: string;
    precioUnitarioPresentacion: string;
    precioUnitarioUso: string;
    almacenId: string;
    proveedorId: string;
    categoriaId: string;
    tipoInsumo: TipoInsumo;
}

export const ESTADO_INICIAL_INSUMO_FORM: InsumoFormState = {
    nombre: '',
    descripcion: '',
    presentacionTipo: '',
    presentacionCantidad: '',
    presentacionUnidad: '',
    unidadUso: '',
    factorConversionUso: '1',
    stockPresentacion: '0',
    stockUso: '0',
    stockMinimo: '0',
    precioUnitarioPresentacion: '0',
    precioUnitarioUso: '0',
    almacenId: '',
    proveedorId: '',
    categoriaId: '',
    tipoInsumo: 'consumible',
};

// ---------- Movimientos ----------
export interface RegistrarMovimientoPayload {
    insumoId: number;
    tipo: TipoMovimiento;
    cantidadPresentacion: number;
    cantidadUso: number;
    descripcion?: string;
    actividadId?: number;
    usuarioId: number;
    almacenOrigenId?: number;
    almacenDestinoId?: number;
}

export interface Movimiento {
    id: number;
    insumoId: number;
    tipo: TipoMovimiento;
    cantidadPresentacion: number;
    cantidadUso: number;
    costoTotal: number;
    descripcion?: string;
    usuarioId: number;
    almacenOrigenId?: number;
    almacenDestinoId?: number;
    fecha?: string;              // ISO, la pone el backend
    stockResultante?: number;    // solo al registrar
}