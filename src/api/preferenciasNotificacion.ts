import { api } from './axios';

/** Los cuatro interruptores de Notificaciones en Configuración. */
export interface PreferenciasNotificacion {
    alertasSensores: boolean;
    stockBajo: boolean;
    actividadesVencidas: boolean;
    nuevasIncidencias: boolean;
}

export const preferenciasNotificacionApi = {
    obtener: () => api.get<PreferenciasNotificacion>('/notificaciones-preferencias'),
    guardar: (cambios: Partial<PreferenciasNotificacion>) =>
        api.put<PreferenciasNotificacion>('/notificaciones-preferencias', cambios),
};
