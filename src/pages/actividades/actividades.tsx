import { useState } from "react"
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { useCultivos } from "../../hooks/cultivos/useCultivos";
import { useTerritorio } from "../../hooks/useTerritorio";
import { useActividadForm } from "../../hooks/Actividades/useActividadForm";
import { useActividades } from "../../hooks/Actividades/useActividades";
import {
    Btn, Card, EmptyState, Input, Modal, PageHeader, Select, StatusBadge, Tab, Textarea,
} from "../../components/ui/AgroUI";
import { campo } from "../../utils/adaptarCampo";
import { estadoParaBadge } from "../../utils/estadoActividad";


const Actividades = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loteFiltroId, setLoteFiltroId] = useState<number | undefined>(undefined);
    const [cultivoIdActual, setCultivoIdActual] = useState<number>(1);
    const {lotes: lotesFiltro } = useTerritorio();
    const {cultivos: cultivosDisponibles} = useCultivos(loteFiltroId);
    const {
        actividades,
        loading,
        error,
        filtroEstado,
        setFiltroEstado,
        handleChangeEstado,
    } = useActividades(cultivoIdActual);

    const {
        form,
        lotes: lotesForm,
        sublotes,
        cultivos: cultivosForm,
        productos,
        handleFormChange,
        handleCreateSubmit,
        enviando,
        errorForm } =
    useActividadForm({
        isModalOpen,
        onSuccess: () => setIsModalOpen(false),
        cultivoIdDefault: cultivoIdActual,
    });

    const Filtros: { label: string; value: string }[] = [
        { label: 'Todas', value: 'Todas' },
        { label: 'Pendiente', value: 'Pendiente' },
        { label: 'En progreso', value: 'En progreso' },
        { label: 'Finalizada', value: 'Finalizada' },
    ];

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-8">

                <PageHeader
                    title="Actividades Agrícolas"
                    subtitle="Labores y Tareas de Campo"
                    action={<Btn onClick={() => setIsModalOpen(true)}>+ Nueva Actividad</Btn>}
                />

                <Card className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <Select
                        label="Filtrar por Lote:"
                        value={loteFiltroId ? String(loteFiltroId) : ""}
                        onChange={(v) => {
                            setLoteFiltroId(v ? Number(v) : undefined);
                            setCultivoIdActual(0);
                        }}
                        options={[
                            { value: "", label: "Seleccione un lote..." },
                            ...(lotesFiltro ?? []).map((lote) => ({ value: String(lote.id), label: lote.nombre })),
                        ]}
                    />

                    <Select
                        label="Cultivo a visualizar:"
                        value={String(cultivoIdActual)}
                        onChange={(v) => setCultivoIdActual(Number(v))}
                        options={[
                            { value: "0", label: !loteFiltroId ? "Primero seleccione un lote" : "Seleccione un cultivo" },
                            ...(cultivosDisponibles ?? []).map((cultivoItem) => ({
                                value: String(cultivoItem.id),
                                label: cultivoItem.nombreCultivo || cultivoItem.tipoCultivo || `Cultivo #${cultivoItem.id}`,
                            })),
                        ]}
                    />
                </Card>

                <Tab
                    tabs={Filtros.map((f) => f.value)}
                    active={filtroEstado}
                    onChange={setFiltroEstado}
                />

                {loading && (
                    <p className="text-center py-8 text-muted-foreground font-medium"> Cargando Actividades</p>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center mb-6 text-sm"> {error} </div>
                )}

                <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Actividad">
                    {errorForm && <p className="text-red-600 mb-3 text-sm">{errorForm}</p>}
                    <form onSubmit={handleCreateSubmit} className="space-y-4">

                        <Input
                            label="Tipo de Actividad"
                            required
                            value={form.tipo || ""}
                            onChange={campo(handleFormChange, "tipo")}
                            placeholder="Ej: Fertilización"
                        />

                        <Select
                            label="Lote"
                            value={String(form.loteId || "")}
                            onChange={campo(handleFormChange, "loteId")}
                            options={[
                                { value: "", label: "Seleccione un lote" },
                                ...(lotesForm ?? []).map((lote) => ({ value: String(lote.id), label: lote.nombre ?? "" })),
                            ]}
                        />

                        <Select
                            label="Sublote"
                            value={String(form.subLoteId || "")}
                            onChange={campo(handleFormChange, "subLoteId")}
                            options={[
                                { value: "", label: "Seleccione un sublote" },
                                ...(sublotes ?? []).map((sub) => ({ value: String(sub.id), label: sub.nombre })),
                            ]}
                        />

                        <Select
                            label="Cultivo"
                            value={String(form.cultivoId || "")}
                            onChange={campo(handleFormChange, "cultivoId")}
                            options={[
                                { value: "", label: "Seleccione un cultivo" },
                                ...(cultivosForm ?? []).map((cultivosItem) => ({
                                    value: String(cultivosItem.id),
                                    label: cultivosItem.nombreCultivo || cultivosItem.tipoCultivo || `Cultivo #${cultivosItem.id}`,
                                })),
                            ]}
                        />

                        <Select
                            label="Producto / Insumo"
                            value={String(form.productoAgroId || "")}
                            onChange={campo(handleFormChange, "productoAgroId")}
                            options={[
                                { value: "", label: "Seleccione un producto" },
                                ...(productos ?? []).map((producto: { id: number | string; nombre: string}) => ({ value: String(producto.id), label: producto.nombre })),
                            ]}
                        />

                        <Input
                            label="Fecha"
                            type="date"
                            required
                            value={form.fecha || ""}
                            onChange={campo(handleFormChange, "fecha")}
                        />

                        <Textarea
                            label="Descripción"
                            value={form.descripcion || ""}
                            onChange={campo(handleFormChange, "descripcion")}
                            rows={3}
                            placeholder="Detalles adicionales de la labor..."
                        />

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                            <Btn variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Btn>
                            <Btn type="submit" disabled={enviando}>{enviando ? 'Guardando...' : 'Guardar'}</Btn>
                        </div>

                    </form>
                </Modal>

                {!loading && !error && actividades.length === 0 && (
                    <EmptyState
                        title={cultivoIdActual ? "Sin actividades" : "Selecciona un cultivo"}
                        description={cultivoIdActual
                            ? "Este cultivo todavía no tiene actividades registradas."
                            : "Elige un lote y un cultivo para ver sus actividades."}
                    />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {actividades.map((actividad) => (
                        <Card
                            key={actividad.id}
                            onClick={() => navigate(`/actividades/${actividad.id}`, {state: {actividad} })}
                            className="flex flex-col justify-between"
                        >
                            <div className="flex justify-between items-start gap-2 mb-3">
                                <h3 className="text-sm font-semibold text-foreground leading-snug">
                                    {actividad.tipo} {actividad.subtipo ? `-${actividad.subtipo}` : ''}
                                </h3>
                                <span
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleChangeEstado(actividad.id, actividad.estado);
                                    }}
                                    className="cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                                >
                                    <StatusBadge status={estadoParaBadge(actividad.estado)} />
                                </span>
                            </div>

                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                {actividad.descripcion || "Sin descripción registrada."}
                            </p>

                            <div className="border-t border-border pt-3 mt-auto">
                                <span className="text-xs text-muted-foreground font-medium">
                                    {actividad.fecha}
                                </span>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
};
export default Actividades;