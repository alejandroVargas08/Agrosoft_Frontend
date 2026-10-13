import { useState } from "react"
import type { tipoFuenteHistorial } from "../../types/historial"
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { useActividadHistorial } from "../../hooks/Historial/useActividadHistorial";
import { useHistorialPreciosLote } from "../../hooks/Historial/useHistorialPreciosLote";
import { useHistorialCultivo } from "../../hooks/Historial/useHistorialCultivo";
import { api } from "../../api/axios";
import { cultivosApi } from "../../api/cultivo/cultivos";
import { User } from "lucide-react";
import { Badge, Card, EmptyState, PageHeader, Select, Tab } from "../../components/ui/AgroUI";
import { actividadesApi } from "../../api/actividades/actividades";

const FUENTES: { id: tipoFuenteHistorial; label: string }[] = [
    { id: 'actividades', label: 'Actividad' },
    { id: 'cultivos', label: 'Cultivos' },
    { id: 'precio_lotes', label: 'Precios de Lotes' },
];

const Historial = () => {
    const [fuente, setFuente] = useState<tipoFuenteHistorial>('actividades');

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-8">
                <PageHeader
                    title="Historial y Auditoría"
                    subtitle="Registro de cambios del sistema por actividad, cultivo o precio de lote"
                />

                <Tab
                    tabs={FUENTES.map((f) => f.label)}
                    active={FUENTES.find((f) => f.id === fuente)?.label ?? ''}
                    onChange={(label) => {
                        const f = FUENTES.find((x) => x.label === label);
                        if (f) setFuente(f.id);
                    }}
                />

            {fuente === 'actividades' && <HistorialActividades/>}
            {fuente === 'cultivos' && <HistorialCultivos/>}
            {fuente === 'precio_lotes' && <HistorialPreciosLote />}

            </div>
        </DashboardLayout>
    );
};

