import { useQuery } from '@tanstack/react-query';
import { usuarioApi } from '../../api/usuarios/usuarios';
import { programasFormacionApi } from '../../api/programa_formacion/programasFormacion';
import { reportesApi } from '../../api/reportes';
import { incidenciasApi } from '../../api/incidencias';
import { alertasApi } from '../../api/alertas';
import { mensajeError } from '../../api/errores/errores';

// Las mismas etiquetas que pone el backend de reportes a cada mes
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** Los indicadores del Dashboard de Administración. No hay un endpoint de
 *  métricas: cada número sale de contar lo que ya devuelve su módulo. Las
 *  llaves de caché son las mismas que usan Reportes, Incidencias y Alertas. */
export function useDashboardAdmin() {
    const usuariosQuery = useQuery({
        queryKey: ['usuarios'],
        queryFn: async () => (await usuarioApi.listar()).data,
    });

    const programasQuery = useQuery({
        queryKey: ['programas-resumen'],
        queryFn: async () => (await programasFormacionApi.resumen()).data,
    });

    const reporteQuery = useQuery({
        queryKey: ['reportes', 'mensual'],
        queryFn: async () => (await reportesApi.obtener('mensual')).data,
    });

    const incidenciasQuery = useQuery({
        queryKey: ['incidencias'],
        queryFn: async () => (await incidenciasApi.listar()).data,
    });

    const sensoresQuery = useQuery({
        queryKey: ['sensores'],
        queryFn: async () => (await alertasApi.sensores()).data,
    });

    const bajoStockQuery = useQuery({
        queryKey: ['insumos-bajo-stock'],
        queryFn: async () => (await alertasApi.insumosBajoStock()).data,
    });

    const usuarios = usuariosQuery.data ?? [];
    const programas = programasQuery.data ?? [];
    const sensores = sensoresQuery.data ?? [];
    const finanzas = reporteQuery.data?.finanzas ?? [];

    const hoy = new Date();
    const delMesActual = (fecha: string) => {
        const f = new Date(fecha);
        return f.getFullYear() === hoy.getFullYear() && f.getMonth() === hoy.getMonth();
    };

    // El reporte mensual trae los últimos seis meses; el último tramo es el actual
    const mesActual = finanzas.find((f) => f.periodo === MESES[hoy.getMonth()]);
    const fichasActivas = programas.filter((p) => p.estado === 'activo');
    const conectados = sensores.filter((s) => s.estadoConexion === 'conectado').length;

    // Un número que no se pudo cargar se muestra como guion, nunca como cero
    const o = <T,>(listo: boolean, valor: T) => (listo ? valor : '—');

    return {
        usuarios: o(usuariosQuery.isSuccess, usuarios.length),
        nuevosEsteMes: usuarios.filter((u) => delMesActual(u.creadoEn)).length,
        pendientes: usuarios.filter((u) => u.estado === 'pendiente').length,
        unidadesActivas: o(reporteQuery.isSuccess, reporteQuery.data?.resumen.unidadesActivas ?? 0),
        ingresosMes: reporteQuery.isSuccess ? (mesActual?.ingresos ?? 0) : null,
        alertasActivas: o(
            incidenciasQuery.isSuccess,
            (incidenciasQuery.data ?? []).filter((i) => i.estado !== 'resolved').length,
        ),
        finanzas,
        sensores: {
            listo: sensoresQuery.isSuccess,
            conectados,
            total: sensores.length,
            desconectados: sensores.length - conectados,
        },
        programas: {
            listo: programasQuery.isSuccess,
            fichasActivas: fichasActivas.length,
            aprendices: fichasActivas.reduce((total, p) => total + p.totalAprendices, 0),
        },
        inventarioCritico: o(bajoStockQuery.isSuccess, (bajoStockQuery.data ?? []).length),
        cargandoFinanzas: reporteQuery.isLoading,
        error: usuariosQuery.error
            ? mensajeError(usuariosQuery.error, 'No se pudieron cargar los indicadores.')
            : '',
    };
}
