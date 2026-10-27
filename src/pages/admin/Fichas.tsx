import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle, CalendarDays, GraduationCap, Lock, LockOpen, Map, Pencil, Plus, UserPlus, Users, X } from 'lucide-react';
import { Badge, Btn, Card, EmptyState, Input, Modal, PageHeader, SearchBar, Select } from '../../components/ui/AgroUI';
import { Aviso, Avatar, MenuAcciones, ModalConfirmar, PaginaAdmin } from '../../components/admin/ComponentesAdmin';
import { fichasAdminApi, lotesAdminApi, usuariosAdminApi } from '../../api/admin/admin';
import { mensajeError } from '../../api/errores/errores';
import { useDatosAdmin, useRefrescarAdmin, type DatosAdmin } from '../../hooks/admin/useDatosAdmin';
import type { FichaResumen } from '../../types/admin/admin';
import { coincide, ESTADO_FICHA, fechaCorta, fechaInput, nombreCompleto, TIPOS_FICHA } from '../../utils/admin/admin';

type Dialogo = 'editar' | 'instructores' | 'aprendices' | 'lotes' | 'cerrar';

const FILTROS = [
    { value: 'activo', label: 'Activas' },
    { value: 'finalizado', label: 'Cerradas' },
    { value: '', label: 'Todas' },
];

