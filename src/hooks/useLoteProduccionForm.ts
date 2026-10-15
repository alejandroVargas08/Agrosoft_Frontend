import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ESTADO_INICIAL_LOTE_PRODUCCION_FORM, type ActualizarLoteProduccionPayload, type CrearLoteProduccionPayload, type loteProduccion, type LoteProduccionFormState } from "../types/lotesProduccion";
import { useState } from "react";
import { actividadesApi, cultivosApi, lotesApi, productosAgroApi } from "../api/actividades/actividades";
import { lotesProduccionApi } from "../api/lotesProduccion";
import { isAxiosError } from "axios";

interface useLoteProduccionFormProps {
    loteEnEdicion?: loteProduccion | null;
    onSuccess: () => void;
}

const DEPENDIENTES: Partial<Record<keyof LoteProduccionFormState, (keyof LoteProduccionFormState)[]>> = {
    loteId: ['cultivoId', 'subLoteId', 'actividadesCosechaId'],
    cultivoId: ['actividadesCosechaId'],
};

export function useLoteProduccionForm({ loteEnEdicion, onSuccess}: useLoteProduccionFormProps) {
    const queryClient = useQueryClient();
    const [errorLocal, setErrorLocal] = useState<string | null>(null);

    const [form, setForm] = useState<LoteProduccionFormState>(() =>
    loteEnEdicion
        ? {
            productoAgroId: String(loteEnEdicion.productoAgroId),
            loteId: String(loteEnEdicion.loteId),
            cultivoId: String(loteEnEdicion.cultivoId),
            subLoteId: loteEnEdicion.subLoteId ? String(loteEnEdicion.subLoteId) : '',
            actividadesCosechaId: loteEnEdicion.actividadesCosechaId ? String(loteEnEdicion.actividadesCosechaId) : '',
            calidad: loteEnEdicion.calidad,
            cantidadKg: String(loteEnEdicion.cantidadKg),
            stockDisponibleKg: String(loteEnEdicion.stockDisponibleKg),
            costoUnitarioKg: String(loteEnEdicion.costoUnitarioKg),
            precioSugeridoKg: String(loteEnEdicion.precioSugeridoKg),
        }
        : ESTADO_INICIAL_LOTE_PRODUCCION_FORM,
); 

    const loteIdNum = form.loteId ? Number(form.loteId) : undefined;
    const cultivoIdNum = form.cultivoId ? Number(form.cultivoId) : undefined;

    const { data: productos = [] } = useQuery({
        queryKey: ['productos-agro'],
        queryFn: async () => (await productosAgroApi.listar()).data,
        });

    const { data: lotesTerreno = [] } = useQuery({
        queryKey: ['lotes'],
        queryFn: async () => (await lotesApi.listar()).data,
        });

    const { data: cultivos = [] } = useQuery({
        queryKey: ['cultivos', loteIdNum],
        queryFn: async () => (await cultivosApi.listarPorLote(loteIdNum!)).data,
        enabled: !!loteIdNum,
        });

    const { data: sublotes = [] } = useQuery({
        queryKey: ['sublotes', loteIdNum],
        queryFn: async () => (await lotesApi.sublotesPorLote(loteIdNum!)).data,
        enabled: !!loteIdNum,
        });

    const { data: actividades = [] } = useQuery({
        queryKey: ['actividades', cultivoIdNum],
        queryFn: async () => (await actividadesApi.listarPorCultivo(cultivoIdNum!)).data,
        enabled: !!cultivoIdNum,
        });

    const invalidarListado = () => queryClient.invalidateQueries({ queryKey: ['lotesProduccion'] });

    const crearMutation = useMutation({
        mutationFn: (payload: CrearLoteProduccionPayload) => lotesProduccionApi.crear(payload),
        onSuccess: () => {
            invalidarListado();
            onSuccess();
        },
    });

    const actualizarMutation = useMutation({
        mutationFn: ({ id, payload}: { id: number; payload: ActualizarLoteProduccionPayload}) =>
            lotesProduccionApi.actualizar(id, payload),
        onSuccess: () => {
            invalidarListado();
            onSuccess();
        },
    });

    const set = (campo: keyof LoteProduccionFormState) => (valor: string) =>
        setForm((prev) => {
            const siguiente = { ...prev, [campo]: valor};
            for (const dep of DEPENDIENTES[campo] ?? []) siguiente[dep] = '';
            return siguiente;
        });

    const costoTotalEstimado = (Number(form.cantidadKg) || 0) * (Number(form.costoUnitarioKg) || 0);

const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    if (!form.productoAgroId) return setErrorLocal('Selecciona el producto.');
    if (!form.loteId) return setErrorLocal('Selecciona el lote.');
    if (!form.cultivoId) return setErrorLocal('Selecciona el cultivo.');
    if (!form.calidad) return setErrorLocal('Selecciona la calidad.');

    const cantidadKg = Number(form.cantidadKg);
    if (!(cantidadKg > 0)) return setErrorLocal('La cantidad debe ser mayor a 0.');

    const stockDisponibleKg = form.stockDisponibleKg === '' ? cantidadKg : Number(form.stockDisponibleKg);
    if (stockDisponibleKg < 0 || stockDisponibleKg > cantidadKg)
        return setErrorLocal('El stock disponible debe estar entre 0 y la cantidad producida.');

    const payload: CrearLoteProduccionPayload = {
        productoAgroId: Number(form.productoAgroId),
        cultivoId: Number(form.cultivoId),
        loteId: Number(form.loteId),
        subLoteId: form.subLoteId ? Number(form.subLoteId) : undefined,
        actividadesCosechaId: form.actividadesCosechaId ? Number(form.actividadesCosechaId) : undefined,
        calidad: form.calidad,
        cantidadKg,
        stockDisponibleKg,
        costoUnitarioKg: Number(form.costoUnitarioKg) || 0,
        costoTotal: costoTotalEstimado,
        precioSugeridoKg: Number(form.precioSugeridoKg) || 0,
    };

    if (loteEnEdicion) actualizarMutation.mutate({ id: loteEnEdicion.id, payload });
    else crearMutation.mutate(payload);
};

const mutacionActiva = loteEnEdicion ? actualizarMutation : crearMutation;
const errorBackend = mutacionActiva.error
    ? isAxiosError(mutacionActiva.error)
        ? (mutacionActiva.error.response?.data as { message?: string | string[] } | undefined)?.message
        : 'Error inesperado al guardar'
    : null;

return {
    form,
    set,
    productos,
    lotesTerreno,
    cultivos,
    sublotes,
    actividades,
    costoTotalEstimado,
    handleSubmit,
    guardando: mutacionActiva.isPending,
    errorForm:
        errorLocal ??
        (Array.isArray(errorBackend) ? errorBackend.join(', ') : errorBackend ?? (mutacionActiva.error ? 'No se pudo guardar el lote de producción' : null)),
    esEdicion: !!loteEnEdicion,
    };    
}