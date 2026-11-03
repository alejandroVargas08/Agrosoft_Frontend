import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Cpu, Edit2, Sun, Wifi, WifiOff } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Btn, Card, EmptyState, Modal, PageHeader, StatCard, StatusBadge, Tab } from '../components/ui/AgroUI';
import EstacionCard from '../components/sensores/EstacionCard';
import HistorialSensor from '../components/sensores/HistorialSensor';
import EditarRangoSensor from '../components/sensores/EditarRangoSensor';
import { useSensoresPorLote, type EstacionLote } from '../hooks/sensores/useSensoresPorLote';
import { usePermisos } from '../hooks/permisos/usePermisos';
import {
    COLOR_MEDIDA, ETIQUETA_MEDIDA, ICONO_MEDIDA, ORDEN_MEDIDAS, nivelUV, textoValor,
    nivelLuz,
} from '../components/sensores/medidas';
import type { Sensor } from '../types/sensor';

const ESTADO_BADGE = {
    conectada: 'connected',
    alerta: 'alert',
    desconectada: 'disconnected',
} as const;

export default function SensorPage() {
    const { estaciones, resumen, cargando, error, recargar } = useSensoresPorLote();
    const [seleccionadaId, setSeleccionadaId] = useState<number | null | undefined>(undefined);
    const [medidaActiva, setMedidaActiva] = useState<string>(ETIQUETA_MEDIDA.temperatura);
    const [editarRangos, setEditarRangos] = useState(false);
    const queryClient = useQueryClient();
    const { puede } = usePermisos();

    // El diseño solo le deja editar rangos al instructor y al admin. No hay
    // permiso de sensores en el backend, asi que se usa el de actividades,
    // que es justo el que separa al instructor del aprendiz.
    const puedeEditarRangos = puede('actividades.gestionar');

    // Se guarda el id y no la estacion, para que el refresco cada 10s no deje
    // la pantalla de detalle mirando datos viejos.
    const seleccionada: EstacionLote | undefined =
        seleccionadaId === undefined ? undefined : estaciones.find((e) => e.loteId === seleccionadaId);

    const abrir = (estacion: EstacionLote) => {
        const primera = ORDEN_MEDIDAS.map((t) => estacion.medida(t)).find((s) => s !== undefined);
        if (primera) setMedidaActiva(ETIQUETA_MEDIDA[primera.tipo]);
        setSeleccionadaId(estacion.loteId);
    };

    const volver = () => setSeleccionadaId(undefined);

    const avisoError = error && (
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
    );

    // ─── Detalle de una estacion ────────────────────────────────────────────
    if (seleccionada) {
        const presentes: Sensor[] = ORDEN_MEDIDAS
            .map((t) => seleccionada.medida(t))
            .filter((s): s is Sensor => s !== undefined);

        const sensorActivo = presentes.find((s) => ETIQUETA_MEDIDA[s.tipo] === medidaActiva) ?? presentes[0];
        const uvSensor = seleccionada.medida('uv');
        const alertaUV = uvSensor?.valor !== null && uvSensor?.valor !== undefined && uvSensor.valor >= 8;

        return (
            <DashboardLayout>
                <div className="space-y-4 p-4 sm:p-6">
                    <PageHeader
                        title={'Estación ' + seleccionada.nombreLote}
                        subtitle={seleccionada.sensores.length + ' sensores'}
                        onBack={volver}
                        action={<StatusBadge status={ESTADO_BADGE[seleccionada.estado]} />}
                    />

                    {puedeEditarRangos && (
                        <Btn variant="outline" size="sm" onClick={() => setEditarRangos(true)}>
                            <Edit2 size={14} />Editar rangos
                        </Btn>
                    )}

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {presentes.map((s) => {
                            const Icono = ICONO_MEDIDA[s.tipo];
                            const color =
                                s.tipo === 'uv' ? nivelUV(s.valor ?? 0).color
                                    : s.tipo === 'luminosidad' ? nivelLuz(s.valor ?? 0).color
                                        : COLOR_MEDIDA[s.tipo];
                            const coloreado = s.tipo === 'uv' || s.tipo === 'luminosidad';
                            return (
                                <div key={s.id} className="rounded-xl border border-border bg-card p-3 text-center">
                                    <Icono size={18} className={`mx-auto mb-1 ${color}`} />
                                    <p className={`text-xl font-bold ${coloreado ? color : 'text-foreground'}`}>
                                        {textoValor(s)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{ETIQUETA_MEDIDA[s.tipo]}</p>
                                </div>
                            );
                        })}
                    </div>

                    {alertaUV && (
                        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-600" />
                            <p className="text-xs text-red-700">
                                Radiación UV muy alta: usa protección solar y evita labores al sol
                            </p>
                        </div>
                    )}

                    {presentes.length > 0 && (
                        <Tab
                            tabs={presentes.map((s) => ETIQUETA_MEDIDA[s.tipo])}
                            active={medidaActiva}
                            onChange={setMedidaActiva}
                        />
                    )}

                    <Card>
                        {sensorActivo ? (
                            <HistorialSensor sensor={sensorActivo} titulo={ETIQUETA_MEDIDA[sensorActivo.tipo]} />
                        ) : (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                Esta estación todavía no tiene sensores con lecturas.
                            </p>
                        )}
                    </Card>

                    {/* El hardware de la estacion, como en el diseño, y debajo
                        como se conecta cada sensor: eso si sale del backend. */}
                    <div className="space-y-1 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
                        <p><strong className="text-foreground">DHT22</strong> — Temperatura (°C) + Humedad relativa (%)</p>
                        <p><strong className="text-foreground">UVM-30A</strong> — Índice UV (0–11+, sin unidad)</p>
                        <p><strong className="text-foreground">Fotorresistor / BH1750</strong> — Luminosidad (lx)</p>
                        {seleccionada.sensores.map((s) =>
                            s.mqttTopic ? (
                                <p key={s.id} className="font-mono">Topic MQTT: {s.mqttTopic}</p>
                            ) : s.endpointUrl ? (
                                <p key={s.id} className="font-mono">{s.endpointUrl}</p>
                            ) : null,
                        )}
                    </div>

                    <Modal open={editarRangos && puedeEditarRangos} onClose={() => setEditarRangos(false)} title="Editar rangos de la estación">
                        {sensorActivo ? (
                            <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Rango de <strong className="text-foreground">{sensorActivo.nombre}</strong>. El
                                    rango decide cuándo la estación entra en alerta.
                                </p>
                                <EditarRangoSensor
                                    sensor={sensorActivo}
                                    onGuardado={() => {
                                        queryClient.invalidateQueries({ queryKey: ['sensor-lecturas'] });
                                        recargar();
                                        setEditarRangos(false);
                                    }}
                                />
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No hay sensores a los que ajustarles el rango.</p>
                        )}
                    </Modal>
                </div>
            </DashboardLayout>
        );
    }

    // ─── Lista de estaciones ────────────────────────────────────────────────
    return (
        <DashboardLayout>
            <div className="space-y-4 p-4 sm:p-6">
                <PageHeader title="Sensores IoT" subtitle="Estaciones de monitoreo por lote" />

                {avisoError}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatCard icon={Wifi} label="Conectadas" value={resumen.conectadas} color="emerald" />
                    <StatCard icon={AlertTriangle} label="Con alerta" value={resumen.conAlerta} color={resumen.conAlerta > 0 ? 'red' : 'emerald'} />
                    <StatCard icon={WifiOff} label="Desconectadas" value={resumen.desconectadas} color={resumen.desconectadas > 0 ? 'red' : 'emerald'} />
                    <StatCard
                        icon={Sun}
                        label="UV promedio"
                        value={resumen.uvPromedio === null ? '—' : 'UV ' + resumen.uvPromedio.toFixed(1)}
                        color={resumen.uvPromedio !== null && resumen.uvPromedio >= 6 ? 'amber' : 'primary'}
                    />
                </div>

                {cargando ? (
                    <p className="text-sm text-muted-foreground">Cargando sensores…</p>
                ) : estaciones.length === 0 && !error ? (
                    <EmptyState
                        icon={Cpu}
                        title="Aún no hay sensores registrados"
                        description="Cuando se registre un sensor y quede asociado a un lote, aparecerá aquí agrupado por estación."
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {estaciones.map((estacion) => (
                            <EstacionCard
                                key={estacion.loteId ?? 'sin-lote'}
                                estacion={estacion}
                                onClick={() => abrir(estacion)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
