import DashboardLayout from '../componets/layout/DashboardLayout';
import { useReservas } from '../hooks/useReservas';

const inputCls = 'w-full rounded-xl border border-neutral-200 py-2 px-3';

const Reservas = () => {
    const {
        form, insumos, reservas, enviando, errorForm,
        handleFormChange, handleSubmit, nombreInsumo, confirmar, cancelar,
    } = useReservas();

    return (
        <DashboardLayout>
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900">Reservas de insumos</h1>
            <p className="text-neutral-500">Aparta stock para actividades futuras</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
                <h2 className="text-lg font-bold mb-4">Nueva reserva</h2>
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
                    <label>Cantidad</label>
                    <input required type="number" step="any" name="cantidad" value={form.cantidad} onChange={handleFormChange} className={inputCls} />
                </div>
                <div>
                    <label>Fecha</label>
                    <input required type="date" name="fechaReserva" value={form.fechaReserva} onChange={handleFormChange} className={inputCls} />
                </div>
                <div className="col-span-2">
                    <label>Motivo</label>
                    <input name="motivo" value={form.motivo} onChange={handleFormChange} className={inputCls} />
                </div>
                <div className="col-span-2 flex justify-end">
                    <button type="submit" disabled={enviando} className="bg-green-800 text-white px-6 py-3 rounded-xl disabled:opacity-50">
                    {enviando ? 'Reservando...' : 'Reservar'}
                    </button>
                </div>
                </form>
            </section>

            <section className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
                <h2 className="text-lg font-bold mb-4">Reservas de esta sesión</h2>
                {reservas.length === 0 && (
                <p className="text-neutral-400 text-sm">Aún no has creado reservas.</p>
                )}
                <ul className="space-y-2 text-sm">
                {reservas.map((r) => (
                    <li key={r.id} className="border-b pb-2 flex justify-between items-center">
                    <div>
                        {nombreInsumo(r.insumoId)} · {r.cantidad} uds
                        <p className="text-xs text-neutral-500">Estado: {r.estado}</p>
                    </div>
                    {r.estado === 'pendiente' && (
                        <div className="flex gap-2 text-xs">
                        <button onClick={() => confirmar(r.id)} className="text-green-700 underline">Confirmar</button>
                        <button onClick={() => cancelar(r.id)} className="text-red-600 underline">Cancelar</button>
                        </div>
                    )}
                    </li>
                ))}
                </ul>
            </section>
            </div>
        </div>
        </DashboardLayout>
    );
    };

export default Reservas;