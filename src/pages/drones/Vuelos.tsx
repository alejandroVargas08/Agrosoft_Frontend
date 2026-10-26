import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Calendar, Images, MapPin, Mountain, Plane, Plus, Upload } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Btn, Card, EmptyState, Input, Modal, PageHeader, SearchBar, Select, Textarea } from '../../components/ui/AgroUI';
import { EstadoVueloBadge } from '../../components/drones/ComponentesDron';
import { dronesApi, vuelosApi } from '../../api/drones/drones';
import { lotesApi, sublotesApi } from '../../api/territorio';
import { cultivosApi } from '../../api/cultivo/cultivos';
import { mensajeError } from '../../api/errores/errores';
import { usePermisos } from '../../hooks/permisos/usePermisos';
import { ESTADO_VUELO, PERMISOS_DRONES, type EstadoVuelo, type Vuelo } from '../../types/drones/drones';
import { colorSalud, fechaCortaDron } from '../../utils/drones/drones';

interface FormVuelo {
    dronId: string;
    nombre: string;
    fechaVuelo: string;
    alturaVueloM: string;
    loteId: string;
    subLoteId: string;
    cultivoId: string;
    observaciones: string;
}

const hoy = () => new Date().toISOString().slice(0, 10);

const FORM_VACIO: FormVuelo = { dronId: '', nombre: '', fechaVuelo: hoy(), alturaVueloM: '', loteId: '', subLoteId: '', cultivoId: '', observaciones: '' };

