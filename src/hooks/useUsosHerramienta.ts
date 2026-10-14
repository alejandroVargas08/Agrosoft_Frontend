import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useState } from "react";
import { ESTADO_INICIAL_USO_HERRAMIENTA_FORM, type RegistrarUsoHerramientaPayload, type UsoHerramientaFormState } from "../types/usosHerramientas";
import { usosHerramientaApi } from "../api/usosHerramienta";
import { insumosApi } from "../api/inventario";
import { useActividadHerramientas } from "../../src/hooks/Actividades/useActividadHerramientas";



const mensajeDe = (
    err: unknown,
    porDefecto: string) : string | null => {
        if (!err) return null; 
        if (isAxiosError(err)) {
            const msg = (err.response?.data as { message?: string | string[]} | undefined)?.message;
            if (Array.isArray(msg)) return msg.join(',');
            return msg ?? porDefecto;
        }

        return 'Error Inesperado';
    };

export function useUsosHerramienta(actividadId: number | undefined) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<UsoHerramientaFormState>(ESTADO_INICIAL_USO_HERRAMIENTA_FORM);
    const [errorLocal, setErrorLocal] = useState<string | null>(null);

    const { data: usos = [], isLoading: loading, error} = useQuery({
        queryKey: ['usos-herramienta', actividadId],
        queryFn: async() => (await usosHerramientaApi.listar(actividadId!)).data,
        enabled: !!actividadId,
    });

    const { herramientas: asignadas} = useActividadHerramientas(actividadId);

    const {data: insumos = []} = useQuery({
        queryKey: ['insumos', 'todos'],
        queryFn: async() => (await insumosApi.listar()).data,
    });
    const nombreHerramienta = (id: number) =>
        insumos.find((i) => i.id === id)?.nombre ?? `Herramienta #${id}`;

    const opcionesHerramientas = [...new Set(asignadas.map((h) => h.insumoId))].map((id) => ({
        value: String(id),
        label: nombreHerramienta(id),
    }));

    const totalHoras = usos.reduce((acc,u) => acc + u.horasUsadas, 0);
    const totalDepreciacion = usos.reduce((acc, u) => acc + u.depreciacionGenerada, 0);

    const registrarMutation = useMutation({
        mutationFn: (payload: RegistrarUsoHerramientaPayload) =>
            usosHerramientaApi.registrar(actividadId!, payload),
        onSuccess: () => {
            setForm(ESTADO_INICIAL_USO_HERRAMIENTA_FORM);
            queryClient.invalidateQueries({ queryKey: ['usos-herramienta', actividadId] });
        },
    });

    const set = (campo: keyof UsoHerramientaFormState) => (valor: string) =>
        setForm((prev) => ({...prev, [campo]: valor }));

    const handleSubmit = (e:React.FormEvent) => {
        e.preventDefault();
        setErrorLocal(null);

        if (!form.insumoId) return setErrorLocal('Selecciona la herramienta.');
    if (!(Number(form.horasUsadas) > 0)) return setErrorLocal('Las horas usadas deben ser mayores a 0.');
    if (form.tasaDepreciacionHora === '' || Number(form.tasaDepreciacionHora) < 0)
      return setErrorLocal('La tasa de depreciación por hora no puede ser negativa.');

    registrarMutation.mutate({
      insumoId: Number(form.insumoId),
      horasUsadas: Number(form.horasUsadas),
      tasaDepreciacionHora: Number(form.tasaDepreciacionHora),
      valorLibroAntes: form.valorLibrosAntes === '' ? undefined : Number(form.valorLibrosAntes),
    });
  };

  return {
    usos,
    loading,
    error: error ? 'No se pudo cargar el uso de herramientas' : null,
    nombreHerramienta,
    opcionesHerramientas,
    totalHoras,
    totalDepreciacion,
    form,
    set,
    handleSubmit,
    registrando: registrarMutation.isPending,
    errorForm: errorLocal ?? mensajeDe(registrarMutation.error, 'No se pudo registrar el uso'),
  };
}