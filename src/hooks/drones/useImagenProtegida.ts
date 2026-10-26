import { useEffect, useState } from 'react';
import type { AxiosResponse } from 'axios';

export function useImagenProtegida(cargar: (() => Promise<AxiosResponse<Blob>>) | null, clave: string) {
    const [url, setUrl] = useState<string | null>(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!cargar) {
            setUrl(null);
            return;
        }
        let activo = true;
        let creada: string | null = null;
        setCargando(true);
        setError(false);
        cargar()
            .then((respuesta) => {
                if (!activo) return;
                creada = URL.createObjectURL(respuesta.data);
                setUrl(creada);
            })
            .catch(() => activo && setError(true))
            .finally(() => activo && setCargando(false));
        return () => {
            activo = false;
            if (creada) URL.revokeObjectURL(creada);
        };
    }, [clave]);

    return { url, cargando, error };
}
