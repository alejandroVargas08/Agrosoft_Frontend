interface AuthUser{
    id?: number;
    nombre?: string;
    nombres?: string;
    name?: string;
    email?: string;
    correo?: string;
    token?: string;
}

export function InicioUsuario(): {user: AuthUser | null; isAuthenticated: boolean}{
    const userStr = localStorage.getItem('user');
    const user: AuthUser | null = userStr ? JSON.parse(userStr): null;

    return {
        user, 
        isAuthenticated: !!localStorage.getItem('token'),
    }
}