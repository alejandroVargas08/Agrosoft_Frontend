import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Edit2, GraduationCap, LockOpen, Plus, UserCheck, Users, X, XCircle } from 'lucide-react';
import { Badge, Btn, Card, EmptyState, Input, Modal, PageHeader, Select } from '../../components/ui/AgroUI';
import { Aviso, BotonesModal, EstadoUsuarioBadge, Inicial, ModalConfirmar, PaginaAdmin } from '../../components/admin/ComponentesAdmin';
import { fichasAdminApi, usuariosAdminApi } from '../../api/admin/admin';
import { mensajeError } from '../../api/errores/errores';
import { useDatosAdmin, useRefrescarAdmin, type DatosAdmin } from '../../hooks/admin/useDatosAdmin';
import type { FichaResumen } from '../../types/admin/admin';
import { ESTADO_FICHA, fechaCorta, fechaInput, nombreCompleto } from '../../utils/admin/admin';

const TIPOS = ['Tecnólogo', 'Técnico', 'Complementaria', 'Especialización'];

type Dialogo = 'aprendices' | 'instructor' | 'cerrar' | 'editar';

const meses = (inicio: string, fin: string) => Math.max(0, Math.round((new Date(fin).getTime() - new Date(inicio).getTime()) / 2592000000));

const ProgramasFormacion = () => {
    const datos = useDatosAdmin();
    const refrescar = useRefrescarAdmin();
    const [nuevo, setNuevo] = useState(false);
    const [seleccion, setSeleccion] = useState<{ ficha: FichaResumen; dialogo: Dialogo } | null>(null);
    const cerrar = () => setSeleccion(null);
    const elegida = (dialogo: Dialogo) => (seleccion?.dialogo === dialogo ? seleccion.ficha : null);

    const cambiarEstado = useMutation({
        mutationFn: (f: FichaResumen) => fichasAdminApi.actualizar(f.id, { estado: f.estado === 'finalizado' ? 'activo' : 'finalizado' }),
        onSuccess: () => { refrescar(); cerrar(); },
    });

    const fichas = [...(datos.fichas.data ?? [])].sort((a, b) => Number(a.estado === 'finalizado') - Number(b.estado === 'finalizado') || a.ficha.localeCompare(b.ficha));
    const fichaCerrar = elegida('cerrar');
    const reabrir = fichaCerrar?.estado === 'finalizado';

    return (
        <PaginaAdmin>
            <PageHeader title="Programas de Formación" subtitle="Fichas SENA registradas" action={<Btn onClick={() => setNuevo(true)}><Plus size={16} />Nuevo Programa</Btn>} />

            {datos.error && <div className="mb-4"><Aviso tipo="error">{mensajeError(datos.error, 'No se pudieron cargar los programas')}</Aviso></div>}

            {datos.cargando ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map((i) => <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />)}</div>
            ) : fichas.length === 0 ? (
                <EmptyState icon={GraduationCap} title="No hay programas registrados" description="Registra la primera ficha con el botón Nuevo Programa." />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fichas.map((fp) => {
                        const estado = ESTADO_FICHA[fp.estado] ?? { texto: fp.estado, color: 'muted' as const };
                        const activa = fp.estado === 'activo';
                        return (
                            <Card key={fp.id}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="p-2 bg-primary/10 rounded-lg"><GraduationCap size={20} className="text-primary" /></div>
                                    <div className="flex items-center gap-1">
                                        <Badge color={estado.color}>{estado.texto}</Badge>
                                        <button type="button" onClick={() => setSeleccion({ ficha: fp, dialogo: 'editar' })} className="p-1 rounded-md text-muted-foreground hover:bg-muted" aria-label="Editar ficha">
                                            <Edit2 size={13} />
                                        </button>
                                    </div>
                                </div>
                                <p className="font-semibold text-foreground mb-1">{fp.nombre}</p>
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge color="info">{fp.tipo}</Badge>
                                    <span className="font-mono text-xs text-primary font-bold">#{fp.ficha}</span>
                                </div>
                                <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
                                    <UserCheck size={11} />
                                    <span>
                                        Instructor:{' '}
                                        {fp.instructores.length === 0
                                            ? <span className="font-medium text-muted-foreground italic">Sin asignar</span>
                                            : <span className="font-medium text-foreground">{fp.instructores.map(nombreCompleto).join(', ')}</span>}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                                    <div className="p-2 bg-muted rounded-lg text-center"><p className="text-muted-foreground">Aprendices</p><p className="font-bold text-foreground">{fp.totalAprendices}</p></div>
                                    <div className="p-2 bg-muted rounded-lg text-center"><p className="text-muted-foreground">Duración</p><p className="font-bold text-foreground">{meses(fp.fechaInicio, fp.fechaFin)}m</p></div>
                                </div>
                                <div className="text-xs text-muted-foreground mt-2 mb-3">
                                    <p>{fechaCorta(fp.fechaInicio)} — {fechaCorta(fp.fechaFin)}</p>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <Btn size="sm" variant="outline" onClick={() => setSeleccion({ ficha: fp, dialogo: 'aprendices' })}><Users size={12} />Ver aprendices</Btn>
                                    <Btn size="sm" variant="outline" onClick={() => setSeleccion({ ficha: fp, dialogo: 'instructor' })}><UserCheck size={12} />Instructor</Btn>
                                    {activa ? (
                                        <Btn size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setSeleccion({ ficha: fp, dialogo: 'cerrar' })}><XCircle size={12} />Cerrar ficha</Btn>
                                    ) : (
                                        <Btn size="sm" variant="ghost" onClick={() => setSeleccion({ ficha: fp, dialogo: 'cerrar' })}><LockOpen size={12} />Reabrir</Btn>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            <ModalAprendices ficha={elegida('aprendices')} datos={datos} onClose={cerrar} />
            <ModalInstructor ficha={elegida('instructor')} datos={datos} onClose={cerrar} />
            <ModalPrograma abierto={nuevo || !!elegida('editar')} ficha={elegida('editar')} datos={datos} onClose={() => { setNuevo(false); cerrar(); }} />

            <ModalConfirmar
                open={!!fichaCerrar}
                titulo={reabrir ? 'Reabrir ficha' : 'Cerrar ficha'}
                mensaje={reabrir
                    ? <>La ficha <strong>#{fichaCerrar?.ficha}</strong> volverá a estar activa y aparecerá otra vez en el registro.</>
                    : <>Esta acción marcará la ficha <strong>#{fichaCerrar?.ficha}</strong> como finalizada. Ya no aparecerá en el registro de aprendices.</>}
                textoConfirmar={reabrir ? 'Reabrir' : 'Cerrar ficha'}
                peligro={!reabrir}
                cargando={cambiarEstado.isPending}
                error={cambiarEstado.error ? mensajeError(cambiarEstado.error, 'No se pudo cambiar la ficha') : null}
                onConfirmar={() => fichaCerrar && cambiarEstado.mutate(fichaCerrar)}
                onClose={() => { cambiarEstado.reset(); cerrar(); }}
            />
        </PaginaAdmin>
    );
};

const ModalAprendices = ({ ficha, datos, onClose }: { ficha: FichaResumen | null; datos: DatosAdmin; onClose: () => void }) => {
    const aprendices = datos.aprendices
        .filter((a) => a.programaFormacionId === ficha?.id)
        .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), 'es'));
    return (
        <Modal open={!!ficha} onClose={onClose} title={`Aprendices — Ficha ${ficha?.ficha ?? ''}`}>
            <div className="space-y-2">
                {aprendices.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No hay aprendices en esta ficha</p>}
                {aprendices.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                        <Inicial nombre={a.nombre} tamano="sm" />
                        <span className="text-sm font-medium flex-1">{nombreCompleto(a)}</span>
                        <EstadoUsuarioBadge estado={a.estado} />
                    </div>
                ))}
                <p className="text-xs text-muted-foreground text-center pt-2">{aprendices.length} aprendices registrados</p>
            </div>
        </Modal>
    );
};

