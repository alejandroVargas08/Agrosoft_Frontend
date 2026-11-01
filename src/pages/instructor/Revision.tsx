import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Btn, Card, EmptyState, Modal, PageHeader, Textarea } from '../../components/ui/AgroUI';
import { useRevision } from '../../hooks/instructor/useRevision';
import type { EntregaPorRevisar } from '../../hooks/instructor/useRevision';

type Decision = { entrega: EntregaPorRevisar; accion: 'aprobar' | 'devolver' };

const fecha = (valor: string | null) =>
    valor ? new Date(valor).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : '—';

const Dato = ({ titulo, valor, destacado = false }: { titulo: string; valor: string; destacado?: boolean }) => (
    <div className="p-2 bg-muted rounded-lg">
        <p className="text-muted-foreground">{titulo}</p>
        <p className={destacado ? 'font-bold text-primary' : 'font-medium'}>{valor}</p>
    </div>
);

const Revision = () => {
    const {
        entregas, total, fichasDisponibles, ficha, setFicha, soloVencidas, setSoloVencidas,
        cargando, error, errorAccion, procesando, aprobar, devolver,
    } = useRevision();

    const [decision, setDecision] = useState<Decision | null>(null);
    const [comentario, setComentario] = useState('');

    const cerrar = () => {
        setDecision(null);
        setComentario('');
    };

    const esAprobar = decision?.accion === 'aprobar';
    // Al devolver el comentario es obligatorio: el aprendiz tiene que saber qué corregir
    const faltaMotivo = !esAprobar && comentario.trim().length < 3;

    const confirmar = () => {
        if (!decision) return;
        if (esAprobar) aprobar(decision.entrega.asignacion.id, comentario, cerrar);
        else devolver(decision.entrega.asignacion.id, comentario, cerrar);
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title="Por revisar"
                    subtitle={total === 1 ? '1 entrega de tus aprendices' : total + ' entregas de tus aprendices'}
                />

                {(error || errorAccion) && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error || errorAccion}
                    </div>
                )}

                {total > 0 && (
                    <div className="flex flex-wrap gap-3 mb-4 items-center">
                        <select
                            value={ficha}
                            onChange={(e) => setFicha(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                        >
                            <option value="">Todas las fichas</option>
                            {fichasDisponibles.map((f) => (
                                <option key={f} value={f}>Ficha {f}</option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={() => setSoloVencidas(!soloVencidas)}
                            className="flex items-center gap-2 text-sm cursor-pointer select-none"
                        >
                            <span
                                className={
                                    'w-10 h-5 rounded-full relative transition-colors ' +
                                    (soloVencidas ? 'bg-primary' : 'bg-muted')
                                }
                            >
                                <span
                                    className={
                                        'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ' +
                                        (soloVencidas ? 'left-5' : 'left-0.5')
                                    }
                                />
                            </span>
                            Solo vencidas
                        </button>
                    </div>
                )}

                {cargando ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">Cargando entregas...</p>
                ) : entregas.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle}
                        title={total === 0 ? 'No hay entregas pendientes' : 'Nada con esos filtros'}
                        description={
                            total === 0
                                ? 'Cuando tus aprendices entreguen actividades, aparecerán aquí para revisión.'
                                : 'Prueba quitando el filtro de ficha o el de vencidas.'
                        }
                    />
                ) : (
                    <div className="space-y-4">
                        {entregas.map((entrega) => {
                            const { asignacion } = entrega;
                            return (
                                <Card key={asignacion.id} className={asignacion.vencida ? 'border-red-200' : ''}>
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                            {entrega.aprendiz.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0 flex items-start justify-between gap-2 flex-wrap">
                                            <div>
                                                <p className="font-semibold text-foreground">{entrega.aprendiz}</p>
                                                <p className="text-xs text-muted-foreground">Ficha {entrega.ficha}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {entrega.entregadaTarde && <Badge color="warning">Tarde</Badge>}
                                                {asignacion.vencida && <Badge color="danger">Vencida</Badge>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                                        <Dato titulo="Actividad" valor={entrega.actividad} />
                                        <Dato titulo="Lote / Cultivo" valor={entrega.lote + ' · ' + entrega.cultivo} />
                                        <Dato titulo="Entregada" valor={fecha(asignacion.entregadaEn)} />
                                        <Dato
                                            titulo="Horas trabajadas"
                                            valor={asignacion.horasTrabajadas !== null ? asignacion.horasTrabajadas + 'h' : '—'}
                                            destacado
                                        />
                                    </div>

                                    {asignacion.comentarioAprendiz && (
                                        <div className="p-3 bg-muted/50 border border-border rounded-xl mb-3">
                                            <p className="text-xs font-semibold text-foreground mb-1">Comentario del aprendiz:</p>
                                            <p className="text-xs text-muted-foreground">{asignacion.comentarioAprendiz}</p>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Btn
                                            size="sm"
                                            onClick={() => { setDecision({ entrega, accion: 'aprobar' }); setComentario(''); }}
                                            className="flex-1 justify-center"
                                        >
                                            Aprobar
                                        </Btn>
                                        <Btn
                                            variant="danger"
                                            size="sm"
                                            onClick={() => { setDecision({ entrega, accion: 'devolver' }); setComentario(''); }}
                                            className="flex-1 justify-center"
                                        >
                                            Devolver
                                        </Btn>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
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
                                        ? 'Buen trabajo, bien documentado...'
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
