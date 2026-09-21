import { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useInsumos } from '../hooks/useInsumos';
import { useInsumoForm } from '../hooks/useInsumoForm';
import type { EstadoInsumo } from '../types/inventario';

const FILTROS: { label: string; value: 'Todos' | EstadoInsumo }[] = [
    { label: 'Todos', value: 'Todos' },
    { label: 'Activo', value: 'activo' },
    { label: 'Agotado', value: 'agotado' },
    { label: 'Inactivo', value: 'inactivo' },
    { label: 'De baja', value: 'de_baja' },
];

const labelCls = 'block text-sm font-semibold text-neutral-800 mb-1.5';
const inputCls =
    'w-full rounded-lg border border-neutral-300 py-2.5 px-3 text-sm text-neutral-800 ' +
    'placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700';

const Insumos = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const {
        insumos, loading, error,
        filtroEstado, setFiltroEstado,
        soloBajoStock, setSoloBajoStock,
        nombreAlmacen, nombreCategoria, nombreProveedor,
    } = useInsumos();

    const {
        form, almacenes, categorias, proveedores,
        enviando, errorForm, handleFormChange, handleCreateSubmit,
    } = useInsumoForm({ isModalOpen, onSuccess: () => setIsModalOpen(false) });

    return (
        <DashboardLayout>
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-neutral-900">Insumos</h1>
                <p className="text-neutral-500">Inventario de consumibles y herramientas</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="rounded-xl bg-green-800 px-6 py-3.5 text-white">
                + Nuevo Insumo
            </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-6">
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
            <label className="ml-4 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={soloBajoStock} onChange={(e) => setSoloBajoStock(e.target.checked)} />
                Solo bajo stock mínimo
            </label>
            </div>

            {loading && <p className="text-neutral-500">Cargando insumos...</p>}
            {error && <p className="text-red-600">{error}</p>}
            {!loading && insumos.length === 0 && <p className="text-neutral-500">No hay insumos para mostrar.</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insumos.map((i) => (
                <div key={i.id} className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold">{i.nombre}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-neutral-100">{i.tipoInsumo}</span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                    {nombreCategoria(i.categoriaId)} · {nombreAlmacen(i.almacenId)} · {nombreProveedor(i.proveedorId)}
                </p>

                <div className="grid grid-cols-3 gap-2 mt-4 text-center text-sm">
                    <div>
                    <p className="text-neutral-400 text-xs">Disponible</p>
                    <p className={`font-bold ${i.stockDisponible <= i.stockMinimo ? 'text-red-600' : ''}`}>
                        {i.stockDisponible}
                    </p>
                    </div>
                    <div>
                    <p className="text-neutral-400 text-xs">Reservado</p>
                    <p className="font-bold">{i.stockReservado}</p>
                    </div>
                    <div>
                    <p className="text-neutral-400 text-xs">Mínimo</p>
                    <p className="font-bold">{i.stockMinimo}</p>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t text-xs">
                    <span>Estado: {i.estado.replace('_', ' ')}</span>
                    <span className="text-neutral-500">Valor: ${i.valorInventario.toLocaleString()}</span>
                </div>
                </div>
            ))}
            </div>

            {isModalOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-50">
                <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-6">
                    <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    aria-label="Volver"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-xl text-neutral-500 hover:bg-neutral-200"
                    >
                    ‹
                    </button>
                    <h2 className="text-2xl font-bold text-green-900">Nuevo Insumo</h2>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8">
                    {errorForm && (
                    <p className="text-red-600 text-sm mb-4">{String(errorForm)}</p>
                    )}

                    <form onSubmit={handleCreateSubmit} className="space-y-5">
                    <div>
                        <label className={labelCls}>
                        Nombre del insumo <span className="text-red-500">*</span>
                        </label>
                        <input required name="nombre" value={form.nombre} onChange={handleFormChange} className={inputCls} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                        <label className={labelCls}>Categoría</label>
                        <select required name="categoriaId" value={form.categoriaId} onChange={handleFormChange} className={inputCls}>
                            <option value="">Seleccione...</option>
                            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                        </div>
                        <div>
                        <label className={labelCls}>Tipo</label>
                        <select name="tipoInsumo" value={form.tipoInsumo} onChange={handleFormChange} className={inputCls}>
                            <option value="consumible">Insumo</option>
                            <option value="herramienta">Herramienta</option>
                            <option value="materia_prima">Materia prima</option>
                        </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                        <label className={labelCls}>Unidad compra</label>
                        <input required name="presentacionTipo" placeholder="Bulto 50kg" value={form.presentacionTipo} onChange={handleFormChange} className={inputCls} />
                        </div>
                        <div>
                        <label className={labelCls}>Unidad uso</label>
                        <input required name="unidadUso" placeholder="kg" value={form.unidadUso} onChange={handleFormChange} className={inputCls} />
                        </div>
                        <div>
                        <label className={labelCls}>Factor conversión</label>
                        <input required type="number" step="any" name="factorConversionUso" value={form.factorConversionUso} onChange={handleFormChange} className={inputCls} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                        <label className={labelCls}>Stock mínimo</label>
                        <input required type="number" step="any" name="stockMinimo" value={form.stockMinimo} onChange={handleFormChange} className={inputCls} />
                        </div>
                        <div>
                        <label className={labelCls}>Precio unitario (COP)</label>
                        <input required type="number" step="any" name="precioUnitarioPresentacion" value={form.precioUnitarioPresentacion} onChange={handleFormChange} className={inputCls} />
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}>Almacén</label>
                        <select required name="almacenId" value={form.almacenId} onChange={handleFormChange} className={inputCls}>
                        <option value="">Seleccione...</option>
                        {almacenes.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className={labelCls}>Proveedor</label>
                        <select name="proveedorId" value={form.proveedorId} onChange={handleFormChange} className={inputCls}>
                        <option value="">Sin proveedor</option>
                        {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                        type="submit"
                        disabled={enviando}
                        className="flex-1 rounded-lg bg-green-800 py-2.5 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-50"
                        >
                        {enviando ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="rounded-lg border border-neutral-300 px-8 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                        >
                        Cancelar
                        </button>
                    </div>
                    </form>
                </div>
                </div>
            </div>
            )}
        </div>
        </DashboardLayout>
    );
};

export default Insumos;