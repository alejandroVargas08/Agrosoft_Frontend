import { useState } from 'react';
import DashboardLayout from '../componets/layout/DashboardLayout';
import { useSublotes } from '../hooks/useSublotes';
import { useSubloteForm } from '../hooks/useSubloteForm';

const inputCls = 'w-full rounded-xl border border-neutral-200 py-3 px-4';

const Sublotes = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const {
        lotes, loteId, setLoteId, loteIdNum,
        sublotes, loading, error,
        handleChangeEstado, handleEliminar,
    } = useSublotes();

    const { form, enviando, errorForm, handleFormChange, handleCreateSubmit } =
        useSubloteForm({ loteId: loteIdNum, onSuccess: () => setIsModalOpen(false) });

    return (
        <DashboardLayout>
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-neutral-900">Sublotes</h1>
                <p className="text-neutral-500">Subdivisiones de cada lote</p>
            </div>
            <button
                onClick={() => setIsModalOpen(true)}
                disabled={!loteIdNum}
                className="rounded-xl bg-green-800 px-6 py-3.5 text-white disabled:opacity-50"
            >
                + Nuevo Sublote
            </button>
            </div>

            <div className="mb-6 max-w-sm">
            <label className="block text-sm text-neutral-600 mb-1">Lote</label>
            <select value={loteId} onChange={(e) => setLoteId(e.target.value)} className={inputCls}>
                <option value="">Seleccione un lote...</option>
                {lotes.map((l) => (
                <option key={l.id} value={l.id}>{l.nombre}</option>
                ))}
            </select>
            </div>

            {!loteIdNum && <p className="text-neutral-500">Selecciona un lote para ver sus sublotes.</p>}
            {loading && <p className="text-neutral-500">Cargando sublotes...</p>}
            {error && <p className="text-red-600">{error}</p>}
            {loteIdNum && !loading && sublotes.length === 0 && (
            <p className="text-neutral-500">Este lote aún no tiene sublotes.</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sublotes.map((s) => (
                <div key={s.id} className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
                <h3 className="text-lg font-bold">{s.nombre}</h3>
                {s.descripcion && <p className="text-sm text-neutral-500">{s.descripcion}</p>}
                <p className="text-sm text-neutral-600 mt-2">{s.areaHa.toFixed(2)} ha</p>
                <p className="text-xs text-neutral-400">
                    Centroide: {s.centroide.lat}, {s.centroide.lng}
                </p>
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <button onClick={() => handleChangeEstado(s.id, s.estado)} className="text-xs underline text-green-700">
                    Estado: {s.estado.replace('_', ' ')}
                    </button>
                    <button onClick={() => handleEliminar(s.id)} className="text-xs text-red-600">
                    Eliminar
                    </button>
                </div>
                </div>
            ))}
            </div>

            {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-2xl w-full max-w-2xl p-6">
                <h2 className="text-xl font-bold mb-4">Nuevo Sublote</h2>
                {errorForm && <p className="text-red-600 mb-3">{errorForm}</p>}

                <form onSubmit={handleCreateSubmit} className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                    <label>Nombre</label>
                    <input required name="nombre" value={form.nombre} onChange={handleFormChange} className={inputCls} />
                    </div>
                    <div className="col-span-2">
                    <label>Descripción</label>
                    <input name="descripcion" value={form.descripcion} onChange={handleFormChange} className={inputCls} />
                    </div>
                    <div>
                    <label>Área (m²)</label>
                    <input required type="number" step="any" name="areaM2" value={form.areaM2} onChange={handleFormChange} className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label>Centroide lat</label>
                        <input required type="number" step="any" name="centroideLat" value={form.centroideLat} onChange={handleFormChange} className={inputCls} />
                    </div>
                    <div>
                        <label>Centroide lng</label>
                        <input required type="number" step="any" name="centroideLng" value={form.centroideLng} onChange={handleFormChange} className={inputCls} />
                    </div>
                    </div>
                    <div className="col-span-2">
                    <label>Vértices (uno por línea, formato lat,lng — mínimo 3)</label>
                    <textarea required name="verticesTexto" rows={5} value={form.verticesTexto} onChange={handleFormChange}
                        placeholder={'1.8500,-76.0500\n1.8505,-76.0500\n1.8505,-76.0495'}
                        className={`${inputCls} font-mono text-sm`} />
                    </div>
                    <div className="col-span-2 flex justify-end gap-3 mt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                    <button type="submit" disabled={enviando} className="bg-green-800 text-white px-6 py-3 rounded-xl disabled:opacity-50">
                        {enviando ? 'Guardando...' : 'Guardar'}
                    </button>
                    </div>
                </form>
                </div>
            </div>
            )}
        </div>
        </DashboardLayout>
    );
    };

export default Sublotes;