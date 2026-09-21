import { useState } from "react"
import { useActividades } from "../../hooks/actividades/useActividades";
import { useActividadForm } from "../../hooks/actividades/useActividadForm";
import { LuClock, LuDollarSign } from "react-icons/lu";
import Sidebar from "../../componets/layout/Sidebar";
import Header from "../../componets/layout/Header";



const Actividades = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const cultivoIdActual = 1;

    const {
        actividades,
        loading,
        error,
        filtroEstado,
        setFiltroEstado,
        handleChangeEstado,
    } = useActividades(cultivoIdActual);

    const { 
        form,
        lotes,
        sublotes,
        cultivos,
        productos,
        handleFormChange,
        handleCreateSubmit,
        enviando,
        errorForm } =
    useActividadForm({
        isModalOpen,
        onSuccess: () => setIsModalOpen(false),
        cultivoIdDefault: cultivoIdActual,
    });

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar de navegación */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Contenedor principal */}
            <div className="flex-1 flex flex-col lg:ml-64 min-w-0 ">
                <Header 
                onMenuClick={() => setIsSidebarOpen(true)}
                unreadNotifications={0}
                />

                <div className="flex-1 p-6 max-w-7xl w-full mx-auto">
                    <div className="flex justify-content-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-neutral-900">Actividades Agrícolas</h1>
                        <p className="text-neutral-500">Labores y tareas del campo</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="rounded-xl bg-green-800 hover:bg-green-700 text-white px-6 py-3.5 transition"
                    >
                        + Nueva Actividad
                    </button>
                </div>

                {/* Filtros de Estado */}
                <div className="flex gap-2 mb-6">
                    {['Todas', 'Pendiente', 'En progreso', 'Completada'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFiltroEstado(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                                filtroEstado === f 
                                    ? 'bg-green-800 text-white' 
                                    : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {loading && <p className="text-neutral-500">Cargando actividades...</p>}
                {error && <p className="text-red-600">{error}</p>}

                {/* Listado en Tarjetas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {actividades.map((act) => (
                        <div key={act.id} className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 flex flex-col justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-neutral-800">{act.nombre}</h3>
                                <p className="text-sm text-neutral-400 mb-2">{act.fecha}</p>
                                <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                                    act.estado === 'completada' ? 'bg-green-100 text-green-800' :
                                    act.estado === 'en_progreso' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {act.estado.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
                                <div className="flex items-center gap-1 text-sm text-neutral-600">
                                    <LuClock className="text-neutral-400" /> {act.horasActividad}h
                                </div>
                                <div className="flex items-center gap-1 text-sm font-semibold text-green-700">
                                    <LuDollarSign /> {(act.horasActividad * act.precioHoraActividad).toLocaleString()}
                                </div>
                            </div>

                            <button
                                onClick={() => handleChangeEstado(act.id, act.estado)}
                                className="text-xs mt-3 text-center underline text-neutral-500 hover:text-green-700"
                            >
                                Cambiar estado de actividad
                            </button>
                        </div>
                    ))}
                </div>

                {/* Modal de Creación */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto shadow-xl">
                            <h2 className="text-xl font-bold mb-4 text-neutral-800">Nueva Actividad</h2>
                            
                            {errorForm && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">{errorForm}</div>}
                            
                            <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre</label>
                                    <input
                                        required
                                        name="nombre"
                                        value={form.nombre}
                                        onChange={handleFormChange}
                                        className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 focus:outline-none focus:border-green-600"
                                        placeholder="Ej. Fertilización de cultivo"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Lote</label>
                                    <select
                                        required
                                        name="loteId"
                                        value={form.loteId}
                                        onChange={handleFormChange}
                                        className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 focus:outline-none focus:border-green-600 bg-white"
                                    >
                                        <option value="">Seleccione lote...</option>
                                        {lotes.map((l: any) => (
                                            <option key={l.id} value={l.id}>
                                                {l.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Sub-lote (Opcional)</label>
                                    <select
                                        name="subLoteId"
                                        value={form.subLoteId}
                                        onChange={handleFormChange}
                                        className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 focus:outline-none focus:border-green-600 bg-white"
                                    >
                                        <option value="">Seleccione sub-lote...</option>
                                        {sublotes.map((sub: any) => (
                                            <option key={sub.id} value={sub.id}>
                                                {sub.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Cultivo</label>
                                    <select
                                        name="cultivoId"
                                        value={form.cultivoId}
                                        onChange={handleFormChange}
                                        className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 focus:outline-none focus:border-green-600 bg-white"
                                    >
                                        <option value="">Seleccione cultivo...</option>
                                        {cultivos.map((cultivo: any) => (
                                            <option key={cultivo.id} value={cultivo.id}>
                                                {cultivo.nombre || `Cultivo #${cultivo.id}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Insumo / Producto (Opcional)</label>
                                    <select
                                        name="productoAgroId"
                                        value={form.productoAgroId}
                                        onChange={handleFormChange}
                                        className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 focus:outline-none focus:border-green-600 bg-white"
                                    >
                                        <option value="">Seleccione producto...</option>
                                        {productos.map((prod: any) => (
                                            <option key={prod.id} value={prod.id}>
                                                {prod.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Fecha</label>
                                    <input
                                        type="date"
                                        required
                                        name="fecha"
                                        value={form.fecha}
                                        onChange={handleFormChange}
                                        className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 focus:outline-none focus:border-green-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Horas de Actividad</label>
                                    <input
                                        type="number"
                                        required
                                        name="horasActividad"
                                        value={form.horasActividad}
                                        onChange={handleFormChange}
                                        className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 focus:outline-none focus:border-green-600"
                                        placeholder="Ej. 4"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Precio por Hora</label>
                                    <input
                                        type="number"
                                        required
                                        name="precioHoraActividad"
                                        value={form.precioHoraActividad}
                                        onChange={handleFormChange}
                                        className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 focus:outline-none focus:border-green-600"
                                        placeholder="Ej. 10000"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Descripción (Opcional)</label>
                                    <textarea
                                        name="descripcion"
                                        value={form.descripcion}
                                        onChange={handleFormChange}
                                        rows={2}
                                        className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 focus:outline-none focus:border-green-600"
                                    />
                                </div>

                                <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-5 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={enviando}
                                        className="bg-green-800 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl disabled:opacity-50 transition"
                                    >
                                        {enviando ? 'Guardando...' : 'Guardar Actividad'}
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

export default Actividades;