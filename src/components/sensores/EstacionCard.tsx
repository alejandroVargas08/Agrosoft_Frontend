import { AlertTriangle, Radio, WifiOff } from 'lucide-react';
import { Badge, Card, StatusBadge } from '../ui/AgroUI';
import type { EstacionLote } from '../../hooks/sensores/useSensoresPorLote';
import type { Sensor } from '../../types/sensor';
import {
    COLOR_MEDIDA, ICONO_MEDIDA, ORDEN_MEDIDAS, fmtNumero, fueraDeRango, nivelLuz, nivelUV, textoValor,
} from './medidas';

/** La barrita de rango del diseño: se pone roja cuando el valor se sale. */
const BarraRango = ({ valor, min, max }: { valor: number; min: number; max: number }) => {
    const pct = Math.min(Math.max(((valor - min) / (max - min || 1)) * 100, 0), 100);
    const fuera = valor < min || valor > max;
    return (
        <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-muted">
                <div
                    className={`h-1.5 rounded-full transition-all ${fuera ? 'bg-red-500' : 'bg-primary'}`}
                    style={{ width: pct + '%' }}
                />
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground">
                {fmtNumero(min)}–{fmtNumero(max)}
            </span>
        </div>
    );
};

/** Una medida dentro de la tarjeta: icono, valor y barra de rango. */
const Medida = ({ sensor }: { sensor: Sensor }) => {
    const Icono = ICONO_MEDIDA[sensor.tipo];
    const fuera = fueraDeRango(sensor);
    const hayRango = sensor.min !== null && sensor.max !== null;

    // El UV no lleva barra: se lee por nivel, como en el diseño.
    if (sensor.tipo === 'uv') {
        const uv = nivelUV(sensor.valor ?? 0);
        return (
            <div className="flex items-center gap-2">
                <Icono size={14} className={uv.color} />
                <div className="flex flex-1 items-center justify-between">
                    <span className={`text-xs font-semibold ${uv.color}`}>
                        {textoValor(sensor)} · {uv.label}
                    </span>
                    {fuera && <AlertTriangle size={12} className="text-red-500" />}
                </div>
            </div>
        );
    }

    // La luz se lee por tramo (Oscuro / Nublado / Luz media / Pleno sol).
    if (sensor.tipo === 'luminosidad') {
        const luz = nivelLuz(sensor.valor ?? 0);
        return (
            <div className="flex items-center gap-2">
                <Icono size={14} className={fuera ? 'text-[#F16C07]' : luz.color} />
                <div className="flex flex-1 items-center justify-between text-xs">
                    <span className={`font-semibold ${luz.color}`}>{textoValor(sensor)}</span>
                    <span className="text-muted-foreground">{luz.label}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Icono size={14} className={fuera ? 'text-red-500' : COLOR_MEDIDA[sensor.tipo]} />
            <div className="flex-1">
                <div className="mb-0.5 flex justify-between text-xs">
                    <span className={`font-semibold ${fuera ? 'text-red-600' : 'text-foreground'}`}>
                        {textoValor(sensor)}
                    </span>
                    {fuera && <AlertTriangle size={12} className="text-red-500" />}
                </div>
                {hayRango && sensor.valor !== null && (
                    <BarraRango valor={sensor.valor} min={sensor.min!} max={sensor.max!} />
                )}
            </div>
        </div>
    );
};

interface Props {
    estacion: EstacionLote;
    onClick: () => void;
}

/** Una estación: el conjunto de sensores de un lote, como en el Figma. */
export default function EstacionCard({ estacion, onClick }: Props) {
    const desconectada = estacion.estado === 'desconectada';
    const conAlerta = estacion.estado === 'alerta';

    const medidas = ORDEN_MEDIDAS
        .map((tipo) => estacion.medida(tipo))
        .filter((s): s is Sensor => s !== undefined);

    return (
        <Card
            onClick={desconectada ? undefined : onClick}
            className={`${desconectada ? 'opacity-60' : ''} ${conAlerta ? 'border-red-200' : ''}`}
        >
            <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <div className={`rounded-lg p-2 ${conAlerta ? 'bg-red-100' : desconectada ? 'bg-muted' : 'bg-icon-bg'}`}>
                        <Radio
                            size={18}
                            className={conAlerta ? 'text-red-600' : desconectada ? 'text-muted-foreground' : 'text-primary'}
                        />
                    </div>
                    {conAlerta && <Badge color="danger">Alerta</Badge>}
                </div>
                <StatusBadge status={estacion.estado === 'conectada' ? 'connected' : estacion.estado === 'alerta' ? 'alert' : 'disconnected'} />
            </div>

            <p className="mb-0.5 text-sm font-semibold text-foreground">{estacion.nombre}</p>
            <p className="mb-3 text-xs text-muted-foreground">{estacion.nombreLote}</p>

            {desconectada ? (
                <div className="flex items-center gap-2 rounded-lg bg-muted p-2 text-sm text-muted-foreground">
                    <WifiOff size={14} /> Sin conexión
                </div>
            ) : medidas.length === 0 ? (
                <p className="text-xs text-muted-foreground">Esta estación todavía no reporta medidas.</p>
            ) : (
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                    {medidas.map((s) => <Medida key={s.id} sensor={s} />)}
                </div>
            )}
        </Card>
    );
}