const Vuelos = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [params, setParams] = useSearchParams();
    const { puede } = usePermisos();
    const puedeCrear = puede(PERMISOS_DRONES.GESTIONAR_VUELOS);
    const puedeCargar = puede(PERMISOS_DRONES.CARGAR_IMAGENES);

    const filtroDron = params.get('dronId') ?? '';
    const filtroLote = params.get('loteId') ?? '';
    const [filtroEstado, setFiltroEstado] = useState<EstadoVuelo | ''>('');
    const [busqueda, setBusqueda] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [form, setForm] = useState<FormVuelo>(FORM_VACIO);
    const [errorLocal, setErrorLocal] = useState<string | null>(null);

    const drones = useQuery({ queryKey: ['drones'], queryFn: async () => (await dronesApi.listar()).data });
    const lotes = useQuery({ queryKey: ['lotes'], queryFn: async () => (await lotesApi.listar()).data });

    const vuelos = useQuery({
        queryKey: ['vuelos', filtroDron, filtroLote],
        queryFn: async () =>
            (await vuelosApi.listar({ dronId: filtroDron ? Number(filtroDron) : undefined, loteId: filtroLote ? Number(filtroLote) : undefined })).data,
        refetchInterval: (query) => (query.state.data?.some((v) => v.estado === 'ANALIZANDO') ? 5000 : false),
    });

    const sublotes = useQuery({
        queryKey: ['sublotes', form.loteId],
        queryFn: async () => (await sublotesApi.porLote(Number(form.loteId))).data,
        enabled: modalAbierto && !!form.loteId,
    });

    const cultivos = useQuery({
        queryKey: ['cultivos', 'lote', form.loteId],
        queryFn: async () => (await cultivosApi.listarPorLote(Number(form.loteId))).data,
        enabled: modalAbierto && !!form.loteId,
    });

    const nombreDron = useMemo(() => new Map((drones.data ?? []).map((d) => [d.id, d.nombre])), [drones.data]);
    const nombreLote = useMemo(() => new Map((lotes.data ?? []).map((l) => [l.id, l.nombre])), [lotes.data]);
    const dronesActivos = (drones.data ?? []).filter((d) => d.activo);

    const lista = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        return (vuelos.data ?? [])
            .filter((v) => !filtroEstado || v.estado === filtroEstado)
            .filter((v) => !texto || v.nombre.toLowerCase().includes(texto) || (nombreLote.get(v.loteId) ?? '').toLowerCase().includes(texto))
            .sort((a, b) => (a.fechaVuelo < b.fechaVuelo ? 1 : a.fechaVuelo > b.fechaVuelo ? -1 : b.id - a.id));
    }, [vuelos.data, filtroEstado, busqueda, nombreLote]);

    const crear = useMutation({
        mutationFn: () =>
            vuelosApi.crear({
                dronId: Number(form.dronId),
                nombre: form.nombre.trim(),
                fechaVuelo: form.fechaVuelo,
                alturaVueloM: form.alturaVueloM ? Number(form.alturaVueloM) : undefined,
                loteId: Number(form.loteId),
                subLoteId: form.subLoteId ? Number(form.subLoteId) : undefined,
                cultivoId: form.cultivoId ? Number(form.cultivoId) : undefined,
                observaciones: form.observaciones.trim() || undefined,
            }),
        onSuccess: ({ data }) => {
            queryClient.invalidateQueries({ queryKey: ['vuelos'] });
            setModalAbierto(false);
            navigate(`/drones/vuelos/${data.id}?tab=imagenes`);
        },
    });

    const cambiarFiltro = (clave: string, valor: string) => {
        const nuevos = new URLSearchParams(params);
        if (valor) nuevos.set(clave, valor);
        else nuevos.delete(clave);
        setParams(nuevos, { replace: true });
    };

    const abrirNuevo = () => {
        setForm({ ...FORM_VACIO, fechaVuelo: hoy(), dronId: filtroDron || (dronesActivos.length === 1 ? String(dronesActivos[0].id) : ''), loteId: filtroLote });
        setErrorLocal(null);
        crear.reset();
        setModalAbierto(true);
    };

    const enviar = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.dronId) return setErrorLocal('Selecciona el dron');
        if (form.nombre.trim().length < 3) return setErrorLocal('El nombre debe tener al menos 3 caracteres');
        if (!form.fechaVuelo) return setErrorLocal('Selecciona la fecha del vuelo');
        if (form.fechaVuelo > hoy()) return setErrorLocal('La fecha del vuelo no puede ser futura');
        if (!form.loteId) return setErrorLocal('Selecciona el lote que se sobrevoló');
        if (form.alturaVueloM && Number(form.alturaVueloM) < 1) return setErrorLocal('La altura debe ser mayor a 0');
        setErrorLocal(null);
        crear.mutate();
    };

    const tarjeta = (vuelo: Vuelo) => {
        const analisis = vuelo.ultimoAnalisis;
        const completado = analisis?.estado === 'COMPLETADO';
        return (
            <Card key={vuelo.id} onClick={() => navigate(`/drones/vuelos/${vuelo.id}`)} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{vuelo.nombre}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Plane size={12} />{nombreDron.get(vuelo.dronId) ?? `Dron #${vuelo.dronId}`}
                        </p>
                    </div>
                    <EstadoVueloBadge estado={vuelo.estado} />
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar size={12} />{fechaCortaDron(vuelo.fechaVuelo)}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} />{nombreLote.get(vuelo.loteId) ?? `Lote #${vuelo.loteId}`}</span>
                    {vuelo.alturaVueloM && <span className="flex items-center gap-1"><Mountain size={12} />{vuelo.alturaVueloM} m</span>}
                    <span className="flex items-center gap-1"><Images size={12} />{vuelo.totalCapturas} capturas</span>
                </div>

                {completado && analisis.saludablePct !== null ? (
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Vegetación saludable</span>
                            <span className="font-bold" style={{ color: colorSalud(analisis.saludablePct) }}>{analisis.saludablePct.toFixed(0)} %</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${analisis.saludablePct}%`, backgroundColor: colorSalud(analisis.saludablePct) }} />
                        </div>
                        {(analisis.capturasCriticas ?? 0) > 0 && (
                            <p className="text-xs text-red-600 flex items-center gap-1">
                                <AlertTriangle size={12} />{analisis.capturasCriticas} capturas críticas
                            </p>
                        )}
                    </div>
                ) : vuelo.estado === 'ANALIZANDO' && analisis ? (
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Analizando…</span><span>{analisis.progreso}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-amber-500 transition-all" style={{ width: `${analisis.progreso}%` }} />
                        </div>
                    </div>
                ) : vuelo.estado === 'REGISTRADO' && puedeCargar ? (
                    <div onClick={(e) => e.stopPropagation()}>
                        <Btn size="sm" variant="outline" className="w-full justify-center" onClick={() => navigate(`/drones/vuelos/${vuelo.id}?tab=imagenes`)}>
                            <Upload size={14} />Subir imágenes
                        </Btn>
                    </div>
                ) : null}
            </Card>
        );
    };

    const opcionesDron = [{ value: '', label: 'Todos los drones' }, ...(drones.data ?? []).map((d) => ({ value: String(d.id), label: d.nombre }))];
    const opcionesLote = [{ value: '', label: 'Todos los lotes' }, ...(lotes.data ?? []).map((l) => ({ value: String(l.id), label: l.nombre }))];
    const opcionesEstado = [{ value: '', label: 'Todos los estados' }, ...Object.entries(ESTADO_VUELO).map(([valor, info]) => ({ value: valor, label: info.texto }))];

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title="Vuelos"
                    subtitle="Sobrevuelos de los lotes y su análisis de salud"
                    onBack={() => navigate('/drones')}
                    action={puedeCrear ? <Btn onClick={abrirNuevo} disabled={dronesActivos.length === 0}><Plus size={16} />Nuevo vuelo</Btn> : undefined}
                />

                {puedeCrear && !drones.isLoading && dronesActivos.length === 0 && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                        No hay drones activos. Registra o activa un dron para poder crear vuelos.
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre o lote..." />
                    <Select value={filtroDron} onChange={(v) => cambiarFiltro('dronId', v)} options={opcionesDron} />
                    <Select value={filtroLote} onChange={(v) => cambiarFiltro('loteId', v)} options={opcionesLote} />
                    <Select value={filtroEstado} onChange={(v) => setFiltroEstado(v as EstadoVuelo | '')} options={opcionesEstado} />
                </div>

                {vuelos.error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between gap-3">
                        {mensajeError(vuelos.error, 'No se pudieron cargar los vuelos')}
                        <Btn size="sm" variant="outline" onClick={() => vuelos.refetch()}>Reintentar</Btn>
                    </div>
                )}

                {vuelos.isLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />)}
                    </div>
                )}

                {!vuelos.isLoading && !vuelos.error && lista.length === 0 && (
                    <EmptyState
                        icon={Plane}
                        title={(vuelos.data ?? []).length === 0 ? 'Aún no hay vuelos' : 'Ningún vuelo coincide'}
                        description={
                            (vuelos.data ?? []).length === 0
                                ? puedeCrear
                                    ? 'Registra el primer vuelo y sube las imágenes que tomó el dron.'
                                    : 'Cuando tu instructor registre un vuelo aparecerá aquí para que subas las imágenes.'
                                : 'Prueba con otros filtros.'
                        }
                        action={puedeCrear && (vuelos.data ?? []).length === 0 && dronesActivos.length > 0 ? <Btn onClick={abrirNuevo}><Plus size={16} />Nuevo vuelo</Btn> : undefined}
                    />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{lista.map(tarjeta)}</div>
            </div>

            <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title="Nuevo vuelo">
                <form className="space-y-4" onSubmit={enviar}>
                    {(errorLocal || crear.error) && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            {errorLocal ?? mensajeError(crear.error, 'No se pudo crear el vuelo')}
                        </div>
                    )}
                    <Select
                        label="Dron"
                        value={form.dronId}
                        onChange={(v) => setForm({ ...form, dronId: v })}
                        options={[{ value: '', label: 'Selecciona un dron' }, ...dronesActivos.map((d) => ({ value: String(d.id), label: `${d.nombre} · ${d.modelo}` }))]}
                    />
                    <Input label="Nombre del vuelo" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} required placeholder="Ej: Monitoreo lote norte" />
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Fecha" type="date" value={form.fechaVuelo} onChange={(v) => setForm({ ...form, fechaVuelo: v })} required />
                        <Input label="Altura (m)" type="number" step="0.1" value={form.alturaVueloM} onChange={(v) => setForm({ ...form, alturaVueloM: v })} placeholder="Ej: 60" />
                    </div>
                    <Select
                        label="Lote"
                        value={form.loteId}
                        onChange={(v) => setForm({ ...form, loteId: v, subLoteId: '', cultivoId: '' })}
                        options={[{ value: '', label: 'Selecciona un lote' }, ...(lotes.data ?? []).map((l) => ({ value: String(l.id), label: l.nombre }))]}
                    />
                    {form.loteId && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Select
                                label="Sublote (opcional)"
                                value={form.subLoteId}
                                onChange={(v) => setForm({ ...form, subLoteId: v })}
                                options={[{ value: '', label: sublotes.isLoading ? 'Cargando...' : 'Todo el lote' }, ...(sublotes.data ?? []).map((s) => ({ value: String(s.id), label: s.nombre }))]}
                            />
                            <Select
                                label="Cultivo (opcional)"
                                value={form.cultivoId}
                                onChange={(v) => setForm({ ...form, cultivoId: v })}
                                options={[
                                    { value: '', label: cultivos.isLoading ? 'Cargando...' : 'Sin cultivo' },
                                    ...(cultivos.data ?? [])
                                        .filter((c) => !form.subLoteId || c.subLoteId === null || String(c.subLoteId) === form.subLoteId)
                                        .map((c) => ({ value: String(c.id), label: c.nombreCultivo })),
                                ]}
                            />
                        </div>
                    )}
                    <Textarea
                        label="Observaciones (opcional)"
                        value={form.observaciones}
                        onChange={(v) => setForm({ ...form, observaciones: v })}
                        placeholder="Clima, hora del vuelo, novedades..."
                    />
                    <div className="flex gap-3 pt-2">
                        <Btn type="submit" disabled={crear.isPending} className="flex-1 justify-center">
                            {crear.isPending ? 'Creando...' : 'Crear y subir imágenes'}
                        </Btn>
                        <Btn variant="outline" onClick={() => setModalAbierto(false)}>Cancelar</Btn>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
};

export default Vuelos;
