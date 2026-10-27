import { useState } from "react";
import { useActividades } from "../../hooks/Actividades/useActividad";
import { useActividadForm } from "../../hooks/Actividades/useActividadForm";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { useCultivos } from "../../hooks/cultivos/useCultivos";
import { useTerritorio } from "../../hooks/useTerritorio";
import { usePermisos } from "../../hooks/permisos/usePermisos";
import { useAsignarAprendices } from "../../hooks/Actividades/useAsignarAprendices";

const Actividades = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loteFiltroId, setLoteFiltroId] = useState<number | undefined>(undefined);
    const [cultivoIdActual, setCultivoIdActual] = useState<number | null>(null);
    const {lotes: lotesFiltro } = useTerritorio();
    const { puede } = usePermisos();
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
        cultivoIdDefault: cultivoIdActual ?? undefined,
    });

    const Filtros: { label: string; value: string }[] = [
        { label: 'Todas', value: 'Todas' },
        { label: 'Pendiente', value: 'Pendiente' },
        { label: 'En progreso', value: 'En progreso' },
        { label: 'Finalizada', value: 'Finalizada' },
    ];

    // Asignación de aprendices: solo consulta si el usuario puede asignar
    const asignacion = useAsignarAprendices(actividades.map((a) => a.id));
    const [seleccionados, setSeleccionados] = useState<number[]>([]);
    const [fechaLimite, setFechaLimite] = useState('');

    const cerrarAsignar = () => {
        asignacion.cerrar();
        setSeleccionados([]);
        setFechaLimite('');
    };

    const alternar = (id: number) =>
        setSeleccionados((previos) =>
            previos.includes(id) ? previos.filter((x) => x !== id) : [...previos, id]);

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
                {puede('actividades.gestionar') && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="rounded-xl bg-green-800 hover:bg-[#418750] transition-colors px-6 py-3.5 text-white font-medium flex items-center gap-2">
                        + Nueva Actividad </button>
                )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-neutral-100">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Filtrar por Lote:</label>
                        <select
                            value={loteFiltroId || ""}
                            onChange={(e) => {
                                setLoteFiltroId(e.target.value ? Number(e.target.value) : undefined);
                                setCultivoIdActual(null);
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
                            value={cultivoIdActual ?? 0}
                            onChange={(e) => setCultivoIdActual(Number(e.target.value) || null)}
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
                {cultivoIdActual === null && (
                    <p className="text-center py-8 text-neutral-500 font-medium">Selecciona un lote y un cultivo para ver sus actividades</p>
                )}
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
                            onClick={() => navigate(`/actividades/${actividad.id}`, {state: {actividad} })}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 relative flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
                            >
                            <div className="flex justify-between items-start gap-2 mb-3">
                                    <h3 className="text-sm font-semibold text-neutral-900 leading-snug">
                                        {actividad.tipo} {actividad.subtipo ? `-${actividad.subtipo}` : ''}
                                    </h3>
                                    <span
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (puede('actividades.gestionar')) handleChangeEstado(actividad.id, actividad.estado);
                                    }} 
                                    className={`text-xs font-semibold px-3 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity shrink-0 ${getEstadoBadge(actividad.estado)}`}>
                                        {actividad.estado ? actividad.estado.replace('_', ' ') : ''}
                                    </span>
                                </div>

                                <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                                {actividad.descripcion || "Sin descripción registrada."}
                                </p>

                                {(() => {
                                    const p = asignacion.progreso(actividad.id);
                                    if (p.total === 0) return null;
                                    return (
                                        <div className="mb-3">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="flex -space-x-1.5">
                                                    {p.iniciales.map((inicial, i) => (
                                                        <div
                                                            key={i}
                                                            className="w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center ring-2 ring-white"
                                                        >
                                                            {inicial}
                                                        </div>
                                                    ))}
                                                    {p.restantes > 0 && (
                                                        <div className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-500 text-xs font-bold flex items-center justify-center ring-2 ring-white">
                                                            +{p.restantes}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-xs text-neutral-500">
                                                    {p.aprobadas} de {p.total} aprobadas
                                                </span>
                                            </div>
                                            <div className="w-full bg-neutral-100 rounded-full h-1.5">
                                                <div
                                                    className="h-1.5 rounded-full bg-[#2d7a3e] transition-all"
                                                    style={{ width: p.porcentaje + '%' }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div className="border-t border-neutral-100 pt-3 mt-auto flex items-center justify-between gap-2">
                                    <span className="text-xs text-neutral-400 font-medium">
                                        {actividad.fecha}
                                    </span>
                                    {asignacion.puedeAsignar && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); asignacion.abrir(actividad.id); }}
                                            className="text-xs font-semibold text-[#2d7a3e] hover:opacity-70 transition-opacity cursor-pointer"
                                        >
                                            Asignar
                                        </button>
                                    )}
                                </div>
                        </div>
                    ))}
                </div>

                {asignacion.actividadId !== null && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
                        <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center pb-4 border-b border-neutral-100 mb-5">
                                <h2 className="text-xl font-bold text-neutral-900">Asignar aprendices</h2>
                                <button
                                    type="button"
                                    onClick={cerrarAsignar}
                                    className="text-neutral-400 hover:text-neutral-600 p-1 rounded-full hover:bg-neutral-100 transition-colors"
                                > X
                                </button>
                            </div>

                            {asignacion.errorAsignar && (
                                <p className="text-red-600 mb-3 text-sm">{asignacion.errorAsignar}</p>
                            )}

                            {asignacion.aprendices.length === 0 ? (
                                <p className="text-sm text-neutral-500 py-6 text-center">
                                    No tienes aprendices a cargo. Revisa tus fichas antes de asignar.
                                </p>
                            ) : (
                                <>
                                    <label className="block text-sm font-medium text-neutral-800 mb-2">
                                        Aprendices <span className="text-red-500">*</span>
                                    </label>
                                    <div className="space-y-1 max-h-56 overflow-y-auto mb-2 pr-1">
                                        {asignacion.aprendices.map((a) => (
                                            <label
                                                key={a.id}
                                                className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-50 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={seleccionados.includes(a.id)}
                                                    onChange={() => alternar(a.id)}
                                                    className="rounded border-neutral-300 accent-[#2d7a3e]"
                                                />
                                                <div className="w-7 h-7 shrink-0 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">
                                                    {a.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm text-neutral-800 flex-1 truncate">
                                                    {a.nombre} {a.apellido}
                                                </span>
                                            </label>
                                        ))}
                                    </div>

                                    <div className="flex gap-3 mb-4">
                                        <button
                                            type="button"
                                            onClick={() => setSeleccionados(asignacion.aprendices.map((a) => a.id))}
                                            className="text-xs text-[#2d7a3e] hover:underline cursor-pointer"
                                        >
                                            Seleccionar todos
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSeleccionados([])}
                                            className="text-xs text-neutral-500 hover:underline cursor-pointer"
                                        >
                                            Quitar todos
                                        </button>
                                        {seleccionados.length > 0 && (
                                            <span className="text-xs text-neutral-500 ml-auto">
                                                {seleccionados.length} seleccionado{seleccionados.length === 1 ? '' : 's'}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mb-5">
                                        <label className="block text-sm font-medium text-neutral-800 mb-1">
                                            Fecha límite de entrega
                                        </label>
                                        <input
                                            type="date"
                                            value={fechaLimite}
                                            onChange={(e) => setFechaLimite(e.target.value)}
                                            className="w-full rounded-2xl border border-neutral-200 py-3 px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2d7a3e]"
                                        />
                                        <p className="text-xs text-neutral-500 mt-1">
                                            Opcional. Sin fecha, la tarea no se marca como vencida.
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-5 border-t border-neutral-100">
                                        <button
                                            type="button"
                                            onClick={cerrarAsignar}
                                            disabled={asignacion.asignando}
                                            className="px-5 py-2.5 rounded-2xl text-sm font-medium text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            disabled={seleccionados.length === 0 || asignacion.asignando}
                                            onClick={() =>
                                                asignacion.asignar(
                                                    asignacion.actividadId!,
                                                    seleccionados,
                                                    fechaLimite,
                                                    cerrarAsignar,
                                                )}
                                            className="bg-[#2d7a3e] hover:bg-[#418750] text-white px-6 py-2.5 rounded-2xl text-sm font-medium shadow-sm disabled:opacity-50 transition-colors"
                                        >
                                            {asignacion.asignando ? 'Asignando...' : 'Asignar'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
            </DashboardLayout>
        );
};
export default Actividades;