const ModalInstructor = ({ ficha, datos, onClose }: { ficha: FichaResumen | null; datos: DatosAdmin; onClose: () => void }) => {
    const refrescar = useRefrescarAdmin();
    const [instructorId, setInstructorId] = useState('');
    useEffect(() => setInstructorId(''), [ficha]);
    const actual = ficha ? datos.fichaPorId.get(ficha.id) ?? ficha : null;

    const asignar = useMutation({
        mutationFn: () => usuariosAdminApi.asignarFicha(Number(instructorId), actual!.id),
        onSuccess: () => { refrescar(); onClose(); },
    });
    const quitar = useMutation({
        mutationFn: (usuarioId: number) => usuariosAdminApi.quitarFicha(usuarioId, actual!.id),
        onSuccess: () => refrescar(),
    });

    const disponibles = datos.instructores.filter((i) => !actual?.instructores.some((x) => x.id === i.id));
    const error = asignar.error ?? quitar.error;

    return (
        <Modal open={!!ficha} onClose={onClose} title={`Asignar instructor — Ficha ${actual?.ficha ?? ''}`}>
            <div className="space-y-3">
                {actual && actual.instructores.length > 0 && (
                    <div className="space-y-2">
                        {actual.instructores.map((i) => (
                            <div key={i.id} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                                <Inicial nombre={i.nombre} tamano="sm" />
                                <span className="text-sm font-medium flex-1">{nombreCompleto(i)}</span>
                                <button type="button" onClick={() => quitar.mutate(i.id)} disabled={quitar.isPending} className="p-1 rounded-md text-destructive hover:bg-red-50" aria-label="Quitar instructor">
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <Select
                    label="Instructor"
                    value={instructorId}
                    onChange={setInstructorId}
                    options={[{ value: '', label: disponibles.length ? 'Seleccionar instructor...' : 'No hay más instructores activos' }, ...disponibles.map((i) => ({ value: String(i.id), label: nombreCompleto(i) }))]}
                />
                {error && <Aviso tipo="error">{mensajeError(error, 'No se pudo actualizar el instructor')}</Aviso>}
                <BotonesModal textoConfirmar="Asignar" onConfirmar={() => asignar.mutate()} onCancelar={onClose} cargando={asignar.isPending} deshabilitado={!instructorId} />
            </div>
        </Modal>
    );
};

const FORM_VACIO = { ficha: '', nombre: '', tipo: TIPOS[0], instructorId: '', fechaInicio: '', fechaFin: '' };

const ModalPrograma = ({ abierto, ficha, datos, onClose }: { abierto: boolean; ficha: FichaResumen | null; datos: DatosAdmin; onClose: () => void }) => {
    const refrescar = useRefrescarAdmin();
    const [form, setForm] = useState(FORM_VACIO);
    useEffect(() => {
        setForm(ficha
            ? { ficha: ficha.ficha, nombre: ficha.nombre, tipo: ficha.tipo, instructorId: '', fechaInicio: fechaInput(ficha.fechaInicio), fechaFin: fechaInput(ficha.fechaFin) }
            : FORM_VACIO);
    }, [ficha, abierto]);
    const campo = (clave: keyof typeof FORM_VACIO) => (valor: string) => setForm((f) => ({ ...f, [clave]: valor }));

    const guardar = useMutation({
        mutationFn: async () => {
            const cuerpo = { ficha: form.ficha.trim(), nombre: form.nombre.trim(), tipo: form.tipo, fechaInicio: form.fechaInicio, fechaFin: form.fechaFin };
            if (ficha) {
                await fichasAdminApi.actualizar(ficha.id, cuerpo);
                return;
            }
            const { data } = await fichasAdminApi.crear(cuerpo);
            if (form.instructorId && data?.id) await usuariosAdminApi.asignarFicha(Number(form.instructorId), data.id);
        },
        onSuccess: () => { refrescar(); cerrar(); },
    });

    function cerrar() {
        guardar.reset();
        onClose();
    }

    const fechasMal = !!form.fechaInicio && !!form.fechaFin && form.fechaFin < form.fechaInicio;
    const completo = form.ficha.trim() && form.nombre.trim() && form.fechaInicio && form.fechaFin && !fechasMal;
    const tipos = TIPOS.includes(form.tipo) ? TIPOS : [form.tipo, ...TIPOS];

    return (
        <Modal open={abierto} onClose={cerrar} title={ficha ? `Editar ficha ${ficha.ficha}` : 'Nuevo Programa de Formación'}>
            <div className="space-y-3">
                <Input label="Número de Ficha" value={form.ficha} onChange={campo('ficha')} required placeholder="2756431" />
                <Input label="Nombre del programa" value={form.nombre} onChange={campo('nombre')} required />
                <Select label="Tipo de formación" value={form.tipo} onChange={campo('tipo')} options={tipos} />
                {!ficha && (
                    <Select
                        label="Instructor asignado"
                        value={form.instructorId}
                        onChange={campo('instructorId')}
                        options={[{ value: '', label: 'Sin instructor asignado' }, ...datos.instructores.map((i) => ({ value: String(i.id), label: nombreCompleto(i) }))]}
                    />
                )}
                <div className="grid grid-cols-2 gap-3">
                    <Input label="Fecha inicio" value={form.fechaInicio} onChange={campo('fechaInicio')} type="date" required />
                    <Input label="Fecha fin" value={form.fechaFin} onChange={campo('fechaFin')} type="date" required />
                </div>
                {fechasMal && <p className="text-xs text-red-600">La fecha de fin no puede ser anterior a la de inicio.</p>}
                {guardar.error && <Aviso tipo="error">{mensajeError(guardar.error, 'No se pudo guardar el programa')}</Aviso>}
                <BotonesModal textoConfirmar={ficha ? 'Guardar cambios' : 'Registrar Programa'} onConfirmar={() => guardar.mutate()} onCancelar={cerrar} cargando={guardar.isPending} deshabilitado={!completo} />
            </div>
        </Modal>
    );
};

export default ProgramasFormacion;
