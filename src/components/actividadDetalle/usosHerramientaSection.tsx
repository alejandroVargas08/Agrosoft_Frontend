import { Badge, Clock, Tractor, TrendingDown } from "lucide-react";
import { useUsosHerramienta } from "../../hooks/useUsosHerramienta";
import { Btn, Card, EmptyState, Input, Select, StatCard } from "../ui/AgroUI";

const cop = (n: number) =>
    new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    }). format(n);

const fecha = (n: string | number) =>
    new Date(n).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

export function UsosHerramientaSection({actividadId}: {actividadId: number | undefined}) {
    const {
        usos,
        loading,
        error,
        nombreHerramienta,
        opcionesHerramientas,
        totalHoras,
        totalDepreciacion,
        form,
        set,
        handleSubmit,
        registrando,
        errorForm,
    } = useUsosHerramienta(actividadId);

    return (
    
    <div className="space-y-4">
        <div>
            <h3 className="font-semibold text-foreground">Uso real de herramientas</h3>
            <p className="text-sm text-muted-foreground">
            Registra las horas que se usó cada herramienta; el sistema calcula la depreciación.
            </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StatCard icon={Clock} label="Horas usadas" value={totalHoras.toLocaleString('es-CO')} color="blue" />
            <StatCard icon={TrendingDown} label="Depreciación generada" value={cop(totalDepreciacion)} color="amber" />
        </div>

    <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
            {errorForm && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errorForm}</div>
            )}

        <Select
            label="Herramienta"
            value={form.insumoId}
            onChange={set('insumoId')}
            options={[
            { value: '', label: opcionesHerramientas.length ? 'Seleccione...' : 'Primero asigna una herramienta a la actividad' },
            ...opcionesHerramientas,
            ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Horas usadas" type="number" step="any" required value={form.horasUsadas} onChange={set('horasUsadas')} />
            <Input label="Depreciación por hora (COP)" type="number" step="any" required value={form.tasaDepreciacionHora} onChange={set('tasaDepreciacionHora')} />
            <Input label="Valor en libros antes" type="number" step="any" placeholder="Opcional" value={form.valorLibrosAntes} onChange={set('valorLibrosAntes')} />
        </div>
        <p className="text-xs text-muted-foreground">
            Deja «Valor en libros antes» vacío si esta herramienta ya se usó antes: se toma el último valor guardado.
            Solo es obligatorio la primera vez.
        </p>

        <Btn type="submit" disabled={registrando}>{registrando ? 'Registrando...' : 'Registrar uso'}</Btn>
        </form>
    </Card>

        {loading && <p className="text-sm text-muted-foreground">Cargando usos...</p>}
        {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">{error}</div>
        )}

        <div className="space-y-3">
        {usos.map((u) => (
            <Card key={u.id}>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-100 text-amber-700"><Tractor size={18} /></div>
                        <div>
                            <p className="font-medium text-foreground">{nombreHerramienta(Number(u.insumoId))}</p>
                            <p className="text-xs text-muted-foreground">{fecha(u.fechaUso)} · {u.horasUsadas} h</p>
                        </div>
                    </div>
            <Badge color="warning">- {cop(u.depreciacionGenerada)}</Badge>
                </div>
            <p className="text-xs text-muted-foreground mt-3">
                Valor en libros: {cop(u.valorLibroAntes)} → <span className="font-semibold text-foreground">{cop(u.valorLibrosDespues)}</span>
            </p>
            </Card>
        ))}
        </div>

        {!loading && usos.length === 0 && (
        <EmptyState
            icon={Tractor}
            title="Sin usos registrados"
            description="Cuando registres las horas de una herramienta, aparecerán aquí."
        />
        )}
    </div>
    );
}

