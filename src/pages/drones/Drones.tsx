import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Edit2, Plane, Plus, Power, Satellite, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Btn, Card, EmptyState, Input, Modal, PageHeader } from '../../components/ui/AgroUI';
import { dronesApi, vuelosApi } from '../../api/drones/drones';
import { mensajeError } from '../../api/errores/errores';
import { usePermisos } from '../../hooks/permisos/usePermisos';
import { PERMISOS_DRONES, type Dron, type DronPayload, type TipoCamara } from '../../types/drones/drones';
import { fechaCortaDron } from '../../utils/drones/drones';

const FORM_VACIO: DronPayload = { nombre: '', modelo: '', numeroSerie: '', tipoCamara: 'MULTIESPECTRAL', tieneRtk: false };

const TIPOS_CAMARA: { valor: TipoCamara; titulo: string; descripcion: string }[] = [
    { valor: 'MULTIESPECTRAL', titulo: 'Multiespectral', descripcion: 'Bandas G, R, RE y NIR. Permite calcular NDVI y la salud del cultivo.' },
    { valor: 'RGB', titulo: 'RGB', descripcion: 'Solo fotos a color. Sirve para inspección visual.' },
];

const Drones = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { puede } = usePermisos();
    const puedeGestionar = puede(PERMISOS_DRONES.GESTIONAR_DRONES);

    const [modalAbierto, setModalAbierto] = useState(false);
    const [editando, setEditando] = useState<Dron | null>(null);
    const [form, setForm] = useState<DronPayload>(FORM_VACIO);
    const [eliminar, setEliminar] = useState<Dron | null>(null);
    const [errorLocal, setErrorLocal] = useState<string | null>(null);

    const drones = useQuery({ queryKey: ['drones'], queryFn: async () => (await dronesApi.listar()).data });
    const vuelos = useQuery({ queryKey: ['vuelos', 'todos'], queryFn: async () => (await vuelosApi.listar()).data });

    const resumenPorDron = useMemo(() => {
        const mapa = new Map<number, { total: number; ultimo: string | null }>();
        for (const vuelo of vuelos.data ?? []) {
            const actual = mapa.get(vuelo.dronId) ?? { total: 0, ultimo: null };
            actual.total += 1;
            if (!actual.ultimo || vuelo.fechaVuelo > actual.ultimo) actual.ultimo = vuelo.fechaVuelo;
            mapa.set(vuelo.dronId, actual);
        }
        return mapa;
    }, [vuelos.data]);

    const refrescar = () => queryClient.invalidateQueries({ queryKey: ['drones'] });

    const guardar = useMutation({
        mutationFn: (datos: DronPayload) => {
            const limpio = { ...datos, numeroSerie: datos.numeroSerie?.trim() || undefined };
            return editando ? dronesApi.actualizar(editando.id, limpio) : dronesApi.crear(limpio);
        },
        onSuccess: () => {
            refrescar();
            cerrarModal();
        },
    });

    const cambiarEstado = useMutation({
        mutationFn: (dron: Dron) => dronesApi.actualizar(dron.id, { activo: !dron.activo }),
        onSuccess: refrescar,
    });

    const borrar = useMutation({
        mutationFn: (id: number) => dronesApi.eliminar(id),
        onSuccess: () => {
            refrescar();
            setEliminar(null);
        },
    });

    const abrirNuevo = () => {
        setEditando(null);
        setForm(FORM_VACIO);
        setErrorLocal(null);
        guardar.reset();
        setModalAbierto(true);
    };

    const abrirEditar = (dron: Dron) => {
        setEditando(dron);
        setForm({ nombre: dron.nombre, modelo: dron.modelo, numeroSerie: dron.numeroSerie ?? '', tipoCamara: dron.tipoCamara, tieneRtk: dron.tieneRtk });
        setErrorLocal(null);
        guardar.reset();
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setEditando(null);
    };

    const enviar = (e: React.FormEvent) => {
        e.preventDefault();
        if (form.nombre.trim().length < 3) return setErrorLocal('El nombre debe tener al menos 3 caracteres');
        if (!form.modelo.trim()) return setErrorLocal('Escribe el modelo del dron');
        setErrorLocal(null);
        guardar.mutate({ ...form, nombre: form.nombre.trim(), modelo: form.modelo.trim() });
    };

    const errorAccion = cambiarEstado.error ?? borrar.error;
    const lista = drones.data ?? [];

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title="Drones"
                    subtitle="Equipos para el monitoreo aéreo de los lotes"
                    action={
                        <div className="flex gap-2">
                            <Btn variant="outline" onClick={() => navigate('/drones/vuelos')}><Plane size={16} />Vuelos</Btn>
                            {puedeGestionar && <Btn onClick={abrirNuevo}><Plus size={16} />Registrar dron</Btn>}
                        </div>
                    }
                />

                {drones.isLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => <div key={i} className="h-44 rounded-xl bg-muted animate-pulse" />)}
                    </div>
                )}

                {drones.error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between gap-3">
                        {mensajeError(drones.error, 'No se pudieron cargar los drones')}
                        <Btn size="sm" variant="outline" onClick={() => drones.refetch()}>Reintentar</Btn>
                    </div>
                )}

                {errorAccion && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        {mensajeError(errorAccion, 'No se pudo completar la acción')}
                    </div>
                )}

                {!drones.isLoading && !drones.error && lista.length === 0 && (
                    <EmptyState
                        icon={Plane}
                        title="Todavía no hay drones"
                        description="Registra tu primer dron para analizar tus lotes desde el aire."
                        action={puedeGestionar ? <Btn onClick={abrirNuevo}><Plus size={16} />Registrar dron</Btn> : undefined}
                    />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lista.map((dron) => {
                        const resumen = resumenPorDron.get(dron.id);
                        return (
                            <Card key={dron.id} className={`flex flex-col gap-3 ${dron.activo ? '' : 'opacity-70'}`}>
                                <div className="flex items-start gap-3">
                                    <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0"><Plane size={22} /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-foreground truncate">{dron.nombre}</p>
                                        <p className="text-sm text-muted-foreground truncate">{dron.modelo}</p>
                                        {dron.numeroSerie && <p className="text-xs text-muted-foreground">Serie: {dron.numeroSerie}</p>}
                                    </div>
                                    <Badge color={dron.activo ? 'success' : 'muted'}>{dron.activo ? 'Activo' : 'Inactivo'}</Badge>
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                    <Badge color={dron.tipoCamara === 'MULTIESPECTRAL' ? 'primary' : 'info'}>
                                        <Camera size={12} className="mr-1" />{dron.tipoCamara === 'MULTIESPECTRAL' ? 'Multiespectral' : 'RGB'}
                                    </Badge>
                                    {dron.tieneRtk && <Badge color="secondary"><Satellite size={12} className="mr-1" />RTK</Badge>}
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="rounded-lg bg-muted p-2">
                                        <p className="text-muted-foreground">Vuelos</p>
                                        <p className="font-semibold text-foreground text-sm">{resumen?.total ?? 0}</p>
                                    </div>
                                    <div className="rounded-lg bg-muted p-2">
                                        <p className="text-muted-foreground">Último vuelo</p>
                                        <p className="font-semibold text-foreground text-sm">{fechaCortaDron(resumen?.ultimo)}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                                    <Btn size="sm" variant="outline" onClick={() => navigate(`/drones/vuelos?dronId=${dron.id}`)}>
                                        <Plane size={14} />Ver vuelos
                                    </Btn>
                                    {puedeGestionar && (
                                        <>
                                            <Btn size="sm" variant="ghost" onClick={() => abrirEditar(dron)}><Edit2 size={14} />Editar</Btn>
                                            <Btn size="sm" variant="ghost" disabled={cambiarEstado.isPending} onClick={() => cambiarEstado.mutate(dron)}>
                                                <Power size={14} />{dron.activo ? 'Desactivar' : 'Activar'}
                                            </Btn>
                                            <Btn size="sm" variant="ghost" className="text-red-600" onClick={() => setEliminar(dron)}>
                                                <Trash2 size={14} />
                                            </Btn>
                                        </>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>

            <Modal open={modalAbierto} onClose={cerrarModal} title={editando ? 'Editar dron' : 'Registrar dron'}>
                <form className="space-y-4" onSubmit={enviar}>
                    {(errorLocal || guardar.error) && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            {errorLocal ?? mensajeError(guardar.error, 'No se pudo guardar el dron')}
                        </div>
                    )}
                    <Input label="Nombre" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} required placeholder="Ej: Dron SENA 1" />
                    <Input label="Modelo" value={form.modelo} onChange={(v) => setForm({ ...form, modelo: v })} required placeholder="Ej: DJI Mavic 3 Multispectral" />
                    <Input label="Número de serie (opcional)" value={form.numeroSerie ?? ''} onChange={(v) => setForm({ ...form, numeroSerie: v })} />
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">Tipo de cámara</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {TIPOS_CAMARA.map((tipo) => (
                                <button
                                    key={tipo.valor}
                                    type="button"
                                    onClick={() => setForm({ ...form, tipoCamara: tipo.valor })}
                                    className={`text-left rounded-xl border p-3 transition-all ${form.tipoCamara === tipo.valor ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:bg-muted'}`}
                                >
                                    <p className="font-semibold text-sm text-foreground">{tipo.titulo}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{tipo.descripcion}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                    <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 cursor-pointer">
                        <span>
                            <span className="block text-sm font-semibold text-foreground">Tiene RTK</span>
                            <span className="block text-xs text-muted-foreground">Posicionamiento de alta precisión</span>
                        </span>
                        <input
                            type="checkbox"
                            checked={form.tieneRtk}
                            onChange={(e) => setForm({ ...form, tieneRtk: e.target.checked })}
                            className="w-5 h-5 accent-[#2D7A3E]"
                        />
                    </label>
                    <div className="flex gap-3 pt-2">
                        <Btn type="submit" disabled={guardar.isPending} className="flex-1 justify-center">
                            {guardar.isPending ? 'Guardando...' : editando ? 'Guardar cambios' : 'Registrar dron'}
                        </Btn>
                        <Btn variant="outline" onClick={cerrarModal}>Cancelar</Btn>
                    </div>
                </form>
            </Modal>

            <Modal open={eliminar !== null} onClose={() => setEliminar(null)} title="Eliminar dron">
                <p className="text-sm text-muted-foreground mb-4">
                    ¿Seguro que quieres eliminar <span className="font-semibold text-foreground">{eliminar?.nombre}</span>? Sus vuelos registrados se conservan.
                </p>
                <div className="flex gap-3">
                    <Btn variant="danger" disabled={borrar.isPending} onClick={() => eliminar && borrar.mutate(eliminar.id)} className="flex-1 justify-center">
                        {borrar.isPending ? 'Eliminando...' : 'Eliminar'}
                    </Btn>
                    <Btn variant="outline" onClick={() => setEliminar(null)}>Cancelar</Btn>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default Drones;
