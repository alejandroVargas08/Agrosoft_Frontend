import { useState } from 'react';
import { AlertTriangle, Box, CheckCircle2, Inbox, Leaf, Wrench, XCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Btn, Card, EmptyState, Modal, PageHeader, StatusBadge, Tab, Textarea } from '../../components/ui/AgroUI';
import { useNovedadesInstructor } from '../../hooks/novedades/useNovedadesInstructor';
import type { PestanaNovedad } from '../../hooks/novedades/useNovedadesInstructor';
import type { Novedad, TipoNovedad } from '../../types/novedades';

const PESTANAS: PestanaNovedad[] = ['Pendientes', 'Atendidas', 'Descartadas'];

const TIPOS: Record<TipoNovedad, { etiqueta: string; icono: typeof Box }> = {
    insumo_bajo: { etiqueta: 'Insumo por acabarse', icono: Box },
    herramienta_danada: { etiqueta: 'Herramienta dañada', icono: Wrench },
    problema_cultivo: { etiqueta: 'Problema en el cultivo', icono: Leaf },
    otro: { etiqueta: 'Otro', icono: AlertTriangle },
};

const fecha = (valor: string | null) =>
    valor ? new Date(valor).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

type Accion = { novedad: Novedad; tipo: 'atender' | 'descartar' };

const NovedadesInstructor = () => {
    const {
        novedades, pestana, setPestana, conteos, insumo,
        cargando, error, errorAccion, procesando, atender, descartar,
    } = useNovedadesInstructor();

    const [accion, setAccion] = useState<Accion | null>(null);
    const [respuesta, setRespuesta] = useState('');

    const cerrar = () => {
        setAccion(null);
        setRespuesta('');
    };

    // El backend exige la respuesta en los dos casos: el aprendiz tiene que saber en qué quedó
    const valida = respuesta.trim().length >= 3;

    const confirmar = () => {
        if (!accion || !valida) return;
        const guardar = accion.tipo === 'atender' ? atender : descartar;
        guardar(accion.novedad.id, respuesta.trim(), cerrar);
    };

    const etiquetas = PESTANAS.map((p) => p + ' (' + conteos[p] + ')');
    const etiquetaActiva = pestana + ' (' + conteos[pestana] + ')';

    const quien = (n: Novedad) =>
        n.reportadaPor ? n.reportadaPor.nombre + ' ' + n.reportadaPor.apellido : 'Aprendiz';

    /** Lo que el aprendiz señaló, con el stock real cuando es un insumo. */
    const detalle = (n: Novedad) => {
        if (n.tipo === 'insumo_bajo') {
            const item = insumo(n.insumoId);
            if (!item) return n.insumoId !== null ? 'Insumo #' + n.insumoId : '';
            return item.nombre + ' — quedan ' + item.stockDisponible + ' ' + item.unidadUso +
                ' (mínimo ' + item.stockMinimo + ')';
        }
        if (n.tipo === 'herramienta_danada') return n.nombreHerramienta ?? '';
        return '';
    };

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title="Novedades"
                    subtitle="Lo que reportan los aprendices de tus fichas"
                />

                {(error || errorAccion) && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error || errorAccion}
                    </div>
                )}

                <Tab
                    tabs={etiquetas}
                    active={etiquetaActiva}
                    onChange={(valor) => setPestana(valor.split(' ')[0] as PestanaNovedad)}
                />

                <div className="mt-4">
                    {cargando ? (
                        <Card className="p-6 text-sm text-muted-foreground">Cargando novedades...</Card>
                    ) : novedades.length === 0 ? (
                        <EmptyState
                            icon={Inbox}
                            title={
                                pestana === 'Pendientes'
                                    ? 'No hay novedades pendientes'
                                    : 'No hay novedades ' + pestana.toLowerCase()
                            }
                            description={
                                pestana === 'Pendientes'
                                    ? 'Cuando un aprendiz reporte algo, te aparece aquí para que le respondas.'
                                    : 'Las novedades que resuelvas quedan guardadas en esta pestaña.'
                            }
                        />
                    ) : (
                        <div className="space-y-3">
                            {novedades.map((n) => {
                                const meta = TIPOS[n.tipo];
                                const Icono = meta.icono;
                                const extra = detalle(n);
                                return (
                                    <Card key={n.id} className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 grid place-items-center">
                                                <Icono className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-bold text-foreground">{quien(n)}</p>
                                                    <StatusBadge status={n.urgencia} />
                                                    {n.estado !== 'pendiente' && <StatusBadge status={n.estado} />}
                                                </div>
                                                <p className="text-sm font-semibold text-muted-foreground">
                                                    {meta.etiqueta}{extra && ' · ' + extra}
                                                </p>
                                                <p className="mt-1.5 text-sm text-foreground/90">{n.descripcion}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Reportada el {fecha(n.creadoEn)}
                                                </p>

                                                {n.respuestaInstructor && (
                                                    <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3">
                                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                                                            Tu respuesta · {fecha(n.respondidaEn)}
                                                        </p>
                                                        <p className="mt-1 text-sm text-foreground/90">{n.respuestaInstructor}</p>
                                                    </div>
                                                )}

                                                {n.estado === 'pendiente' && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <Btn size="sm" onClick={() => setAccion({ novedad: n, tipo: 'atender' })}>
                                                            <CheckCircle2 className="w-4 h-4" /> Atender
                                                        </Btn>
                                                        <Btn
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setAccion({ novedad: n, tipo: 'descartar' })}
                                                        >
                                                            <XCircle className="w-4 h-4" /> Descartar
                                                        </Btn>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <Modal
                open={accion !== null}
                onClose={cerrar}
                title={accion?.tipo === 'descartar' ? 'Descartar novedad' : 'Atender novedad'}
            >
                {accion && (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-border bg-muted/40 p-3">
                            <p className="text-sm font-bold text-foreground">
                                {quien(accion.novedad)} · {TIPOS[accion.novedad.tipo].etiqueta}
                            </p>
                            <p className="mt-1 text-sm text-foreground/90">{accion.novedad.descripcion}</p>
                        </div>

                        <Textarea
                            label={accion.tipo === 'descartar' ? '¿Por qué la descartas?' : '¿Qué se hizo?'}
                            value={respuesta}
                            onChange={setRespuesta}
                            placeholder={
                                accion.tipo === 'descartar'
                                    ? 'Explícale al aprendiz por qué no se va a atender'
                                    : 'Cuéntale qué se hizo o qué sigue'
                            }
                            rows={4}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            La respuesta es obligatoria: el aprendiz tiene que saber en qué quedó lo que reportó.
                        </p>

                        <div className="flex justify-end gap-2 pt-1">
                            <Btn variant="ghost" onClick={cerrar} disabled={procesando}>Cancelar</Btn>
                            <Btn
                                variant={accion.tipo === 'descartar' ? 'danger' : 'primary'}
                                onClick={confirmar}
                                disabled={!valida || procesando}
                            >
                                {procesando ? 'Guardando...' : accion.tipo === 'descartar' ? 'Descartar' : 'Marcar atendida'}
                            </Btn>
                        </div>
                    </div>
                )}
            </Modal>
        </DashboardLayout>
    );
};

export default NovedadesInstructor;
