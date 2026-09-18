import { useState } from 'react';
import DashboardLayout from '../componets/layout/DashboardLayout';
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

    const inputCls = 'w-full rounded-xl border border-neutral-200 py-2 px-3';

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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">
                <div className="bg-white rounded-2xl w-full max-w-3xl p-6 my-8">
                <h2 className="text-xl font-bold mb-4">Nuevo Insumo</h2>
                {errorForm && <p className="text-red-600 mb-3">{String(errorForm)}</p>}

                <form onSubmit={handleCreateSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="col-span-2 md:col-span-3">
                    <label>Nombre</label>
                    <input required name="nombre" value={form.nombre} onChange={handleFormChange} className={inputCls} />
                    </div>
                    <div className="col-span-2 md:col-span-3">
                    <label>Descripción</label>
                    <input name="descripcion" value={form.descripcion} onChange={handleFormChange} className={inputCls} />
                    </div>

                    <div>
                    <label>Tipo</label>
                    <select name="tipoInsumo" value={form.tipoInsumo} onChange={handleFormChange} className={inputCls}>
                        <option value="consumible">Consumible</option>
                        <option value="herramienta">Herramienta</option>
                    </select>
                    </div>
                    <div>
                    <label>Categoría</label>
                    <select required name="categoriaId" value={form.categoriaId} onChange={handleFormChange} className={inputCls}>
                        <option value="">Seleccione...</option>
                        {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                    </div>
                    <div>
                    <label>Almacén</label>
                    <select required name="almacenId" value={form.almacenId} onChange={handleFormChange} className={inputCls}>
                        <option value="">Seleccione...</option>
                        {almacenes.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </select>
                    </div>
                    <div>
                    <label>Proveedor</label>
                    <select required name="proveedorId" value={form.proveedorId} onChange={handleFormChange} className={inputCls}>
                        <option value="">Seleccione...</option>
                        {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                    </div>

                    <div>
                    <label>Presentación (tipo)</label>
                    <input required name="presentacionTipo" placeholder="Bulto, Galón..." value={form.presentacionTipo} onChange={handleFormChange} className={inputCls} />
                    </div>
                    <div>
                    <label>Cantidad por presentación</label>
                    <input required type="number" step="any" name="presentacionCantidad" value={form.presentacionCantidad} onChange={handleFormChange} className={inputCls} />
                    </div>
                    <div>
                    <label>Unidad presentación</label>
                    <input required name="presentacionUnidad" placeholder="kg, L..." value={form.presentacionUnidad} onChange={handleFormChange} className={inputCls} />
                    </div>
                    <div>
                    <label>Unidad de uso</label>
                    <input required name="unidadUso" placeholder="g, mL..." value={form.unidadUso} onChange={handleFormChange} className={inputCls} />
                    </div>
                    <div>
                    <label>Factor conversión a uso</label>
                    <input required type="number" step="any" name="factorConversionUso" value={form.factorConversionUso} onChange={handleFormChange} className={inputCls} />
                    </div>

                    <div>
                    <label>Stock (presentación)</label>
                    <input required type="number" step="any" name="stockPresentacion" value={form.stockPresentacion} onChange={handleFormChange} className={inputCls} />
                    </div>
                    <div>
                    <label>Stock (uso)</label>
                    <input required type="number" step="any" name="stockUso" value={form.stockUso} onChange={handleFormChange} className={inputCls} />
                    </div>
                    <div>
                    <label>Stock mínimo</label>
                    <input required type="number" step="any" name="stockMinimo" value={form.stockMinimo} onChange={handleFormChange} className={inputCls} />
                    </div>
                    <div>
                    <label>Precio por presentación</label>
                    <input required type="number" step="any" name="precioUnitarioPresentacion" value={form.precioUnitarioPresentacion} onChange={handleFormChange} className={inputCls} />
                    </div>
                    <div>
                    <label>Precio por unidad de uso</label>
                    <input required type="number" step="any" name="precioUnitarioUso" value={form.precioUnitarioUso} onChange={handleFormChange} className={inputCls} />
                    </div>

                    <div className="col-span-2 md:col-span-3 flex justify-end gap-3 mt-4">
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

export default Insumos;