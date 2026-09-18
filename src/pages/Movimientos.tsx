import DashboardLayout from '../componets/layout/DashboardLayout';
import { useMovimientos } from '../hooks/useMovimientos';

const labelCls = 'block text-sm font-semibold text-neutral-800 mb-1.5';
const inputCls =
    'w-full rounded-lg border border-neutral-300 py-2.5 px-3 text-sm text-neutral-800 ' +
    'placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700';

const Movimientos = () => {
    const {
        form, insumos, almacenes, registrados,
        insumoSeleccionado, cantidadUsoCalculada,
        enviando, errorForm, handleFormChange, handleSubmit, nombreInsumo,
    } = useMovimientos();

    const esTraslado = form.tipo === 'traslado';

    return (
        <DashboardLayout>
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900">Movimientos de insumos</h1>
            <p className="text-neutral-500">Entradas, salidas, traslados y ajustes de stock</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
                <h2 className="text-lg font-bold mb-5">Registrar movimiento</h2>
                {errorForm && <p className="text-red-600 text-sm mb-4">{String(errorForm)}</p>}

                <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className={labelCls}>
                    Insumo <span className="text-red-500">*</span>
                    </label>
                    <select required name="insumoId" value={form.insumoId} onChange={handleFormChange} className={inputCls}>
                    <option value="">Seleccione...</option>
                    {insumos.map((i) => (
                        <option key={i.id} value={i.id}>
                        {i.nombre} (disp. {i.stockDisponible} {i.unidadUso})
                        </option>
                    ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                    <label className={labelCls}>Tipo</label>
                    <select name="tipo" value={form.tipo} onChange={handleFormChange} className={inputCls}>
                        <option value="entrada">Entrada</option>
                        <option value="salida">Salida</option>
                        <option value="traslado">Traslado</option>
                        <option value="ajuste">Ajuste</option>
                    </select>
                    </div>
                    <div>
                    <label className={labelCls}>
                        Cantidad {insumoSeleccionado ? `(${insumoSeleccionado.presentacionTipo})` : ''}
                    </label>
                    <input
                        required
                        type="number"
                        step="any"
                        min="0"
                        name="cantidadPresentacion"
                        value={form.cantidadPresentacion}
                        onChange={handleFormChange}
                        className={inputCls}
                    />
                    </div>
                </div>

                {insumoSeleccionado && form.cantidadPresentacion !== '' && (
                    <div className="rounded-lg bg-green-50 border border-green-100 px-3 py-2 text-sm text-green-900">
                    Equivale a <strong>{cantidadUsoCalculada}</strong> {insumoSeleccionado.unidadUso}
                    <span className="text-green-700">
                        {' '}· factor {insumoSeleccionado.factorConversionUso}
                    </span>
                    </div>
                )}

                {esTraslado && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label className={labelCls}>Almacén origen</label>
                        <select required name="almacenOrigenId" value={form.almacenOrigenId} onChange={handleFormChange} className={inputCls}>
                        <option value="">Seleccione...</option>
                        {almacenes.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Almacén destino</label>
                        <select required name="almacenDestinoId" value={form.almacenDestinoId} onChange={handleFormChange} className={inputCls}>
                        <option value="">Seleccione...</option>
                        {almacenes.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                        </select>
                    </div>
                    </div>
                )}

                <div>
                    <label className={labelCls}>Descripción</label>
                    <input
                    name="descripcion"
                    placeholder="Motivo del movimiento (opcional)"
                    value={form.descripcion}
                    onChange={handleFormChange}
                    className={inputCls}
                    />
                </div>

                <button
                    type="submit"
                    disabled={enviando}
                    className="w-full rounded-lg bg-green-800 py-2.5 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-50"
                >
                    {enviando ? 'Registrando...' : 'Registrar'}
                </button>
                </form>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
                <h2 className="text-lg font-bold mb-5">Registrados en esta sesión</h2>
                {registrados.length === 0 && (
                <p className="text-neutral-400 text-sm">Aún no has registrado movimientos.</p>
                )}
                <ul className="space-y-3 text-sm">
                {registrados.map((m) => (
                    <li key={m.id} className="border-b border-neutral-100 pb-3">
                    <span className="font-semibold uppercase text-xs px-2 py-0.5 rounded-full bg-neutral-100 mr-2">{m.tipo}</span>
                    {nombreInsumo(m.insumoId)} · {m.cantidadUso} uds de uso
                    <p className="text-xs text-neutral-500 mt-1">
                        Costo ${m.costoTotal.toLocaleString()} · Stock resultante {m.stockResultante}
                    </p>
                    </li>
                ))}
                </ul>
            </section>
            </div>
        </div>
        </DashboardLayout>
    );
};

export default Movimientos;