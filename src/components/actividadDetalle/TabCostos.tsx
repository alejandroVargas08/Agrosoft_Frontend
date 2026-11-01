import { useQuery } from '@tanstack/react-query';
import { Hammer, Truck, Users, Wrench } from 'lucide-react';
import { actividadInsumosApi } from '../../api/actividades/actividadInsumos';
import { actividadInsumoUsoApi } from '../../api/actividades/actividadInsumoUso';
import { actividadServiciosApi } from '../../api/actividades/actividadServicios';
import { actividadHerramientasApi } from '../../api/actividades/actividadHerramientas';
import { insumosApi } from '../../api/inventario';
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

    // La ficha del insumo trae el costo de adquisicion, el valor residual y la
    // vida util: con eso se calcula la depreciacion por hora de cada herramienta
    const catalogoInsumos = useQuery({
        queryKey: ['insumos'],
        queryFn: async () => (await insumosApi.listar()).data,
        staleTime: 60_000,
    });

    const horas = actividad?.horasActividad ?? 0;
    const precioHora = actividad?.precioHoraActividad ?? 0;
    const manoDeObra = horas * precioHora;

    const costoInsumos = (insumos.data ?? []).reduce((s, i) => s + (i.costoTotal || 0), 0);
    const costoUsos = (usos.data ?? []).reduce((s, u) => s + (u.costoTotal || 0), 0);
    const costoServicios = (servicios.data ?? []).reduce((s, x) => s + (x.costo || 0), 0);
    const horasHerramienta = (herramientas.data ?? []).reduce((s, h) => s + (h.horasEstimadas || 0), 0);

    // Depreciacion lineal: (costo - valor residual) / vida util, por hora de uso.
    // Solo cuenta la herramienta cuya ficha tenga los tres datos.
    const porInsumo = new Map((catalogoInsumos.data ?? []).map((i) => [i.id, i]));
    let costoHerramientas = 0;
    let herramientasSinDatos = 0;

    for (const h of herramientas.data ?? []) {
        const insumo = porInsumo.get(h.insumoId);
        const vidaUtil = insumo?.vidaUtilHoras ?? 0;

        if (!insumo || vidaUtil <= 0 || insumo.costoAdquisicion === undefined) {
            if ((h.horasEstimadas || 0) > 0) herramientasSinDatos++;
            continue;
        }

        const depreciable = insumo.costoAdquisicion - (insumo.valorResidual ?? 0);
        costoHerramientas += (depreciable / vidaUtil) * (h.horasEstimadas || 0);
    }

    const total = manoDeObra + costoInsumos + costoUsos + costoServicios + costoHerramientas;

    const cargando = insumos.isLoading || usos.isLoading || servicios.isLoading || catalogoInsumos.isLoading;

    const RUBROS = [
        { icono: Users, titulo: 'Mano de obra', detalle: horas + 'h × ' + pesos(precioHora) + '/h', valor: manoDeObra },
        { icono: Wrench, titulo: 'Insumos planeados', detalle: (insumos.data ?? []).length + ' registros', valor: costoInsumos },
        { icono: Hammer, titulo: 'Insumos usados', detalle: (usos.data ?? []).length + ' registros', valor: costoUsos },
        { icono: Truck, titulo: 'Servicios', detalle: (servicios.data ?? []).length + ' contratados', valor: costoServicios },
        { icono: Hammer, titulo: 'Herramientas', detalle: horasHerramienta + 'h de uso · depreciación', valor: costoHerramientas },
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

            {herramientasSinDatos > 0 && (
                <p className="text-xs text-neutral-500 pt-1">
                    {herramientasSinDatos} herramienta{herramientasSinDatos === 1 ? '' : 's'} con horas
                    registradas no entra{herramientasSinDatos === 1 ? '' : 'n'} en el total: a su ficha de
                    inventario le falta el costo de adquisición o la vida útil.
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