function HistorialActividades() {
    const [loteId, setLoteId] = useState<string>('');
    const [cultivoSeleccionadoId, setCultivoSeleccionadoId] = useState<string>('');
    const [actividadId, setActividadId] = useState<string>('');

    const loteIdNum = loteId ? Number(loteId) : undefined;
    const cultivoIdNum = cultivoSeleccionadoId ? Number(cultivoSeleccionadoId) : undefined;
    const actividadIdNum = actividadId ? Number(actividadId) : undefined;

    const { data: lotes = []} = useQuery({
        queryKey: ['lotes-select'],
        queryFn: async() => {
            const response = await api.get('/territorio/lotes');
            console.log("Respuesta de lotes recibida:", response.data);
            return Array.isArray(response.data) ? response.data : (response.data?.data || []);
        }
    });

    const { data: cultivos = []} = useQuery({
        queryKey: ['cultivos-por-lote', loteIdNum],
        queryFn: async() => {
            const response = await cultivosApi.listarPorLote(loteIdNum!);
            return response.data || response;
        },
        enabled: !!loteIdNum,
    });

    const { data: actividades = []} = useQuery({
        queryKey: ['actividades-por-cultivo', cultivoIdNum],
        queryFn: async() => {
            const response = await actividadesApi.listarPorCultivo(cultivoIdNum!);
            return response.data || response;
        },
        enabled: !!cultivoIdNum,
    });

    const { historial, loading, error} = useActividadHistorial(actividadIdNum);

    return (

        <div>

            <Card className="mb-6 max-w-sm">
                <Select
                    label="1. Selecciona un Lote:"
                    value={loteId}
                    onChange={(v) => {
                        setLoteId(v);
                        setCultivoSeleccionadoId('');
                        setActividadId('');
                    }}
                    options={[
                        { value: '', label: '-- Elige un lote --' },
                        ...(Array.isArray(lotes) ? lotes : []).map((l: {id: number; nombre?: string; nombreLote?: string }) => ({
                            value: String(l.id),
                            label: l.nombre || l.nombreLote || `Lote #${l.id}`,
                        })),
                    ]}
                />
            </Card>

            {loteIdNum && (
                <Card className="mb-6 max-w-sm">
                    <Select
                        label="2. Seleccionar Cultivo:"
                        value={cultivoSeleccionadoId}
                        onChange={(v) => {
                            setCultivoSeleccionadoId(v);
                            setActividadId('');
                        }}
                        options={[
                            { value: '', label: 'Elige un cultivo' },
                            ...cultivos.map((c: { id: number; nombreCultivo?: string; tipoCultivo?: string }) => ({
                                value: String(c.id),
                                label: c.nombreCultivo || c.tipoCultivo || `Cultivo #${c.id}`,
                            })),
                        ]}
                    />
                </Card>
            )}

            { cultivoIdNum && (
                <Card className="mb-6 max-w-sm">
                    <Select
                        label="3. Seleccionar Actividad:"
                        value={actividadId}
                        onChange={setActividadId}
                        options={[
                            { value: '', label: '-- Elige una actividad --' },
                            ...actividades.map((a: { id: number; tipo?: string }) => ({
                                value: String(a.id),
                                label: a.tipo ? `${a.tipo} (ID: ${a.id})` : `Actividad #${a.id}`,
                            })),
                        ]}
                    />
                </Card>
            )}

            {!loteIdNum && <p className="text-muted-foreground italic text-sm">Primero selecciona un lote para ver sus cultivos.</p> }
            { loteIdNum && !cultivoIdNum && <p className="text-muted-foreground italic text-sm">Selecciona un cultivo para ver sus actividades.</p> }
            {cultivoIdNum && !actividadIdNum && <p className="text-muted-foreground italic text-sm">Selecciona una actividad para consultar su historial.</p>}

        { actividadIdNum && (
            <TimelineContainer loading={loading} error={error} isEmpty={historial.length === 0}>
            {historial.map((h) => (
                <TimelineCard
                key={h.id}
                usuarioId={h.usuarioId}
                tipoLabel="Actividad"
                fecha={h.fechaCreacion}
                motivo={h.motivo}
                cambios={h.cambios}
                />
            ))}
            </TimelineContainer>
        )}
        </div>
    );
}

function HistorialCultivos() {
    const [loteId, setLoteId] = useState<string>('');
    const [cultivoId, setCultivoId] = useState<string>('');

    const loteIdNum = loteId ? Number(loteId): undefined;
    const cultivoIdNum = cultivoId ? Number(cultivoId) : undefined;

    const { data: lotes = []} = useQuery({
        queryKey: ['lotes-select-cultivos-tab'],
        queryFn: async () => (await api.get('/territorio/lotes')).data,
    });

    const { data: cultivos = []} = useQuery({
        queryKey: ['cultivos-por-lote-tab', loteIdNum],
        queryFn: async() => {
            const response = await cultivosApi.listarPorLote(loteIdNum!);
            return response.data || response;
        },
        enabled: !!loteIdNum,
    });

    const { historial, loading, error } = useHistorialCultivo(cultivoIdNum);

    return (
    <div>

        <Card className="mb-6 max-w-sm">
            <Select
                label="Seleccionar Lote:"
                value={loteId}
                onChange={(v) => {
                    setLoteId(v);
                    setCultivoId('');
                }}
                options={[
                    { value: '', label: '-- Elige un lote --' },
                    ...lotes.map((l: { id: number; nombre?: string }) => ({
                        value: String(l.id),
                        label: l.nombre || `Lote #${l.id}`,
                    })),
                ]}
            />
        </Card>

        { loteIdNum && (
            <Card className="mb-6 max-w-sm">
                <Select
                    label="2. Seleccionar Cultivo:"
                    value={cultivoId}
                    onChange={setCultivoId}
                    options={[
                        { value: '', label: 'Elige un cultivo' },
                        ...cultivos.map((c: { id: number; nombreCultivo?: string; tipoCultivo?: string }) => ({
                            value: String(c.id),
                            label: c.nombreCultivo || c.tipoCultivo || `Cultivo #${c.id}`,
                        })),
                    ]}
                />
            </Card>
        )}

        { !loteIdNum && <p className="text-muted-foreground italic text-sm">Primero selecciona un lote para ver sus cultivos.</p> }
        {loteIdNum && !cultivoIdNum && <p className="text-muted-foreground italic text-sm">Selecciona un cultivo para ver su historial.</p>}

        {cultivoIdNum && (
            <TimelineContainer loading={loading} error={error} isEmpty={historial.length === 0}>
                {historial.map((h) => (
                <TimelineCard
                    key={h.id}
                    usuarioId={h.usuarioId}
                    tipoLabel="Cultivo"
                    fecha={new Date().toISOString()}
                    motivo={h.motivo}
                    cambios={h.cambios}
                />
            ))}
        </TimelineContainer>
        )}
    </div>
    );
}

