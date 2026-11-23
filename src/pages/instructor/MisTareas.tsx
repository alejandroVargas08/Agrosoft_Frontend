import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Check, CheckCircle2, ChevronDown, ClipboardList, Image as Imagen, Info, Leaf, Play, Upload } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Btn, Card, EmptyState, Input, Modal, PageHeader, StatusBadge, Tab, Textarea } from '../../components/ui/AgroUI';
import { VisorEvidencias } from '../../components/instructor/GaleriaEvidencias';
import { ActividadEvidenciaApi } from '../../api/actividades/actividadEvidencias';
import { mensajeError } from '../../api/errores/errores';
import { useMisTareas } from '../../hooks/instructor/useMisTareas';
import type { PestanaTarea, TareaPropia } from '../../hooks/instructor/useMisTareas';

const PESTANAS: PestanaTarea[] = ['Pendientes', 'Entregadas', 'Aprobadas'];

/** "2026-10-30" es solo fecha: new Date() la lee en UTC y en Colombia sale un día antes. */
const aFecha = (valor: string) => {
    const solo = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
    return solo ? new Date(Number(solo[1]), Number(solo[2]) - 1, Number(solo[3])) : new Date(valor);
};

const fecha = (valor: string | null) =>
    valor ? aFecha(valor).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/ de /g, ' ') : '—';

const capital = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Igual que la app de escritorio: "Tipo · Subtipo", o solo el tipo. */
const tipoDe = (a: { tipo: string; subtipo: string | null }) =>
    a.subtipo?.trim() ? `${capital(a.tipo)} · ${capital(a.subtipo)}` : capital(a.tipo);

const Dato = ({ titulo, valor }: { titulo: string; valor: string }) => (
    <div className="rounded-lg bg-muted px-3 py-2">
        <p className="text-[11px] text-muted-foreground">{titulo}</p>
        <p className="text-sm font-semibold text-foreground">{valor}</p>
    </div>
);

/** Fotos de la entrega: las que ya subió el aprendiz y el botón para subir más. */
const FotosDeLaTarea = ({ tarea, puedeSubir }: { tarea: TareaPropia; puedeSubir: boolean }) => {
    const queryClient = useQueryClient();
    const entrada = useRef<HTMLInputElement>(null);
    const [visor, setVisor] = useState<number | null>(null);
    const actividadId = tarea.asignacion.actividad?.id;
    const asignacionId = tarea.asignacion.id;
    const clave = ['actividad-evidencias', actividadId, asignacionId];

    const evidencias = useQuery({
        queryKey: clave,
        enabled: !!actividadId,
        queryFn: async () => (await ActividadEvidenciaApi.listar(actividadId!, asignacionId)).data,
    });

    const subir = useMutation({
        mutationFn: (foto: File) => ActividadEvidenciaApi.subirFoto(actividadId!, foto, asignacionId),
        onSuccess: () => { toast.success('Foto subida'); queryClient.invalidateQueries({ queryKey: clave }); },
        onError: (e) => toast.error(mensajeError(e, 'No se pudo subir la foto')),
    });

    const fotos = (evidencias.data ?? []).flatMap((ev) =>
        ev.imagenes.map((url, n) => ({ id: `${ev.id}-${n}`, url, nombre: ev.descripcion ?? `Foto ${n + 1}` })),
    );

    return (
        <div>
            <div className="mb-2 flex items-center justify-between gap-3">
                <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Imagen size={14} />Fotos de evidencia ({fotos.length})
                </p>
                {puedeSubir && actividadId && (
                    <>
                        <Btn variant="outline" size="sm" disabled={subir.isPending} onClick={() => entrada.current?.click()}>
                            <Upload size={14} />{subir.isPending ? 'Subiendo...' : 'Subir foto'}
                        </Btn>
                        <input
                            ref={entrada}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => {
                                const archivo = e.target.files?.[0];
                                if (archivo) subir.mutate(archivo);
                                e.target.value = '';
                            }}
                        />
                    </>
                )}
            </div>

            {evidencias.isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando fotos...</p>
            ) : fotos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Todavía no hay fotos. Sube fotos del trabajo para que tu instructor pueda revisarlo.
                </p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {fotos.map((foto, indice) => (
                        <button
                            key={foto.id}
                            type="button"
                            onClick={() => setVisor(indice)}
                            aria-label={`Ver foto ${indice + 1}`}
                            className="h-28 w-28 overflow-hidden rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <img src={foto.url} alt="" className="h-full w-full object-cover" />
                        </button>
                    ))}
                </div>
            )}

            {visor !== null && (
                <VisorEvidencias
                    fotos={fotos}
                    indiceInicial={visor}
                    datos={{ aprendiz: 'Tu entrega', actividad: tarea.titulo, fecha: fecha(tarea.asignacion.entregadaEn) }}
                    alCerrar={() => setVisor(null)}
                />
            )}
        </div>
    );
};

