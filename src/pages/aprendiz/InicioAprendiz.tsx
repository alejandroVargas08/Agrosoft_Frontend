import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ClipboardList, Droplets, FlaskConical, Lightbulb, RotateCcw, Star, Thermometer } from 'lucide-react';
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

/** El Figma formatea el valor con su unidad pegada: 24,5°C, 68%, 38,5 klx */
const valorSensor = (valor: number, unidad: string): string => {
    const u = unidad.trim().toLowerCase();
    const num = (v: number, decimales = 1) =>
        v.toLocaleString('es-CO', { maximumFractionDigits: decimales });

    if (u === 'c' || u === '°c') return num(valor) + '°C';
    if (u === '%') return num(valor) + '%';
    if (u === 'lux') {
        // Mismo formato y mismas palabras que el Figma
        const texto = valor >= 100_000
            ? Math.round(valor / 1000) + ' klx'
            : valor >= 1000
                ? num(valor / 1000) + ' klx'
                : num(valor, 0) + ' lx';
        const calidad = valor <= 1000
            ? 'Oscuro'
            : valor <= 10_000
                ? 'Nublado'
                : valor <= 50_000
                    ? 'Luz media'
                    : 'Pleno sol';
        return texto + ' · ' + calidad;
    }
    return num(valor, 2) + (unidad ? ' ' + unidad : '');
};

const InicioAprendiz = () => {
    const { user } = InicioUsuario();
    const navigate = useNavigate();
    const { tareas, todas, conteos } = useMisTareas();
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

                {/* Los colores cambian con el valor, como en el Figma */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <StatCard
                        icon={ClipboardList} label="Tareas pendientes" value={conteos.Pendientes}
                        color={conteos.Pendientes > 0 ? 'amber' : 'emerald'}
                    />
                    <StatCard
                        icon={Calendar} label="Por vencer esta semana" value={porVencer}
                        color={porVencer > 0 ? 'amber' : 'emerald'}
                    />
                    <StatCard
                        icon={RotateCcw} label="Devueltas" value={devueltas}
                        color={devueltas > 0 ? 'red' : 'emerald'}
                    />
                    <StatCard icon={Clock} label="Horas acumuladas" value={horas + 'h'} color="primary" />
                </div>

                {proxima && (
                    <Card className="mb-4 border-primary/20 bg-primary/5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                                <Star size={16} className="text-primary" />Tu próxima tarea
                            </h3>
                            <StatusBadge status={proxima.asignacion.estado} />
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">{proxima.titulo}</p>
                        <p className="text-xs text-muted-foreground mb-3">
                            {proxima.lote} · {proxima.cultivo}
                        </p>
                        <div className="flex gap-2">
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

                {enLinea.length > 0 && (
                    <Card className="mb-4">
                        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Thermometer size={16} className="text-primary" />Clima ahora en tu lote
                        </h3>
                        <div className="flex items-center gap-3 flex-wrap">
                            {enLinea.map((s) => {
                                const Icono = iconoSensor(s.nombre);
                                return (
                                    <div key={s.id} className="flex items-center gap-2 p-3 bg-muted rounded-xl">
                                        <Icono size={18} className="text-primary" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">{etiquetaSensor(s.nombre)}</p>
                                            <p className="text-lg font-bold text-foreground">
                                                {valorSensor(s.valor!, s.unidad)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
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
                            {/* El Figma usa un Btn fantasma con text-primary, pero sin tailwind-merge
                                el text-foreground del propio Btn le gana. Mismo resultado visual. */}
                            <button
                                type="button"
                                onClick={() => navigate('/notificaciones')}
                                className="w-full flex items-center justify-center px-3 py-1.5 text-sm font-semibold rounded-lg bg-transparent text-primary hover:bg-muted transition-colors"
                            >
                                Ver todas
                            </button>
                        </div>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default InicioAprendiz;