import { useState } from "react"
import { useActividades } from "../../hooks/actividades/useActividades";
import { useActividadForm } from "../../hooks/actividades/useActividadForm";
import { LuClock, LuDollarSign } from "react-icons/lu";
import Sidebar from "../../componets/layout/Sidebar";



const ActividadesAgricolas = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const {
        actividades,
        loading,
        error,
        filtroEstado,
        setFiltroEstado,
        handleChangeEstado,
    } = useActividades(1);

    const { form, lotes, handleFormChange, handleCreateSubmit, enviando, errorForm } =
    useActividadForm({
        isModalOpen,
        onSuccess: () => setIsModalOpen(false),
    });

   return (
    <div className="flex min-h-screen bg-gray-50">
        {/* 2. Renderizas el Sidebar aquí */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* 3. Contenedor principal con 'flex-1' y 'lg:ml-64' para que respete el ancho del menú */}
        <div className="flex-1 p-6 max-w-7xl mx-auto lg:ml-64">
            <div className="flex justify-between items-center mb-8">
                <div>
                <h1 className="text-3xl font-bold text-neutral-900">Actividades Agrícolas</h1>
                <p className="text-neutral-500">Labores y tareas del campo</p>
                </div>
                <button
                onClick={() => setIsModalOpen(true)}
                className="rounded-xl bg-green-800 px-6 py-3.5 text-white">
                + Nueva Actividad
                </button>
            </div>

            <div className="flex gap-2 mb-6">
            {['Todas', 'Pendiente', 'En progreso', 'Completada'].map((f) => (
                <button
                key={f}
                onClick={() => setFiltroEstado(f)}
                className={`px-4 py-2 rounded-full ${
                    filtroEstado === f ? 'bg-green-800 text-white' : 'border border-neutral-200'}`}>{f}
                </button>
            ))}
            </div>

            {loading && <p className="text-neutral-500">Cargando actividades...</p>}
            {error && <p className="text-red-600">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {actividades.map((act) => (
                <div key={act.id} className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100">
                <h3 className="text-lg font-bold">{act.nombre}</h3>
                <p className="text-sm text-neutral-400">{act.fecha}</p>
                <button
                    onClick={() => handleChangeEstado(act.id, act.estado)}
                    className="text-xs mt-2 underline text-green-700"
                >
                    Estado: {act.estado.replace('_', ' ')} (clic para avanzar)
                </button>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <LuClock /> {act.horasActividad}h
                  <LuDollarSign /> {(act.horasActividad * act.precioHoraActividad).toLocaleString()}
                </div>
                </div>
            ))}
            </div>

            {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-2xl w-full max-w-2xl p-6">
                <h2 className="text-xl font-bold mb-4">Nueva Actividad</h2>
                {errorForm && <p className="text-red-600 mb-3">{errorForm}</p>}
                <form onSubmit={handleCreateSubmit} className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                    <label>Nombre</label>
                    <input
                        required
                        name="nombre"
                        value={form.nombre}
                        onChange={handleFormChange}
                        className="w-full rounded-xl border border-neutral-200 py-3 px-4 focus:border-green-600"
                    />
                    </div>
                    <div>
                    <label>Lote (Gatilla la carga de cultivos)</label>
                    <select
                        required
                        name="loteId"
                        value={form.loteId}
                        onChange={handleFormChange}
                        className="w-full rounded-xl border border-neutral-200 py-3 px-4">
                        <option value="">Seleccione...</option>
                        {lotes.map((l: any) => (
                        <option key={l.id} value={l.id}>
                            {l.nombre}
                        </option>
                        ))}
                    </select>
                    </div>
                    <div className="col-span-2 flex justify-end gap-3 mt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)}>
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={enviando}
                        className="bg-green-800 text-white px-6 py-3 rounded-xl disabled:opacity-50">
                        {enviando ? 'Guardando...' : 'Guardar'}
                    </button>
                    </div>
                </form>
                </div>
            </div>
            )}
        </div>
    </div>
    ); 
};

export default ActividadesAgricolas;