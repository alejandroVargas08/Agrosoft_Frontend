import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { sensorLecturasApi } from '../../api/sensores';
import type { Sensor } from '../../types/sensor';

type Rango = '6h' | '24h' | '7d';

const RANGOS: { label: string; valor: Rango; horas: number }[] = [
    { label: '6 horas', valor: '6h', horas: 6 },
    { label: '24 horas', valor: '24h', horas: 24 },
    { label: '7 días', valor: '7d', horas: 24 * 7 },
];

const BOTON_BASE = 'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ';
const BOTON_ACTIVO = 'bg-primary text-white';
const BOTON_INACTIVO = 'bg-muted text-muted-foreground';

export default function HistorialSensor({ sensor }: { sensor: Sensor }) {
    const [rango, setRango] = useState<Rango>('24h');
    const sensorId = Number(sensor.id);

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
            .map((l) => ({ t: new Date(l.fechaLectura).getTime(), valor: Number(l.valor) }))
            .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.valor) && p.t >= desde)
            .sort((a, b) => a.t - b.t)
            .map((p) => ({
                ...p,
                etiqueta: new Date(p.t).toLocaleString('es-CO', {
                    ...(horas > 24 ? { day: '2-digit', month: '2-digit' } : {}),
                    hour: '2-digit',
                    minute: '2-digit',
                }),
            }));
    }, [data, horas]);

    const estadisticas = useMemo(() => {
        if (puntos.length === 0) return null;
        const valores = puntos.map((p) => p.valor);
        return {
            min: Math.min(...valores),
            max: Math.max(...valores),
            promedio: valores.reduce((a, b) => a + b, 0) / valores.length,
        };
    }, [puntos]);

    const fmt = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 1 });

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {RANGOS.map((r) => (
                    <button
                        key={r.valor}
                        onClick={() => setRango(r.valor)}
                        className={BOTON_BASE + (rango === r.valor ? BOTON_ACTIVO : BOTON_INACTIVO)}
                    >
                        {r.label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Cargando lecturas…</p>
            ) : isError ? (
                <p className="py-10 text-center text-sm text-red-600">No se pudieron cargar las lecturas.</p>
            ) : puntos.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                    Este sensor no registró lecturas en las últimas {RANGOS.find((r) => r.valor === rango)!.label}.
                </p>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={puntos}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e6" />
                            <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} minTickGap={24} />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                unit={sensor.unidad ? ` ${sensor.unidad}` : ''}
                                width={70}
                            />
                            <Tooltip
                                formatter={(v: number) => [`${fmt(v)} ${sensor.unidad}`, 'Lectura']}
                            />
                            {sensor.min !== null && (
                                <ReferenceLine
                                    y={sensor.min}
                                    stroke="#ef4444"
                                    strokeDasharray="4 4"
                                    label={{ value: `mín ${fmt(sensor.min)}`, fontSize: 11, position: 'insideBottomLeft' }}
                                />
                            )}
                            {sensor.max !== null && (
                                <ReferenceLine
                                    y={sensor.max}
                                    stroke="#ef4444"
                                    strokeDasharray="4 4"
                                    label={{ value: `máx ${fmt(sensor.max)}`, fontSize: 11, position: 'insideTopLeft' }}
                                />
                            )}
                            <Line
                                type="monotone"
                                dataKey="valor"
                                stroke="#2d7a3e"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>

                    {estadisticas && (
                        <div className="grid grid-cols-3 gap-3 text-center">
                            {[
                                { label: 'Mínima', valor: estadisticas.min },
                                { label: 'Promedio', valor: estadisticas.promedio },
                                { label: 'Máxima', valor: estadisticas.max },
                            ].map((e) => (
                                <div key={e.label} className="rounded-xl bg-muted px-3 py-2">
                                    <p className="text-xs text-muted-foreground">{e.label}</p>
                                    <p className="text-sm font-semibold text-foreground">
                                        {fmt(e.valor)} {sensor.unidad}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                        {puntos.length} lectura{puntos.length === 1 ? '' : 's'} en el rango seleccionado.
                    </p>
                </>
            )}
        </div>
    );
}
