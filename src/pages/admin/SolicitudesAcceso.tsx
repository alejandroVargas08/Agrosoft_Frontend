import { useState } from 'react';
import { UserCheck } from 'lucide-react';
import { Badge, Btn, Card, EmptyState, PageHeader } from '../../components/ui/AgroUI';
import { Aviso, Inicial, ModalAprobar, ModalRechazo, PaginaAdmin } from '../../components/admin/ComponentesAdmin';
import { mensajeError } from '../../api/errores/errores';
import { useDatosAdmin } from '../../hooks/admin/useDatosAdmin';
import { ROL_INSTRUCTOR, type UsuarioAdmin } from '../../types/admin/admin';
import { haceCuanto, nombreCompleto } from '../../utils/admin/admin';

const SolicitudesAcceso = () => {
    const datos = useDatosAdmin();
    const [aprobando, setAprobando] = useState<UsuarioAdmin | null>(null);
    const [rechazando, setRechazando] = useState<UsuarioAdmin | null>(null);
    const solicitudes = datos.solicitudes.data ?? [];

    return (
        <PaginaAdmin>
            <PageHeader title="Solicitudes de acceso" subtitle={`${solicitudes.length} solicitudes pendientes`} />

            {datos.solicitudes.error && <div className="mb-4"><Aviso tipo="error">{mensajeError(datos.solicitudes.error, 'No se pudieron cargar las solicitudes')}</Aviso></div>}

            {datos.solicitudes.isLoading ? (
                <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />)}</div>
            ) : solicitudes.length === 0 ? (
                <EmptyState icon={UserCheck} title="No hay solicitudes pendientes" description="Cuando un instructor o administrador solicite acceso, aparecerá aquí." />
            ) : (
                <div className="space-y-3">
                    {solicitudes.map((usuario) => {
                        const solicitud = usuario.solicitud;
                        const esInstructor = solicitud?.rolSolicitado === ROL_INSTRUCTOR;
                        const fichas = (solicitud?.fichasACargo ?? []).map((id) => datos.fichaPorId.get(id)?.ficha ?? `#${id}`);
                        return (
                            <Card key={usuario.id}>
                                <div className="flex items-start justify-between mb-3 gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Inicial nombre={usuario.nombre} />
                                        <div className="min-w-0">
                                            <p className="font-semibold text-foreground">{nombreCompleto(usuario)}</p>
                                            <p className="text-xs text-muted-foreground truncate">{usuario.correo}</p>
                                            <p className="text-xs text-muted-foreground">CC: {usuario.identificacion}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <Badge color={esInstructor ? 'info' : 'primary'}>{solicitud?.rolSolicitado ?? 'Sin rol'}</Badge>
                                        <p className="text-xs text-muted-foreground">{haceCuanto(solicitud?.solicitadoEn ?? usuario.creadoEn)}</p>
                                    </div>
                                </div>
                                {esInstructor && fichas.length > 0 && (
                                    <div className="p-2 bg-muted rounded-lg mb-3 text-xs">
                                        <p className="text-muted-foreground mb-1">Fichas solicitadas:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {fichas.map((f) => <span key={f} className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-semibold">{f}</span>)}
                                        </div>
                                    </div>
                                )}
                                {!esInstructor && solicitud?.motivo && (
                                    <div className="p-2 bg-muted rounded-lg mb-3">
                                        {solicitud.cargo && <p className="text-xs text-muted-foreground">Cargo: <span className="text-foreground">{solicitud.cargo}</span></p>}
                                        <p className="text-xs text-muted-foreground">Motivo: <span className="text-foreground">{solicitud.motivo}</span></p>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <Btn size="sm" onClick={() => setAprobando(usuario)} className="flex-1 justify-center">Aprobar</Btn>
                                    <Btn variant="danger" size="sm" onClick={() => setRechazando(usuario)} className="flex-1 justify-center">Rechazar</Btn>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            <ModalAprobar usuario={aprobando} datos={datos} onClose={() => setAprobando(null)} />
            <ModalRechazo usuario={rechazando} onClose={() => setRechazando(null)} />
        </PaginaAdmin>
    );
};

export default SolicitudesAcceso;
