import { api } from '../axios';

export const emailCodesApi = {
  enviarCodigo: (email: string) => api.post('/email-codes/enviar', { email }),
  verificarCodigo: (email: string, codigo: string) =>
    api.post('/email-codes/verificar', { email, codigo }),
};