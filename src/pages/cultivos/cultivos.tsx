import { useState } from "react";
import { useCultivos } from "../../hooks/cultivos/useCultivos";
import { useCultivoForm } from "../../hooks/cultivos/useCultivosForm";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { lotesApi } from "../../api/territorio";
import { Sprout, Calendar } from "lucide-react";
import { Btn, Card, EmptyState, Input, Modal, PageHeader, Select, StatusBadge } from "../../components/ui/AgroUI";
import { campo } from "../../utils/adaptarCampo";

const Cultivos = () => {
    const [loteFiltro, setLoteFiltro] = useState<string>('');
    const loteIdNum = loteFiltro ? Number(loteFiltro) : undefined;
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: lotesFiltro = [] } = useQuery({
        queryKey: ['lotes'],
        queryFn: async () => (await lotesApi.listar()).data,
    });

    const {
    cultivos,
    loading,
    error,
    handleFinalizar,
    finalizando,
    handleEliminar,
    eliminando,
    } = useCultivos(loteIdNum);

    const {
        form,
        lotes,
        sublotes,
        handleFormChange,
        handleCreateSubmit,
        creando,
        errorForm
    } = useCultivoForm({
        isModalOpen,
        onSucces: (loteCreado) => {
            setIsModalOpen(false);
            setLoteFiltro(String(loteCreado));
        },
    });

    return (
        <DashboardLayout>
            <div className="p-6 max-w-7xl mx-auto">
                <PageHeader
                    title="Cultivos"
                    subtitle="Gestión de cultivos y registros de cosecha"
                    action={<Btn size="lg" onClick={() => setIsModalOpen(true)}>+ Nuevo Cultivo</Btn>}
                />

                <Select
                    label="Lote"
                    value={loteFiltro}
                    onChange={setLoteFiltro}
                    className="mb-6 max-w-sm"
                    options={[
                        { value: "", label: "Selecciona un lote..." },
                        ...lotesFiltro.map((l) => ({ value: String(l.id), label: l.nombre })),
                    ]}
                />

                {!loteIdNum && (
                    <EmptyState
                        icon={Sprout}
                        title="Elige un lote"
                        description="Selecciona un lote para ver sus cultivos."
                    />
                )}

                {loading && <p className="text-muted-foreground">Cargando cultivos...</p>}
                {error && <p className="text-red-600">{error}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cultivos.map((c) => (
                        <Card key={c.id}>
                            <div className="flex items-center gap-2">
                                <Sprout size={20} className="text-primary" />
                                <h3 className="text-lg font-bold text-foreground">{c.nombreCultivo}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{c.tipoCultivo}</p>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                                <Calendar size={14} /> Sembrado: {c.fechaSiembra}
                            </p>
                            <div className="mt-3">
                                <StatusBadge status={c.estado} />
                            </div>
                            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                                {c.estado === 'activo' && (
                                    <Btn
                                        size="sm"
                                        variant="outline"
                                        disabled={finalizando}
                                        onClick={() =>
                                            handleFinalizar(c.id, new Date().toISOString().slice(0, 10))
                                        }
                                    >
                                        Finalizar
                                    </Btn>
                                )}
                                <Btn
                                    size="sm"
                                    variant="danger"
                                    disabled={eliminando}
                                    onClick={() => handleEliminar(c.id)}
                                >
                                    Eliminar
                                </Btn>
                            </div>
                        </Card>
                    ))}
                </div>

                <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Cultivo">
                    {errorForm && <p className="text-red-600 mb-3 text-sm">{errorForm}</p>}
                    <form onSubmit={handleCreateSubmit} className="grid grid-cols-2 gap-4">

                        <Select
                            className="col-span-2"
                            label="Lote"
                            value={form.loteId}
                            onChange={campo(handleFormChange, "loteId")}
                            options={[
                                { value: "", label: "Seleccione un lote" },
                                ...lotes.map((l: {id: number | string; nombre: string}) => ({ value: String(l.id), label: l.nombre })),
                            ]}
                        />

                        <Input
                            className="col-span-2"
                            label="Nombre del cultivo"
                            required
                            value={form.nombreCultivo}
                            onChange={campo(handleFormChange, "nombreCultivo")}
                            placeholder="Ej: Maíz amarillo"
                        />

                        <Input
                            label="Tipo de cultivo"
                            required
                            value={form.tipoCultivo}
                            onChange={campo(handleFormChange, "tipoCultivo")}
                            placeholder="Ej: Transitorio"
                        />

                        <Select
                            label="Sublote (opcional)"
                            value={form.subLoteId}
                            onChange={campo(handleFormChange, "subLoteId")}
                            options={[
                                { value: "", label: "Ninguno" },
                                ...sublotes.map((s: {id: number | string; nombre: string}) => ({ value: String(s.id), label: s.nombre })),
                            ]}
                        />

                        <Input
                            className="col-span-2"
                            label="Fecha de siembra"
                            type="date"
                            required
                            value={form.fechaSiembra}
                            onChange={campo(handleFormChange, "fechaSiembra")}
                        />

                        <div className="col-span-2 flex justify-end gap-3 mt-2">
                            <Btn variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Btn>
                            <Btn type="submit" disabled={creando}>{creando ? 'Guardando...' : 'Guardar'}</Btn>
                        </div>
                    </form>
                </Modal>
            </div>
        </DashboardLayout>
    )

};

export default Cultivos;