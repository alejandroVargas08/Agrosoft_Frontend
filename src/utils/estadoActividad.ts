const ESTADO_A_STATUS: Record<string, string> = {
    Pendiente: 'pending',
    En_progreso: 'in_progress',
    'En progreso': 'in_progress',
    Finalizada: 'completed',
    Completada: 'completed',
}; 

export const estadoParaBadge = (estado: string): string => ESTADO_A_STATUS[estado] ?? estado; 