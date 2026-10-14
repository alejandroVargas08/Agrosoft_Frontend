import type { RegistrarUsoHerramientaPayload, UsoHerramienta } from "../types/usosHerramientas";
import { api } from "./axios";

export const usosHerramientaApi = {
    listar: (actividadId: number) => 
        api.get<UsoHerramienta[]>(`/actividad/${actividadId}/usoHerramienta`),

    registrar: (actividadId: number, data: RegistrarUsoHerramientaPayload) =>
        api.post<UsoHerramienta>(`/actividad/${actividadId}/usoHerramienta`, data),
};