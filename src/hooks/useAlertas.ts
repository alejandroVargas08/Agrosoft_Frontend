import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { alertasApi } from '../api/alertas';
import type { Alerta, SeveridadAlerta } from '../types/alertas';

// "Hace 15 min", "Hace 2h", "Hace 1 día"
const hace = (iso: string) => {
    if (!iso) return '';
    const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (minutos < 1) return 'Hace un momento';
    if (minutos < 60) return 'Hace ' + minutos + ' min';
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return 'Hace ' + horas + 'h';
    const dias = Math.floor(horas / 24);
    return 'Hace ' + dias + (dias === 1 ? ' día' : ' días');
};

const num = (n: number) => Number(n).toLocaleString('es-CO', { maximumFractionDigits: 2 });

// Días entre hoy y la fecha de la tarea: negativo = ya venció
const diasHasta = (iso: string) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fecha = new Date(iso);
    fecha.setHours(0, 0, 0, 0);
    return Math.round((fecha.getTime() - hoy.getTime()) / 86400000);
};

const textoPlazo = (dias: number) => {
    if (dias < -1) return 'Venció hace ' + Math.abs(dias) + ' días';
    if (dias === -1) return 'Venció ayer';
    if (dias === 0) return 'Vence hoy';
    if (dias === 1) return 'Vence mañana';
    return 'Vence en ' + dias + ' días';
};

// Solo las que siguen abiertas entran como alerta
const ABIERTAS = ['Pendiente', 'En_progreso'];

// Cuántos días antes del vencimiento empieza a avisar
const AVISO_DIAS = 3;

export function useAlertas() {
    const queryClient = useQueryClient();

    const sensorAlertasQuery = useQuery({
        queryKey: ['sensor-alertas'],
        queryFn: async () => (await alertasApi.sensorAlertas()).data,
    });

    const sensoresQuery = useQuery({
        queryKey: ['sensores'],
        queryFn: async () => (await alertasApi.sensores()).data,
    });

    const bajoStockQuery = useQuery({
        queryKey: ['insumos-bajo-stock'],
        queryFn: async () => (await alertasApi.insumosBajoStock()).data,
    });

    const actividadesQuery = useQuery({
        queryKey: ['actividades-alertas'],
        queryFn: async () => (await alertasApi.actividades()).data,
    });

    const sensores = sensoresQuery.data ?? [];

    // Alertas de sensores: alta si el valor se desvía más del 20% del umbral
    const alertasSensor: Alerta[] = (sensorAlertasQuery.data ?? []).map((a) => {
        const sensor = sensores.find((s) => s.id === a.sensorId);
        const nombre = sensor?.nombreSensor ?? 'Sensor #' + a.sensorId;
        const desviacion = a.umbral ? Math.abs(a.valor - a.umbral) / Math.abs(a.umbral) : 0;
        const severidad: SeveridadAlerta = desviacion > 0.2 ? 'high' : 'medium';

        return {
            id: 'sensor-' + a.id,
            idOriginal: a.id,
            tipo: 'sensor',
            severidad,
            titulo: nombre + ' fuera de rango',
            descripcion: 'Reporta ' + num(a.valor) + ' (umbral: ' + num(a.umbral) + ')',
            fecha: hace(a.fechaAlerta),
        };
    });

    // Alertas de inventario: alta si el disponible llegó a cero
    const alertasStock: Alerta[] = (bajoStockQuery.data ?? []).map((i) => ({
        id: 'stock-' + i.id,
        idOriginal: i.id,
        tipo: 'stock',
        severidad: i.stockDisponible <= 0 ? 'high' : 'medium',
        titulo: 'Stock bajo: ' + i.nombre,
        descripcion: num(i.stockDisponible) + ' ' + i.unidadUso + ' disponibles, mínimo ' + num(i.stockMinimo) + ' ' + i.unidadUso,
        fecha: '',
    }));

    // Alertas de tareas: vencidas en rojo, las de los próximos días en naranja
    const alertasTarea: Alerta[] = (actividadesQuery.data ?? [])
        .filter((a) => ABIERTAS.includes(a.estado))
        .map((a) => ({ actividad: a, dias: diasHasta(a.fecha) }))
        .filter(({ dias }) => dias <= AVISO_DIAS)
        .map(({ actividad, dias }) => ({
            id: 'task-' + actividad.id,
            idOriginal: actividad.id,
            tipo: 'task' as const,
            severidad: (dias < 0 ? 'high' : dias === 0 ? 'medium' : 'low') as SeveridadAlerta,
            titulo: (dias < 0 ? 'Tarea vencida: ' : 'Tarea pendiente: ') + actividad.nombre,
            descripcion: actividad.tipo + ' · Lote ' + actividad.loteId,
            fecha: textoPlazo(dias),
        }));

    // Las más graves primero
    const PESO: Record<SeveridadAlerta, number> = { high: 0, medium: 1, low: 2 };
    const alertas = [...alertasSensor, ...alertasStock, ...alertasTarea].sort(
        (a, b) => PESO[a.severidad] - PESO[b.severidad],
    );

    const descartarMutation = useMutation({
        mutationFn: (id: number) => alertasApi.descartarSensorAlerta(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sensor-alertas'] }),
    });

    return {
        alertas,
        total: alertas.length,
        cargando: sensorAlertasQuery.isLoading || bajoStockQuery.isLoading || actividadesQuery.isLoading,
        error: sensorAlertasQuery.error || bajoStockQuery.error || actividadesQuery.error
            ? 'No se pudieron cargar las alertas.'
            : '',
        descartar: (id: number) => descartarMutation.mutate(id),
    };
}