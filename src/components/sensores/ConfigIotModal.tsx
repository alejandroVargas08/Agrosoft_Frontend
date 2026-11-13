import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { iotConfigApi } from '../../api/admin/admin';
import { mensajeError } from '../../api/errores/errores';
import { Btn, Input, Modal, StatusBadge } from '../ui/AgroUI';
import type { EstacionLote } from '../../hooks/sensores/useSensoresPorLote';

const slug = (nombre: string) =>
    nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'estacion';

interface Props {
    open: boolean;
    onClose: () => void;
    estaciones: EstacionLote[];
}

/** "Configuración IoT" del diseño: el broker que comparten todas las estaciones. */
export default function ConfigIotModal({ open, onClose, estaciones }: Props) {
    const navigate = useNavigate();
    const configs = useQuery({
        queryKey: ['iot-global-config'],
        queryFn: async () => (await iotConfigApi.listar()).data,
        enabled: open,
    });

    const broker = configs.data?.[0];
    const [agente, setAgente] = useState('');
    const [puerto, setPuerto] = useState('1883');
    const [prefijo, setPrefijo] = useState('agrosoft');

    useEffect(() => {
        if (!open || !broker) return;
        setAgente(broker.agente);
        setPuerto(String(broker.puerto));
        setPrefijo(broker.prefijoTema);
    }, [open, broker]);

    // Todas las estaciones hablan con el mismo broker: se actualizan juntas
    const guardar = useMutation({
        mutationFn: async () => {
            const cambios = { agente: agente.trim(), puerto: Number(puerto), prefijoTema: prefijo.trim() };
            for (const c of configs.data ?? []) await iotConfigApi.actualizar(c.id, cambios);
        },
        onSuccess: () => { toast.success('Configuración guardada'); configs.refetch(); onClose(); },
    });

    const estadoBadge = (e?: EstacionLote) =>
        !e ? 'disconnected' : e.estado === 'conectada' ? 'connected' : e.estado === 'alerta' ? 'alert' : 'disconnected';

    // Las estaciones son las que ya mandan datos (sensores agrupados por lote)
    // más las registradas aquí que todavía no tienen sensores
    const registradas = configs.data ?? [];
    const filas = [
        ...estaciones.map((e) => {
            const config = registradas.find((c) => c.loteId === e.loteId);
            const tema = e.sensores.find((s) => s.mqttTopic)?.mqttTopic
                ?? (config ? `${config.prefijoTema}/${slug(config.nombre)}` : null);
            return { clave: 'e' + e.loteId, nombre: config?.nombre ?? e.nombre, tema, estado: estadoBadge(e) };
        }),
        ...registradas
            .filter((c) => !estaciones.some((e) => e.loteId === c.loteId))
            .map((c) => ({ clave: 'c' + c.id, nombre: c.nombre, tema: `${c.prefijoTema}/${slug(c.nombre)}`, estado: 'disconnected' })),
    ];

    const puertoValido = Number(puerto) > 0 && Number(puerto) <= 65535;
    // El broker se guarda en la configuración de cada estación registrada
    const hayRegistradas = registradas.length > 0;

    return (
        <Modal open={open} onClose={onClose} title="Configuración IoT">
            <div className="space-y-4">
                <Input label="Broker MQTT" value={agente} onChange={setAgente} autoComplete="off" />
                <Input label="Puerto" value={puerto} onChange={setPuerto} type="number" />
                <Input label="Prefijo de topics" value={prefijo} onChange={setPrefijo} autoComplete="off" />

                <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">Estaciones registradas</label>
                    {configs.isLoading ? (
                        <p className="text-xs text-muted-foreground">Cargando…</p>
                    ) : filas.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Todavía no hay estaciones registradas.</p>
                    ) : (
                        <div className="space-y-2">
                            {filas.map((f) => (
                                <div key={f.clave} className="flex items-center justify-between gap-2 p-2 bg-muted rounded-lg text-sm">
                                    <span className="truncate">{f.nombre}</span>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {f.tema && <span className="font-mono text-xs text-muted-foreground">{f.tema}</span>}
                                        <StatusBadge status={f.estado} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {!configs.isLoading && !hayRegistradas && (
                    <p className="text-xs text-[#E65100]">
                        El broker se guarda junto con las estaciones registradas en Config. Sistema. Registra la primera para poder guardarlo.
                    </p>
                )}
                {configs.error && <p className="text-sm text-red-600">{mensajeError(configs.error, 'No se pudo cargar la configuración IoT.')}</p>}
                {guardar.error && <p className="text-sm text-red-600">{mensajeError(guardar.error, 'No se pudo guardar la configuración.')}</p>}

                <Btn onClick={() => navigate('/ajustes', { state: { pestana: 'IoT / MQTT' } })} variant="outline" className="w-full justify-center">
                    Registrar nueva estación
                </Btn>
                <Btn
                    onClick={() => guardar.mutate()}
                    disabled={!hayRegistradas || !agente.trim() || !puertoValido || guardar.isPending}
                    className="w-full justify-center"
                >
                    {guardar.isPending ? 'Guardando…' : 'Guardar configuración'}
                </Btn>
            </div>
        </Modal>
    );
}
