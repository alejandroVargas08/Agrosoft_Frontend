import { useNavigate } from 'react-router-dom';
import {
    AlertCircle, AlertTriangle, Calendar, CheckCircle, ClipboardList,
    Droplets, Lightbulb, Package, Plane, Plus, Radio, Thermometer,
} from 'lucide-react';
import {
    Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Btn, Card, StatCard, StatusBadge } from '../../components/ui/AgroUI';
import { fmtLux, fmtNumero, nivelLuz, nivelUV } from '../../components/sensores/medidas';
import { useInicioInstructor } from '../../hooks/instructor/useInicioInstructor';
import type { EstacionLote } from '../../hooks/sensores/useSensoresPorLote';
import { InicioUsuario } from '../../hooks/useAuth';

const hoy = () =>
    new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

const fecha = (valor: string) =>
    new Date(valor).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

/** Una estación del diseño: el lote arriba y sus medidas a la derecha. */
const FilaEstacion = ({ estacion, alVerSensores }: { estacion: EstacionLote; alVerSensores: () => void }) => {
    const alerta = estacion.estado === 'alerta';
    const temperatura = estacion.medida('temperatura');
    const humedad = estacion.medida('humedad');
    const uv = estacion.medida('uv');
    const luz = estacion.medida('luminosidad');

    return (
        <button
            type="button"
            onClick={alVerSensores}
            className={
                'w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left cursor-pointer hover:shadow-sm transition ' +
                (alerta ? 'border-red-200 bg-red-50' : 'border-border bg-muted/30')
            }
        >
            <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{estacion.nombreLote}</p>
                <p className="text-xs text-muted-foreground truncate">
                    Estación {estacion.nombreLote}
                </p>
            </div>

            <div className="flex items-center gap-2 text-xs flex-wrap justify-end">
                {temperatura?.valor !== null && temperatura !== undefined && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                        <Thermometer size={12} />{fmtNumero(temperatura.valor)}°C
                    </span>
                )}
                {humedad?.valor !== null && humedad !== undefined && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                        <Droplets size={12} />{fmtNumero(humedad.valor)}%
                    </span>
                )}
                {uv?.valor !== null && uv !== undefined && (
                    <span className={'px-1.5 py-0.5 rounded-full text-[10px] font-semibold ' + nivelUV(uv.valor).bg}>
                        UV {fmtNumero(uv.valor)}
                    </span>
                )}
                {luz?.valor !== null && luz !== undefined && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                        <Lightbulb size={12} />{fmtLux(luz.valor)} · {nivelLuz(luz.valor).label}
                    </span>
                )}
                {alerta && <AlertTriangle size={14} className="text-red-500" />}
            </div>
        </button>
    );
};

