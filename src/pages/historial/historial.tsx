import { useState } from "react"
import type { tipoFuenteHistorial } from "../../types/historial"
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { useActividadHistorial } from "../../hooks/Historial/useActividadHistorial";
import { useHistorialPreciosLote } from "../../hooks/Historial/useHistorialPreciosLote";
import { useHistorialCultivo } from "../../hooks/Historial/useHistorialCultivo";
import { api } from "../../api/axios"; 

const Historial = () => {
    const [fuente, setFuente] = useState<tipoFuenteHistorial>('actividades');

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-8">
                <div className="mb-6">
                        <h1 className="text-3xl font-bold text-neutral-900">Historial y Auditoría</h1>
                        <p className="text-neutral-500 text-base mt-1">Registro de cambios del sistema por actividad, cultivo o precio de lote</p>
                </div>

                <div className="flex gap-2 mb-8 border-b border-neutral-200 pb-4">
                    {[
                    { id: 'actividades' as tipoFuenteHistorial, label: 'Actividad' },
                    { id: 'cultivos' as tipoFuenteHistorial, label: 'Cultivos' },
                    { id: 'precio_lotes' as tipoFuenteHistorial, label: 'Precios de Lotes' },
                    ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFuente(f.id)}
                        className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                        fuente === f.id
                            ? 'bg-[#2d7a3e] text-white shadow-sm'
                            : 'bg-[#edf2ee] text-neutral-600 hover:bg-[#e2ebd7]'
                        }`}
                    >
                        {f.label}
                    </button>
                    ))}
                </div>

            {fuente === 'actividades' && <HistorialActividades/>}
            {fuente === 'cultivos' && <HistorialCultivos/>} {/* Corregido a HistorialCultivos (con mayúscula) */}
            {fuente === 'precio_lotes' && <HistorialPreciosLote />}

            </div>
        </DashboardLayout>
    );
};

function HistorialActividades() {
    const [actividadId, setActividadId] = useState<string>('');
    const actividadIdNum = actividadId ? Number(actividadId) : undefined;

    const { data: actividades = []} = useQuery({
        queryKey: ['actividades-select'],
        queryFn: async() => (await api.get('/actividades')).data,
    });

    const { historial, loading, error} = useActividadHistorial(actividadIdNum);

    return (
        <div>
        <div className="mb-6 max-w-sm bg-white p-4 rounded-2xl shadow-sm border border-neutral-100">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Seleccionar Actividad:</label>
            <select
                value={actividadId}
                onChange={(e) => setActividadId(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-700"
                >
                <option value="">-- Elige una actividad --</option>
                {actividades.map((a: { id: number; tipo?: string }) => (
                <option key={a.id} value={a.id}>{a.tipo ? `${a.tipo} (ID: ${a.id})` : `Actividad #${a.id}`}</option>
                ))}
            </select>
        </div>

        {!actividadIdNum && <p className="text-neutral-400 italic text-sm">Selecciona una actividad para consultar su registro de cambios.</p>}

        {actividadIdNum && (
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

function HistorialCultivos() { // Renombrado a HistorialCultivos
    const [cultivoId, setCultivoId] = useState<string>('');
    const cultivoIdNum = cultivoId ? Number(cultivoId) : undefined;

    const { data: cultivos = []} = useQuery({
        queryKey: ['cultivos-select'],
        queryFn: async() => (await api.get('/cultivos')).data,
    }); 

    const { historial, loading, error } = useHistorialCultivo(cultivoIdNum); // Conectado con el hook real

    return (
    <div>
        <div className="mb-6 max-w-sm bg-white p-4 rounded-2xl shadow-sm border border-neutral-100">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Seleccionar Cultivo:</label>
            <select
                value={cultivoId}
                onChange={(e) => setCultivoId(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 py-2.5 px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-700"
                >
                <option value="">-- Elige un cultivo --</option>
                {cultivos.map((c: { id: number; nombreCultivo?: string }) => (
                <option key={c.id} value={c.id}>{c.nombreCultivo || `Cultivo #${c.id}`}</option>
            ))}
            </select>
        </div>

        {!cultivoIdNum && <p className="text-neutral-400 italic text-sm">Selecciona un cultivo para ver su historial.</p>}

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
  if (loading) return <p className="text-sm text-neutral-500 text-center py-6">Cargando registros...</p>;
  if (error) return <p className="text-sm text-red-600 bg-red-50 p-4 rounded-xl text-center">{error}</p>;
  if (isEmpty) return <p className="text-sm text-neutral-400 italic">No hay registros de cambios disponibles.</p>;

  return (
    <div className="relative border-l-2 border-emerald-200 ml-4 space-y-6">
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
      <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-xs shadow-sm">
        👤
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900 text-sm">Usuario #{usuarioId}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#e2f4ed] text-[#0d5433] font-medium capitalize">
              {tipoLabel}
            </span>
          </div>
          <span className="text-xs text-neutral-400">
            {fecha ? new Date(fecha).toLocaleString() : ''}
          </span>
        </div>

        <p className="text-sm text-neutral-600 mb-3 font-medium">Actualización registrada</p>

        {cambios && (
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 mb-3 text-sm font-mono space-y-1">
                {Object.entries(cambios).map(([campo, val]) => {
                const valorCambio = val as { anterior?: unknown; nuevo?: unknown };
                return (
                    <div key={campo} className="flex items-center gap-2 flex-wrap">
                        <span className="text-neutral-700 font-semibold">{campo}:</span>
                        <span className="text-red-500 line-through">{String(valorCambio?.anterior ?? 'N/D')}</span>
                        <span className="text-neutral-400">→</span>
                        <span className="text-[#0d5433] font-bold">{String(valorCambio?.nuevo ?? 'N/D')}</span>
                    </div>
                );
                })}
            </div>
            )}

            {motivo && (
                <p className="text-xs text-neutral-500 italic">
                Motivo: "{motivo}"
                </p>
            )}
            </div>
        </div>
    );
}

export default Historial;