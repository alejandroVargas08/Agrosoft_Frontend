import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { sensoresApi } from '../../api/sensores';
import { Btn, Input } from '../ui/AgroUI';
import type { Sensor } from '../../types/sensor';

interface Props {
    sensor: Sensor;
    onGuardado: () => void;
}

/**
 * El rango operativo decide cuando el sensor entra en alerta.
 * PATCH /sensores/:id ya acepta valorMinimoSensor y valorMaximoSensor.
 */
export default function EditarRangoSensor({ sensor, onGuardado }: Props) {
    const [min, setMin] = useState(sensor.min !== null ? String(sensor.min) : '');
    const [max, setMax] = useState(sensor.max !== null ? String(sensor.max) : '');
    const [error, setError] = useState<string | null>(null);

    const mutacion = useMutation({
        mutationFn: (payload: { valorMinimoSensor: number; valorMaximoSensor: number }) =>
            sensoresApi.actualizarRango(Number(sensor.id), payload),
        onSuccess: onGuardado,
        onError: () => setError('No se pudo guardar el rango. Intenta de nuevo.'),
    });

    const guardar = () => {
        const nMin = Number(min);
        const nMax = Number(max);
        if (!Number.isFinite(nMin) || !Number.isFinite(nMax)) {
            setError('Escribe ambos valores.');
            return;
        }
        // El dominio rechaza minimo >= maximo: lo avisamos antes de enviar
        if (nMin >= nMax) {
            setError('El valor mínimo debe ser menor que el máximo.');
            return;
        }
        setError(null);
        mutacion.mutate({ valorMinimoSensor: nMin, valorMaximoSensor: nMax });
    };

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <Input
                    label={`Mínimo ${sensor.unidad ? `(${sensor.unidad})` : ''}`}
                    value={min}
                    onChange={setMin}
                    type="number"
                />
                <Input
                    label={`Máximo ${sensor.unidad ? `(${sensor.unidad})` : ''}`}
                    value={max}
                    onChange={setMax}
                    type="number"
                />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Btn onClick={guardar} disabled={mutacion.isPending}>
                {mutacion.isPending ? 'Guardando…' : 'Guardar rango'}
            </Btn>
        </div>
    );
}
