import { useState } from "react"
import { useActividades } from "../hooks/Actividades/useActividades";
import { useActividadForm } from "../hooks/Actividades/useActividadForm";
import DashboardLayout from "../componets/layout/DashboardLayout";

const Actividades = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
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

    // El value debe coincidir exactamente con el "estado" que llega del backend
    const Filtros: { label: string; value: string }[] = [
        { label: 'Todas', value: 'Todas' },
        { label: 'Pendiente', value: 'Pendiente' },
        { label: 'En progreso', value: 'En_progreso' },
        { label: 'Finalizada', value: 'Finalizada' },
    ];

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'Finalizada':
                return 'bg-[#e2f4ed] text-[#0d5433]';
            case 'En_progreso':
                return 'bg-[#e8f0fe] text-[#1a73e8]';
            case 'Pendiente':
                return 'bg-[#fef3d6] text-[#b7791f]';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-8">

                {/* Titulo */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Actividades Agrícolas</h1>
                        <p className="text-neutral-500 text-sm sm:text-base mt-1">Labores y Tareas de Campo</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full sm:w-auto rounded-xl bg-green-800 hover:bg-[#418750] transition-colors px-6 py-3 text-white font-medium flex items-center justify-center gap-2">
                        + Nueva Actividad
                    </button>
                </div>

                {/* Filtro */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {Filtros.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setFiltroEstado(f.value)}
                            className={`px-4 sm:px-5 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                                filtroEstado === f.value
                                    ? 'bg-[#2d7a3e] text-white shadow-sm'
                                    : 'bg-[#edf2ee] text-neutral-600 hover:bg-[#e2ebd7]'}`}>
                            {f.label}
                        </button>
                    ))}
                </div>

                {loading && (
                    <p className="text-center py-8 text-neutral-500 font-medium">Cargando Actividades</p>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center mb-6 text-sm">{error}</div>
                )}

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-2xl p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                            <h2 className="text-xl font-bold mb-4 text-neutral-900">Nueva Actividad</h2>
                            {errorForm && <p className="text-red-600 mb-3 text-sm">{errorForm}</p>}
                            <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                <div>
                                    <label className="text-sm font-medium text-neutral-700">Fecha de la actividad</label>
                                    <input
                                        type="date"
                                        required
                                        name="fecha"
                                        value={form.fecha || ""}
                                        onChange={handleFormChange}
                                        className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 mt-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-700"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-neutral-700">Lote</label>
                                    <select
                                        name="loteId"
                                        value={form.loteId || ""}
                                        onChange={handleFormChange}
                                        className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 mt-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-700"
                                    >
                                        <option value="">Seleccione un lote</option>
                                        {lotes?.map((lote: { id: number | string; nombre?: string; tipo?: string }) => (
                                            <option key={lote.id} value={lote.id}>{lote.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-neutral-700">Sublote</label>
                                    <select
                                        name="subLoteId"
                                        value={form.subLoteId || ""}
                                        onChange={handleFormChange}
                                        className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 mt-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-700"
                                    >
                                        <option value="">Seleccione un sublote</option>
                                        {sublotes?.map((sub: { id: number | string; nombre: string }) => (
                                            <option key={sub.id} value={sub.id}>{sub.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-neutral-700">Cultivo</label>
                                    <select
                                        name="cultivoId"
                                        value={form.cultivoId || ""}
                                        onChange={handleFormChange}
                                        className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 mt-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-700">
                                        <option value="">Seleccione un cultivo</option>
                                        {cultivos?.map((cultivo: { id: number | string; nombre?: string; tipo?: string }) => (
                                            <option key={cultivo.id} value={cultivo.id}>{cultivo.nombre || cultivo.tipo}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="text-sm font-medium text-neutral-700">Producto / Insumo</label>
                                    <select
                                        name="productoAgroId"
                                        value={form.productoAgroId || ""}
                                        onChange={handleFormChange}
                                        className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 mt-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-700"
                                    >
                                        <option value="">Seleccione un producto</option>
                                        {productos?.map((producto: { id: number | string; nombre: string }) => (
                                            <option key={producto.id} value={producto.id}>{producto.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="text-sm font-medium text-neutral-700">Tipo de Actividad</label>
                                    <input
                                        required
                                        name="tipo"
                                        value={form.tipo || ""}
                                        onChange={handleFormChange}
                                        placeholder="Ej. Siembra, Fertilización..."
                                        className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="text-sm font-medium text-neutral-700">Descripción</label>
                                    <textarea
                                        name="descripcion"
                                        value={form.descripcion || ""}
                                        onChange={handleFormChange}
                                        rows={3}
                                        className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                                    />
                                </div>

                                <div className="sm:col-span-2 flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4 pt-4 border-t border-neutral-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={enviando}
                                        className="bg-[#2d7a3e] hover:bg-[#418750] text-white px-6 py-2 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
                                    >
                                        {enviando ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Tarjetas */}
                {!loading && actividades.length === 0 && (
                    <p className="text-center py-12 text-neutral-400 text-sm">No hay actividades registradas.</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {actividades.map((actividad) => (
                        <div
                            key={actividad.id}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex flex-col gap-3 h-full"
                        >
                            <div className="flex justify-between items-start gap-3">
                                <h3 className="text-base font-bold text-neutral-900 leading-snug break-words">
                                    {actividad.tipo}{actividad.subtipo ? ` — ${actividad.subtipo}` : ''}
                                </h3>
                                <span
                                    onClick={() => handleChangeEstado(actividad.id, actividad.estado)}
                                    title="Click para cambiar el estado"
                                    className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap ${getEstadoBadge(actividad.estado)}`}
                                >
                                    {actividad.estado ? actividad.estado.replace('_', ' ') : ''}
                                </span>
                            </div>

                            {actividad.descripcion && (
                                <p className="text-sm text-neutral-600 line-clamp-2">
                                    {actividad.descripcion}
                                </p>
                            )}

                            <div className="mt-auto pt-2 border-t border-neutral-100">
                                <span className="text-xs text-neutral-400">
                                    {actividad.fecha}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </DashboardLayout>
    );
};

export default Actividades;