const MisTareas = () => {
    const navigate = useNavigate();
    const {
        tareas, pestana, setPestana, conteos, cargando, error, errorAccion, procesando,
        iniciar, entregar,
    } = useMisTareas();

    const [abiertas, setAbiertas] = useState<Set<number>>(new Set());
    const [iniciada, setIniciada] = useState<string | null>(null);
    const [porEntregar, setPorEntregar] = useState<TareaPropia | null>(null);
    const [horas, setHoras] = useState('');
    const [comentario, setComentario] = useState('');

    const alternar = (id: number) =>
        setAbiertas((prev) => {
            const sig = new Set(prev);
            if (sig.has(id)) sig.delete(id);
            else sig.add(id);
            return sig;
        });

    const empezar = (tarea: TareaPropia) =>
        iniciar(tarea.asignacion.id, () => {
            setIniciada(tarea.titulo);
            setAbiertas((prev) => new Set(prev).add(tarea.asignacion.id));
        });

    const cerrarEntrega = () => {
        setPorEntregar(null);
        setHoras('');
        setComentario('');
    };

    const horasValidas = Number(horas) > 0;

    const confirmarEntrega = () => {
        if (!porEntregar || !horasValidas) return;
        entregar(porEntregar.asignacion.id, Number(horas), comentario, () => {
            toast.success('Tarea entregada a tu instructor');
            setIniciada(null);
            cerrarEntrega();
        });
    };

    // Las pestañas llevan el conteo en la etiqueta, como en el diseño
    const etiquetas = PESTANAS.map((p) => p + ' (' + conteos[p] + ')');
    const etiquetaActiva = pestana + ' (' + conteos[pestana] + ')';

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader title="Mis tareas" subtitle={`Tienes ${conteos.Pendientes} tarea(s) pendiente(s)`} />

                {(error || errorAccion) && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error || errorAccion}
                    </div>
                )}

                {iniciada && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-[#2D7A3E]">
                        <CheckCircle2 size={16} className="shrink-0" />
                        Iniciaste "{iniciada}". Cuando termines, sube las fotos y entrégala.
                    </div>
                )}

                <Tab
                    tabs={etiquetas}
                    active={etiquetaActiva}
                    onChange={(etiqueta) => setPestana(etiqueta.split(' ')[0] as PestanaTarea)}
                />

                {cargando ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">Cargando tus tareas...</p>
                ) : tareas.length === 0 ? (
                    <EmptyState
                        icon={ClipboardList}
                        title="No tienes tareas en esta categoría"
                        description="Cuando tu instructor te asigne una actividad, aparecerá aquí."
                        action={<Btn variant="outline" onClick={() => navigate('/inicio')}>Ir al inicio</Btn>}
                    />
                ) : (
                    <div className="space-y-3">
                        {tareas.map((tarea) => {
                            const { asignacion } = tarea;
                            const abierta = abiertas.has(asignacion.id);
                            const descripcion = asignacion.actividad?.descripcion?.trim();
                            const trabajando = ['EN_PROGRESO', 'DEVUELTA'].includes(asignacion.estado);
                            return (
                                <Card key={asignacion.id} className={'p-0 overflow-hidden ' + (asignacion.vencida ? 'border-red-200' : '')}>
                                    <button
                                        type="button"
                                        onClick={() => alternar(asignacion.id)}
                                        aria-expanded={abierta}
                                        className="w-full flex items-start gap-3 p-4 text-left"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-foreground text-[15px]">{tarea.titulo}</p>
                                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                <span className={'inline-flex items-center gap-1 ' + (asignacion.vencida ? 'text-red-600 font-semibold' : '')}>
                                                    <Calendar size={12} />
                                                    {asignacion.fechaLimite
                                                        ? (asignacion.vencida ? 'Venció ' : 'Vence ') + fecha(asignacion.fechaLimite)
                                                        : 'Sin fecha límite'}
                                                </span>
                                                {asignacion.actividad?.tipo && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Leaf size={12} />{tipoDe(asignacion.actividad)}
                                                    </span>
                                                )}
                                                <span className="inline-flex items-center gap-1">
                                                    <Info size={12} />Asignó {tarea.asignadaPor}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <StatusBadge status={asignacion.estado} />
                                            <ChevronDown
                                                size={18}
                                                className={'text-muted-foreground transition-transform ' + (abierta ? 'rotate-180' : '')}
                                            />
                                        </div>
                                    </button>

                                    {abierta && (
                                        <div className="px-4 pb-4 space-y-3">
                                            <div className="border-t border-border" />
                                            {descripcion && <p className="text-sm text-muted-foreground">{descripcion}</p>}

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                <Dato titulo="Asignada por" valor={tarea.asignadaPor} />
                                                <Dato titulo="Fecha límite" valor={fecha(asignacion.fechaLimite)} />
                                                <Dato
                                                    titulo="Horas trabajadas"
                                                    valor={asignacion.horasTrabajadas !== null ? `${asignacion.horasTrabajadas} h` : '—'}
                                                />
                                            </div>

                                            {asignacion.estado === 'DEVUELTA' && asignacion.comentarioInstructor && (
                                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                                                    <p className="text-xs font-semibold text-red-700 mb-1">Tu instructor pidió:</p>
                                                    <p className="text-xs text-red-600">{asignacion.comentarioInstructor}</p>
                                                </div>
                                            )}

                                            {asignacion.estado === 'APROBADA' && asignacion.comentarioInstructor && (
                                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                                                    <p className="text-xs font-semibold text-emerald-700 mb-1">Comentario del instructor:</p>
                                                    <p className="text-xs text-emerald-600">{asignacion.comentarioInstructor}</p>
                                                </div>
                                            )}

                                            {asignacion.estado !== 'ASIGNADA' && (
                                                <FotosDeLaTarea tarea={tarea} puedeSubir={trabajando} />
                                            )}

                                            <div className="flex justify-end gap-3 pt-1">
                                                {asignacion.estado === 'ASIGNADA' && (
                                                    <Btn disabled={procesando} onClick={() => empezar(tarea)} className="justify-center min-w-40">
                                                        <Play size={16} />{procesando ? 'Iniciando...' : 'Iniciar tarea'}
                                                    </Btn>
                                                )}
                                                {trabajando && (
                                                    <Btn
                                                        onClick={() => { setPorEntregar(tarea); setHoras(''); setComentario(''); }}
                                                        className="justify-center min-w-40"
                                                    >
                                                        <Check size={16} />Entregar tarea
                                                    </Btn>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}

                <Modal open={!!porEntregar} onClose={cerrarEntrega} title="Entregar tarea">
                    {porEntregar && (
                        <div className="space-y-4">
                            <Input
                                label="Horas trabajadas"
                                type="number"
                                step="0.5"
                                value={horas}
                                onChange={setHoras}
                                required
                                placeholder="Ej: 4.5"
                            />

                            <Textarea
                                label="Comentario para el instructor"
                                rows={3}
                                value={comentario}
                                onChange={setComentario}
                                placeholder="Describe lo que hiciste, dificultades encontradas..."
                            />

                            <Btn
                                disabled={procesando || !horasValidas}
                                onClick={confirmarEntrega}
                                className="w-full justify-center"
                            >
                                {procesando ? 'Entregando...' : 'Entregar'}
                            </Btn>
                        </div>
                    )}
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default MisTareas;
