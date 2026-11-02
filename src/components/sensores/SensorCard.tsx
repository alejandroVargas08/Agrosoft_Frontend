import { Droplets, FlaskConical, Cpu, Thermometer, AlertTriangle, WifiOff, type LucideIcon } from 'lucide-react';
import type { Sensor, TipoSensor } from '../../types/sensor';

const ICONOS: Record<TipoSensor, LucideIcon> = {
    temperatura: Thermometer,
    humedad: Droplets,
    ph: FlaskConical,
    otro: Cpu,
};

// El diseño colorea cada medida distinto: temperatura naranja, humedad azul
const COLOR_TIPO: Record<TipoSensor, string> = {
    temperatura: 'text-[#F16C07]',
    humedad: 'text-blue-500',
    ph: 'text-primary',
    otro: 'text-primary',
};

// Clases completas: Tailwind no detecta las que se arman con interpolación
const ESTILOS = {
    ok: { tile: 'bg-icon-bg', badge: 'bg-chip-bg text-chip-fg', borde: 'border-border', texto: 'En línea' },
    alerta: { tile: 'bg-red-100', badge: 'bg-red-100 text-red-700', borde: 'border-red-200', texto: 'Con alerta' },
    off: { tile: 'bg-muted', badge: 'bg-red-100 text-red-700', borde: 'border-border', texto: 'Desconectado' },
} as const;

function haceCuanto(fecha: string | null): string {
    if (!fecha) return 'Sin datos';
    const s = Math.max(0, (Date.now() - new Date(fecha).getTime()) / 1000);
    if (s < 60) return `Hace ${Math.floor(s)}s`;
    if (s < 3600) return `Hace ${Math.floor(s / 60)}min`;
    if (s < 86400) return `Hace ${Math.floor(s / 3600)}h`;
    return `Hace ${Math.floor(s / 86400)}d`;
}

const fmt = (n: number | null) =>
    n === null ? '–' : n.toLocaleString('es', { maximumFractionDigits: 1 });

/** La barrita de rango del diseño: se pone roja cuando el valor se sale */
const BarraRango = ({ valor, min, max }: { valor: number; min: number; max: number }) => {
    const pct = Math.min(Math.max(((valor - min) / (max - min || 1)) * 100, 0), 100);
    const fuera = valor < min || valor > max;
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-full h-1.5">
                <div
                    className={`h-1.5 rounded-full transition-all ${fuera ? 'bg-red-500' : 'bg-primary'}`}
                    style={{ width: pct + '%' }}
                />
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">{fmt(min)}–{fmt(max)}</span>
        </div>
    );
};

export default function SensorCard({ sensor }: { sensor: Sensor }) {
    const estado = !sensor.enLinea ? 'off' : sensor.alerta ? 'alerta' : 'ok';
    const e = ESTILOS[estado];
    const Icono = ICONOS[sensor.tipo];
    const hayRango = sensor.min !== null && sensor.max !== null;
    const colorIcono = estado === 'ok' ? COLOR_TIPO[sensor.tipo]
        : estado === 'alerta' ? 'text-red-600'
            : 'text-muted-foreground';

    return (
        <article className={`bg-card rounded-xl border shadow-sm p-4 ${e.borde} ${estado === 'off' ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${e.tile}`}>
                        <Icono size={18} className={colorIcono} />
                    </div>
                    {estado === 'alerta' && <AlertTriangle size={14} className="text-red-500" />}
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${e.badge}`}>{e.texto}</span>
            </div>

            <p className="font-semibold text-foreground text-sm mb-0.5">{sensor.nombre}</p>
            <p className="text-xs text-muted-foreground mb-3">{sensor.ubicacion}</p>

            {estado === 'off' ? (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm text-muted-foreground">
                    <WifiOff size={14} /> Sin conexión
                </div>
            ) : (
                <>
                    <p className={`text-2xl font-bold ${estado === 'alerta' ? 'text-red-600' : 'text-foreground'}`}>
                        {fmt(sensor.valor)}
                        <span className="ml-1 text-base font-normal text-muted-foreground">{sensor.unidad}</span>
                    </p>
                    {hayRango && sensor.valor !== null && (
                        <div className="mt-2">
                            <BarraRango valor={sensor.valor} min={sensor.min!} max={sensor.max!} />
                        </div>
                    )}
                </>
            )}

            <p className="mt-2 text-xs text-muted-foreground">{haceCuanto(sensor.ultimaLectura)}</p>
        </article>
    );
}
