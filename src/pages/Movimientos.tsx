import DashboardLayout from '../componets/layout/DashboardLayout';
import { useMovimientos } from '../hooks/useMovimientos';

const inputCls = 'w-full rounded-xl border border-neutral-200 py-2 px-3';

const Movimientos = () => {
    const {
        form, insumos, almacenes, registrados,
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
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
                <h2 className="text-lg font-bold mb-4">Registrar movimiento</h2>
                {errorForm && <p className="text-red-600 mb-3">{String(errorForm)}</p>}

                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label>Insumo</label>
                    <select required name="insumoId" value={form.insumoId} onChange={handleFormChange} className={inputCls}>
                    <option value="">Seleccione...</option>
                    {insumos.map((i) => (
                        <option key={i.id} value={i.id}>{i.nombre} (disp. {i.stockDisponible})</option>
                    ))}
                    </select>
                </div>

                <div>
                    <label>Tipo</label>
                    <select name="tipo" value={form.tipo} onChange={handleFormChange} className={inputCls}>
                    <option value="entrada">Entrada</option>
                    <option value="salida">Salida</option>
                    <option value="traslado">Traslado</option>
                    <option value="ajuste">Ajuste</option>
                    </select>
                </div>
                <div />

                <div>
                    <label>Cantidad (presentación)</label>
                    <input required type="number" step="any" name="cantidadPresentacion" value={form.cantidadPresentacion} onChange={handleFormChange} className={inputCls} />
                </div>
                <div>
                    <label>Cantidad (uso)</label>
                    <input required type="number" step="any" name="cantidadUso" value={form.cantidadUso} onChange={handleFormChange} className={inputCls} />
                </div>

                {esTraslado && (
                    <>
                    <div>
                        <label>Almacén origen</label>
                        <select required name="almacenOrigenId" value={form.almacenOrigenId} onChange={handleFormChange} className={inputCls}>
                        <option value="">Seleccione...</option>
                        {almacenes.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                        </select>
                    </div>
                    <div>
                        <label>Almacén destino</label>
                        <select required name="almacenDestinoId" value={form.almacenDestinoId} onChange={handleFormChange} className={inputCls}>
                        <option value="">Seleccione...</option>
                        {almacenes.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                        </select>
                    </div>
                    </>
                )}

                <div className="col-span-2">
                    <label>Descripción</label>
                    <input name="descripcion" value={form.descripcion} onChange={handleFormChange} className={inputCls} />
                </div>

                <div className="col-span-2 flex justify-end">
                    <button type="submit" disabled={enviando} className="bg-green-800 text-white px-6 py-3 rounded-xl disabled:opacity-50">
                    {enviando ? 'Registrando...' : 'Registrar'}
                    </button>
                </div>
                </form>
            </section>

            <section className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
                <h2 className="text-lg font-bold mb-4">Registrados en esta sesión</h2>
                {registrados.length === 0 && (
                <p className="text-neutral-400 text-sm">Aún no has registrado movimientos.</p>
                )}
                <ul className="space-y-2 text-sm">
                {registrados.map((m) => (
                    <li key={m.id} className="border-b pb-2">
                    <span className="font-semibold uppercase text-xs px-2 py-0.5 rounded-full bg-neutral-100 mr-2">{m.tipo}</span>
                    {nombreInsumo(m.insumoId)} · {m.cantidadUso} uds de uso
                    <p className="text-xs text-neutral-500">
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