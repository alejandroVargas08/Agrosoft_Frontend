import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { telegramApi } from '../api/telegram';

export function useTelegram() {
    const queryClient = useQueryClient();

    // El modulo de Telegram se apaga con TELEGRAM_ENABLED=false y entonces la
    // ruta no existe: eso no es un error que haya que reintentar ni mostrar rojo
    const estadoQuery = useQuery({
        queryKey: ['telegram-vinculacion'],
        queryFn: async () => (await telegramApi.estado()).data,
        retry: false,
    });

    const generarCodigo = useMutation({
        mutationFn: async () => (await telegramApi.generarCodigo()).data,
    });

    const desvincular = useMutation({
        mutationFn: () => telegramApi.desvincular(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['telegram-vinculacion'] });
        },
    });

    return {
        disponible: !estadoQuery.isError,
        vinculado: estadoQuery.data?.vinculado ?? false,
        cargandoEstado: estadoQuery.isLoading,
        refrescarEstado: () => queryClient.invalidateQueries({ queryKey: ['telegram-vinculacion'] }),
        generarCodigo,
        desvincular,
    };
}
