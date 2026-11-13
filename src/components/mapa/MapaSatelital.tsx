import type { ReactNode } from 'react';
import { APIProvider, Map } from '@vis.gl/react-google-maps';
import type { MapMouseEvent } from '@vis.gl/react-google-maps';
import type { Punto } from '../../types/territorio';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
const CENTRO_HUILA: Punto = { lat: 2.2, lng: -75.6 };

interface MapaSatelitalProps {
    children?: ReactNode;
    alto?: number;
    centro?: Punto;
    zoom?: number;
    onClickMapa?: (punto: Punto) => void;
    className?: string;
}

export const MapaSatelital = ({ children, alto, centro, zoom = 8, onClickMapa, className = '' }: MapaSatelitalProps) => {
    if (!API_KEY) {
        return (
            <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                Falta VITE_GOOGLE_MAPS_API_KEY en el archivo .env de la web.
            </div>
        );
    }

    const manejarClick = (e: MapMouseEvent) => {
        const latLng = e.detail.latLng;
        if (latLng && onClickMapa) onClickMapa({ lat: latLng.lat, lng: latLng.lng });
    };

    return (
        <APIProvider apiKey={API_KEY} language="es" region="CO">
            <div className={`w-full ${className}`} style={alto ? { height: alto } : undefined}>
                <Map
                    defaultCenter={centro ?? CENTRO_HUILA}
                    defaultZoom={zoom}
                    mapTypeId="hybrid"
                    gestureHandling="greedy"
                    streetViewControl={false}
                    mapTypeControl={false}
                    clickableIcons={false}
                    disableDoubleClickZoom={!!onClickMapa}
                    draggableCursor={onClickMapa ? 'crosshair' : undefined}
                    onClick={onClickMapa ? manejarClick : undefined}
                    style={{ width: '100%', height: '100%' }}
                >
                    {children}
                </Map>
            </div>
        </APIProvider>
    );
};
