export interface Venta {
    id: number;
    fecha: string;
    clienteId: number | null;
    subtotal: number;
    impuestos: number;
    descuento: number;
    total: number;
    estado: string;
    usuarioId: number;
}

export interface CrearVentaPayload {
    fecha: string;
    clienteId?: number;
    subtotal: number;
    impuestos: number;
    descuento: number;
    total: number;
    estado: string;
    usuarioId: number;
}

export interface Cliente {
    id: number;
    nombre: string;
    identificacion: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    notas?: string;
}

export interface CrearClientePayload {
    nombre: string;
    identificacion: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    notas?: string;
}

export interface VentaDetalle {
    id: number;
    ventaId: number;
    productoAgroId: number;
    loteProduccionId?: number;
    cultivoId?: number;
    cantidadKg: number;
    precioUnitarioKg: number;
    costoUnitarioKg?: number;
}

export interface CrearVentaDetallePayload {
    ventaId: number;
    productoAgroId: number;
    loteProduccionId?: number;
    cultivoId?: number;
    cantidadKg: number;
    precioUnitarioKg: number;
    costoUnitarioKg?: number;
}

export interface LoteProduccion {
    id: number;
    productoAgroId: number;
    cultivoId: number;
    loteId: number;
    subLoteId?: number;
    calidad: string;
    cantidadKg: number;
    stockDisponibleKg: number;
    costoUnitarioKg: number;
    costoTotal: number;
    precioSugeridoKg: number;
    // Trazabilidad de la cosecha
    destino?: string | null;
    responsable?: string | null;
    observaciones?: string | null;
    /** Día de la cosecha (las viejas traen el día en que se registraron) */
    fechaCosecha?: string | null;
    /** Lo que se anotó tal cual, ej. 12 bultos. cantidadKg es su equivalente. */
    cantidad?: number | null;
    unidad?: string | null;
}