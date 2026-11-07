import { useState } from 'react';
import { Camera, ImagePlus, Trash2, Upload } from 'lucide-react';
import { useActividadEvidencias } from '../../hooks/Actividades/useActividadEvidencias';
import { Btn, EmptyState, Input, Modal } from '../ui/AgroUI';
import type { ActividadEvidencia } from '../../types/actividadDetalle';

export function TabEvidencias({ actividadId }: { actividadId: number | undefined }) {
    const {
        evidencias, loading, error,
        registrar, registrando, errorRegistrar,
        agregarImagen, agregandoImagen,
        eliminar, eliminando,
    } = useActividadEvidencias(actividadId);

    const [subiendo, setSubiendo] = useState(false);
    const [descripcion, setDescripcion] = useState('');
    const [urlImagen, setUrlImagen] = useState('');
    const [validacion, setValidacion] = useState<string | null>(null);

    // La evidencia abierta en grande y la url de la imagen que se le suma
    const [abierta, setAbierta] = useState<ActividadEvidencia | null>(null);
    const [urlNueva, setUrlNueva] = useState('');

    const cerrarSubida = () => {
        setSubiendo(false);
        setDescripcion('');
        setUrlImagen('');
        setValidacion(null);
    };

    const guardar = (e: React.FormEvent) => {
        e.preventDefault();
        if (!descripcion.trim() && !urlImagen.trim()) {
            setValidacion('Agrega una descripción o una imagen.');
            return;
        }
        setValidacion(null);
        registrar(
            {
                descripcion: descripcion.trim() || undefined,
                imagenes: urlImagen.trim() ? [urlImagen.trim()] : undefined,
            },
            { onSuccess: cerrarSubida },
        );
    };

    const cerrarDetalle = () => { setAbierta(null); setUrlNueva(''); };

    const sumarImagen = () => {
        if (!abierta || !urlNueva.trim()) return;
        agregarImagen(abierta.id, urlNueva.trim());
        setUrlNueva('');
    };

    const borrar = (id: number) => {
        eliminar(id);
        cerrarDetalle();
    };

    return (
        <div className="space-y-4">
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            {loading ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Cargando evidencias…</p>
            ) : evidencias.length === 0 ? (
                <EmptyState
                    icon={Camera}
                    title="Sin evidencias"
                    description="Sube una foto o una nota de lo que hiciste en esta actividad."
                />
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {evidencias.map((e) => (
                        <div
                            key={e.id}
                            onClick={() => setAbierta(e)}
                            className="cursor-pointer overflow-hidden rounded-xl border border-border transition hover:shadow-sm"
                        >
                            {e.imagenes.length > 0 ? (
                                <img src={e.imagenes[0]} alt="" className="h-24 w-full object-cover" />
                            ) : (
                                <div className="flex h-24 items-center justify-center bg-muted">
                                    <Camera size={28} className="text-muted-foreground" />
                                </div>
                            )}
                            <div className="p-2">
                                <p className="text-xs font-medium text-foreground">
                                    {e.descripcion || 'Sin descripción'}
                                </p>
                                {e.imagenes.length > 1 && (
                                    <p className="text-[10px] text-muted-foreground">
                                        {e.imagenes.length} imágenes
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Btn
                variant="outline"
                onClick={() => setSubiendo(true)}
                disabled={!actividadId}
            >
                <Upload size={14} />Subir evidencia
            </Btn>

            <Modal open={subiendo} onClose={cerrarSubida} title="Subir evidencia">
                <form onSubmit={guardar} className="space-y-3">
                    {(validacion || errorRegistrar) && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {validacion ?? errorRegistrar}
                        </div>
                    )}

                    <Input
                        label="Descripción"
                        value={descripcion} onChange={setDescripcion}
                        placeholder="Qué se hizo, dónde, con qué"
                    />
                    <div>
                        <Input
                            label="URL de la imagen"
                            value={urlImagen} onChange={setUrlImagen}
                            placeholder="https://…"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                            Todavía no se suben archivos: la imagen va por enlace.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-1">
                        <Btn type="submit" disabled={registrando} className="flex-1 justify-center">
                            {registrando ? 'Guardando…' : 'Guardar'}
                        </Btn>
                        <Btn variant="outline" onClick={cerrarSubida}>Cancelar</Btn>
                    </div>
                </form>
            </Modal>

            <Modal
                open={abierta !== null}
                onClose={cerrarDetalle}
                title={abierta?.descripcion || 'Evidencia'}
            >
                {abierta && (
                    <div className="space-y-3">
                        {abierta.imagenes.length === 0 ? (
                            <div className="flex h-48 items-center justify-center rounded-xl bg-muted">
                                <Camera size={40} className="text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {abierta.imagenes.map((img) => (
                                    <img key={img} src={img} alt="" className="w-full rounded-xl object-cover" />
                                ))}
                            </div>
                        )}

                        <div className="flex items-end gap-2">
                            <Input
                                label="Agregar otra imagen" className="flex-1"
                                value={urlNueva} onChange={setUrlNueva} placeholder="https://…"
                            />
                            <Btn
                                variant="outline"
                                onClick={sumarImagen}
                                disabled={!urlNueva.trim() || agregandoImagen}
                            >
                                <ImagePlus size={14} />
                            </Btn>
                        </div>

                        <div className="flex justify-end border-t border-border pt-3">
                            <Btn variant="danger" onClick={() => borrar(abierta.id)} disabled={eliminando}>
                                <Trash2 size={14} />Eliminar evidencia
                            </Btn>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
