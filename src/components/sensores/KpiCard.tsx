import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  valor: number;
  icono: LucideIcon;
  color: string; // clases completas de bg + text
}

export default function KpiCard({ label, valor, icono: Icono, color }: Props) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`grid h-12 w-12 place-items-center rounded-xl ${color}`}>
        <Icono className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold leading-tight text-slate-900">{valor}</p>
      </div>
    </div>
  );
}