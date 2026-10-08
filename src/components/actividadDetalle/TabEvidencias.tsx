import { useState } from "react";
import { useActividadEvidencias } from "../../hooks/actividades/useActividadEvidencias";

export function TabEvidencias ({actividadId}: {actividadId: number | undefined}) {
    const { 
        evidencias, 
        loading, 
        error, 
        registrar, 
        registrando, 
        errorRegistrar,
        agregarImagen,
        eliminar,
        eliminando
    } = useActividadEvidencias(actividadId); 

    const [descripcion, setDescripcion] = useState(''); 
    const [urlImagen, setUrlImagen] = useState('');
    const [validacion, setValidacion] = useState<string | null>(null); 

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); 

        if (!descripcion.trim() && !urlImagen.trim()) {
            setValidacion('Agrega una descripción o una imagen.'); 
            return; 
        }
        setValidacion(null); 
        registrar({
            descripcion: descripcion || undefined,
            imagenes: urlImagen ? [urlImagen] : undefined,
        }); 
        setDescripcion(''); 
        setUrlImagen(''); 
    }; 

    return (
    <div>
        <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-3 mb-6 bg-white p-4 rounded-xl border border-neutral-200">
            <input
            placeholder="Descripción (opcional si agregas imagen)" value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="col-span-2 rounded-lg border border-neutral-200 py-2 px-3"
            />
            <input
            placeholder="URL de imagen (opcional)" value={urlImagen}
            onChange={(e) => setUrlImagen(e.target.value)}
            className="rounded-lg border border-neutral-200 py-2 px-3"
            />
            <button
            type="submit" disabled={registrando}
            className="col-span-3 bg-green-800 text-white rounded-lg py-2 disabled:opacity-50"
            >
            {registrando ? 'Guardando...' : '+ Registrar evidencia'}
            </button>
            {(validacion || errorRegistrar) && (
            <p className="col-span-3 text-red-600 text-sm">{validacion ?? errorRegistrar}</p>
            )}
        </form>

        {loading && <p className="text-neutral-500">Cargando...</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="space-y-3">
            {evidencias.map((e) => (
            <div key={e.id} className="bg-white p-4 rounded-lg border border-neutral-100">
                <div className="flex justify-between items-start">
                <p className="text-sm">{e.descripcion || <em className="text-neutral-400">Sin descripción</em>}</p>
                <button
                    disabled={eliminando} onClick={() => eliminar(e.id)}
                    className="text-sm text-red-600 underline disabled:opacity-50"
                >
                    Eliminar
                </button>
                </div>
                {e.imagenes.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                    {e.imagenes.map((img) => (
                    <img key={img} src={img} alt="" className="w-20 h-20 object-cover rounded-lg" />
                    ))}
                </div>
                )}
                <button
                onClick={() => {
                    const url = prompt('URL de la nueva imagen:');
                    if (url) agregarImagen(e.id, url);
                }}
                className="text-xs text-green-700 underline mt-2"
                >
                + Agregar otra imagen
                </button>
            </div>
            ))}
        </div>
    </div>
    );
}