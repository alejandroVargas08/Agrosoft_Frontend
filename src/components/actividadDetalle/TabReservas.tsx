import { useState } from "react";
import { useActividadInsumoReserva } from "../../hooks/actividades/useActividadInsumoReserva";

export function TabReservas({ actividadId} : {actividadId: number | undefined}) {
    const { 
        reservas, 
        loading, 
        error,
        reservar,
        reservando,
        errorReservar,
        ajustarCantidad,
        liberar,
        liberando, 
    } = useActividadInsumoReserva(actividadId);

    const [form, setForm] = useState({ insumoId: '', cantidadReservada: ''});
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        reservar({
            insumoId: Number(form.insumoId), 
            cantidadReservada: Number(form.cantidadReservada),
        }); 
        setForm({insumoId: '', cantidadReservada: ''});
    }; 

    return (
    <div>
        <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-3 mb-6 bg-white p-4 rounded-xl border border-neutral-200">
        <input
            required type="number" placeholder="ID insumo" value={form.insumoId}
            onChange={(e) => setForm({ ...form, insumoId: e.target.value })}
            className="rounded-lg border border-neutral-200 py-2 px-3"
        />
        <input
            required type="number" step="0.01" placeholder="Cantidad a reservar" value={form.cantidadReservada}
            onChange={(e) => setForm({ ...form, cantidadReservada: e.target.value })}
            className="rounded-lg border border-neutral-200 py-2 px-3"
        />
        <button
            type="submit" disabled={reservando}
            className="bg-green-800 text-white rounded-lg py-2 disabled:opacity-50"
        >
            {reservando ? 'Reservando...' : '+ Reservar'}
        </button>
        {errorReservar && <p className="col-span-3 text-red-600 text-sm">{errorReservar}</p>}
        </form>

        {loading && <p className="text-neutral-500">Cargando...</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="space-y-2">
        {reservas.map((r) => (
            <div key={r.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-neutral-100">
            <span className="text-sm">Insumo #{r.insumoId} — {r.cantidadReservada} reservado</span>
            <div className="flex gap-3">
                <button
                onClick={() => {
                    const nueva = Number(prompt('Nueva cantidad reservada:', String(r.cantidadReservada)));
                    if (nueva > 0) ajustarCantidad(r.id, nueva);
                }}
                className="text-sm text-amber-700 underline"
                >
                Ajustar
                </button>
                <button
                disabled={liberando} onClick={() => liberar(r.id)}
                className="text-sm text-red-600 underline disabled:opacity-50"
                >
                Liberar
                </button>
            </div>
            </div>
        ))}
        </div>
    </div>
  );
}