export const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}${path}`, {
    signal,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 401) throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
  if (res.status === 403) throw new Error("No tienes permiso para ver esta información.");
  if (!res.ok) throw new Error(`Error ${res.status} al consultar ${path}`);
  return res.json() as Promise<T>;
}
