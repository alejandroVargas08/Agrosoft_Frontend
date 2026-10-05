import { useState } from "react";
import { useActividadInsumoUso } from "../../hooks/actividades/useActividadInsumoUso";

export function TabUsos ({ actividadId} : { actividadId: number | undefined}) {
    const {
        usos,
        loading, 
        error,
        registrar,
        registrando, 
        errorRegistrar
    } = useActividadInsumoUso(actividadId); 

    const [form, setForm] = useState({ insumoId: '', cantidadUso: '', costoUnitarioUso: ''}); 
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); 
        registrar({
            insumoId: Number(form.insumoId), 
            cantidadUso: Number(form.cantidadUso),
            costoUnitarioUso: Number(form.costoUnitarioUso),
        }); 
        setForm({ insumoId: '', cantidadUso: '', costoUnitarioUso: ''});
    };

    return (
    <div>
        <p className="text-sm text-neutral-500 mb-3">
            Si hay una reserva activa para este insumo en esta actividad, se descuenta automáticamente.
        </p>
        <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-3 mb-6 bg-white p-4 rounded-xl border border-neutral-200">
            <input
            required type="number" placeholder="ID insumo" value={form.insumoId}
            onChange={(e) => setForm({ ...form, insumoId: e.target.value })}
            className="rounded-lg border border-neutral-200 py-2 px-3"
            />
            <input
            required type="number" step="0.01" placeholder="Cantidad usada" value={form.cantidadUso}
            onChange={(e) => setForm({ ...form, cantidadUso: e.target.value })}
            className="rounded-lg border border-neutral-200 py-2 px-3"
            />
            <input
            required type="number" step="0.01" placeholder="Costo unitario" value={form.costoUnitarioUso}
            onChange={(e) => setForm({ ...form, costoUnitarioUso: e.target.value })}
            className="rounded-lg border border-neutral-200 py-2 px-3"
            />
            <button
            type="submit" disabled={registrando}
            className="col-span-3 bg-green-800 text-white rounded-lg py-2 disabled:opacity-50"
            >
            {registrando ? 'Registrando...' : '+ Registrar uso'}
            </button>
            {errorRegistrar && <p className="col-span-3 text-red-600 text-sm">{errorRegistrar}</p>}
        </form>

        {loading && <p className="text-neutral-500">Cargando...</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="space-y-2">
            {usos.map((u) => (
            <div key={u.id} className="bg-white p-3 rounded-lg border border-neutral-100 text-sm">
                Insumo #{u.insumoId} — {u.cantidadUso} usado — Costo total: {u.costoTotal.toLocaleString()}
                {u.movimientoInsumoId && (
                <span className="text-neutral-400"> · vinculado a movimiento #{u.movimientoInsumoId}</span>
                )}
            </div>
            ))}
        </div>
        </div>
    );
}