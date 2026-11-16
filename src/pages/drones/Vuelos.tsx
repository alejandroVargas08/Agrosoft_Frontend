import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plane, Plus, Upload } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Btn, EmptyState, Input, Modal, PageHeader, SearchBar, Select, Textarea } from '../../components/ui/AgroUI';
import { EstadoVueloBadge } from '../../components/drones/ComponentesDron';
import { dronesApi, vuelosApi } from '../../api/drones/drones';
import { lotesApi, sublotesApi } from '../../api/territorio';
import { cultivosApi } from '../../api/cultivo/cultivos';
import { mensajeError } from '../../api/errores/errores';
import { usePermisos } from '../../hooks/permisos/usePermisos';
import { ESTADO_VUELO, PERMISOS_DRONES, type EstadoVuelo } from '../../types/drones/drones';
import { fechaCortaDron, hoyLocal } from '../../utils/drones/drones';

// Mismos cortes del Figma para el punto de color de la columna Salud
const colorPunto = (pct: number) => (pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-[#F59E0B]' : 'bg-red-500');

const COLUMNAS = ['Vuelo', 'Dron', 'Lote / Cultivo', 'Fecha', 'Altura', 'Capturas', 'Estado', 'Salud', 'Acciones'];

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

const hoy = hoyLocal;

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

    // El vuelo guarda solo el id del cultivo: se piden los cultivos de los lotes que aparecen en la lista
    const lotesConCultivo = useMemo(
        () => [...new Set((vuelos.data ?? []).filter((v) => v.cultivoId).map((v) => v.loteId))].sort((a, b) => a - b),
        [vuelos.data],
    );
    const cultivosDeLotes = useQuery({
        queryKey: ['cultivos', 'lotes', lotesConCultivo],
        queryFn: async () => (await Promise.all(lotesConCultivo.map((id) => cultivosApi.listarPorLote(id)))).flatMap((r) => r.data),
        enabled: lotesConCultivo.length > 0,
    });
    const nombreCultivo = useMemo(() => new Map((cultivosDeLotes.data ?? []).map((c) => [c.id, c.nombreCultivo])), [cultivosDeLotes.data]);

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

    const opcionesDron = [{ value: '', label: 'Todos los drones' }, ...(drones.data ?? []).map((d) => ({ value: String(d.id), label: d.nombre }))];
    const opcionesLote = [{ value: '', label: 'Todos los lotes' }, ...(lotes.data ?? []).map((l) => ({ value: String(l.id), label: l.nombre }))];
    const opcionesEstado = [{ value: '', label: 'Todos los estados' }, ...Object.entries(ESTADO_VUELO).map(([valor, info]) => ({ value: valor, label: info.texto }))];

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title="Vuelos"
                    subtitle="Registro de vuelos de dron"
                    onBack={() => navigate('/drones')}
                    action={puedeCrear ? <Btn onClick={abrirNuevo} disabled={dronesActivos.length === 0}><Plus size={16} />Nuevo vuelo</Btn> : undefined}
                />

                {puedeCrear && !drones.isLoading && dronesActivos.length === 0 && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                        No hay drones activos. Registra o activa un dron para poder crear vuelos.
                    </div>
                )}

                <div className="flex flex-wrap gap-3 mb-4">
                    <div className="w-full sm:w-64"><SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre o lote..." /></div>
                    <Select value={filtroDron} onChange={(v) => cambiarFiltro('dronId', v)} options={opcionesDron} />
                    <Select value={filtroEstado} onChange={(v) => setFiltroEstado(v as EstadoVuelo | '')} options={opcionesEstado} />
                    <Select value={filtroLote} onChange={(v) => cambiarFiltro('loteId', v)} options={opcionesLote} />
                </div>

                {vuelos.error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between gap-3">
                        {mensajeError(vuelos.error, 'No se pudieron cargar los vuelos')}
                        <Btn size="sm" variant="outline" onClick={() => vuelos.refetch()}>Reintentar</Btn>
                    </div>
                )}

                {vuelos.isLoading && (
                    <div className="space-y-2">
                        {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}
                    </div>
                )}

                {!vuelos.isLoading && !vuelos.error && lista.length === 0 && (
                    <EmptyState
                        icon={Plane}
                        title={(vuelos.data ?? []).length === 0 ? 'Sin vuelos registrados' : 'Ningún vuelo coincide'}
                        description={
                            (vuelos.data ?? []).length === 0
                                ? puedeCrear
                                    ? 'Registra un vuelo para analizar tus lotes desde el aire.'
                                    : 'Cuando tu instructor registre un vuelo aparecerá aquí para que subas las imágenes.'
                                : 'Prueba con otros filtros.'
                        }
                        action={puedeCrear && (vuelos.data ?? []).length === 0 && dronesActivos.length > 0 ? <Btn onClick={abrirNuevo}><Plus size={16} />Nuevo vuelo</Btn> : undefined}
                    />
                )}

                {lista.length > 0 && (
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[750px]">
                                <thead>
                                    <tr className="bg-muted border-b border-border">
                                        {COLUMNAS.map((col) => (
                                            <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {lista.map((vuelo, i) => {
                                        const analisis = vuelo.ultimoAnalisis;
                                        const salud = analisis?.estado === 'COMPLETADO' ? analisis.saludablePct : null;
                                        const cultivo = vuelo.cultivoId ? nombreCultivo.get(vuelo.cultivoId) : undefined;
                                        return (
                                            <tr key={vuelo.id} className={`border-b border-border last:border-0 hover:bg-muted/20 ${i % 2 === 0 ? 'bg-white' : 'bg-muted/10'}`}>
                                                <td className="px-4 py-3 font-medium text-foreground">{vuelo.nombre}</td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground">{nombreDron.get(vuelo.dronId) ?? '—'}</td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground">{nombreLote.get(vuelo.loteId) ?? '—'}{cultivo ? ` · ${cultivo}` : ''}</td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fechaCortaDron(vuelo.fechaVuelo)}</td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground">{vuelo.alturaVueloM ? `${vuelo.alturaVueloM}m` : '—'}</td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground text-center">{vuelo.totalCapturas}</td>
                                                <td className="px-4 py-3"><EstadoVueloBadge estado={vuelo.estado} /></td>
                                                <td className="px-4 py-3">
                                                    {salud != null ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${colorPunto(salud)}`} />
                                                            <span className="text-xs font-medium">{salud.toFixed(0)}%</span>
                                                        </div>
                                                    ) : vuelo.estado === 'ANALIZANDO' && analisis ? (
                                                        <span className="text-xs text-muted-foreground">{analisis.progreso}%</span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Btn variant="outline" size="sm" onClick={() => navigate(`/drones/vuelos/${vuelo.id}`)}>Ver</Btn>
                                                        {puedeCargar && (
                                                            <Btn variant="outline" size="sm" onClick={() => navigate(`/drones/vuelos/${vuelo.id}?tab=imagenes`)}>
                                                                <Upload size={13} />Imágenes
                                                            </Btn>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title="Nuevo vuelo">
                <form className="space-y-3" onSubmit={enviar}>
                    {(errorLocal || crear.error) && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            {errorLocal ?? mensajeError(crear.error, 'No se pudo crear el vuelo')}
                        </div>
                    )}
                    <Select
                        label="Dron"
                        value={form.dronId}
                        onChange={(v) => setForm({ ...form, dronId: v })}
                        options={[{ value: '', label: 'Seleccionar dron...' }, ...dronesActivos.map((d) => ({ value: String(d.id), label: d.nombre }))]}
                    />
                    <Input label="Nombre del vuelo" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} required placeholder="Mínimo 3 caracteres" />
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Fecha del vuelo" type="date" value={form.fechaVuelo} onChange={(v) => setForm({ ...form, fechaVuelo: v })} required />
                        <Input label="Altura (m, opcional)" type="number" step="0.1" value={form.alturaVueloM} onChange={(v) => setForm({ ...form, alturaVueloM: v })} placeholder="80" />
                    </div>
                    <Select
                        label="Lote"
                        value={form.loteId}
                        onChange={(v) => setForm({ ...form, loteId: v, subLoteId: '', cultivoId: '' })}
                        options={[{ value: '', label: 'Seleccionar lote...' }, ...(lotes.data ?? []).map((l) => ({ value: String(l.id), label: l.nombre }))]}
                    />
                    {form.loteId && (sublotes.data ?? []).length > 0 && (
                        <Select
                            label="Sublote (opcional)"
                            value={form.subLoteId}
                            onChange={(v) => setForm({ ...form, subLoteId: v, cultivoId: '' })}
                            options={[{ value: '', label: 'Todo el lote' }, ...(sublotes.data ?? []).map((s) => ({ value: String(s.id), label: s.nombre }))]}
                        />
                    )}
                    <Select
                        label="Cultivo"
                        value={form.cultivoId}
                        onChange={(v) => setForm({ ...form, cultivoId: v })}
                        options={[
                            { value: '', label: !form.loteId ? 'Primero elige el lote' : cultivos.isLoading ? 'Cargando...' : 'Seleccionar cultivo...' },
                            ...(cultivos.data ?? [])
                                .filter((c) => !form.subLoteId || c.subLoteId === null || String(c.subLoteId) === form.subLoteId)
                                .map((c) => ({ value: String(c.id), label: c.nombreCultivo })),
                        ]}
                    />
                    <Textarea
                        label="Observaciones"
                        value={form.observaciones}
                        onChange={(v) => setForm({ ...form, observaciones: v })}
                        rows={2}
                        placeholder="Condiciones del vuelo, objetivos..."
                    />
                    <Btn type="submit" disabled={crear.isPending} className="w-full justify-center">
                        {crear.isPending ? 'Registrando...' : 'Registrar vuelo'}
                    </Btn>
                </form>
            </Modal>
        </DashboardLayout>
    );
};

export default Vuelos;
