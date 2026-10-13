import { Droplets, FlaskConical, Cpu, Thermometer, type LucideIcon } from "lucide-react";
import type { Sensor, TipoSensor } from "../../types/sensor";

const ICONOS: Record<TipoSensor, LucideIcon> = {
  temperatura: Thermometer,
  humedad: Droplets,
  ph: FlaskConical,
  otro: Cpu,
};

// Clases completas (Tailwind no detecta clases armadas con interpolación)
const ESTILOS = {
  ok:     { icono: "bg-emerald-100 text-emerald-700", badge: "bg-emerald-100 text-emerald-700", valor: "text-emerald-700", borde: "border-slate-200", texto: "En línea" },
  alerta: { icono: "bg-amber-100 text-amber-700",     badge: "bg-amber-100 text-amber-700",     valor: "text-amber-600",   borde: "border-amber-300", texto: "Alerta" },
  off:    { icono: "bg-red-100 text-red-600",         badge: "bg-red-100 text-red-600",         valor: "text-slate-400",   borde: "border-slate-200", texto: "Desconectado" },
} as const;

function haceCuanto(fecha: string | null): string {
  if (!fecha) return "Sin datos";
  const s = Math.max(0, (Date.now() - new Date(fecha).getTime()) / 1000);
  if (s < 60) return `Hace ${Math.floor(s)}s`;
  if (s < 3600) return `Hace ${Math.floor(s / 60)}min`;
  if (s < 86400) return `Hace ${Math.floor(s / 3600)}h`;
  return `Hace ${Math.floor(s / 86400)}d`;
}

const fmt = (n: number | null) =>
  n === null ? "–" : n.toLocaleString("es", { maximumFractionDigits: 1 });

export default function SensorCard({ sensor }: { sensor: Sensor }) {
  const estado = !sensor.enLinea ? "off" : sensor.alerta ? "alerta" : "ok";
  const e = ESTILOS[estado];
  const Icono = ICONOS[sensor.tipo];
  const hayRango = sensor.min !== null && sensor.max !== null;

  return (
    <article className={`rounded-2xl border bg-white p-5 shadow-sm ${e.borde}`}>
      <div className="flex items-start justify-between">
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${e.icono}`}>
          <Icono className="h-5 w-5" />
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${e.badge}`}>{e.texto}</span>
      </div>

      <h3 className="mt-4 text-[17px] font-semibold text-slate-900">{sensor.nombre}</h3>
      <p className="text-sm text-slate-500">{sensor.ubicacion}</p>

      <p className={`mt-5 text-3xl font-bold ${e.valor}`}>
        {fmt(sensor.valor)}
        <span className="ml-1 text-base font-normal text-slate-500">{sensor.unidad}</span>
      </p>

      <div className="mt-1 flex justify-between text-sm text-slate-500">
        <span>{haceCuanto(sensor.ultimaLectura)}</span>
        {hayRango && <span>{fmt(sensor.min)} — {fmt(sensor.max)} {sensor.unidad}</span>}
      </div>
    </article>
  );
}