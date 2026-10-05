import { useState } from "react";
import { useActividadInsumos } from "../../hooks/actividades/useActividadInsumos";

export function TabInsumos({actividadId}: {actividadId: number | undefined}) {
    const { 
        insumos,
        loading,
        error,
        registrar,
        registrando,
        errorRegistrar,
        eliminar,
        eliminando,    
    } = useActividadInsumos(actividadId);

    const [form, setForm] = useState({
        insumoId: '',
        cantidadUsada: '',
        unidad: '',
        costoUnitario: '', 
    }); 

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        registrar({
            insumoId: Number(form.insumoId),
            cantidadUsada: Number(form.cantidadUsada),
            unidad: form.unidad,
            costoUnitario: Number(form.costoUnitario),
        });
        setForm({
            insumoId: '',
            cantidadUsada: '',
            unidad: '',
            costoUnitario: ''
        });
    };

    return (
    <div>
        <form onSubmit={handleSubmit} className="grid grid-cols-4 gap-3 mb-6 bg-white p-4 rounded-xl border border-neutral-200">
            <input
            required type="number" placeholder="ID insumo" value={form.insumoId}
            onChange={(e) => setForm({ ...form, insumoId: e.target.value })}
            className="rounded-lg border border-neutral-200 py-2 px-3"
            />
            <input
            required type="number" step="0.01" placeholder="Cantidad usada" value={form.cantidadUsada}
            onChange={(e) => setForm({ ...form, cantidadUsada: e.target.value })}
            className="rounded-lg border border-neutral-200 py-2 px-3"
            />
            <input
            required placeholder="Unidad (kg, l, ...)" value={form.unidad}
            onChange={(e) => setForm({ ...form, unidad: e.target.value })}
            className="rounded-lg border border-neutral-200 py-2 px-3"
            />
            <input
            required type="number" step="0.01" placeholder="Costo unitario" value={form.costoUnitario}
            onChange={(e) => setForm({ ...form, costoUnitario: e.target.value })}
            className="rounded-lg border border-neutral-200 py-2 px-3"
            />
            <button
            type="submit" disabled={registrando}
            className="col-span-4 bg-green-800 text-white rounded-lg py-2 disabled:opacity-50"
            >
            {registrando ? 'Registrando...' : '+ Registrar insumo usado'}
            </button>
            {errorRegistrar && <p className="col-span-4 text-red-600 text-sm">{errorRegistrar}</p>}
        </form>

        {loading && <p className="text-neutral-500">Cargando...</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="space-y-2">
            {insumos.map((i) => (
            <div key={i.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-neutral-100">
                <span className="text-sm">
                Insumo #{i.insumoId} — {i.cantidadUsada} {i.unidad} — Costo total: {i.costoTotal.toLocaleString()}
                </span>
                <button
                disabled={eliminando} onClick={() => eliminar(i.id)}
                className="text-sm text-red-600 underline disabled:opacity-50"
                >
                Eliminar
                </button>
            </div>
            ))}
        </div>
    </div>
    );
}