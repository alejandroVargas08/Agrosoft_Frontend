import { useMemo, useState } from 'react';
import {
    Area, AreaChart, CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine,
    ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { sensorLecturasApi } from '../../api/sensores';
import { useQuery } from '@tanstack/react-query';
import type { Sensor } from '../../types/sensor';
import { COLOR_GRAFICA, fmtLux, fmtNumero, nivelLuz } from './medidas';

type Rango = '6h' | '24h' | '7d';

const RANGOS: { valor: Rango; horas: number }[] = [
    { valor: '6h', horas: 6 },
    { valor: '24h', horas: 24 },
    { valor: '7d', horas: 24 * 7 },
];

interface Props {
    sensor: Sensor;
    /** El nombre de la medida, que es lo que el diseño pone de titulo. */
    titulo: string;
}

export default function HistorialSensor({ sensor, titulo }: Props) {
    const [rango, setRango] = useState<Rango>('24h');
    const sensorId = Number(sensor.id);
    const esLuz = sensor.tipo === 'luminosidad';

    const { data, isLoading, isError } = useQuery({
        queryKey: ['sensor-lecturas', sensorId],
        queryFn: async () => (await sensorLecturasApi.porSensor(sensorId)).data,
        enabled: Number.isFinite(sensorId) && sensorId > 0,
    });

    const horas = RANGOS.find((r) => r.valor === rango)!.horas;

    // El endpoint devuelve todas las lecturas del sensor: el rango se recorta aquí
    const puntos = useMemo(() => {
        const desde = Date.now() - horas * 3600_000;
        return (data ?? [])
            .map((l) => ({ t: new Date(l.fechaLectura).getTime(), value: Number(l.valor) }))
            .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.value) && p.t >= desde)
            .sort((a, b) => a.t - b.t)
            .map((p) => ({
                ...p,
                time: new Date(p.t).toLocaleString('es-CO', {
                    ...(horas > 24 ? { day: '2-digit', month: '2-digit' } : {}),
                    hour: '2-digit',
                    minute: '2-digit',
                }),
            }));
    }, [data, horas]);

    const stats = useMemo(() => {
        if (puntos.length === 0) return null;
        const valores = puntos.map((p) => p.value);
        const fuera = valores.filter(
            (v) => (sensor.min !== null && v < sensor.min) || (sensor.max !== null && v > sensor.max),
        ).length;
        return {
            promedio: valores.reduce((a, b) => a + b, 0) / valores.length,
            min: Math.min(...valores),
            max: Math.max(...valores),
            alertas: fuera,
        };
    }, [puntos, sensor.min, sensor.max]);

    const leer = (v: number) => (esLuz ? fmtLux(v) : fmtNumero(v) + (sensor.unidad ? ' ' + sensor.unidad : ''));
    const color = COLOR_GRAFICA[sensor.tipo];
    const luz = esLuz ? nivelLuz(sensor.valor ?? 0) : null;
    const bajoMinimo = esLuz && sensor.valor !== null && sensor.min !== null && sensor.valor < sensor.min;
    const sobreMaximo = esLuz && sensor.valor !== null && sensor.max !== null && sensor.valor > sensor.max;

    return (
        <>
            <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{titulo}</h3>
                <div className="flex gap-1">
                    {RANGOS.map((r) => (
                        <button
                            key={r.valor}
                            onClick={() => setRango(r.valor)}
                            className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${
                                rango === r.valor ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            {r.valor}
                        </button>
                    ))}
                </div>
            </div>

            {esLuz && luz && (
                <div className="mb-3 flex items-center gap-3">
                    <span className={`text-2xl font-bold ${luz.color}`}>{fmtLux(sensor.valor ?? 0)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${luz.bg} ${luz.color}`}>
                        {luz.label}
                    </span>
                </div>
            )}

            {bajoMinimo && (
                <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-[#FFF3E0] p-3">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#F16C07]" />
                    <p className="text-xs text-[#F16C07]">
                        Poca luz para el cultivo (actual: {fmtLux(sensor.valor!)}, mínimo: {fmtLux(sensor.min!)})
                    </p>
                </div>
            )}
            {sobreMaximo && (
                <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-[#FFF3E0] p-3">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#F16C07]" />
                    <p className="text-xs text-[#F16C07]">
                        Exceso de radiación solar (actual: {fmtLux(sensor.valor!)}, máximo: {fmtLux(sensor.max!)})
                    </p>
                </div>
            )}

            {isLoading ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Cargando lecturas…</p>
            ) : isError ? (
                <p className="py-10 text-center text-sm text-red-600">No se pudieron cargar las lecturas.</p>
            ) : puntos.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                    Este sensor no registró lecturas en las últimas {rango === '7d' ? '7 días' : rango}.
                </p>
            ) : esLuz ? (
                <>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={puntos}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e6" />
                            <XAxis dataKey="time" tick={{ fontSize: 10 }} minTickGap={24} />
                            <YAxis
                                tick={{ fontSize: 11 }}
                                tickFormatter={(v: number) => (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : String(v))}
                            />
                            <Tooltip formatter={(v: number) => fmtLux(v)} />
                            {sensor.min !== null && sensor.max !== null && (
                                <ReferenceArea y1={sensor.min} y2={sensor.max} fill="#3A9C50" fillOpacity={0.1} />
                            )}
                            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>

                    {stats && (
                        <div className="mt-4 grid grid-cols-4 gap-2">
                            {[
                                { label: 'Promedio', value: fmtLux(stats.promedio) },
                                { label: 'Mínimo', value: fmtLux(stats.min) },
                                { label: 'Máximo', value: fmtLux(stats.max) },
                                { label: 'Alertas', value: String(stats.alertas) },
                            ].map((e) => (
                                <div key={e.label} className="rounded-lg bg-muted p-2 text-center">
                                    <p className="text-[10px] text-muted-foreground">{rango} · {e.label}</p>
                                    <p className="text-xs font-bold text-foreground">{e.value}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={puntos}>
                            <defs>
                                <linearGradient id={'grad-' + sensorId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e6" />
                            <XAxis dataKey="time" tick={{ fontSize: 10 }} minTickGap={24} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v: number) => leer(v)} />
                            <Area
                                type="monotone" dataKey="value" stroke={color} strokeWidth={2}
                                fill={'url(#grad-' + sensorId + ')'} dot={false}
                            />
                            {sensor.min !== null && (
                                <ReferenceLine y={sensor.min} stroke="#F59E0B" strokeDasharray="4 4" strokeWidth={1} />
                            )}
                            {sensor.max !== null && (
                                <ReferenceLine y={sensor.max} stroke="#DC2626" strokeDasharray="4 4" strokeWidth={1} />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>

                    <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                        {sensor.min !== null && (
                            <span>
                                <span className="mr-1 inline-block h-0.5 w-3 bg-[#F59E0B] align-middle" />
                                {leer(sensor.min)} mín
                            </span>
                        )}
                        {sensor.max !== null && (
                            <span>
                                <span className="mr-1 inline-block h-0.5 w-3 bg-[#DC2626] align-middle" />
                                {leer(sensor.max)} máx
                            </span>
                        )}
                    </div>
                </>
            )}
        </>
    );
}
