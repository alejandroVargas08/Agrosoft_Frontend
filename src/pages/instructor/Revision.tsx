import { useState } from 'react';
import { Calendar, Check, CheckCircle, ChevronDown, Image as Imagen, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Btn, Card, EmptyState, Modal, PageHeader, Textarea } from '../../components/ui/AgroUI';
import { VisorEvidencias } from '../../components/instructor/GaleriaEvidencias';
import { useRevision } from '../../hooks/instructor/useRevision';
import type { EntregaPorRevisar } from '../../hooks/instructor/useRevision';

type Decision = { entrega: EntregaPorRevisar; accion: 'aprobar' | 'devolver' };

/** "2026-10-30" es solo fecha: new Date() la lee en UTC y en Colombia sale un día antes. */
const aFecha = (valor: string) => {
    const solo = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
    return solo ? new Date(Number(solo[1]), Number(solo[2]) - 1, Number(solo[3])) : new Date(valor);
};

const fecha = (valor: string | null) =>
    valor ? aFecha(valor).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/ de /g, ' ') : '—';

const fechaHora = (valor: string | null) => {
    if (!valor) return '—';
    const d = new Date(valor);
    const dia = d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace(/ de /g, ' ');
    const hora = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${dia}, ${hora}`;
};

const haceCuanto = (valor: string | null) => {
    if (!valor) return '';
    const minutos = Math.floor((Date.now() - new Date(valor).getTime()) / 60000);
    if (minutos < 1) return 'hace un momento';
    if (minutos < 60) return `hace ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `hace ${horas} h`;
    const dias = Math.floor(horas / 24);
    return dias === 1 ? 'hace 1 día' : `hace ${dias} días`;
};

const iniciales = (nombre: string) =>
    nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('');

const horas = (h: number | null) => (h !== null ? `${h} h` : '—');

const Dato = ({ titulo, valor }: { titulo: string; valor: string }) => (
    <div className="rounded-lg bg-muted px-3 py-2">
        <p className="text-[11px] text-muted-foreground">{titulo}</p>
        <p className="text-sm font-semibold text-foreground">{valor}</p>
    </div>
);

