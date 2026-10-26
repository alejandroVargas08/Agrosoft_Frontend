import { useState } from 'react';
import { UserCheck } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Badge, Btn, Card, EmptyState, Modal, PageHeader } from '../components/ui/AgroUI';
import { useSolicitudes } from '../hooks/useSolicitudes';
import type { SolicitudAcceso } from '../api/usuarios/solicitudes';

type Decision = { solicitud: SolicitudAcceso; accion: 'aprobar' | 'rechazar' };

const SolicitudesAcceso = () => {
    const { solicitudes, total, cargando, error, errorAccion, procesando, nombreRol, aprobar, rechazar } =
        useSolicitudes();
    const [decision, setDecision] = useState<Decision | null>(null);

    const confirmar = () => {
        if (!decision) return;
        const cerrar = () => setDecision(null);
        if (decision.accion === 'aprobar') aprobar(decision.solicitud.id, cerrar);
        else rechazar(decision.solicitud.id, cerrar);
    };

    const esAprobar = decision?.accion === 'aprobar';
    const nombreCompleto = (s: SolicitudAcceso) => s.nombre + ' ' + s.apellido;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title="Solicitudes de acceso"
                    subtitle={total === 1 ? '1 solicitud pendiente' : total + ' solicitudes pendientes'}
                />

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                        {error}
                    </div>
                )}

                {errorAccion && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                        {errorAccion}
                    </div>
                )}

                {cargando && <p className="text-sm text-muted-foreground">Cargando solicitudes...</p>}

                {!cargando && !error && solicitudes.length === 0 ? (
                    <EmptyState
                        icon={UserCheck}
                        title="No hay solicitudes pendientes"
                        description="Cuando alguien solicite acceso como instructor o administrador, aparecerá aquí."
                    />
                ) : (
                    <div className="space-y-3">
                        {solicitudes.map((s) => (
                            <Card key={s.id}>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {s.nombre.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-foreground truncate">{nombreCompleto(s)}</p>
                                            <p className="text-xs text-muted-foreground truncate">{s.correo}</p>
                                            <p className="text-xs text-muted-foreground">
                                                CC: {s.identificacion} · Tel: {s.telefono}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge color="info">{nombreRol(s.rolId)}</Badge>
                                </div>

                                {s.idFicha && (
                                    <div className="p-2 bg-muted rounded-lg mb-3 text-xs text-muted-foreground">
                                        Ficha: <span className="text-foreground font-semibold">{s.idFicha}</span>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Btn
                                        size="sm"
                                        disabled={procesando}
                                        onClick={() => setDecision({ solicitud: s, accion: 'aprobar' })}
                                        className="flex-1 justify-center"
                                    >
                                        Aprobar
                                    </Btn>
                                    <Btn
                                        variant="danger"
                                        size="sm"
                                        disabled={procesando}
                                        onClick={() => setDecision({ solicitud: s, accion: 'rechazar' })}
                                        className="flex-1 justify-center"
                                    >
                                        Rechazar
                                    </Btn>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <Modal
                    open={!!decision}
                    onClose={() => setDecision(null)}
                    title={esAprobar ? 'Aprobar solicitud' : 'Rechazar solicitud'}
                >
                    {decision && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                {esAprobar ? (
                                    <>
                                        <strong className="text-foreground">{nombreCompleto(decision.solicitud)}</strong> podrá
                                        ingresar a AgroSoft como{' '}
                                        <strong className="text-foreground">{nombreRol(decision.solicitud.rolId)}</strong>.
                                    </>
                                ) : (
                                    <>
                                        <strong className="text-foreground">{nombreCompleto(decision.solicitud)}</strong> no podrá
                                        ingresar. La cuenta queda rechazada y tendrá que volver a registrarse.
                                    </>
                                )}
                            </p>

                            <div className="flex gap-3">
                                <Btn
                                    variant={esAprobar ? 'primary' : 'danger'}
                                    disabled={procesando}
                                    onClick={confirmar}
                                    className="flex-1 justify-center"
                                >
                                    {procesando ? 'Guardando...' : esAprobar ? 'Confirmar' : 'Rechazar'}
                                </Btn>
                                <Btn variant="outline" onClick={() => setDecision(null)} className="flex-1 justify-center">
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

export default SolicitudesAcceso;
