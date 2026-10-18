import { isAxiosError } from 'axios';

export function mensajeError(error: unknown, porDefecto: string): string {
    if (!isAxiosError(error)) return porDefecto;
    if (!error.response) return 'No hay conexión con el servidor. Verifica que el backend esté encendido.';

    const status = error.response.status;
    const detalle = error.response.data?.message;
    const texto = Array.isArray(detalle) ? detalle.join(', ') : detalle;

    if (status === 403) return texto ?? 'No tienes permiso para esta acción.';
    if (status === 404) return texto ?? 'El recurso no existe o no tienes acceso a él.';
    if (status >= 500) return 'Error interno del servidor. Revisa la consola del backend.';
    return texto ?? porDefecto;
}

export function esSinPermiso(error: unknown): boolean {
    return isAxiosError(error) && error.response?.status === 403;
}
