import { api } from '../axios';

export const TipoCodigo = {
    VERIFICACION_EMAIL: 'verificacion_email',
    RESTABLECER_CONTRASENA: 'restablecer_contrasena',
} as const;

export type TipoCodigo = (typeof TipoCodigo)[keyof typeof TipoCodigo];

export const emailCodesApi = {
    enviarCodigo: (email: string, tipo: TipoCodigo) =>
        api.post('/email-codes/enviar', { email, tipo }),

    verificarCodigo: (email: string, codigo: string, tipo: TipoCodigo) =>
        api.post('/email-codes/verificar', { email, codigo, tipo }),

    restablecerContrasena: (email: string, codigo: string, nuevaContrasena: string) =>
        api.post('/email-codes/restablecer', { email, codigo, nuevaContrasena }),
};