import { useState } from "react";
import { useCultivos } from "../../hooks/cultivos/useCultivos";
import { useCultivoForm } from "../../hooks/cultivos/useCultivosForm";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { lotesApi } from "../../api/territorio";
import { LuSprout, LuCalendar } from "react-icons/lu";

const Cultivos = () => {
    const [loteFiltro, setLoteFiltro] = useState<string>('');
    const loteIdNum = loteFiltro ? Number(loteFiltro) : undefined;
    const [isModalOpen, setIsModalOpen] = useState(false); 

    const { data: lotesFiltro = [] } = useQuery({
        queryKey: ['lotes'],
        queryFn: async () => (await lotesApi.listar()).data,
    });

    const {
    cultivos,
    loading,
    error,
    handleFinalizar,
    finalizando,
    handleEliminar,
    eliminando,
    } = useCultivos(loteIdNum);

    const { 
        form, 
        lotes,
        sublotes, 
        handleFormChange,
        handleCreateSubmit, 
        creando,
        errorForm
    } = useCultivoForm({
        isModalOpen,
        onSucces: (loteCreado) => {
            setIsModalOpen(false);
            setLoteFiltro(String(loteCreado));
        },
    });

    return (
        <DashboardLayout>
            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900">Cultivos</h1>
                        <p className="text-neutral-500">Gestión de cultivos y registros de cosecha</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="rounded-xl bg-green-800 px-6 py-3.5 text-white hover:bg-green-700 transition"
                    >
                        + Nuevo Cultivo
                    </button>
                </div>


                <div className="mb-6 max-w-sm">    
                    <label className="block text-sm text-neutral-500 mb-1">Lote</label>    
                    <select        
                        value={loteFiltro}        
                        onChange={(e) => setLoteFiltro(e.target.value)}        
                        className="w-full rounded-xl border border-neutral-200 py-3 px-4 bg-white"    
                    >        
                        <option value="">Selecciona un lote...</option>        
                        {lotesFiltro.map((l: any) => (            
                            <option key={l.id} value={l.id}>{l.nombre}</option>        
                        ))}    
                    </select>
                </div>

                {!loteIdNum && (    
                    <p className="text-neutral-400 italic mb-6">Elige un lote para ver sus cultivos.</p>
                )}



                {loading && <p className="text-neutral-500">Cargando cultivos...</p>}
                {error && <p className="text-red-600">{error}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cultivos.map((c) => (
                        <div key={c.id} className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
                            <div className="flex items-center gap-2">
                                <LuSprout className="text-green-700 text-xl" />
                                <h3 className="text-lg font-bold text-neutral-800">{c.nombreCultivo}</h3>
                            </div>
                            <p className="text-sm text-neutral-500 mt-1">{c.tipoCultivo}</p>
                            <p className="flex items-center gap-2 text-sm text-neutral-400 mt-2">
                                <LuCalendar /> Sembrado: {c.fechaSiembra}
                            </p>
                            <span
                                className={`inline-block mt-3 text-xs px-3 py-1 rounded-full font-medium ${
                                    c.estado === 'activo'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-neutral-100 text-neutral-600'
                                }`}
                            >
                                {c.estado}
                            </span>
                            <div className="flex gap-3 mt-4 pt-4 border-t border-neutral-100">
                                {c.estado === 'activo' && (
                                    <button
                                        disabled={finalizando}
                                        onClick={() =>
                                            handleFinalizar(c.id, new Date().toISOString().slice(0, 10))
                                        }
                                        className="text-sm text-amber-700 underline disabled:opacity-50 hover:text-amber-800"
                                    >
                                        Finalizar
                                    </button>
                                )}
                                <button
                                    disabled={eliminando}
                                    onClick={() => handleEliminar(c.id)}
                                    className="text-sm text-red-600 underline disabled:opacity-50 hover:text-red-700"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl">
                            <h2 className="text-xl font-bold mb-4 text-neutral-900">Nuevo Cultivo</h2>
                            {errorForm && <p className="text-red-600 mb-3 text-sm">{errorForm}</p>}
                            <form onSubmit={handleCreateSubmit} className="grid grid-cols-2 gap-4">

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-neutral-700 mb-1"> Lote</label>
                                    <select 
                                    required
                                    name="loteId"
                                    value={form.loteId}
                                    onChange={handleFormChange}
                                    className="w-full rounded-xl border border-neutral-200 py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
                                    >
                                        <option value=""> Seleccione un lote</option>
                                        {lotes.map((l: any) => (
                                            <option key={l.id} value={l.id}> {l.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Nombre del cultivo
                                    </label>
                                    <input
                                        required
                                        name="nombreCultivo"
                                        value={form.nombreCultivo}
                                        onChange={handleFormChange}
                                        className="w-full rounded-xl border border-neutral-200 py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-600"
                                        placeholder="Ej: Maíz amarillo"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Tipo de cultivo
                                    </label>
                                    <input
                                        required
                                        name="tipoCultivo"
                                        value={form.tipoCultivo}
                                        onChange={handleFormChange}
                                        className="w-full rounded-xl border border-neutral-200 py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-600"
                                        placeholder="Ej: Transitorio"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Sublote (opcional)
                                    </label>
                                    <select
                                        name="subLoteId"
                                        value={form.subLoteId}
                                        onChange={handleFormChange}
                                        className="w-full rounded-xl border border-neutral-200 py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
                                    >
                                        <option value="">Ninguno</option>
                                        {sublotes.map((s: any) => (
                                            <option key={s.id} value={s.id}>
                                                {s.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Fecha de siembra
                                    </label>
                                    <input
                                        required
                                        type="date"
                                        name="fechaSiembra"
                                        value={form.fechaSiembra}
                                        onChange={handleFormChange}
                                        className="w-full rounded-xl border border-neutral-200 py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-600"
                                    />
                                </div>
                                <div className="col-span-2 flex justify-end gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-3 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creando}
                                        className="bg-green-800 text-white px-6 py-3 rounded-xl disabled:opacity-50 hover:bg-green-700 transition"
                                    >
                                        {creando ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )

};

export default Cultivos;