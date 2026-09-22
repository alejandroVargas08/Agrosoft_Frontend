import { useState } from "react"
import { useActividades } from "../../hooks/actividades/useActividades";
import { useActividadForm } from "../../hooks/actividades/useActividadForm";
import DashboardLayout from "../../componets/layout/DashboardLayout";



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

    const Filtros: { label: string; value: string }[] = [
        { label: 'Todas', value: 'TODAS' },
        { label: 'Pendiente', value: 'PENDIENTE' },
        { label: 'En progreso', value: 'EN_PROGRESO' },
        { label: 'Completada', value: 'COMPLETADA' },
    ];

    const getEstadoBadge = (estado: string) => {
        switch (estado) {

            case 'Todas':
            return 'bg-green-200 text-white-800';
            
            case 'Completada':
                return 'bg-emerald-100 text-emerald-800';
            case 'En_progreso':
                return 'bg-blue-100 text-blue-800';
            case 'Pendiente':
                return 'bg-amber-100 text-amber-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
            <DashboardLayout>
            <div className="max-w-7xl mx-auto">

{/* Titulo */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                    <h1 className="text-3xl sm:text-3xl font-bold text-neutral-900 mx-auto">Actividades Agrícolas</h1>
                    <p className="text-neutral-500 text-base mt-1">Labores y Tareas de Campo</p>
                    </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="rounded-xl bg-green-800 hover:bg-[#418750] transition-colors px-6 py-3.5 text-white font-medium flex items-center gap-2">
                    + Nueva Actividad </button>
                </div>
{/* Filtro */}
                <div className="flex gap-2 mb-8">
                    {Filtros.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setFiltroEstado(f.value)}
                        className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                            filtroEstado === f.value 
                            ? 'bg-[#2d7a3e] text-white shadow-sm' 
                            : 'bg-[#edf2ee] text-neutral-600 hover:bg-[#e2ebd7]'}`}>
                        {f.label}
                    </button>
                    ))}
                </div>
{/* Modalll */}

                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
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

                                    {/* Ejemplo: Seleccionar Lote */}
                                    <label className="text-sm font-medium text-neutral-700">Lote</label>
                                    <select 
                                        name="loteId"
                                        value={form.loteId || ""}
                                        onChange={handleFormChange}
                                        className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 mt-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-700"
                                    >
                                        <option value="">Seleccione un lote</option>
                                        {lotes?.map((lote) => (
                                            <option key={lote.id} value={lote.id}>{lote.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                        {/* Seleccionar Sublote */}
                                <div>
                                    <label className="text-sm font-medium text-neutral-700">Sublote</label>
                                    <select 
                                        name="subloteId"
                                        value={form.subloteId || ""}
                                        onChange={handleFormChange}
                                        className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 mt-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-700"
                                    >
                                        <option value="">Seleccione un sublote</option>
                                        {sublotes?.map((sub: any) => (
                                            <option key={sub.id} value={sub.id}>{sub.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                        {/* Tipo / Nombre */}
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

                                        {/* Descripción */}
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

                                {/* Botones de acción */}
                                <div className="sm:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-neutral-100">
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
            
{/* Tarjetasss */}
                <div className="flex flex-col gap-4">
                    {actividades.map((actividad) => (
                        <div key={actividad.id}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 relative flex flex-col justify-between"> 

                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-neutral-900">
                                        {actividad.tipo} — {actividad.subtipo}
                                    </h3>
                                    <span className="text-xs text-neutral-400">
                                        {actividad.fecha}
                                    </span>
                                </div>

                                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getEstadoBadge(actividad.estado)}`}>
                                    {actividad.estado}
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