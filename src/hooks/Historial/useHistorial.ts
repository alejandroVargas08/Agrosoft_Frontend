import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const api = axios.create({
    baseURL: 'http://localhost:3000/api'
});

export const useActividadHistorial = (actividadId: number) => {
    return useQuery({
        queryKey: ['historial-actividad', actividadId],
        queryFn: async() => {
            const {data} = await axios.get(`/actividadHistorial/actividad/${actividadId}`);
            return data; 
        },
        enabled: !!actividadId,
    });
};

export const useCultivoHistorial = (cultivoId: number) => {
    return useQuery({
    queryKey: ['historial-cultivo', cultivoId],
    queryFn: async () => {
            const { data } = await axios.get(`/cultivos/${cultivoId}/historial`);
            return data;
    },
    enabled: !!cultivoId,
    });
};

export const useHistorialPreciosLote = () => {
    return useQuery({
        queryKey: ['historial-precios-lote'],
        queryFn: async() => {
            const {data}  = await api.get('/historial-precios-lote');
            return data;
        },
    });
};