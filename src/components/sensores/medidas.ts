import { Droplets, FlaskConical, Lightbulb, Sun, Thermometer, Cpu, type LucideIcon } from 'lucide-react';
import type { Sensor, TipoSensor } from '../../types/sensor';

/** El orden en que el diseño muestra las medidas dentro de la estación. */
export const ORDEN_MEDIDAS: TipoSensor[] = ['temperatura', 'humedad', 'ph', 'uv', 'luminosidad'];

export const ETIQUETA_MEDIDA: Record<TipoSensor, string> = {
    temperatura: 'Temperatura',
    humedad: 'Humedad',
    ph: 'pH',
    uv: 'Índice UV',
    luminosidad: 'Luminosidad',
    otro: 'Otra medida',
};

export const ICONO_MEDIDA: Record<TipoSensor, LucideIcon> = {
    temperatura: Thermometer,
    humedad: Droplets,
    ph: FlaskConical,
    uv: Sun,
    luminosidad: Lightbulb,
    otro: Cpu,
};

/** Cada medida tiene su color en el diseño. */
export const COLOR_MEDIDA: Record<TipoSensor, string> = {
    temperatura: 'text-[#F16C07]',
    humedad: 'text-blue-500',
    ph: 'text-primary',
    uv: 'text-[#F59E0B]',
    luminosidad: 'text-[#F16C07]',
    otro: 'text-primary',
};

/** Color de la linea en la grafica del detalle. */
export const COLOR_GRAFICA: Record<TipoSensor, string> = {
    temperatura: '#F16C07',
    humedad: '#3B82F6',
    ph: '#3A9C50',
    uv: '#F59E0B',
    luminosidad: '#F59E0B',
    otro: '#3A9C50',
};

/** Escala UV estandar (OMS), con la paleta del diseño. */
export function nivelUV(indice: number): { label: string; color: string; bg: string } {
    if (indice <= 0) return { label: 'Noche', color: 'text-gray-500', bg: 'bg-gray-100' };
    if (indice <= 2) return { label: 'Bajo', color: 'text-[#3A9C50]', bg: 'bg-[#EBF3ED]' };
    if (indice <= 5) return { label: 'Moderado', color: 'text-[#F59E0B]', bg: 'bg-[#FFF3E0]' };
    if (indice <= 7) return { label: 'Alto', color: 'text-[#F16C07]', bg: 'bg-[#FFF3E0]' };
    return { label: 'Muy alto', color: 'text-red-600', bg: 'bg-red-100' };
}

/** La lectura de luz por tramos, tal cual el luxInfo del diseño. */
export function nivelLuz(v: number): { label: string; color: string; bg: string } {
    if (v <= 1000) return { label: 'Oscuro', color: 'text-gray-500', bg: 'bg-gray-100' };
    if (v <= 10000) return { label: 'Nublado', color: 'text-[#F59E0B]', bg: 'bg-[#FFF3E0]' };
    if (v <= 50000) return { label: 'Luz media', color: 'text-[#3A9C50]', bg: 'bg-[#EBF3ED]' };
    return { label: 'Pleno sol', color: 'text-[#F16C07]', bg: 'bg-[#FFF3E0]' };
}

/** 1500 -> "1,5 klx". Tal cual el fmtLux del diseño. */
export function fmtLux(v: number): string {
    if (v >= 100000) return Math.round(v / 1000) + ' klx';
    if (v >= 1000) return (v / 1000).toFixed(1).replace('.', ',') + ' klx';
    return v + ' lx';
}

export const fmtNumero = (n: number | null) =>
    n === null ? '–' : n.toLocaleString('es-CO', { maximumFractionDigits: 1 });

/** Como se lee el valor de cada medida en la tarjeta. */
export function textoValor(sensor: Sensor): string {
    if (sensor.valor === null) return '–';
    if (sensor.tipo === 'luminosidad') return fmtLux(sensor.valor);
    if (sensor.tipo === 'uv') return 'UV ' + fmtNumero(sensor.valor);
    return fmtNumero(sensor.valor) + (sensor.unidad ? sensor.unidad : '');
}

export const fueraDeRango = (s: Sensor) =>
    s.valor !== null && ((s.min !== null && s.valor < s.min) || (s.max !== null && s.valor > s.max));
