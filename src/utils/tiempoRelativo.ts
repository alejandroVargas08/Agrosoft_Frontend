export function tiempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  
  if (min < 1) 
    return 'Ahora';
  if (min < 60) 
    return `Hace ${min}m`;

  const h = Math.floor(min / 60);
  
  if (h < 24) 
    return `Hace ${h}h`;
  return `Hace ${Math.floor(h / 24)}d`;
}
