import { Clock } from 'lucide-react';
import { useActividadHistorial } from '../../hooks/Historial/useActividadHistorial';
import { Card, EmptyState } from '../ui/AgroUI';

const fecha = (valor: string | Date) =>
    new Date(valor).toLocaleString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

const texto = (valor: unknown) =>
    valor === null || valor === undefined || valor === '' ? '—' : String(valor);

/** Los cambios que se le han hecho a la actividad, con el antes y el después. */
export function TabHistorial({ actividadId }: { actividadId: number | undefined }) {
    const { historial, loading, error } = useActividadHistorial(actividadId);

    if (loading) return <p className="py-6 text-center text-sm text-muted-foreground">Cargando el historial...</p>;
    if (error) return <p className="py-6 text-center text-sm text-red-600">{error}</p>;

    if (historial.length === 0) {
        return <EmptyState icon={Clock} title="Sin cambios" description="No hay historial de cambios" />;
    }

    return (
        <div className="space-y-3">
            {historial.map((registro) => (
                <Card key={registro.id}>
                    <div className="mb-1 flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-foreground">Usuario #{registro.usuarioId}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{fecha(registro.fechaCreacion)}</span>
                    </div>

                    {Object.entries(registro.cambios ?? {}).map(([campo, cambio]) => (
                        <div key={campo} className="mb-1 rounded-lg bg-muted p-2 text-xs last:mb-0">
                            <span className="font-medium text-foreground">{campo}: </span>
                            <span className="text-red-500 line-through">{texto(cambio?.anterior)}</span>
                            <span className="text-muted-foreground"> → </span>
                            <span className="text-emerald-600">{texto(cambio?.nuevo)}</span>
                        </div>
                    ))}

                    {registro.motivo && (
                        <p className="mt-2 text-xs italic text-muted-foreground">Motivo: {registro.motivo}</p>
                    )}
                </Card>
            ))}
        </div>
    );
}
