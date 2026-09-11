import { useState } from 'react';
import DashboardLayout from '../componets/layout/DashboardLayout';
import { useLotes } from '../hooks/useLotes';
import { useLoteForm } from '../hooks/useLoteForm';
import type { EstadoLote } from '../types/territorio';

const FILTROS: { label: string; value: 'Todos' | EstadoLote }[] = [
    { label: 'Todos', value: 'Todos' },
    { label: 'En preparación', value: 'en_preparacion' },
    { label: 'Activo', value: 'activo' },
    { label: 'Inactivo', value: 'inactivo' },
    ];

    const Lotes = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const {
        lotes, loading, error,
        filtroEstado, setFiltroEstado,
        handleChangeEstado, handleEliminar,
    } = useLotes();

    const { form, enviando, errorForm, handleFormChange, handleCreateSubmit } =
        useLoteForm({ onSuccess: () => setIsModalOpen(false) });

    return (
        <DashboardLayout>
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-neutral-900">Lotes</h1>
                <p className="text-neutral-500">Territorio de la unidad productiva</p>
            </div>
            <button
                onClick={() => setIsModalOpen(true)}
                className="rounded-xl bg-green-800 px-6 py-3.5 text-white"
            >
                + Nuevo Lote
            </button>
            </div>

            <div className="flex gap-2 mb-6">
            {FILTROS.map((f) => (
                <button
                key={f.value}
                onClick={() => setFiltroEstado(f.value)}
                className={`px-4 py-2 rounded-full ${
                    filtroEstado === f.value ? 'bg-green-800 text-white' : 'border border-neutral-300'
                }`}
                >
                {f.label}
                </button>
            ))}
            </div>

            {loading && <p className="text-neutral-500">Cargando lotes...</p>}
            {error && <p className="text-red-600">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lotes.map((lote) => (
                <div key={lote.id} className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
                <h3 className="text-lg font-bold">{lote.nombre}</h3>
                {lote.descripcion && <p className="text-sm text-neutral-500">{lote.descripcion}</p>}
                <p className="text-sm text-neutral-600 mt-2">
                    {lote.areaHa.toFixed(2)} ha · {lote.cantidadVertices} vértices
                </p>
                <p className="text-xs text-neutral-400">
                    Centroide: {lote.centroide.lat}, {lote.centroide.lng}
                </p>

                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <button
                    onClick={() => handleChangeEstado(lote.id, lote.estado)}
                    className="text-xs underline text-green-700"
                    >
                    Estado: {lote.estado.replace('_', ' ')}
                    </button>
                    <button onClick={() => handleEliminar(lote.id)} className="text-xs text-red-600">
                    Eliminar
                    </button>
                </div>
                </div>
            ))}
            </div>

            {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-2xl w-full max-w-2xl p-6">
                <h2 className="text-xl font-bold mb-4">Nuevo Lote</h2>
                {errorForm && <p className="text-red-600 mb-3">{errorForm}</p>}

                <form onSubmit={handleCreateSubmit} className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                    <label>Nombre</label>
                    <input required name="nombre" value={form.nombre} onChange={handleFormChange}
                        className="w-full rounded-xl border border-neutral-200 py-3 px-4" />
                    </div>

                    <div className="col-span-2">
                    <label>Descripción</label>
                    <input name="descripcion" value={form.descripcion} onChange={handleFormChange}
                        className="w-full rounded-xl border border-neutral-200 py-3 px-4" />
                    </div>

                    <div>
                    <label>Área (m²)</label>
                    <input required type="number" step="any" name="areaM2" value={form.areaM2} onChange={handleFormChange}
                        className="w-full rounded-xl border border-neutral-200 py-3 px-4" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label>Centroide lat</label>
                        <input required type="number" step="any" name="centroideLat" value={form.centroideLat} onChange={handleFormChange}
                        className="w-full rounded-xl border border-neutral-200 py-3 px-4" />
                    </div>
                    <div>
                        <label>Centroide lng</label>
                        <input required type="number" step="any" name="centroideLng" value={form.centroideLng} onChange={handleFormChange}
                        className="w-full rounded-xl border border-neutral-200 py-3 px-4" />
                    </div>
                    </div>

                    <div className="col-span-2">
                    <label>Vértices (uno por línea, formato lat,lng — mínimo 3)</label>
                    <textarea required name="verticesTexto" rows={5} value={form.verticesTexto} onChange={handleFormChange}
                        placeholder={'1.8500,-76.0500\n1.8510,-76.0500\n1.8510,-76.0490'}
                        className="w-full rounded-xl border border-neutral-200 py-3 px-4 font-mono text-sm" />
                    </div>

                    <div className="col-span-2 flex justify-end gap-3 mt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                    <button type="submit" disabled={enviando}
                        className="bg-green-800 text-white px-6 py-3 rounded-xl disabled:opacity-50">
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

export default Lotes;