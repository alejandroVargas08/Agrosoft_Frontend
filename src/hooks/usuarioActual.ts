// Devuelve el id del usuario guardado en localStorage al iniciar sesión
export function usuarioActualId(): number | undefined {
    try {
        const id = JSON.parse(localStorage.getItem('user') ?? 'null')?.id;
        return typeof id === 'number' ? id : undefined;
    } catch {
        return undefined;
    }
}