const Revision = () => {
    const { entregas, total, cargando, error, errorAccion, procesando, aprobar, devolver } = useRevision();

    const [abiertas, setAbiertas] = useState<Set<number>>(new Set());
    const [decision, setDecision] = useState<Decision | null>(null);
    const [comentario, setComentario] = useState('');
    const [visor, setVisor] = useState<{ entrega: EntregaPorRevisar; indice: number } | null>(null);

    const alternar = (id: number) =>
        setAbiertas((prev) => {
            const sig = new Set(prev);
            if (sig.has(id)) sig.delete(id);
            else sig.add(id);
            return sig;
        });

    const decidir = (entrega: EntregaPorRevisar, accion: 'aprobar' | 'devolver') => {
        setDecision({ entrega, accion });
        setComentario('');
    };

    const cerrar = () => {
        setDecision(null);
        setComentario('');
    };

    const esAprobar = decision?.accion === 'aprobar';
    // Al devolver el comentario es obligatorio: el aprendiz tiene que saber qué corregir
    const faltaMotivo = !esAprobar && comentario.trim().length < 3;

    const confirmar = () => {
        if (!decision) return;
        const avisar = (mensaje: string) => () => { toast.success(mensaje); cerrar(); };
        if (esAprobar) aprobar(decision.entrega.asignacion.id, comentario, avisar('Tarea aprobada'));
        else devolver(decision.entrega.asignacion.id, comentario, avisar('Tarea devuelta'));
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader title="Por revisar" subtitle={`${total} entrega(s) esperan tu revisión`} />

                {(error || errorAccion) && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error || errorAccion}
                    </div>
                )}

                {cargando ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">Cargando entregas...</p>
                ) : entregas.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle}
                        title="No hay entregas pendientes"
                        description="Cuando tus aprendices entreguen actividades, aparecerán aquí para revisión."
                    />
                ) : (
                    <div className="space-y-3">
                        {entregas.map((entrega) => {
                            const { asignacion } = entrega;
                            const abierta = abiertas.has(asignacion.id);
                            const descripcion = asignacion.actividad?.descripcion?.trim();
                            return (
                                <Card key={asignacion.id} className="p-0 overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => alternar(asignacion.id)}
                                        aria-expanded={abierta}
                                        className="w-full flex items-start gap-3 p-4 text-left"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                            {iniciales(entrega.aprendiz)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-foreground">{entrega.aprendiz}</p>
                                            <p className="text-sm text-muted-foreground">{entrega.actividad}</p>
                                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                <span className="inline-flex items-center gap-1">
                                                    <Upload size={12} />Entregó {haceCuanto(asignacion.entregadaEn)}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Calendar size={12} />{horas(asignacion.horasTrabajadas)} trabajadas
                                                </span>
                                                {asignacion.fechaLimite && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Calendar size={12} />Límite {fecha(asignacion.fechaLimite)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Badge color="warning">Entregada</Badge>
                                            <ChevronDown
                                                size={18}
                                                className={'text-muted-foreground transition-transform ' + (abierta ? 'rotate-180' : '')}
                                            />
                                        </div>
                                    </button>

                                    {abierta && (
                                        <div className="px-4 pb-4 space-y-3">
                                            <div className="border-t border-border" />
                                            {descripcion && <p className="text-sm text-foreground">{descripcion}</p>}

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                <Dato titulo="Entregada" valor={fechaHora(asignacion.entregadaEn)} />
                                                <Dato titulo="Horas trabajadas" valor={horas(asignacion.horasTrabajadas)} />
                                                <Dato titulo="Fecha límite" valor={fecha(asignacion.fechaLimite)} />
                                            </div>

                                            {asignacion.comentarioAprendiz && (
                                                <Dato titulo="Comentario del aprendiz" valor={asignacion.comentarioAprendiz} />
                                            )}

                                            {entrega.fotos.length > 0 && (
                                                <div>
                                                    <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                                        <Imagen size={14} />Fotos de evidencia ({entrega.fotos.length})
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {entrega.fotos.map((foto, indice) => (
                                                            <button
                                                                key={foto.id}
                                                                type="button"
                                                                onClick={() => setVisor({ entrega, indice })}
                                                                aria-label={`Ver foto ${indice + 1}`}
                                                                className="h-28 w-28 overflow-hidden rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                                                            >
                                                                <img src={foto.url} alt="" className="h-full w-full object-cover" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex justify-end gap-3 pt-2">
                                                <Btn variant="outline" onClick={() => decidir(entrega, 'devolver')} className="justify-center min-w-40">
                                                    <X size={16} />Devolver
                                                </Btn>
                                                <Btn onClick={() => decidir(entrega, 'aprobar')} className="justify-center min-w-40">
                                                    <Check size={16} />Aprobar
                                                </Btn>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}

                {visor && (
                    <VisorEvidencias
                        fotos={visor.entrega.fotos}
                        indiceInicial={visor.indice}
                        datos={{
                            aprendiz: visor.entrega.aprendiz,
                            actividad: visor.entrega.asignacion.actividad?.nombre ?? visor.entrega.actividad,
                            fecha: fecha(visor.entrega.asignacion.entregadaEn),
                        }}
                        alCerrar={() => setVisor(null)}
                    />
                )}

                <Modal
                    open={!!decision}
                    onClose={cerrar}
                    title={esAprobar ? 'Aprobar tarea' : 'Devolver tarea'}
                >
                    {decision && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                {esAprobar ? (
                                    <>
                                        Estás aprobando la entrega de{' '}
                                        <strong className="text-foreground">{decision.entrega.aprendiz}</strong>.
                                    </>
                                ) : (
                                    <>
                                        ¿Qué debe corregir{' '}
                                        <strong className="text-foreground">{decision.entrega.aprendiz}</strong>?
                                    </>
                                )}
                            </p>

                            <Textarea
                                label={esAprobar ? 'Comentario (opcional)' : 'Motivo de devolución'}
                                rows={3}
                                value={comentario}
                                onChange={setComentario}
                                required={!esAprobar}
                                placeholder={
                                    esAprobar
                                        ? 'Excelente trabajo, bien documentado...'
                                        : 'Falta la foto del área fertilizada...'
                                }
                            />

                            <div className="flex gap-3">
                                <Btn
                                    variant={esAprobar ? 'primary' : 'danger'}
                                    disabled={procesando || faltaMotivo}
                                    onClick={confirmar}
                                    className="flex-1 justify-center"
                                >
                                    {procesando ? 'Guardando...' : esAprobar ? 'Aprobar' : 'Devolver'}
                                </Btn>
                                <Btn variant="outline" onClick={cerrar} className="flex-1 justify-center">
                                    Cancelar
                                </Btn>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default Revision;
