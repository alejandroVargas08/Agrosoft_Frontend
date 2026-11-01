import { useActividadHistorial } from '../../hooks/Historial/useActividadHistorial';

const fecha = (valor: string | Date) =>
    new Date(valor).toLocaleString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

const texto = (valor: unknown) =>
    valor === null || valor === undefined || valor === '' ? '—' : String(valor);

/** Los cambios que se le han hecho a la actividad, con el antes y el después. */
export function TabHistorial({ actividadId }: { actividadId: number | undefined }) {
    const { historial, loading, error } = useActividadHistorial(actividadId);

    if (loading) return <p className="text-sm text-neutral-500 py-6 text-center">Cargando el historial...</p>;
    if (error) return <p className="text-sm text-red-600 py-6 text-center">{error}</p>;
    if (historial.length === 0) {
        return <p className="text-sm text-neutral-500 py-6 text-center">Esta actividad no tiene cambios registrados.</p>;
    }

    return (
        <div className="space-y-3">
            {historial.map((registro) => (
                <div key={registro.id} className="p-4 bg-[#f0f4f1] rounded-2xl">
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-sm font-semibold text-neutral-900">
                            Usuario #{registro.usuarioId}
                        </span>
                        <span className="text-xs text-neutral-500 shrink-0">{fecha(registro.fechaCreacion)}</span>
                    </div>

                    {Object.entries(registro.cambios ?? {}).map(([campo, cambio]) => (
                        <div key={campo} className="text-xs p-2 bg-white rounded-xl mb-1 last:mb-0">
                            <span className="font-medium text-neutral-900">{campo}: </span>
                            <span className="text-red-500 line-through">{texto(cambio?.anterior)}</span>
                            <span className="text-neutral-400"> → </span>
                            <span className="text-emerald-600 font-medium">{texto(cambio?.nuevo)}</span>
                        </div>
                    ))}

                    {registro.motivo && (
                        <p className="text-xs text-neutral-500 mt-2 italic">Motivo: {registro.motivo}</p>
                    )}
                </div>
            ))}
        </div>
    );
}