const InicioInstructor = () => {
    const navigate = useNavigate();
    const { user } = InicioUsuario();
    const {
        porRevisar, vencidas, novedadesAbiertas, insumosBajos, estacionesConAlerta,
        estaciones, proximasFechas, aprobadasPorSemana, ultimoVuelo,
    } = useInicioInstructor();

    const nombreSesion = user?.nombre ?? user?.nombres ?? user?.name ?? '';
    const primerNombre = nombreSesion.split(' ')[0];

    const accesos = [
        { label: 'Nueva actividad', icon: Plus, ruta: '/actividades' },
        { label: 'Por revisar', icon: CheckCircle, ruta: '/por-revisar' },
        { label: 'Novedades', icon: AlertCircle, ruta: '/novedades' },
        { label: 'Nuevo vuelo', icon: Plane, ruta: '/drones' },
    ];

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-foreground">
                        Buenos días{primerNombre ? ', ' + primerNombre : ''}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">{hoy()}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                    <button type="button" onClick={() => navigate('/por-revisar')} className="text-left cursor-pointer">
                        <StatCard
                            icon={ClipboardList}
                            label="Por revisar"
                            value={porRevisar}
                            color={porRevisar > 0 ? 'amber' : 'emerald'}
                        />
                    </button>

                    <button type="button" onClick={() => navigate('/actividades')} className="text-left cursor-pointer">
                        <StatCard
                            icon={AlertTriangle}
                            label="Vencidas"
                            value={vencidas}
                            color={vencidas > 0 ? 'red' : 'emerald'}
                        />
                    </button>

                    <button type="button" onClick={() => navigate('/novedades')} className="text-left cursor-pointer">
                        <StatCard
                            icon={AlertCircle}
                            label="Novedades abiertas"
                            value={novedadesAbiertas}
                            color={novedadesAbiertas > 0 ? 'amber' : 'emerald'}
                        />
                    </button>

                    <StatCard
                        icon={Package}
                        label="Insumos bajos"
                        value={insumosBajos}
                        color={insumosBajos > 0 ? 'red' : 'emerald'}
                    />

                    <button type="button" onClick={() => navigate('/sensores-iot')} className="text-left cursor-pointer">
                        <StatCard
                            icon={Radio}
                            label="Estaciones con alerta"
                            value={estacionesConAlerta}
                            color={estacionesConAlerta > 0 ? 'red' : 'emerald'}
                        />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <Card>
                        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Thermometer size={16} className="text-primary" />
                            Clima de mis lotes
                        </h3>
                        {estaciones.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                Ninguna estación está reportando ahora mismo.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {estaciones.map((estacion) => (
                                    <FilaEstacion
                                        key={estacion.loteId ?? 'sin-lote'}
                                        estacion={estacion}
                                        alVerSensores={() => navigate('/sensores-iot')}
                                    />
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card>
                        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Calendar size={16} className="text-primary" />
                            Próximas fechas límite
                        </h3>
                        {proximasFechas.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                No hay actividades con plazo pendiente.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {proximasFechas.map((plazo) => (
                                    <div
                                        key={plazo.actividadId}
                                        className="flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-xl"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate">{plazo.actividad}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {plazo.aprendices === 1 ? '1 aprendiz' : plazo.aprendices + ' aprendices'}
                                            </p>
                                        </div>
                                        <span
                                            className={
                                                'shrink-0 text-xs font-bold px-2 py-1 rounded-lg ' +
                                                (plazo.diasRestantes <= 3
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-[#FFF3E0] text-[#F16C07]')
                                            }
                                        >
                                            {plazo.diasRestantes}d restantes
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <Card>
                        <h3 className="font-semibold text-foreground mb-3">Tareas aprobadas por semana</h3>
                        <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={aprobadasPorSemana}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e6" />
                                <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="aprobadas" name="Aprobadas" fill="#2d7a3e" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    <Card>
                        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Plane size={16} className="text-primary" />
                            Último vuelo de dron
                        </h3>

                        {ultimoVuelo === null ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                Todavía no hay vuelos analizados.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold truncate">{ultimoVuelo.nombre}</p>
                                    <StatusBadge status={ultimoVuelo.estado} />
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="p-2 bg-muted rounded-lg">
                                        <p className="text-muted-foreground">Dron</p>
                                        <p className="font-medium truncate">{ultimoVuelo.dron}</p>
                                    </div>
                                    <div className="p-2 bg-muted rounded-lg">
                                        <p className="text-muted-foreground">Lote</p>
                                        <p className="font-medium truncate">{ultimoVuelo.lote}</p>
                                    </div>
                                    <div className="p-2 bg-muted rounded-lg">
                                        <p className="text-muted-foreground">Salud</p>
                                        <p className="font-bold text-primary">
                                            {ultimoVuelo.salud !== null ? fmtNumero(ultimoVuelo.salud) + '%' : '—'}
                                        </p>
                                    </div>
                                    <div className="p-2 bg-muted rounded-lg">
                                        <p className="text-muted-foreground">Fecha</p>
                                        <p className="font-medium">{fecha(ultimoVuelo.fecha)}</p>
                                    </div>
                                </div>
                                <Btn
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate('/drones')}
                                    className="w-full justify-center"
                                >
                                    Ver análisis
                                </Btn>
                            </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                            {accesos.map((acceso) => (
                                <button
                                    key={acceso.ruta}
                                    type="button"
                                    onClick={() => navigate(acceso.ruta)}
                                    className="flex flex-col items-center gap-1.5 p-3 bg-muted rounded-xl hover:bg-primary/10 transition text-center"
                                >
                                    <acceso.icon size={18} className="text-primary" />
                                    <span className="text-xs font-semibold text-foreground leading-tight">
                                        {acceso.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default InicioInstructor;
