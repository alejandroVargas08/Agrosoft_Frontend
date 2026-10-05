import React, { useState } from "react";
import { useActividadServicios } from "../../hooks/actividades/useActividadServicios";

export function TabServicio ({ actividadId} : {actividadId: number | undefined}) {
    const {
        servicios,
        loading,
        error, 
        registrar, 
        registrando,
        errorRegistrar, 
        actualizarHoras,
        eliminar,
        eliminando
    } = useActividadServicios(actividadId); 

    const [form, setForm] = useState({
        nombreServicio: '',
        proveedorId: '', 
        maquinariaId: '', 
        horas: '', 
        precioHora: '', 
    }); 

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); 
        registrar({
            nombreServicio: form.nombreServicio,
            proveedorId: Number(form.proveedorId), 
            maquinariaId: Number(form.maquinariaId), 
            horas: Number(form.horas), 
            precioHora: Number (form.precioHora), 
        }); 
        setForm({ nombreServicio: '', proveedorId: '', maquinariaId: '', horas: '', precioHora: ''}); 
    };

    return (
    <div>
        <form onSubmit={handleSubmit} className="grid grid-cols-5 gap-3 mb-6 bg-white p-4 rounded-xl border border-neutral-200">
            <input
            required placeholder="Nombre del servicio" value={form.nombreServicio}
            onChange={(e) => setForm({ ...form, nombreServicio: e.target.value })}
            className="col-span-2 rounded-lg border border-neutral-200 py-2 px-3"
            />
            <input
            required type="number" placeholder="ID proveedor" value={form.proveedorId}
            onChange={(e) => setForm({ ...form, proveedorId: e.target.value })}
            className="rounded-lg border border-neutral-200 py-2 px-3"
            />
            <input
            required type="number" placeholder="ID maquinaria" value={form.maquinariaId}
            onChange={(e) => setForm({ ...form, maquinariaId: e.target.value })}
            className="rounded-lg border border-neutral-200 py-2 px-3"
            />
            <input
            required type="number" step="0.01" placeholder="Horas" value={form.horas}
            onChange={(e) => setForm({ ...form, horas: e.target.value })}
            className="rounded-lg border border-neutral-200 py-2 px-3"
            />
            <input
            required type="number" step="0.01" placeholder="Precio/hora" value={form.precioHora}
            onChange={(e) => setForm({ ...form, precioHora: e.target.value })}
            className="col-span-2 rounded-lg border border-neutral-200 py-2 px-3"
            />
            <button
            type="submit" disabled={registrando}
            className="col-span-3 bg-green-800 text-white rounded-lg py-2 disabled:opacity-50"
            >
            {registrando ? 'Registrando...' : '+ Registrar servicio'}
            </button>
            {errorRegistrar && <p className="col-span-5 text-red-600 text-sm">{errorRegistrar}</p>}
        </form>

        {loading && <p className="text-neutral-500">Cargando...</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="space-y-2">
            {servicios.map((s) => (
            <div key={s.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-neutral-100">
                <span className="text-sm">
                {s.nombreServicio} — {s.horas}h — Costo: {s.costo.toLocaleString()}
                </span>
                <div className="flex gap-3">
                <button
                    onClick={() => {
                    const nuevas = Number(prompt('Nuevas horas:', String(s.horas)));
                    if (nuevas > 0) actualizarHoras(s.id, nuevas);
                    }}
                    className="text-sm text-amber-700 underline"
                >
                    Editar horas
                </button>
                <button
                    disabled={eliminando} onClick={() => eliminar(s.id)}
                    className="text-sm text-red-600 underline disabled:opacity-50"
                >
                    Eliminar
                </button>
                </div>
            </div>
            ))}
        </div>
    </div>
    );


}