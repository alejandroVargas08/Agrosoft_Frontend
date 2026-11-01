import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, Cpu, MapPin, Wifi, WifiOff } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Badge, Card, EmptyState, Modal, PageHeader, StatCard } from '../components/ui/AgroUI';
import SensorCard from '../components/sensores/SensorCard';
import HistorialSensor from '../components/sensores/HistorialSensor';
import EditarRangoSensor from '../components/sensores/EditarRangoSensor';
import { useSensoresPorLote } from '../hooks/sensores/useSensoresPorLote';
import type { Sensor } from '../types/sensor';

export default function SensorPage() {
    const { estaciones, resumen, cargando, error, recargar } = useSensoresPorLote();
    const [seleccionado, setSeleccionado] = useState<Sensor | null>(null);
    const queryClient = useQueryClient();

    const cerrar = () => setSeleccionado(null);

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6 space-y-6">
                <PageHeader title="Sensores IoT" subtitle="Monitoreo en tiempo real por lote" />

                {error && (
                    <div
                        role="alert"
                        className="flex flex-col gap-3 rounded-xl bg-red-50 px-5 py-4 text-red-700 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <span>No se pudieron cargar los sensores ({error}).</span>
                        <button
                            onClick={recargar}
                            className="self-start rounded-lg border border-red-300 px-3 py-1 text-sm font-semibold hover:bg-red-100 sm:self-auto"
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard icon={Wifi} label="En línea" value={resumen.enLinea} color="emerald" />
                    <StatCard icon={WifiOff} label="Desconectados" value={resumen.desconectados} color="red" />
                    <StatCard icon={Cpu} label="Total sensores" value={resumen.total} color="primary" />
                    <StatCard icon={Bell} label="Alertas activas" value={resumen.alertas} color="amber" />
                </section>

                {cargando ? (
                    <p className="text-sm text-muted-foreground">Cargando sensores…</p>
                ) : estaciones.length === 0 && !error ? (
                    <EmptyState
                        icon={Cpu}
                        title="Aún no hay sensores registrados"
                        description="Cuando se registre un sensor y quede asociado a un lote, aparecerá aquí agrupado por estación."
                    />
                ) : (
                    <div className="space-y-6">
                        {estaciones.map((estacion) => (
                            <Card key={estacion.loteId ?? 'sin-lote'} className="p-0 overflow-hidden">
                                <header className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-icon-bg">
                                            <MapPin className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-foreground">{estacion.nombreLote}</h2>
                                            <p className="text-xs text-muted-foreground">
                                                {estacion.sensores.length} sensor
                                                {estacion.sensores.length === 1 ? '' : 'es'} ·{' '}
                                                {estacion.enLinea} en línea
                                            </p>
                                        </div>
                                    </div>
                                    {estacion.alertas > 0 && (
                                        <Badge color="danger">
                                            {estacion.alertas} fuera de rango
                                        </Badge>
                                    )}
                                </header>

                                <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                                    {estacion.sensores.map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => setSeleccionado(s)}
                                            className="text-left transition-transform hover:-translate-y-0.5"
                                        >
                                            <SensorCard sensor={{ ...s, ubicacion: estacion.nombreLote }} />
                                        </button>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <Modal open={seleccionado !== null} onClose={cerrar} title={seleccionado?.nombre ?? ''}>
                    {seleccionado && (
                        <div className="space-y-6">
                            <HistorialSensor sensor={seleccionado} />

                            <div className="border-t border-border pt-4">
                                <h3 className="mb-3 text-sm font-semibold text-foreground">
                                    Rango operativo
                                </h3>
                                <EditarRangoSensor
                                    sensor={seleccionado}
                                    onGuardado={() => {
                                        queryClient.invalidateQueries({ queryKey: ['sensor-lecturas'] });
                                        recargar();
                                        cerrar();
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </DashboardLayout>
    );
}
