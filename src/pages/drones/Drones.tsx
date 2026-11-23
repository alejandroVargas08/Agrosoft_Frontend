import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, Plane, Plus, Power, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Btn, Card, EmptyState, Input, Modal, PageHeader, StatusBadge } from '../../components/ui/AgroUI';
import { dronesApi, vuelosApi } from '../../api/drones/drones';
import { mensajeError } from '../../api/errores/errores';
import { usePermisos } from '../../hooks/permisos/usePermisos';
import { PERMISOS_DRONES, type Dron, type DronPayload, type TipoCamara } from '../../types/drones/drones';
import { fechaCortaDron } from '../../utils/drones/drones';

const FORM_VACIO: DronPayload = { nombre: '', modelo: '', numeroSerie: '', tipoCamara: 'RGB', tieneRtk: false };

const TIPOS_CAMARA: { valor: TipoCamara; titulo: string; descripcion: string }[] = [
    { valor: 'RGB', titulo: 'RGB', descripcion: 'Fotografía estándar, ideal para mapeo visual' },
    { valor: 'MULTIESPECTRAL', titulo: 'Multiespectral', descripcion: 'Índices NDVI/NDRE, análisis de salud vegetal' },
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
                    subtitle="Gestión de drones de inspección"
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
                        title="Sin drones registrados"
                        description="Registra tu primer dron para analizar tus lotes desde el aire."
                        action={puedeGestionar ? <Btn onClick={abrirNuevo}><Plus size={16} />Registrar dron</Btn> : undefined}
                    />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lista.map((dron) => {
                        const resumen = resumenPorDron.get(dron.id);
                        return (
                            <Card key={dron.id} className={dron.activo ? '' : 'opacity-70'}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-icon-bg rounded-lg"><Plane size={20} className="text-primary" /></div>
                                        <div className="flex gap-1 flex-wrap">
                                            <Badge color={dron.tipoCamara === 'MULTIESPECTRAL' ? 'info' : 'muted'}>{dron.tipoCamara === 'MULTIESPECTRAL' ? 'Multiespectral' : 'RGB'}</Badge>
                                            {dron.tieneRtk && <Badge color="primary">RTK</Badge>}
                                        </div>
                                    </div>
                                    <StatusBadge status={dron.activo ? 'activo' : 'inactivo'} />
                                </div>
                                <p className="font-semibold text-foreground mb-0.5">{dron.nombre}</p>
                                <p className="text-xs text-muted-foreground mb-1">{dron.modelo}</p>
                                {dron.numeroSerie && <p className="text-xs text-muted-foreground font-mono mb-3">{dron.numeroSerie}</p>}
                                <div className="flex justify-between text-xs text-muted-foreground mb-3">
                                    <span>{resumen?.total ?? 0} {resumen?.total === 1 ? 'vuelo' : 'vuelos'}</span>
                                    {resumen?.ultimo && <span>Último: {fechaCortaDron(resumen.ultimo)}</span>}
                                </div>
                                <div className="flex gap-2">
                                    <Btn variant="outline" size="sm" onClick={() => navigate(`/drones/vuelos?dronId=${dron.id}`)} className="flex-1 justify-center">Ver vuelos</Btn>
                                    {puedeGestionar && (
                                        <>
                                            <Btn variant="ghost" size="sm" onClick={() => abrirEditar(dron)} title="Editar"><Edit2 size={12} /></Btn>
                                            <Btn variant="ghost" size="sm" disabled={cambiarEstado.isPending} onClick={() => cambiarEstado.mutate(dron)} title={dron.activo ? 'Desactivar' : 'Activar'}>
                                                <Power size={12} />
                                            </Btn>
                                            <Btn variant="ghost" size="sm" className="text-red-600" onClick={() => setEliminar(dron)} title="Eliminar"><Trash2 size={12} /></Btn>
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
                    <Input label="Nombre" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} required placeholder="Ej: Drone Alpha" />
                    <Input label="Modelo" value={form.modelo} onChange={(v) => setForm({ ...form, modelo: v })} required placeholder="Ej: DJI Phantom 4 Multispectral" />
                    <Input label="Número de serie (opcional)" value={form.numeroSerie ?? ''} onChange={(v) => setForm({ ...form, numeroSerie: v })} placeholder="Ej: DJI-PH4M-001" />
                    <div>
                        <label className="text-sm font-semibold text-foreground mb-2 block">Tipo de cámara</label>
                        <div className="grid grid-cols-2 gap-2">
                            {TIPOS_CAMARA.map((tipo) => (
                                <button
                                    key={tipo.valor}
                                    type="button"
                                    onClick={() => setForm({ ...form, tipoCamara: tipo.valor })}
                                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${form.tipoCamara === tipo.valor ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}
                                >
                                    <p className="text-sm font-semibold text-foreground">{tipo.titulo}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{tipo.descripcion}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                        <div>
                            <p className="text-sm font-medium text-foreground">Tiene RTK</p>
                            <p className="text-xs text-muted-foreground">Posicionamiento de alta precisión</p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={form.tieneRtk}
                            onClick={() => setForm({ ...form, tieneRtk: !form.tieneRtk })}
                            className={`w-11 h-6 rounded-full relative transition-colors ${form.tieneRtk ? 'bg-primary' : 'bg-muted border border-border'}`}
                        >
                            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.tieneRtk ? 'left-5' : 'left-0.5'}`} />
                        </button>
                    </div>
                    <Btn type="submit" disabled={guardar.isPending} className="w-full justify-center">
                        {guardar.isPending ? 'Guardando...' : editando ? 'Guardar cambios' : 'Registrar dron'}
                    </Btn>
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
