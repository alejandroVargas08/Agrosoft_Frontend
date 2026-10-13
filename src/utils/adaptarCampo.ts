import type { ChangeEvent } from "react"

type ManejadorCambio = {
    bivarianceHack(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void;
} ['bivarianceHack']; 

export const campo= 
(handler: ManejadorCambio, name: string) => 
(value: string) =>
    handler({ target: {name, value} } as ChangeEvent<HTMLInputElement>);