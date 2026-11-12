import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Leaf, Package, Wrench } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Btn, Card, EmptyState, Modal, PageHeader, Tab, Textarea } from '../../components/ui/AgroUI';
import { useNovedadesInstructor } from '../../hooks/novedades/useNovedadesInstructor';
import type { PestanaNovedad } from '../../hooks/novedades/useNovedadesInstructor';
import type { Novedad, TipoNovedad, UrgenciaNovedad } from '../../types/novedades';

const PESTANAS: PestanaNovedad[] = ['Pendientes', 'Atendidas', 'Descartadas'];

const TIPOS: Record<TipoNovedad, { etiqueta: string; icono: typeof Package }> = {
    insumo_bajo: { etiqueta: 'Insumo por acabarse', icono: Package },
    herramienta_danada: { etiqueta: 'Herramienta dañada', icono: Wrench },
    problema_cultivo: { etiqueta: 'Problema en el cultivo', icono: Leaf },
    otro: { etiqueta: 'Otro', icono: AlertCircle },
};

// El backend las guarda en ingles
const URGENCIA: Record<UrgenciaNovedad, { chip: 'muted' | 'progress' | 'danger'; texto: string }> = {
    low: { chip: 'muted', texto: 'Baja' },
    medium: { chip: 'progress', texto: 'Media' },
    high: { chip: 'danger', texto: 'Alta' },
};

/** "Hace 3h", "Hace 2d". Tal cual el fmtRelative del diseño. */
const hace = (valor: string) => {
    const diferencia = Date.now() - new Date(valor).getTime();
    const horas = Math.floor(diferencia / 3600000);
    const dias = Math.floor(diferencia / 86400000);
    if (horas < 1) return 'Hace un momento';
    if (horas < 24) return 'Hace ' + horas + 'h';
    return 'Hace ' + dias + 'd';
};

type Accion = { novedad: Novedad; tipo: 'atender' | 'descartar' };

const NovedadesInstructor = () => {
    const navigate = useNavigate();
    const {
        novedades, pestana, setPestana, conteos, insumo, ficha,
        cargando, error, errorAccion, procesando, atender, descartar,
    } = useNovedadesInstructor();

    const [accion, setAccion] = useState<Accion | null>(null);
    const [respuesta, setRespuesta] = useState('');

    const cerrar = () => {
        setAccion(null);
        setRespuesta('');
    };

    // Descartar obliga a explicar por qué; atender no, como en el diseño
    const descarta = accion?.tipo === 'descartar';
    const valida = !descarta || respuesta.trim().length >= 3;

    const confirmar = () => {
        if (!accion || !valida) return;
        if (descarta) descartar(accion.novedad.id, respuesta.trim(), cerrar);
        else atender(accion.novedad.id, respuesta.trim(), cerrar);
    };

    const etiquetas = PESTANAS.map((p) => p + ' (' + conteos[p] + ')');
    const etiquetaActiva = pestana + ' (' + conteos[pestana] + ')';

    const quien = (n: Novedad) =>
        n.reportadaPor ? n.reportadaPor.nombre + ' ' + n.reportadaPor.apellido : 'Aprendiz';

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader title="Novedades" subtitle="Reportadas por tus aprendices" />

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

                {cargando ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">Cargando novedades...</p>
                ) : novedades.length === 0 ? (
                    <EmptyState
                        icon={AlertCircle}
                        title="Sin novedades en esta categoría"
                        description="Aquí aparecerán las novedades reportadas por tus aprendices."
                    />
                ) : (
                    <div className="space-y-3">
                        {novedades.map((n) => {
                            const meta = TIPOS[n.tipo];
                            const Icono = meta.icono;
                            const alta = n.urgencia === 'high';
                            const item = n.tipo === 'insumo_bajo' ? insumo(n.insumoId) : null;
                            const numeroFicha = ficha(n.reportadaPor?.id);

                            return (
                                <Card key={n.id} className={alta ? 'border-red-200' : ''}>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className={'p-2 rounded-lg shrink-0 ' + (alta ? 'bg-red-100' : 'bg-icon-bg')}>
                                                <Icono size={16} className={alta ? 'text-red-600' : 'text-primary'} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-foreground">{meta.etiqueta}</p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {quien(n)}{numeroFicha ? ' · Ficha ' + numeroFicha : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge color={URGENCIA[n.urgencia].chip}>{URGENCIA[n.urgencia].texto}</Badge>
                                    </div>

                                    <p className="text-sm text-muted-foreground mb-2">{n.descripcion}</p>

                                    {item && (
                                        <div className="flex items-center gap-3 p-2 bg-muted rounded-lg mb-2 text-xs">
                                            <Package size={12} className="text-muted-foreground shrink-0" />
                                            <span className="min-w-0">
                                                Stock actual: <strong>{item.stockDisponible} {item.unidadUso}</strong>
                                                {' / '}Mínimo: {item.stockMinimo} {item.unidadUso}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => navigate('/inventario')}
                                                className="ml-auto text-primary hover:underline font-medium shrink-0"
                                            >
                                                Ir al inventario
                                            </button>
                                        </div>
                                    )}

                                    <p className="text-xs text-muted-foreground mb-3">{hace(n.creadoEn)}</p>

                                    {n.estado === 'pendiente' && (
                                        <div className="flex gap-2">
                                            <Btn
                                                size="sm"
                                                onClick={() => { setAccion({ novedad: n, tipo: 'atender' }); setRespuesta(''); }}
                                                className="flex-1 justify-center"
                                            >
                                                Marcar atendida
                                            </Btn>
                                            <Btn
                                                variant="outline"
                                                size="sm"
                                                onClick={() => { setAccion({ novedad: n, tipo: 'descartar' }); setRespuesta(''); }}
                                                className="flex-1 justify-center"
                                            >
                                                Descartar
                                            </Btn>
                                        </div>
                                    )}

                                    {n.respuestaInstructor && (
                                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg mt-2">
                                            <p className="text-xs text-emerald-700">{n.respuestaInstructor}</p>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}

                <Modal
                    open={accion !== null}
                    onClose={cerrar}
                    title={accion?.tipo === 'descartar' ? 'Descartar novedad' : 'Marcar novedad como atendida'}
                >
                    {accion && (
                        <div className="space-y-3">
                            <Textarea
                                label={descarta ? 'Motivo' : 'Respuesta (opcional)'}
                                value={respuesta}
                                onChange={setRespuesta}
                                placeholder={
                                    descarta
                                        ? 'Indica por qué se descarta esta novedad...'
                                        : 'Indica qué acciones se tomaron...'
                                }
                                rows={3}
                                required={descarta}
                            />

                            <div className="flex gap-3">
                                <Btn
                                    variant={descarta ? 'danger' : 'primary'}
                                    onClick={confirmar}
                                    disabled={!valida || procesando}
                                    className="flex-1 justify-center"
                                >
                                    {procesando ? 'Guardando...' : descarta ? 'Descartar' : 'Confirmar'}
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

export default NovedadesInstructor;
