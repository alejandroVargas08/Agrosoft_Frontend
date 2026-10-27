import { useQuery } from '@tanstack/react-query';
import { Hammer, Truck, Users, Wrench } from 'lucide-react';
import { actividadInsumosApi } from '../../api/actividades/actividadInsumos';
import { actividadInsumoUsoApi } from '../../api/actividades/actividadInsumoUso';
import { actividadServiciosApi } from '../../api/actividades/actividadServicios';
import { actividadHerramientasApi } from '../../api/actividades/actividadHerramientas';
import type { Actividad } from '../../types/actividades';

const pesos = (valor: number) =>
    '$ ' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(valor || 0);

interface Props {
    actividadId: number | undefined;
    actividad?: Actividad | null;
}

/** El desglose de costos de la actividad. Cada rubro sale de su propio
 *  endpoint; la mano de obra, de las horas y el precio por hora que la
 *  actividad ya guarda. */
export function TabCostos({ actividadId, actividad }: Props) {
    const habilitado = !!actividadId;

    const insumos = useQuery({
        queryKey: ['actividad-insumos', actividadId],
        queryFn: async () => (await actividadInsumosApi.listar(actividadId!)).data,
        enabled: habilitado,
    });
    const usos = useQuery({
        queryKey: ['actividad-insumo-uso', actividadId],
        queryFn: async () => (await actividadInsumoUsoApi.listar(actividadId!)).data,
        enabled: habilitado,
    });
    const servicios = useQuery({
        queryKey: ['actividad-servicios', actividadId],
        queryFn: async () => (await actividadServiciosApi.listar(actividadId!)).data,
        enabled: habilitado,
    });
    const herramientas = useQuery({
        queryKey: ['actividad-herramientas', actividadId],
        queryFn: async () => (await actividadHerramientasApi.listar(actividadId!)).data,
        enabled: habilitado,
    });

    const horas = actividad?.horasActividad ?? 0;
    const precioHora = actividad?.precioHoraActividad ?? 0;
    const manoDeObra = horas * precioHora;

    const costoInsumos = (insumos.data ?? []).reduce((s, i) => s + (i.costoTotal || 0), 0);
    const costoUsos = (usos.data ?? []).reduce((s, u) => s + (u.costoTotal || 0), 0);
    const costoServicios = (servicios.data ?? []).reduce((s, x) => s + (x.costo || 0), 0);
    const horasHerramienta = (herramientas.data ?? []).reduce((s, h) => s + (h.horasEstimadas || 0), 0);

    const total = manoDeObra + costoInsumos + costoUsos + costoServicios;

    const cargando = insumos.isLoading || usos.isLoading || servicios.isLoading;

    const RUBROS = [
        { icono: Users, titulo: 'Mano de obra', detalle: horas + 'h × ' + pesos(precioHora) + '/h', valor: manoDeObra },
        { icono: Wrench, titulo: 'Insumos planeados', detalle: (insumos.data ?? []).length + ' registros', valor: costoInsumos },
        { icono: Hammer, titulo: 'Insumos usados', detalle: (usos.data ?? []).length + ' registros', valor: costoUsos },
        { icono: Truck, titulo: 'Servicios', detalle: (servicios.data ?? []).length + ' contratados', valor: costoServicios },
    ];

    if (cargando) {
        return <p className="text-sm text-neutral-500 py-6 text-center">Calculando los costos...</p>;
    }

    return (
        <div className="space-y-3">
            {RUBROS.map(({ icono: Icono, titulo, detalle, valor }) => (
                <div key={titulo} className="flex items-center justify-between gap-3 p-3 bg-[#f0f4f1] rounded-2xl">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-white rounded-xl shrink-0">
                            <Icono className="w-4 h-4 text-[#2d7a3e]" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-900">{titulo}</p>
                            <p className="text-xs text-neutral-500">{detalle}</p>
                        </div>
                    </div>
                    <span className="font-semibold text-neutral-900 shrink-0">{pesos(valor)}</span>
                </div>
            ))}

            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#2d7a3e]/10 border border-[#2d7a3e]/20">
                <p className="text-sm font-bold text-[#2d7a3e]">Costo total</p>
                <span className="text-lg font-bold text-[#2d7a3e]">{pesos(total)}</span>
            </div>

            {horasHerramienta > 0 && (
                <p className="text-xs text-neutral-500 pt-1">
                    Se registraron {horasHerramienta}h de uso de herramientas. No entran en el total:
                    el backend guarda las horas pero no la depreciación por hora.
                </p>
            )}

            {horas === 0 && (
                <p className="text-xs text-neutral-500 pt-1">
                    Esta actividad no tiene horas registradas, así que la mano de obra queda en cero.
                </p>
            )}
        </div>
    );
}
