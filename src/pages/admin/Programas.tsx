import { useState } from 'react';
import { GraduationCap, Plus, UserCheck, Users, X } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Btn, Card, EmptyState, Input, Modal, PageHeader, SearchBar, Select, StatusBadge } from '../../components/ui/AgroUI';
import { useAprendicesDeFicha, useProgramas } from '../../hooks/admin/useProgramas';
import type { ProgramaConResumen } from '../../api/programa_formacion/programasFormacion';

const TIPOS = ['Tecnólogo', 'Técnico', 'Operario', 'Auxiliar', 'Complementaria', 'Especialización'];

const fecha = (valor: string) =>
    new Date(valor).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

const meses = (inicio: string, fin: string) =>
    Math.max(0, Math.round((new Date(fin).getTime() - new Date(inicio).getTime()) / 2592000000));

const FORM_VACIO = { nombre: '', tipo: TIPOS[0], ficha: '', fechaInicio: '', fechaFin: '' };

const Programas = () => {
    const {
        programas, total, instructores, busqueda, setBusqueda,
        cargando, error, errorAccion, procesando,
        crear, cerrar, asignarInstructor, quitarInstructor,
    } = useProgramas();

    const [formAbierto, setFormAbierto] = useState(false);
    const [form, setForm] = useState(FORM_VACIO);
    const [verAprendices, setVerAprendices] = useState<ProgramaConResumen | null>(null);
    const [verInstructores, setVerInstructores] = useState<ProgramaConResumen | null>(null);
    const [porCerrar, setPorCerrar] = useState<ProgramaConResumen | null>(null);
    const [instructorElegido, setInstructorElegido] = useState('');

    const { aprendices, cargando: cargandoAprendices } = useAprendicesDeFicha(verAprendices?.id ?? null);

    const campo = (clave: keyof typeof FORM_VACIO) => (valor: string) =>
        setForm((f) => ({ ...f, [clave]: valor }));

    const formCompleto =
        form.nombre.trim() && form.ficha.trim() && form.fechaInicio && form.fechaFin;

    const guardar = () => {
        if (!formCompleto) return;
        crear(
            {
                nombre: form.nombre.trim(),
                tipo: form.tipo,
                ficha: form.ficha.trim(),
                fechaInicio: form.fechaInicio,
                fechaFin: form.fechaFin,
            },
            () => { setFormAbierto(false); setForm(FORM_VACIO); },
        );
    };

    // Los que todavía no están a cargo de esta ficha
    const disponibles = verInstructores
        ? instructores.filter((i) => !verInstructores.instructores.some((x) => x.id === i.id))
        : [];

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title="Programas de formación"
                    subtitle={total === 1 ? '1 ficha registrada' : total + ' fichas registradas'}
                    action={
                        <Btn onClick={() => { setForm(FORM_VACIO); setFormAbierto(true); }}>
                            <Plus size={16} />Nuevo programa
                        </Btn>
                    }
                />

                {(error || errorAccion) && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error || errorAccion}
                    </div>
                )}

                {total > 0 && (
                    <div className="mb-4 max-w-md">
                        <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre o ficha..." />
                    </div>
                )}

                {cargando ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">Cargando programas...</p>
                ) : programas.length === 0 ? (
                    <EmptyState
                        icon={GraduationCap}
                        title={total === 0 ? 'Sin programas registrados' : 'Nada con esa búsqueda'}
                        description={
                            total === 0
                                ? 'Registra la primera ficha para poder asignarle instructores y aprendices.'
                                : 'Prueba con otro nombre o número de ficha.'
                        }
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {programas.map((p) => (
                            <Card key={p.id}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <GraduationCap size={20} className="text-primary" />
                                    </div>
                                    <StatusBadge status={p.estado} />
                                </div>

                                <p className="font-semibold text-foreground mb-1">{p.nombre}</p>
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge color="info">{p.tipo}</Badge>
                                    <span className="font-mono text-xs text-primary font-bold">#{p.ficha}</span>
                                </div>

                                <div className="flex items-start gap-1 mb-2 text-xs text-muted-foreground">
                                    <UserCheck size={11} className="mt-0.5 shrink-0" />
                                    <span>
                                        Instructor:{' '}
                                        {p.instructores.length === 0 ? (
                                            <span className="italic">Sin asignar</span>
                                        ) : (
                                            <span className="font-medium text-foreground">
                                                {p.instructores.map((i) => i.nombre + ' ' + i.apellido).join(', ')}
                                            </span>
                                        )}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                                    <div className="p-2 bg-muted rounded-lg text-center">
                                        <p className="text-muted-foreground">Aprendices</p>
                                        <p className="font-bold text-foreground">{p.totalAprendices}</p>
                                    </div>
                                    <div className="p-2 bg-muted rounded-lg text-center">
                                        <p className="text-muted-foreground">Duración</p>
                                        <p className="font-bold text-foreground">{meses(p.fechaInicio, p.fechaFin)}m</p>
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground mt-2 mb-3">
                                    {fecha(p.fechaInicio)} — {fecha(p.fechaFin)}
                                </p>

                                <div className="flex gap-2 flex-wrap">
                                    <Btn size="sm" variant="outline" onClick={() => setVerAprendices(p)}>
                                        <Users size={12} />Aprendices
                                    </Btn>
                                    <Btn
                                        size="sm"
                                        variant="outline"
                                        onClick={() => { setInstructorElegido(''); setVerInstructores(p); }}
                                    >
                                        <UserCheck size={12} />Instructores
                                    </Btn>
                                    {p.estado === 'activo' && (
                                        <Btn size="sm" variant="ghost" onClick={() => setPorCerrar(p)}>
                                            Cerrar ficha
                                        </Btn>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <Modal
                    open={!!verAprendices}
                    onClose={() => setVerAprendices(null)}
                    title={verAprendices ? 'Aprendices — Ficha ' + verAprendices.ficha : ''}
                >
                    {cargandoAprendices ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">Cargando...</p>
                    ) : aprendices.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            Esta ficha todavía no tiene aprendices registrados.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {aprendices.map((a) => (
                                <div key={a.id} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                        {a.nombre.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{a.nombre} {a.apellido}</p>
                                        <p className="text-xs text-muted-foreground truncate">{a.correo}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Modal>

                <Modal
                    open={!!verInstructores}
                    onClose={() => setVerInstructores(null)}
                    title={verInstructores ? 'Instructores — Ficha ' + verInstructores.ficha : ''}
                >
                    {verInstructores && (
                        <div className="space-y-4">
                            {verInstructores.instructores.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Esta ficha no tiene instructor asignado.</p>
                            ) : (
                                <div className="space-y-2">
                                    {verInstructores.instructores.map((i) => (
                                        <div key={i.id} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                                {i.nombre.charAt(0)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium truncate">{i.nombre} {i.apellido}</p>
                                                <p className="text-xs text-muted-foreground truncate">{i.correo}</p>
                                            </div>
                                            <button
                                                type="button"
                                                disabled={procesando}
                                                onClick={() => quitarInstructor(i.id, verInstructores.id)}
                                                className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                                                aria-label={'Quitar a ' + i.nombre}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {disponibles.length > 0 ? (
                                <div className="space-y-3 pt-2 border-t border-border">
                                    <Select
                                        label="Agregar instructor"
                                        value={instructorElegido}
                                        onChange={setInstructorElegido}
                                        options={[
                                            { value: '', label: 'Seleccionar...' },
                                            ...disponibles.map((i) => ({
                                                value: String(i.id),
                                                label: i.nombre + ' ' + i.apellido,
                                            })),
                                        ]}
                                    />
                                    <Btn
                                        disabled={procesando || !instructorElegido}
                                        onClick={() =>
                                            asignarInstructor(Number(instructorElegido), verInstructores.id, () =>
                                                setInstructorElegido(''),
                                            )
                                        }
                                        className="w-full justify-center"
                                    >
                                        {procesando ? 'Guardando...' : 'Asignar'}
                                    </Btn>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                                    No hay más instructores activos para asignar. Un usuario aparece aquí cuando tiene
                                    el rol Instructor.
                                </p>
                            )}
                        </div>
                    )}
                </Modal>

                <Modal open={!!porCerrar} onClose={() => setPorCerrar(null)} title="Cerrar ficha">
                    {porCerrar && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                La ficha <strong className="text-foreground">#{porCerrar.ficha}</strong> queda marcada
                                como finalizada. Deja de aparecer en el registro y en los selectores de ficha; los
                                datos que ya tiene no se borran.
                            </p>
                            <div className="flex gap-3">
                                <Btn
                                    variant="danger"
                                    disabled={procesando}
                                    onClick={() => cerrar(porCerrar.id, () => setPorCerrar(null))}
                                    className="flex-1 justify-center"
                                >
                                    {procesando ? 'Guardando...' : 'Cerrar ficha'}
                                </Btn>
                                <Btn variant="outline" onClick={() => setPorCerrar(null)} className="flex-1 justify-center">
                                    Cancelar
                                </Btn>
                            </div>
                        </div>
                    )}
                </Modal>

                <Modal open={formAbierto} onClose={() => setFormAbierto(false)} title="Nuevo programa de formación">
                    <div className="space-y-3">
                        <Input label="Número de ficha" value={form.ficha} onChange={campo('ficha')} required placeholder="2756431" />
                        <Input label="Nombre del programa" value={form.nombre} onChange={campo('nombre')} required />
                        <Select label="Tipo de formación" value={form.tipo} onChange={campo('tipo')} options={TIPOS} />
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Fecha inicio" value={form.fechaInicio} onChange={campo('fechaInicio')} type="date" required />
                            <Input label="Fecha fin" value={form.fechaFin} onChange={campo('fechaFin')} type="date" required />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            El instructor se asigna después, desde el botón Instructores de la tarjeta.
                        </p>
                        <div className="flex gap-3 pt-1">
                            <Btn disabled={procesando || !formCompleto} onClick={guardar} className="flex-1 justify-center">
                                {procesando ? 'Guardando...' : 'Registrar programa'}
                            </Btn>
                            <Btn variant="outline" onClick={() => setFormAbierto(false)} className="flex-1 justify-center">
                                Cancelar
                            </Btn>
                        </div>
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default Programas;
