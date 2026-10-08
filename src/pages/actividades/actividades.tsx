import { useState } from "react"
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { useCultivos } from "../../hooks/cultivos/useCultivos";
import { useTerritorio } from "../../hooks/useTerritorio";
import { useActividadForm } from "../../hooks/Actividades/useActividadForm";
import { useActividades } from "../../hooks/Actividades/useActividades";


const Actividades = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loteFiltroId, setLoteFiltroId] = useState<number | undefined>(undefined);
    const [cultivoIdActual, setCultivoIdActual] = useState<number>(1);
    const {lotes: lotesFiltro } = useTerritorio();
    const {cultivos: cultivosDisponibles} = useCultivos(loteFiltroId);
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
        lotes: lotesForm,
        sublotes,
        cultivos: cultivosForm,
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
        { label: 'Todas', value: 'Todas' },
        { label: 'Pendiente', value: 'Pendiente' },
        { label: 'En progreso', value: 'En progreso' },
        { label: 'Finalizada', value: 'Finalizada' },
    ];

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'Todas':
            return 'bg-green-200 text-white-800';
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
            <div className="p-4 sm:p-8">

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-neutral-100">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Filtrar por Lote:</label>
                        <select
                            value={loteFiltroId || ""}
                            onChange={(e) => {
                                setLoteFiltroId(e.target.value ? Number(e.target.value) : undefined);
                                setCultivoIdActual(0);
                            }}
                            className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-700"
                        >
                            <option value="">Seleccione un lote...</option>
                            {lotesFiltro?.map((lote) => (
                                <option key={lote.id} value={lote.id}>
                                    {lote.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Cultivo a visualizar:</label>

                        <select
                            value={cultivoIdActual}
                            onChange={(e) => setCultivoIdActual(Number(e.target.value))}
                            disabled={!loteFiltroId}
                            className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-700 disabled:bg-neutral-100 disabled:text-neutral-400"
                        >
                            <option value={0}>
                                {!loteFiltroId ? "Primero seleccione un lote" : "Seleccione un cultivo"}
                            </option>
                            {cultivosDisponibles?.map((cultivoItem) => (
                                <option key={cultivoItem.id} value={cultivoItem.id}>
                                    {cultivoItem.nombreCultivo || cultivoItem.tipoCultivo || `Cultivo #${cultivoItem.id}`}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

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
                {loading && (
                    <p className="text-center py-8 text-neutral-500 font-medium"> Cargando Actividades</p>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center mb-6 text-sm"> {error} </div>
                )}

                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
                        <div className="bg-white rounded-3xl w-full max-w-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center pb-4 border-b border-neutral-100 mb-5">
                                <h2 className="text-xl font-bold mb-4 text-neutral-900">Nueva Actividad</h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-neutral-400 hover:text-neutral-600 p-1 rounded-full hover:bg-neutral-100 transition-colors"
                                > X
                                </button>
                            </div>
                        { errorForm && <p className="text-red-600 mb-3 text-sm">{errorForm}</p>}
                            <form onSubmit={handleCreateSubmit} className="space-y-4">

                            <div>
                                <label className="block text-sm font-medium text-neutral-800 mb-1">Tipo de Actividad <span className="text-red-500">*</span>
                                </label>
                                <input
                                    required
                                    name="tipo"
                                    value={form.tipo || ""}
                                    onChange={handleFormChange}
                                    placeholder="Ej: Fertilización"
                                    className="w-full rounded-2xl border border-neutral-200 py-3 px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2d7a3e]"
                                    />          
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-800 mb-1">Lote</label>
                                <select
                                    name="loteId"
                                    value={form.loteId || ""}
                                    onChange={handleFormChange}
                                    className="w-full rounded-2xl border border-neutral-200 py-3 px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2d7a3e]"
                                >
                                <option value="">Seleccione un lote</option>
                                {lotesForm?.map((lote: { id: number | string; nombre?: string; tipo?: string }) => (
                                <option key={lote.id} value={lote.id}>{lote.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-800 mb-1">Sublote</label>
                                <select
                                    name="subLoteId"
                                    value={form.subLoteId || ""}
                                    onChange={handleFormChange}
                                    className="w-full rounded-2xl border border-neutral-200 py-3 px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2d7a3e]"
                                >
                                    <option value="">Seleccione un sublote</option>
                                    {sublotes?.map((sub: { id: number | string; nombre: string }) => (
                                        <option key={sub.id} value={sub.id}>{sub.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-800 mb-1">Cultivo</label>
                                <select
                                    name="cultivoId"
                                    value={form.cultivoId || ""}
                                    onChange={handleFormChange}
                                    className="w-full rounded-2xl border border-neutral-200 py-3 px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2d7a3e]"
                                >
                                    <option value="">Seleccione un cultivo</option>
                                    {cultivosForm?.map((cultivosItem: { id: number | string; nombreCultivo?: string; tipoCultivo?: string }) => (
                                        <option key={cultivosItem.id} value={cultivosItem.id}>
                                            {cultivosItem.nombreCultivo || cultivosItem.tipoCultivo || `Cultivo #${cultivosItem.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>


                            <div>
                                <label className="block text-sm font-medium text-neutral-800 mb-1">Producto / Insumo</label>
                                <select
                                    name="productoAgroId"
                                    value={form.productoAgroId || ""}
                                    onChange={handleFormChange}
                                    className="w-full rounded-2xl border border-neutral-200 py-3 px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2d7a3e]"
                                >
                                    <option value="">Seleccione un producto</option>
                                    {productos?.map((producto: { id: number | string; nombre: string }) => (
                                        <option key={producto.id} value={producto.id}>{producto.nombre}</option>
                                    ))}
                                </select>
                            </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-800 mb-1">
                                        Fecha <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        name="fecha"
                                        value={form.fecha || ""}
                                        onChange={handleFormChange}
                                        className="w-full rounded-2xl border border-neutral-200 py-3 px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2d7a3e]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-800 mb-1">Descripción</label>
                                    <textarea
                                        name="descripcion"
                                        value={form.descripcion || ""}
                                        onChange={handleFormChange}
                                        rows={3}
                                        placeholder="Detalles adicionales de la labor..."
                                        className="w-full rounded-2xl border border-neutral-200 py-3 px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2d7a3e]"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-5 mt-6 border-t border-neutral-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-5 py-2.5 rounded-2xl text-sm font-medium text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={enviando}
                                        className="bg-[#2d7a3e] hover:bg-[#418750] text-white px-6 py-2.5 rounded-2xl text-sm font-medium shadow-sm disabled:opacity-50 transition-colors"
                                    >
                                        {enviando ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {actividades.map((actividad) => (
                        <div
                            key={actividad.id}
                            onClick={() => navigate(`/actividades/${actividad.id}`)}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 relative flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
                            >
                            <div className="flex justify-between items-start gap-2 mb-3">
                                    <h3 className="text-sm font-semibold text-neutral-900 leading-snug">
                                        {actividad.tipo} {actividad.subtipo ? `-${actividad.subtipo}` : ''}
                                    </h3>
                                    <span
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleChangeEstado(actividad.id, actividad.estado);
                                    }} 
                                    className={`text-xs font-semibold px-3 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity shrink-0 ${getEstadoBadge(actividad.estado)}`}>
                                        {actividad.estado ? actividad.estado.replace('_', ' ') : ''}
                                    </span>
                                </div>

                                <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                                {actividad.descripcion || "Sin descripción registrada."}
                                </p>

                                <div className="border-t border-neutral-100 pt-3 mt-auto">
                                    <span className="text-xs text-neutral-400 font-medium">
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