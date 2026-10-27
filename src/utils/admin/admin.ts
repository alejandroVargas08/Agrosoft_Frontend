import type { EstadoUsuario, Permiso } from '../../types/admin/admin';

type ColorBadge = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

export const ESTADO_USUARIO: Record<EstadoUsuario, { texto: string; color: ColorBadge }> = {
    activo: { texto: 'Activo', color: 'success' },
    inactivo: { texto: 'Inactivo', color: 'muted' },
    pendiente: { texto: 'Pendiente', color: 'warning' },
    rechazado: { texto: 'Rechazado', color: 'danger' },
    suspendido: { texto: 'Suspendido', color: 'danger' },
};

export const ESTADO_FICHA: Record<string, { texto: string; color: ColorBadge }> = {
    activo: { texto: 'Activa', color: 'success' },
    inactivo: { texto: 'Inactiva', color: 'muted' },
    finalizado: { texto: 'Cerrada', color: 'info' },
};

export const TIPOS_FICHA = ['Tecnólogo', 'Técnico', 'Especialización tecnológica', 'Operario', 'Auxiliar', 'Curso complementario'];

const MODULOS: Record<string, string> = {
    usuarios: 'Usuarios',
    fichas: 'Fichas',
    actividades: 'Actividades',
    cultivos: 'Cultivos',
    lotes: 'Lotes y sublotes',
    sublotes: 'Lotes y sublotes',
    inventario: 'Inventario',
    insumos: 'Inventario',
    incidencias: 'Incidencias',
    tratamientos: 'Tratamientos',
    drones: 'Drones',
    vuelos: 'Drones',
    analisis: 'Drones',
    sensores: 'Sensores IoT',
    iot: 'Sensores IoT',
    ventas: 'Ventas',
    reportes: 'Reportes',
    novedades: 'Novedades',
    wiki: 'Wiki EPA',
};

export function nombreCompleto(persona: { nombre: string; apellido: string } | null | undefined): string {
    if (!persona) return 'Sin nombre';
    return `${persona.nombre} ${persona.apellido}`.trim();
}

export function iniciales(persona: { nombre: string; apellido: string } | null | undefined): string {
    if (!persona) return '?';
    return `${persona.nombre.charAt(0)}${persona.apellido.charAt(0)}`.toUpperCase();
}

export function fechaCorta(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fechaInput(fecha: string | null | undefined): string {
    return fecha ? fecha.slice(0, 10) : '';
}

export function haceCuanto(fecha: string | null | undefined): string {
    if (!fecha) return 'Nunca';
    const minutos = Math.round((Date.now() - new Date(fecha).getTime()) / 60000);
    if (minutos < 1) return 'Hace un momento';
    if (minutos < 60) return `Hace ${minutos} min`;
    const horas = Math.round(minutos / 60);
    if (horas < 24) return `Hace ${horas} h`;
    const dias = Math.round(horas / 24);
    if (dias === 1) return 'Ayer';
    if (dias < 30) return `Hace ${dias} días`;
    return fechaCorta(fecha);
}

export function coincide(texto: string, ...campos: (string | null | undefined)[]): boolean {
    const buscado = texto.trim().toLowerCase();
    if (!buscado) return true;
    return campos.some((campo) => campo?.toLowerCase().includes(buscado));
}

export function moduloDePermiso(permiso: Permiso): string {
    const prefijo = permiso.nombre.split('.')[0];
    return MODULOS[prefijo] ?? prefijo.charAt(0).toUpperCase() + prefijo.slice(1);
}

export function agruparPermisos(permisos: Permiso[]): { modulo: string; permisos: Permiso[] }[] {
    const grupos = new Map<string, Permiso[]>();
    for (const permiso of [...permisos].sort((a, b) => a.nombre.localeCompare(b.nombre))) {
        const modulo = moduloDePermiso(permiso);
        grupos.set(modulo, [...(grupos.get(modulo) ?? []), permiso]);
    }
    return [...grupos.entries()]
        .sort(([a], [b]) => a.localeCompare(b, 'es'))
        .map(([modulo, lista]) => ({ modulo, permisos: lista }));
}

export function generarContrasena(): string {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const valores = crypto.getRandomValues(new Uint32Array(10));
    return Array.from(valores, (v) => caracteres[v % caracteres.length]).join('');
}
