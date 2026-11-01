import { useQueries } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { ActividadEvidenciaApi } from '../../api/actividades/actividadEvidencias';
import { actividadInsumoUsoApi } from '../../api/actividades/actividadInsumoUso';

/**
 * La lista de verificación del modal de entrega.
 *
 * En el Figma los dos puntos están escritos a mano (uno hecho, otro no). Aquí
 * se consultan de verdad: las evidencias y los insumos usados de la actividad.
 */
export function ChecklistEntrega({ actividadId }: { actividadId: number | undefined }) {
    const [evidencias, usos] = useQueries({
        queries: [
            {
                queryKey: ['actividad-evidencias', actividadId],
                queryFn: async () => (await ActividadEvidenciaApi.listar(actividadId!)).data,
                enabled: actividadId !== undefined,
            },
            {
                queryKey: ['actividad-insumo-uso', actividadId],
                queryFn: async () => (await actividadInsumoUsoApi.listar(actividadId!)).data,
                enabled: actividadId !== undefined,
            },
        ],
    });

    // Sin actividad asociada no hay nada que comprobar
    if (actividadId === undefined) return null;

    const puntos = [
        { label: 'Subiste evidencias', hecho: (evidencias.data ?? []).length > 0, cargando: evidencias.isLoading },
        { label: 'Registraste los insumos usados', hecho: (usos.data ?? []).length > 0, cargando: usos.isLoading },
    ];

    return (
        <div className="space-y-2">
            {puntos.map((p) => (
                <div
                    key={p.label}
                    className={`flex items-center gap-3 rounded-xl p-3 ${
                        p.hecho ? 'border border-emerald-200 bg-emerald-50' : 'border border-border bg-muted/50'
                    }`}
                >
                    <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full ${
                            p.hecho ? 'bg-emerald-500' : 'border-2 border-border bg-muted'
                        }`}
                    >
                        {p.hecho && <Check size={12} className="text-white" />}
                    </div>
                    <span className={`text-sm ${p.hecho ? 'font-medium text-emerald-700' : 'text-muted-foreground'}`}>
                        {p.cargando ? 'Comprobando…' : p.label}
                    </span>
                </div>
            ))}
        </div>
    );
}