const Fichas = () => {
    const datos = useDatosAdmin();
    const refrescar = useRefrescarAdmin();
    const [busqueda, setBusqueda] = useState('');
    const [estado, setEstado] = useState('activo');
    const [creando, setCreando] = useState(false);
    const [seleccion, setSeleccion] = useState<{ ficha: FichaResumen; dialogo: Dialogo } | null>(null);

    const lotes = useQuery({
        queryKey: ['admin', 'lotes'],
        queryFn: async () => (await lotesAdminApi.listar()).data,
    });

    const cerrar = () => setSeleccion(null);
    const abrir = (ficha: FichaResumen, dialogo: Dialogo) => setSeleccion({ ficha, dialogo });
    const elegida = (dialogo: Dialogo) => (seleccion?.dialogo === dialogo ? seleccion.ficha : null);

    const cambiarEstado = useMutation({
        mutationFn: (f: FichaResumen) => fichasAdminApi.actualizar(f.id, { estado: f.estado === 'finalizado' ? 'activo' : 'finalizado' }),
        onSuccess: () => { refrescar(); cerrar(); },
    });

    const fichas = useMemo(() => (datos.fichas.data ?? [])
        .filter((f) => !estado || f.estado === estado)
        .filter((f) => coincide(busqueda, f.ficha, f.nombre, f.tipo, ...f.instructores.map(nombreCompleto)))
        .sort((a, b) => a.ficha.localeCompare(b.ficha)), [datos.fichas.data, estado, busqueda]);

    const lotesDe = (fichaId: number) => (lotes.data ?? []).filter((l) => l.programaFormacionId === fichaId);
    const fichaCerrar = elegida('cerrar');

    return (
        <PaginaAdmin>
            <PageHeader
                title="Fichas"
                subtitle="Programas de formación, sus instructores, aprendices y lotes"
                action={<Btn onClick={() => setCreando(true)}><Plus size={16} />Nueva ficha</Btn>}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                <div className="sm:col-span-2"><SearchBar value={busqueda} onChange={setBusqueda} placeholder="Número, programa o instructor" /></div>
                <Select value={estado} onChange={setEstado} options={FILTROS} />
            </div>

            {datos.error && <div className="mb-4"><Aviso tipo="error">{mensajeError(datos.error, 'No se pudieron cargar las fichas')}</Aviso></div>}

            {datos.cargando && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1, 2].map((i) => <div key={i} className="h-56 rounded-xl bg-muted animate-pulse" />)}</div>}

            {!datos.cargando && !datos.error && fichas.length === 0 && (
                <EmptyState icon={GraduationCap} title="No hay fichas" description="Crea la primera ficha o cambia los filtros." />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fichas.map((f) => {
                    const estadoFicha = ESTADO_FICHA[f.estado] ?? { texto: f.estado, color: 'muted' as const };
                    const cerrada = f.estado === 'finalizado';
                    const totalLotes = lotesDe(f.id).length;
                    return (
                        <Card key={f.id} className="flex flex-col gap-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">Ficha</p>
                                    <p className="text-2xl font-bold text-primary font-mono">{f.ficha}</p>
                                    <p className="font-semibold text-foreground truncate">{f.nombre}</p>
                                    <p className="text-xs text-muted-foreground">{f.tipo}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Badge color={estadoFicha.color}>{estadoFicha.texto}</Badge>
                                    <MenuAcciones acciones={[
                                        { label: 'Editar', icon: Pencil, onClick: () => abrir(f, 'editar') },
                                        { label: cerrada ? 'Reabrir ficha' : 'Cerrar ficha', icon: cerrada ? LockOpen : Lock, onClick: () => abrir(f, 'cerrar'), peligro: !cerrada },
                                    ]} />
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <CalendarDays size={13} />{fechaCorta(f.fechaInicio)} — {fechaCorta(f.fechaFin)}
                            </p>

                            <div>
                                <p className="text-xs text-muted-foreground mb-1.5">Instructor a cargo</p>
                                {f.instructores.length === 0 ? (
                                    <p className="text-sm text-[#B45309] flex items-center gap-1.5"><AlertTriangle size={14} />Sin instructor asignado</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {f.instructores.map((i) => (
                                            <span key={i.id} className="inline-flex items-center gap-1.5 text-sm text-foreground">
                                                <Avatar persona={i} tamano="sm" />{nombreCompleto(i)}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { icon: UserPlus, texto: 'Instructores', valor: f.instructores.length, dialogo: 'instructores' as const },
                                    { icon: Users, texto: 'Aprendices', valor: f.totalAprendices, dialogo: 'aprendices' as const },
                                    { icon: Map, texto: 'Lotes', valor: totalLotes, dialogo: 'lotes' as const },
                                ].map(({ icon: Icon, texto, valor, dialogo }) => (
                                    <button
                                        key={texto}
                                        type="button"
                                        onClick={() => abrir(f, dialogo)}
                                        className="rounded-lg bg-muted/60 hover:bg-muted p-2 text-center transition-colors"
                                    >
                                        <Icon size={14} className="mx-auto mb-1 text-primary" />
                                        <p className="text-lg font-bold text-foreground">{valor}</p>
                                        <p className="text-[11px] text-muted-foreground">{texto}</p>
                                    </button>
                                ))}
                            </div>
                        </Card>
                    );
                })}
            </div>

            <ModalFicha abierto={creando} ficha={null} onClose={() => setCreando(false)} />
            <ModalFicha abierto={!!elegida('editar')} ficha={elegida('editar')} onClose={cerrar} />
            <ModalInstructores ficha={elegida('instructores')} datos={datos} onClose={cerrar} />
            <ModalAprendices ficha={elegida('aprendices')} datos={datos} onClose={cerrar} />
            <ModalLotes ficha={elegida('lotes')} datos={datos} onClose={cerrar} />

            <ModalConfirmar
                open={!!fichaCerrar}
                titulo={fichaCerrar?.estado === 'finalizado' ? 'Reabrir ficha' : 'Cerrar ficha'}
                mensaje={fichaCerrar?.estado === 'finalizado'
                    ? <>¿Reabrir la ficha <b>{fichaCerrar?.ficha}</b>? Volverá a aparecer en el registro y en las listas de fichas activas.</>
                    : <>¿Cerrar la ficha <b>{fichaCerrar?.ficha}</b>? Ya no aparecerá en el registro de aprendices. Sus datos, aprendices y lotes se conservan.</>}
                textoConfirmar={fichaCerrar?.estado === 'finalizado' ? 'Reabrir' : 'Cerrar ficha'}
                peligro={fichaCerrar?.estado !== 'finalizado'}
                cargando={cambiarEstado.isPending}
                error={cambiarEstado.error ? mensajeError(cambiarEstado.error, 'No se pudo cambiar el estado de la ficha') : null}
                onConfirmar={() => fichaCerrar && cambiarEstado.mutate(fichaCerrar)}
                onClose={() => { cambiarEstado.reset(); cerrar(); }}
            />
        </PaginaAdmin>
    );
};

const FORM_VACIO = { nombre: '', tipo: TIPOS_FICHA[0], ficha: '', fechaInicio: '', fechaFin: '' };

const ModalFicha = ({ abierto, ficha, onClose }: { abierto: boolean; ficha: FichaResumen | null; onClose: () => void }) => {
    const refrescar = useRefrescarAdmin();
    const [form, setForm] = useState(FORM_VACIO);
    useEffect(() => {
        setForm(ficha
            ? { nombre: ficha.nombre, tipo: ficha.tipo, ficha: ficha.ficha, fechaInicio: fechaInput(ficha.fechaInicio), fechaFin: fechaInput(ficha.fechaFin) }
            : FORM_VACIO);
    }, [ficha, abierto]);
    const campo = (clave: keyof typeof FORM_VACIO) => (valor: string) => setForm((f) => ({ ...f, [clave]: valor }));

    const guardar = useMutation({
        mutationFn: async () => {
            const cuerpo = { ...form, nombre: form.nombre.trim(), ficha: form.ficha.trim() };
            if (ficha) await fichasAdminApi.actualizar(ficha.id, cuerpo);
            else await fichasAdminApi.crear(cuerpo);
        },
        onSuccess: () => { refrescar(); cerrar(); },
    });
    const cerrar = () => { guardar.reset(); onClose(); };

    const fechasMal = form.fechaInicio && form.fechaFin && form.fechaFin < form.fechaInicio;
    const completo = form.nombre.trim() && form.ficha.trim() && form.fechaInicio && form.fechaFin && !fechasMal;
    const tipos = TIPOS_FICHA.includes(form.tipo) ? TIPOS_FICHA : [form.tipo, ...TIPOS_FICHA];

    return (
        <Modal open={abierto} onClose={cerrar} title={ficha ? `Editar ficha ${ficha.ficha}` : 'Nueva ficha'}>
            <div className="space-y-3">
                <Input label="Programa de formación" value={form.nombre} onChange={campo('nombre')} required placeholder="Ej: Gestión de empresas agropecuarias" />
                <div className="grid grid-cols-2 gap-3">
                    <Input label="Número de ficha" value={form.ficha} onChange={campo('ficha')} required placeholder="Ej: 2873456" />
                    <Select label="Tipo" value={form.tipo} onChange={campo('tipo')} options={tipos} />
                    <Input label="Fecha de inicio" type="date" value={form.fechaInicio} onChange={campo('fechaInicio')} required />
                    <Input label="Fecha de fin" type="date" value={form.fechaFin} onChange={campo('fechaFin')} required />
                </div>
                {fechasMal && <Aviso tipo="alerta">La fecha de fin no puede ser anterior a la de inicio.</Aviso>}
                {guardar.error && <Aviso tipo="error">{mensajeError(guardar.error, 'No se pudo guardar la ficha')}</Aviso>}
                <div className="flex justify-end gap-2 pt-1">
                    <Btn variant="outline" onClick={cerrar}>Cancelar</Btn>
                    <Btn onClick={() => guardar.mutate()} disabled={!completo || guardar.isPending}>{guardar.isPending ? 'Guardando...' : ficha ? 'Guardar cambios' : 'Crear ficha'}</Btn>
                </div>
            </div>
        </Modal>
    );
};

const ModalInstructores = ({ ficha, datos, onClose }: { ficha: FichaResumen | null; datos: DatosAdmin; onClose: () => void }) => {
    const refrescar = useRefrescarAdmin();
    const [instructorId, setInstructorId] = useState('');
    useEffect(() => setInstructorId(''), [ficha]);
    const actual = ficha ? datos.fichaPorId.get(ficha.id) ?? ficha : null;

    const asignar = useMutation({
        mutationFn: () => usuariosAdminApi.asignarFicha(Number(instructorId), actual!.id),
        onSuccess: () => { setInstructorId(''); refrescar(); },
    });
    const quitar = useMutation({
        mutationFn: (usuarioId: number) => usuariosAdminApi.quitarFicha(usuarioId, actual!.id),
        onSuccess: () => refrescar(),
    });

    const disponibles = datos.instructores.filter((i) => !actual?.instructores.some((x) => x.id === i.id));
    const error = asignar.error ?? quitar.error;

    return (
        <Modal open={!!ficha} onClose={onClose} title={`Instructores · Ficha ${actual?.ficha ?? ''}`}>
            <div className="space-y-4">
                {actual?.instructores.length === 0 ? (
                    <Aviso tipo="alerta">Esta ficha no tiene instructor. Asígnale uno para que pueda crear y revisar actividades.</Aviso>
                ) : (
                    <div className="divide-y divide-border rounded-xl border border-border">
                        {actual?.instructores.map((i) => (
                            <div key={i.id} className="flex items-center justify-between gap-3 p-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar persona={i} tamano="sm" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">{nombreCompleto(i)}</p>
                                        <p className="text-xs text-muted-foreground truncate">{i.correo}</p>
                                    </div>
                                </div>
                                <Btn variant="ghost" size="sm" onClick={() => quitar.mutate(i.id)} disabled={quitar.isPending} className="text-red-600"><X size={14} />Quitar</Btn>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-end gap-2">
                    <Select
                        label="Asignar instructor"
                        value={instructorId}
                        onChange={setInstructorId}
                        options={[{ value: '', label: disponibles.length ? 'Selecciona un instructor' : 'No hay más instructores activos' }, ...disponibles.map((i) => ({ value: String(i.id), label: `${nombreCompleto(i)} · ${i.correo}` }))]}
                        className="flex-1 min-w-0"
                    />
                    <Btn onClick={() => asignar.mutate()} disabled={!instructorId || asignar.isPending}><Plus size={15} />Asignar</Btn>
                </div>

                {error && <Aviso tipo="error">{mensajeError(error, 'No se pudo actualizar los instructores')}</Aviso>}
                <div className="flex justify-end"><Btn variant="outline" onClick={onClose}>Cerrar</Btn></div>
            </div>
        </Modal>
    );
};

const ModalAprendices = ({ ficha, datos, onClose }: { ficha: FichaResumen | null; datos: DatosAdmin; onClose: () => void }) => {
    const refrescar = useRefrescarAdmin();
    const [busqueda, setBusqueda] = useState('');
    const [nuevoId, setNuevoId] = useState('');
    useEffect(() => { setBusqueda(''); setNuevoId(''); }, [ficha]);

    const mover = useMutation({
        mutationFn: ({ usuarioId, fichaId }: { usuarioId: number; fichaId: number | null }) => usuariosAdminApi.cambiarFicha(usuarioId, fichaId),
        onSuccess: () => { setNuevoId(''); refrescar(); },
    });

    const deLaFicha = datos.aprendices
        .filter((a) => a.programaFormacionId === ficha?.id)
        .filter((a) => coincide(busqueda, nombreCompleto(a), a.correo, a.identificacion))
        .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), 'es'));
    const sinFicha = datos.aprendices.filter((a) => !a.programaFormacionId && a.estado === 'activo');

    return (
        <Modal open={!!ficha} onClose={onClose} title={`Aprendices · Ficha ${ficha?.ficha ?? ''}`}>
            <div className="space-y-4">
                <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar aprendiz" />
                {deLaFicha.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No hay aprendices en esta ficha</p>
                ) : (
                    <div className="max-h-72 overflow-y-auto divide-y divide-border rounded-xl border border-border">
                        {deLaFicha.map((a) => (
                            <div key={a.id} className="flex items-center justify-between gap-3 p-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar persona={a} tamano="sm" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">{nombreCompleto(a)}</p>
                                        <p className="text-xs text-muted-foreground truncate">{a.identificacion} · {a.correo}</p>
                                    </div>
                                </div>
                                <Btn variant="ghost" size="sm" onClick={() => mover.mutate({ usuarioId: a.id, fichaId: null })} disabled={mover.isPending} className="text-red-600"><X size={14} />Quitar</Btn>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-end gap-2">
                    <Select
                        label="Agregar aprendiz sin ficha"
                        value={nuevoId}
                        onChange={setNuevoId}
                        options={[{ value: '', label: sinFicha.length ? 'Selecciona un aprendiz' : 'Todos los aprendices tienen ficha' }, ...sinFicha.map((a) => ({ value: String(a.id), label: `${nombreCompleto(a)} · ${a.identificacion}` }))]}
                        className="flex-1 min-w-0"
                    />
                    <Btn onClick={() => mover.mutate({ usuarioId: Number(nuevoId), fichaId: ficha!.id })} disabled={!nuevoId || mover.isPending}><Plus size={15} />Agregar</Btn>
                </div>

                {mover.error && <Aviso tipo="error">{mensajeError(mover.error, 'No se pudo mover al aprendiz')}</Aviso>}
                <div className="flex justify-end"><Btn variant="outline" onClick={onClose}>Cerrar</Btn></div>
            </div>
        </Modal>
    );
};

const ModalLotes = ({ ficha, datos, onClose }: { ficha: FichaResumen | null; datos: DatosAdmin; onClose: () => void }) => {
    const refrescar = useRefrescarAdmin();
    const lotes = useQuery({
        queryKey: ['admin', 'lotes'],
        queryFn: async () => (await lotesAdminApi.listar()).data,
        enabled: !!ficha,
    });
    const asignar = useMutation({
        mutationFn: ({ loteId, fichaId }: { loteId: number; fichaId: number | null }) => lotesAdminApi.asignarFicha(loteId, fichaId),
        onSuccess: () => refrescar(),
    });

    const lista = [...(lotes.data ?? [])].sort((a, b) => {
        const propioA = a.programaFormacionId === ficha?.id ? 0 : 1;
        const propioB = b.programaFormacionId === ficha?.id ? 0 : 1;
        return propioA - propioB || a.nombre.localeCompare(b.nombre, 'es');
    });

    return (
        <Modal open={!!ficha} onClose={onClose} title={`Lotes · Ficha ${ficha?.ficha ?? ''}`}>
            <div className="space-y-4">
                <Aviso>Los aprendices e instructores de la ficha ven los lotes asignados a ella. Un lote sin ficha lo ven todos.</Aviso>
                {lotes.isLoading ? (
                    <div className="h-40 rounded-xl bg-muted animate-pulse" />
                ) : lista.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No hay lotes registrados</p>
                ) : (
                    <div className="max-h-80 overflow-y-auto divide-y divide-border rounded-xl border border-border">
                        {lista.map((lote) => {
                            const propio = lote.programaFormacionId === ficha?.id;
                            const otra = lote.programaFormacionId ? datos.fichaPorId.get(lote.programaFormacionId) : null;
                            return (
                                <div key={lote.id} className="flex items-center justify-between gap-3 p-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">{lote.nombre}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {propio ? 'Asignado a esta ficha' : otra ? `Ficha ${otra.ficha}` : 'Sin ficha · visible para todos'}
                                        </p>
                                    </div>
                                    {propio ? (
                                        <Btn variant="ghost" size="sm" className="text-red-600" disabled={asignar.isPending} onClick={() => asignar.mutate({ loteId: lote.id, fichaId: null })}>
                                            <X size={14} />Quitar
                                        </Btn>
                                    ) : (
                                        <Btn variant="outline" size="sm" disabled={asignar.isPending} onClick={() => asignar.mutate({ loteId: lote.id, fichaId: ficha!.id })}>
                                            <Plus size={14} />Asignar
                                        </Btn>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                {lotes.error && <Aviso tipo="error">{mensajeError(lotes.error, 'No se pudieron cargar los lotes')}</Aviso>}
                {asignar.error && <Aviso tipo="error">{mensajeError(asignar.error, 'No se pudo asignar el lote')}</Aviso>}
                <div className="flex justify-end"><Btn variant="outline" onClick={onClose}>Cerrar</Btn></div>
            </div>
        </Modal>
    );
};

export default Fichas;
