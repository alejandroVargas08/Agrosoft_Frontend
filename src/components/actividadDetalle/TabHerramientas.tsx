import { useState } from "react";
import { useActividadHerramientas } from "../../hooks/actividades/useActividadHerramientas";

export function TabHerramientas ({actividadId} : {actividadId: number | undefined}) {
    const {
        herramientas, 
        loading, 
        error, 
        asignar, 
        asignado, 
        errorAsignar, 
        reestimar, 
        quitar, 
        quitando, 
    } = useActividadHerramientas(actividadId); 


    const [form, setForm] = useState({ insumoId: '', activoFijoId: '', horasEstimadas: ''}); 
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        asignar ({
            insumoId: Number(form.insumoId), 
            activoFijoId: form.activoFijoId ? Number(form.activoFijoId) : undefined,
            horasEstimadas: Number(form.horasEstimadas),
        }); 
        setForm({ insumoId: '', activoFijoId: '', horasEstimadas: ''}); 
    }; 

    return (
        <div>
        <form onSubmit={handleSubmit} className="grid grid-cols-4 gap-3 mb-6 bg-white p-4 rounded-xl border border-neutral-200">
            <input
            required type="number" placeholder="ID herramienta (insumo)" value={form.insumoId}
            onChange={(e) => setForm({ ...form, insumoId: e.target.value })}
            className="rounded-lg border border-neutral-200 py-2 px-3"
            />
            <input
            type="number" placeholder="ID activo fijo (opcional)" value={form.activoFijoId}
            onChange={(e) => setForm({ ...form, activoFijoId: e.target.value })}
            className="rounded-lg border border-neutral-200 py-2 px-3"
            />
            <input
            required type="number" step="0.01" placeholder="Horas estimadas" value={form.horasEstimadas}
            onChange={(e) => setForm({ ...form, horasEstimadas: e.target.value })}
            className="rounded-lg border border-neutral-200 py-2 px-3"
            />
            <button
            type="submit" disabled={asignado}
            className="bg-green-800 text-white rounded-lg py-2 disabled:opacity-50"
            >
            {asignado ? 'Asignando...' : '+ Asignar'}
            </button>
            {errorAsignar && <p className="col-span-4 text-red-600 text-sm">{errorAsignar}</p>}
        </form>

        {loading && <p className="text-neutral-500">Cargando...</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="space-y-2">
            {herramientas.map((h) => (
            <div key={h.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-neutral-100">
                <span className="text-sm">
                Herramienta #{h.insumoId} — {h.horasEstimadas}h estimadas
                {h.activoFijoId && <span className="text-neutral-400"> · activo fijo #{h.activoFijoId}</span>}
                </span>
                <div className="flex gap-3">
                <button
                    onClick={() => {
                    const nuevas = Number(prompt('Nuevas horas estimadas:', String(h.horasEstimadas)));
                    if (nuevas > 0) reestimar(h.id, nuevas);
                    }}
                    className="text-sm text-amber-700 underline"
                >
                    Re-estimar
                </button>
                <button
                    disabled={quitando} onClick={() => quitar(h.id)}
                    className="text-sm text-red-600 underline disabled:opacity-50"
                >
                    Quitar
                </button>
                </div>
            </div>
            ))}
        </div>
        </div>
    );
}