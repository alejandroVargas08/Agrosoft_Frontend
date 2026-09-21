import { useState } from 'react';
import {
    Plus, Search, MapPin, Layers, Crosshair, Trash2, X, CheckCircle2, Clock,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useLotes } from '../hooks/useLotes';
import { useLoteForm } from '../hooks/useLoteForm';
import type { EstadoLote } from '../types/territorio';

const FILTROS: { label: string; value: 'Todos' | EstadoLote }[] = [
    { label: 'Todos los estados', value: 'Todos' },
    { label: 'En preparación', value: 'en_preparacion' },
    { label: 'Activo', value: 'activo' },
    { label: 'Inactivo', value: 'inactivo' },
];

// Texto y colores del badge según el estado
const ESTADO_UI: Record<EstadoLote, { label: string; clase: string }> = {
    activo: {
        label: 'Activo',
        clase: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    en_preparacion: {
        label: 'En preparación',
        clase: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    inactivo: {
        label: 'Inactivo',
        clase: 'bg-gray-100 text-gray-600 border-gray-200',
    },
};

const inputClase =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-700/20';
const labelClase = 'mb-1.5 block text-sm font-medium text-gray-700';

const Lotes = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [busqueda, setBusqueda] = useState('');

    const {
        lotes, todosLosLotes, loading, error,
        filtroEstado, setFiltroEstado,
        handleChangeEstado, handleEliminar,
    } = useLotes();

    const { form, enviando, errorForm, handleFormChange, handleCreateSubmit } =
        useLoteForm({ onSuccess: () => setIsModalOpen(false) });

    // Búsqueda por nombre (sobre la lista ya filtrada por estado)
    const lotesVisibles = lotes.filter((l) =>
        l.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()),
    );

    // Datos para las tarjetas de resumen
    const totalActivos = todosLosLotes.filter((l) => l.estado === 'activo').length;
    const totalPreparacion = todosLosLotes.filter((l) => l.estado === 'en_preparacion').length;
    const areaTotalHa = todosLosLotes.reduce((suma, l) => suma + l.areaHa, 0);

    const resumen = [
        { titulo: 'Total Lotes', valor: todosLosLotes.length, icono: Layers, color: 'text-green-700', fondo: 'bg-green-700/10' },
        { titulo: 'Activos', valor: totalActivos, icono: CheckCircle2, color: 'text-emerald-600', fondo: 'bg-emerald-600/10' },
        { titulo: 'Área Total', valor: areaTotalHa.toFixed(2), unidad: 'ha', icono: MapPin, color: 'text-blue-500', fondo: 'bg-blue-500/10' },
        { titulo: 'En preparación', valor: totalPreparacion, icono: Clock, color: 'text-amber-500', fondo: 'bg-amber-500/10' },
    ];

    return (
        <DashboardLayout>
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Encabezado */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Lotes</h1>
                        <p className="mt-1 text-gray-500">Gestiona el territorio de la unidad productiva</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center rounded-lg bg-green-800 px-5 py-3 font-medium text-white transition hover:bg-green-900"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Nuevo Lote
                    </button>
                </div>

                {/* Búsqueda y filtro */}
                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative max-w-md flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar lotes..."
                            className={`${inputClase} pl-10`}
                        />
                    </div>
                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value as 'Todos' | EstadoLote)}
                        className={`${inputClase} sm:w-52`}
                    >
                        {FILTROS.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                    </select>
                </div>

                {/* Tarjetas de resumen */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {resumen.map(({ titulo, valor, unidad, icono: Icono, color, fondo }) => (
                        <div key={titulo} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">{titulo}</p>
                                    <p className="mt-1 text-3xl font-bold text-gray-900">{valor}</p>
                                    {unidad && <p className="text-xs text-gray-500">{unidad}</p>}
                                </div>
                                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${fondo}`}>
                                    <Icono className={`h-6 w-6 ${color}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {loading && <p className="text-gray-500">Cargando lotes...</p>}
                {error && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
                )}

                {/* Listado de lotes */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {lotesVisibles.map((lote) => {
                        const estado = ESTADO_UI[lote.estado];
                        return (
                            <div
                                key={lote.id}
                                className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="truncate text-lg font-semibold text-gray-900">{lote.nombre}</h3>
                                        <p className="truncate text-sm italic text-gray-500">
                                            {lote.descripcion || 'Sin descripción'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleEliminar(lote.id)}
                                        title="Eliminar lote"
                                        className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <MapPin className="h-4 w-4 flex-shrink-0" />
                                        <span>Área</span>
                                        <span className="ml-auto font-medium text-gray-700">
                                            {lote.areaHa.toFixed(2)} ha
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Layers className="h-4 w-4 flex-shrink-0" />
                                        <span>Vértices</span>
                                        <span className="ml-auto font-medium text-gray-700">{lote.cantidadVertices}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Crosshair className="h-4 w-4 flex-shrink-0" />
                                        <span className="truncate">
                                            {lote.centroide.lat}, {lote.centroide.lng}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-sm">
                                    <span className="text-gray-500">Estado</span>
                                    <button
                                        onClick={() => handleChangeEstado(lote.id, lote.estado)}
                                        title="Clic para cambiar el estado"
                                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition hover:opacity-80 ${estado.clase}`}
                                    >
                                        {estado.label}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Estado vacío */}
                {!loading && !error && lotesVisibles.length === 0 && (
                    <div className="py-12 text-center">
                        <Layers className="mx-auto mb-4 h-16 w-16 text-gray-400 opacity-50" />
                        <h3 className="mb-2 text-lg font-semibold text-gray-900">No se encontraron lotes</h3>
                        <p className="mb-6 text-gray-500">Intenta cambiar los filtros o crea un nuevo lote</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center rounded-lg bg-green-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-900"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Crear primer lote
                        </button>
                    </div>
                )}
            </div>

            {/* Modal: Nuevo Lote */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Nuevo Lote</h2>
                                <p className="text-sm text-gray-500">Registra la ubicación y el área del lote</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
                            {errorForm && (
                                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">
                                    {errorForm}
                                </p>
                            )}

                            <div className="sm:col-span-2">
                                <label className={labelClase}>Nombre</label>
                                <input required name="nombre" value={form.nombre} onChange={handleFormChange}
                                    placeholder="Ej: Lote Norte" className={inputClase} />
                            </div>

                            <div className="sm:col-span-2">
                                <label className={labelClase}>Descripción</label>
                                <input name="descripcion" value={form.descripcion} onChange={handleFormChange}
                                    placeholder="Opcional" className={inputClase} />
                            </div>

                            <div className="sm:col-span-2">
                                <label className={labelClase}>Área (m²)</label>
                                <input required type="number" step="any" name="areaM2" value={form.areaM2}
                                    onChange={handleFormChange} className={inputClase} />
                            </div>

                            <div>
                                <label className={labelClase}>Centroide latitud</label>
                                <input required type="number" step="any" name="centroideLat" value={form.centroideLat}
                                    onChange={handleFormChange} className={inputClase} />
                            </div>
                            <div>
                                <label className={labelClase}>Centroide longitud</label>
                                <input required type="number" step="any" name="centroideLng" value={form.centroideLng}
                                    onChange={handleFormChange} className={inputClase} />
                            </div>

                            <div className="sm:col-span-2">
                                <label className={labelClase}>Vértices</label>
                                <textarea required name="verticesTexto" rows={5} value={form.verticesTexto}
                                    onChange={handleFormChange}
                                    placeholder={'1.8500,-76.0500\n1.8510,-76.0500\n1.8510,-76.0490'}
                                    className={`${inputClase} font-mono`} />
                                <p className="mt-1.5 text-xs text-gray-500">
                                    Uno por línea, en formato lat,lng. Mínimo 3 vértices.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 sm:col-span-2">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={enviando}
                                    className="rounded-lg bg-green-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-900 disabled:opacity-50">
                                    {enviando ? 'Guardando...' : 'Guardar lote'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Lotes;