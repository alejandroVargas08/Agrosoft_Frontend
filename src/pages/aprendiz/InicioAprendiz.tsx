import { Link, useNavigate } from 'react-router-dom';
import { Bell, Calendar, Clock, ClipboardList, Droplets, FlaskConical, Lightbulb, RotateCcw, Star, Thermometer } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Btn, Card, StatCard, StatusBadge } from '../../components/ui/AgroUI';
import { InicioUsuario } from '../../hooks/useAuth';
import { useMisTareas } from '../../hooks/instructor/useMisTareas';
import { useSensores } from '../../hooks/sensores/useSensores';
import { useNotificacionesContext } from '../../context/NotificacionesContext';

const hoyLargo = () =>
    new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

const haceCuanto = (iso: string) => {
    const ms = Date.now() - new Date(iso).getTime();
    const horas = Math.floor(ms / 3_600_000);
    if (horas < 1) return 'Hace un momento';
    if (horas < 24) return 'Hace ' + horas + 'h';
    return 'Hace ' + Math.floor(ms / 86_400_000) + 'd';
};

/**
 * El Figma muestra una etiqueta genérica ("Temperatura"), no el nombre completo
 * del sensor, que aquí viene como "Temperatura - La Esperanza".
 */
const etiquetaSensor = (nombre: string) => nombre.split(' - ')[0].trim();

const iconoSensor = (nombre: string) => {
    const n = nombre.toLowerCase();
    if (n.includes('temp')) return Thermometer;
    if (n.includes('hum')) return Droplets;
    if (n.includes('lumin') || n.includes('luz')) return Lightbulb;
    if (n.includes('ph')) return FlaskConical;
    return Thermometer;
};

/** El Figma formatea el valor con su unidad pegada: 24.5°C, 68%, 42,5 klx */
const valorSensor = (valor: number, unidad: string): string => {
    const u = unidad.trim().toLowerCase();
    const num = (v: number, decimales = 1) =>
        v.toLocaleString('es-CO', { maximumFractionDigits: decimales });

    if (u === 'c' || u === '°c') return num(valor) + '°C';
    if (u === '%') return num(valor) + '%';
    if (u === 'lux') {
        const klx = valor / 1000;
        // El Figma acompaña la luminosidad con una lectura en palabras
        const calidad = klx < 10 ? 'Luz baja' : klx <= 50 ? 'Luz media' : 'Luz alta';
        return num(klx) + ' klx · ' + calidad;
    }
    return num(valor, 2) + (unidad ? ' ' + unidad : '');
};

const InicioAprendiz = () => {
    const { user } = InicioUsuario();
    const navigate = useNavigate();
    const { tareas, todas, conteos, cargando } = useMisTareas();
    const { sensores } = useSensores(60_000);
    const { notificaciones } = useNotificacionesContext();

    const nombre = (user?.nombre || user?.nombres || user?.name || '').split(' ')[0];

    // La próxima es la primera pendiente: ya vienen ordenadas y con lote y cultivo resueltos
    const proxima = tareas[0] ?? null;

    const porVencer = todas.filter(
        (t) => t.asignacion.estado !== 'APROBADA' &&
            t.diasParaEntregar !== null && t.diasParaEntregar >= 0 && t.diasParaEntregar <= 7,
    ).length;
    const devueltas = todas.filter((t) => t.asignacion.estado === 'DEVUELTA').length;
    const horas = todas.reduce((suma, t) => suma + (t.asignacion.horasTrabajadas ?? 0), 0);

    const ultimas = notificaciones.slice(0, 3);
    const enLinea = sensores.filter((s) => s.enLinea && s.valor !== null).slice(0, 4);

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-foreground">Hola, {nombre || 'aprendiz'}</h1>
                    <p className="text-sm text-muted-foreground mt-1">{hoyLargo()}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {/* Los colores son fijos, como en el Figma: no cambian con el valor */}
                    <StatCard icon={ClipboardList} label="Tareas pendientes" value={conteos.Pendientes} color="amber" />
                    <StatCard icon={Calendar} label="Por vencer esta semana" value={porVencer} color="amber" />
                    <StatCard icon={RotateCcw} label="Devueltas" value={devueltas} color="red" />
                    <StatCard icon={Clock} label="Horas acumuladas" value={horas + 'h'} color="primary" />
                </div>

                {proxima && (
                    <Card className="mb-4 border-primary/20 bg-primary/5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                                <Star className="w-4 h-4 text-primary" />Tu próxima tarea
                            </h3>
                            <StatusBadge status={proxima.asignacion.estado} />
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">{proxima.titulo}</p>
                        <p className="text-xs text-muted-foreground mb-3">
                            {proxima.lote} · {proxima.cultivo}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Btn onClick={() => navigate('/mis-tareas')} className="flex-1 justify-center">
                                Continuar
                            </Btn>
                            {proxima.asignacion.actividad && (
                                <Btn
                                    variant="outline"
                                    onClick={() => navigate('/actividades/' + proxima.asignacion.actividad!.id)}
                                    className="flex-1 justify-center"
                                >
                                    Ver actividad
                                </Btn>
                            )}
                        </div>
                    </Card>
                )}

                {!cargando && !proxima && (
                    <Card className="mb-4">
                        <p className="text-sm text-muted-foreground">
                            No tienes tareas pendientes. Cuando tu instructor te asigne una, aparece aquí.
                        </p>
                    </Card>
                )}

                {enLinea.length > 0 && (
                    <Card className="mb-4">
                        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Thermometer className="w-4 h-4 text-primary" />Clima ahora en tu lote
                        </h3>
                        <div className="flex items-center gap-3 flex-wrap">
                            {enLinea.map((s) => {
                                const Icono = iconoSensor(s.nombre);
                                return (
                                    <div key={s.id} className="flex items-center gap-2 rounded-xl bg-icon-bg p-3">
                                        <Icono className={`w-5 h-5 ${s.alerta ? 'text-[#F16C07]' : 'text-primary'}`} />
                                        <div>
                                            <p className="text-xs text-muted-foreground">{etiquetaSensor(s.nombre)}</p>
                                            <p className={`text-lg font-bold ${s.alerta ? 'text-[#F16C07]' : 'text-foreground'}`}>
                                                {valorSensor(s.valor!, s.unidad)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {enLinea.some((s) => s.alerta) && (
                            <div className="mt-3 rounded-xl border border-[#F16C07]/30 bg-[#FFF3E0] p-3">
                                <p className="text-xs text-[#E65100]">
                                    Hay sensores fuera de rango. Revísalos antes de salir al campo.
                                </p>
                            </div>
                        )}
                    </Card>
                )}

                <Card>
                    <h3 className="font-semibold text-foreground mb-3">Últimas notificaciones</h3>
                    {ultimas.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No tienes notificaciones recientes.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {ultimas.map((n) => (
                                <div
                                    key={n.id}
                                    className={`flex items-start gap-3 p-3 rounded-xl ${n.leida ? 'bg-muted/30' : 'bg-primary/5'}`}
                                >
                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.leida ? 'bg-muted-foreground/30' : 'bg-primary'}`} />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground">{n.titulo}</p>
                                        <p className="text-xs text-muted-foreground">{n.mensaje}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{haceCuanto(n.creadoEn)}</p>
                                    </div>
                                </div>
                            ))}
                            <Link
                                to="/notificaciones"
                                className="flex items-center justify-center gap-2 w-full rounded-lg py-2 text-sm font-semibold text-primary hover:bg-muted transition-colors"
                            >
                                <Bell className="w-4 h-4" />Ver todas
                            </Link>
                        </div>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default InicioAprendiz;