function HistorialPreciosLote() {
    const {registros , loading, error} = useHistorialPreciosLote();

    return (
    <div>
        <TimelineContainer loading={loading} error={error} isEmpty={registros.length === 0}>
        {registros.map((r) => (
            <TimelineCard
                key={r.id}
                usuarioId={r.usuarioId}
                tipoLabel="Precio Lote"
                fecha={r.fecha}
                motivo={r.razon}
                cambios={{
                precio: { anterior: r.precioAnterior, nuevo: r.precioNuevo }
            }}
            />
            ))}
        </TimelineContainer>
    </div>
    );
}

interface TimelineContainerProps {
    loading: boolean;
    error: string | null;
    isEmpty: boolean;
    children: React.ReactNode;
}

function TimelineContainer({ loading, error, isEmpty, children }: TimelineContainerProps) {
    if (loading) return <p className="text-sm text-muted-foreground text-center py-6">Cargando registros...</p>;
    if (error) return <p className="text-sm text-red-600 bg-red-50 p-4 rounded-xl text-center">{error}</p>;
    if (isEmpty) return <EmptyState title="Sin registros" description="No hay registros de cambios disponibles." />;

    return (
        <div className="relative border-l-2 border-primary/20 ml-4 space-y-6">
            {children}
        </div>
    );
}

interface TimelineCardProps {
    usuarioId: number;
    tipoLabel: string;
    fecha: string | Date;
    motivo?: string | null;
    cambios?: Record<string, unknown>;
}

function TimelineCard({ usuarioId, tipoLabel, fecha, motivo, cambios }: TimelineCardProps) {
  return (
    <div className="relative pl-6">
      <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-sm">
        <User size={14} />
      </div>

      <Card>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground text-sm">Usuario #{usuarioId}</span>
            <Badge color="primary">{tipoLabel}</Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {fecha ? new Date(fecha).toLocaleString() : ''}
          </span>
        </div>

        <p className="text-sm text-muted-foreground mb-3 font-medium">Actualización registrada</p>

        {cambios && (
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 mb-3 text-sm font-mono space-y-1">
                {Object.entries(cambios).map(([campo, val]) => {
                const valorCambio = val as { anterior?: unknown; nuevo?: unknown };
                return (
                    <div key={campo} className="flex items-center gap-2 flex-wrap">
                        <span className="text-foreground font-semibold">{campo}:</span>
                        <span className="text-red-500 line-through">{String(valorCambio?.anterior ?? 'N/D')}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-primary font-bold">{String(valorCambio?.nuevo ?? 'N/D')}</span>
                    </div>
                );
                })}
            </div>
            )}

            {motivo && (
                <p className="text-xs text-muted-foreground italic">
                Motivo: "{motivo}"
                </p>
            )}
      </Card>
    </div>
    );
}

export default Historial;