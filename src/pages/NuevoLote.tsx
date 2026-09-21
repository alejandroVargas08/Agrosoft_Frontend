import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Btn, Card, Input, PageHeader, Select, Textarea } from '../components/ui/AgroUI';
import { lotesApi } from '../api/territorio';
import { useNuevoLoteForm } from '../hooks/useNuevoLoteForm';

const NuevoLote = () => {
    const navigate = useNavigate();
    const volver = () => navigate('/territorio');

    // Lotes existentes, para elegir el lote padre de un sublote
    const { data: lotes = [] } = useQuery({
        queryKey: ['lotes'],
        queryFn: async () => (await lotesApi.listar()).data,
    });

    const { form, set, areaM2, enviando, errorForm, handleSubmit } = useNuevoLoteForm({ onSuccess: volver });

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                <PageHeader title={form.tipo === 'subplot' ? 'Nuevo Sublote' : 'Nuevo Lote'} onBack={volver} />
                <Card className="max-w-lg">
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {errorForm && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errorForm}</div>
                        )}

                        <Select
                            label="Tipo" value={form.tipo} onChange={set('tipo')}
                            options={[{ value: 'plot', label: 'Lote principal' }, { value: 'subplot', label: 'Sublote' }]}
                        />
                        {form.tipo === 'subplot' && (
                            <Select
                                label="Lote padre" value={form.parentId} onChange={set('parentId')}
                                options={[{ value: '', label: 'Seleccionar...' }, ...lotes.map((l) => ({ value: String(l.id), label: l.nombre }))]}
                            />
                        )}
                        <Input label="Nombre" value={form.nombre} onChange={set('nombre')} required placeholder="Ej: Lote C - Oriente" />
                        <Input label="Descripción" value={form.descripcion} onChange={set('descripcion')} placeholder="Descripción breve" />
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Área (hectáreas)" value={form.areaHa} onChange={set('areaHa')} type="number" step="any" placeholder="1.5" required />
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold">Área (m²)</label>
                                <div className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground">{areaM2 || '—'}</div>
                            </div>
                        </div>
                        <Textarea
                            label="Vértices del polígono" value={form.verticesTexto} onChange={set('verticesTexto')} required rows={4}
                            placeholder={'1.8500,-76.0500\n1.8510,-76.0500\n1.8510,-76.0490'} className="font-mono"
                        />
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex gap-2">
                            <Info size={14} className="shrink-0 mt-0.5" />
                            <span>Escribe un vértice por línea en formato lat,lng (mínimo 3). El centroide se calcula automáticamente.</span>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Btn type="submit" disabled={enviando} className="flex-1 justify-center">
                                {enviando ? 'Guardando...' : form.tipo === 'subplot' ? 'Guardar Sublote' : 'Guardar Lote'}
                            </Btn>
                            <Btn variant="outline" onClick={volver}>Cancelar</Btn>
                        </div>
                    </form>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default NuevoLote;