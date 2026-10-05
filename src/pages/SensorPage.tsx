import { Bell, Cpu, Wifi, WifiOff } from "lucide-react";
import KpiCard from "../components/sensores/KpiCard";
import SensorCard from "../components/sensores/SensorCard";
import { useSensores } from "../hooks/sensores/useSensores";
import DashboardLayout from "../components/layout/DashboardLayout";

export default function SensorPage() {
  const { sensores, resumen, cargando, error, recargar } = useSensores();

  return (
  <DashboardLayout>    
    <main className="min-h-screen bg-[#f8faf8] px-7 py-7">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sensores IoT</h1>
      <p className="mb-6 mt-1 text-slate-500">Monitoreo en tiempo real</p>

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-center justify-between rounded-xl bg-red-100 px-5 py-4 text-red-700"
        >
          <span>No se pudieron cargar los sensores ({error}).</span>
          <button
            onClick={recargar}
            className="rounded-lg border border-red-300 px-3 py-1 text-sm font-medium hover:bg-red-50"
          >
            Reintentar
          </button>
        </div>
      )}

      <section className="mb-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="En línea" valor={resumen.enLinea} icono={Wifi} color="bg-emerald-100 text-emerald-700" />
        <KpiCard label="Desconectados" valor={resumen.desconectados} icono={WifiOff} color="bg-red-100 text-red-600" />
        <KpiCard label="Total sensores" valor={resumen.total} icono={Cpu} color="bg-slate-200 text-emerald-800" />
        <KpiCard label="Alertas activas" valor={resumen.alertas} icono={Bell} color="bg-amber-100 text-amber-700" />
      </section>

      {cargando ? (
        <p className="text-slate-500">Cargando sensores…</p>
      ) : sensores.length === 0 && !error ? (
        <p className="text-slate-500">Aún no hay sensores registrados.</p>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sensores.map((s) => (
            <SensorCard key={s.id} sensor={s} />
          ))}
        </section>
      )}
    </main>
 </DashboardLayout>
  
  );
}