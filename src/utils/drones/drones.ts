import type { Banda } from '../../types/drones/drones';

export const EXTENSIONES_PERMITIDAS = /\.(jpe?g|tiff?)$/i;
export const MAX_ARCHIVOS_POR_CARGA = 60;
export const MAX_TAMANO_ARCHIVO = 60 * 1024 * 1024;
export const MAX_BYTES_POR_LOTE = 400 * 1024 * 1024;

const BANDA_POR_SUFIJO: Record<string, Banda> = { D: 'RGB', G: 'G', R: 'R', RE: 'RE', NIR: 'NIR' };

export function bandaDelArchivo(nombre: string): Banda | null {
    const coincidencia = nombre.match(/_\d{4}_(D|G|R|RE|NIR|MS_G|MS_R|MS_RE|MS_NIR)\.(jpe?g|tiff?)$/i);
    if (!coincidencia) return /\.jpe?g$/i.test(nombre) ? 'RGB' : null;
    const sufijo = coincidencia[1].toUpperCase().replace('MS_', '');
    return BANDA_POR_SUFIJO[sufijo] ?? null;
}

export function validarArchivo(archivo: File): string | null {
    if (!EXTENSIONES_PERMITIDAS.test(archivo.name)) return 'Formato no permitido (solo JPG o TIF)';
    if (archivo.size > MAX_TAMANO_ARCHIVO) return 'Supera 60 MB';
    return null;
}

export function dividirEnLotes(archivos: File[]): File[][] {
    const lotes: File[][] = [];
    let actual: File[] = [];
    let bytes = 0;
    for (const archivo of archivos) {
        if (actual.length === MAX_ARCHIVOS_POR_CARGA || bytes + archivo.size > MAX_BYTES_POR_LOTE) {
            lotes.push(actual);
            actual = [];
            bytes = 0;
        }
        actual.push(archivo);
        bytes += archivo.size;
    }
    if (actual.length > 0) lotes.push(actual);
    return lotes;
}

export function tamanoLegible(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fechaCortaDron(valor: string | null | undefined): string {
    if (!valor) return '—';
    const fecha = new Date(valor.length === 10 ? `${valor}T12:00:00` : valor);
    if (Number.isNaN(fecha.getTime())) return valor;
    return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fechaHoraDron(valor: string | null | undefined): string {
    if (!valor) return '—';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return valor;
    return fecha.toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function colorSalud(porcentaje: number | null | undefined): string {
    if (porcentaje === null || porcentaje === undefined) return '#9CA3AF';
    if (porcentaje >= 70) return '#10B981';
    if (porcentaje >= 40) return '#F59E0B';
    return '#DC2626';
}
