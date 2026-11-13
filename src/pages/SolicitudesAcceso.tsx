import { useState } from 'react';
import { UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Badge, Btn, Card, EmptyState, Modal, PageHeader, Textarea } from '../components/ui/AgroUI';
import { useSolicitudes } from '../hooks/useSolicitudes';
import type { SolicitudAcceso } from '../api/usuarios/solicitudes';

type Decision = { solicitud: SolicitudAcceso; accion: 'aprobar' | 'rechazar' };

/** "Hace 2h", "Hace 3d". El fmtRelative del diseño. */
const hace = (valor: string) => {
    const ms = Date.now() - new Date(valor).getTime();
    const horas = Math.floor(ms / 3_600_000);
    if (horas < 1) return 'Hace un momento';
    if (horas < 24) return 'Hace ' + horas + 'h';
    return 'Hace ' + Math.floor(ms / 86_400_000) + 'd';
};

const SolicitudesAcceso = () => {
    const { solicitudes, total, cargando, error, errorAccion, procesando, nombreRol, programas, aprobar, rechazar } =
        useSolicitudes();
    const [decision, setDecision] = useState<Decision | null>(null);
    const [motivo, setMotivo] = useState('');
    const [fichas, setFichas] = useState<number[]>([]);

    /** El rol que pidió, que es el que se aprueba; no el que tiene mientras espera. */
    const rolPedido = (s: SolicitudAcceso) => s.solicitud?.rolSolicitado ?? nombreRol(s.rolId);
    const esInstructor = (s: SolicitudAcceso) => rolPedido(s) === 'Instructor';
    const numeroFicha = (id: number) => programas.find((p) => p.id === id)?.ficha ?? '#' + id;
    const nombreCompleto = (s: SolicitudAcceso) => s.nombre + ' ' + s.apellido;

    const abrir = (solicitud: SolicitudAcceso, accion: Decision['accion']) => {
        setDecision({ solicitud, accion });
        setMotivo('');
        // Las casillas arrancan marcadas con las fichas que pidió
        setFichas(solicitud.solicitud?.fichasACargo ?? []);
    };

    const cerrar = () => {
        setDecision(null);
        setMotivo('');
        setFichas([]);
    };

    const alternarFicha = (id: number) =>
        setFichas((actuales) => (actuales.includes(id) ? actuales.filter((f) => f !== id) : [...actuales, id]));

    const esAprobar = decision?.accion === 'aprobar';
    // El backend exige un motivo para rechazar y se lo muestra a la persona cuando intenta entrar
    const faltaMotivo = !esAprobar && motivo.trim().length === 0;

    const confirmar = () => {
        if (!decision) return;
        const { solicitud } = decision;
        if (esAprobar) {
            aprobar(solicitud.id, esInstructor(solicitud) ? fichas : undefined, () => {
                toast.success('Solicitud aprobada');
                cerrar();
            });
        } else {
            rechazar(solicitud.id, motivo.trim(), () => {
                toast.success('Solicitud rechazada');
                cerrar();
            });
        }
    };

    // Solo las fichas activas se pueden dejar a cargo
    const activas = programas.filter((p) => p.estado === 'activo');

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title="Solicitudes de acceso"
                    subtitle={total === 1 ? '1 solicitud pendiente' : total + ' solicitudes pendientes'}
                />

                {(error || errorAccion) && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                        {error || errorAccion}
                    </div>
                )}

                {cargando ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">Cargando solicitudes...</p>
                ) : solicitudes.length === 0 ? (
                    <EmptyState
                        icon={UserCheck}
                        title="No hay solicitudes pendientes"
                        description="Cuando un instructor o administrador solicite acceso, aparecerá aquí."
                    />
                ) : (
                    <div className="space-y-3">
                        {solicitudes.map((s) => {
                            const pedidas = s.solicitud?.fichasACargo ?? [];
                            return (
                                <Card key={s.id}>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {s.nombre.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-foreground truncate">{nombreCompleto(s)}</p>
                                                <p className="text-xs text-muted-foreground truncate">{s.correo}</p>
                                                <p className="text-xs text-muted-foreground">CC: {s.identificacion}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <Badge color={esInstructor(s) ? 'info' : 'primary'}>{rolPedido(s)}</Badge>
                                            <p className="text-xs text-muted-foreground">
                                                {hace(s.solicitud?.solicitadoEn ?? s.creadoEn)}
                                            </p>
                                        </div>
                                    </div>

                                    {pedidas.length > 0 && (
                                        <div className="p-2 bg-muted rounded-lg mb-3 text-xs">
                                            <p className="text-muted-foreground mb-1">Fichas solicitadas:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {pedidas.map((id) => (
                                                    <span key={id} className="bg-chip-bg text-chip-fg px-2 py-0.5 rounded-full text-xs font-semibold">
                                                        {numeroFicha(id)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {s.solicitud?.motivo && (
                                        <div className="p-2 bg-muted rounded-lg mb-3">
                                            <p className="text-xs text-muted-foreground">
                                                Motivo: <span className="text-foreground">{s.solicitud.motivo}</span>
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Btn size="sm" disabled={procesando} onClick={() => abrir(s, 'aprobar')} className="flex-1 justify-center">
                                            Aprobar
                                        </Btn>
                                        <Btn variant="danger" size="sm" disabled={procesando} onClick={() => abrir(s, 'rechazar')} className="flex-1 justify-center">
                                            Rechazar
                                        </Btn>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

                <Modal open={!!decision} onClose={cerrar} title={esAprobar ? 'Aprobar solicitud' : 'Rechazar solicitud'}>
                    {decision && (
                        <div className="space-y-3">
                            {esAprobar ? (
                                <>
                                    <p className="text-sm text-muted-foreground">
                                        Confirmar rol: <strong>{rolPedido(decision.solicitud)}</strong> para{' '}
                                        <strong>{nombreCompleto(decision.solicitud)}</strong>
                                    </p>
                                    {esInstructor(decision.solicitud) && (
                                        <div>
                                            <label className="text-sm font-semibold text-foreground mb-2 block">Fichas a cargo</label>
                                            {activas.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">No hay fichas activas.</p>
                                            ) : (
                                                activas.map((p) => (
                                                    <label key={p.id} className="flex items-center gap-2 py-1.5 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={fichas.includes(p.id)}
                                                            onChange={() => alternarFicha(p.id)}
                                                            className="accent-primary"
                                                        />
                                                        <span className="text-sm">{p.ficha} — {p.nombre}</span>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* El diseño dice que el motivo se manda por correo, pero el
                                        sistema no envía ninguno: se muestra al intentar entrar */}
                                    <p className="text-sm text-muted-foreground">
                                        <strong>{nombreCompleto(decision.solicitud)}</strong> verá el motivo cuando intente
                                        iniciar sesión.
                                    </p>
                                    <Textarea
                                        label="Motivo"
                                        rows={3}
                                        value={motivo}
                                        onChange={setMotivo}
                                        required
                                        placeholder="Indica por qué se rechaza la solicitud..."
                                    />
                                </>
                            )}

                            <div className="flex gap-3">
                                <Btn
                                    variant={esAprobar ? 'primary' : 'danger'}
                                    disabled={procesando || faltaMotivo}
                                    onClick={confirmar}
                                    className="flex-1 justify-center"
                                >
                                    {procesando ? 'Guardando...' : esAprobar ? 'Confirmar' : 'Rechazar'}
                                </Btn>
                                <Btn variant="outline" onClick={cerrar} className="flex-1 justify-center">Cancelar</Btn>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default SolicitudesAcceso;
