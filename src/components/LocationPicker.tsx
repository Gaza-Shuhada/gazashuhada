'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Next.js
// Use CDN URLs for Leaflet marker icons to avoid build issues
const iconPrototype = L.Icon.Default.prototype as unknown as { _getIconUrl?: () => void };
delete iconPrototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Gaza, Palestine coordinates
const GAZA_CENTER: [number, number] = [31.5, 34.45];
const DEFAULT_ZOOM = 11;

interface LocationPickerProps {
  initialLat?: number | null;
  initialLng?: number | null;
  onLocationChange?: (lat: number | null, lng: number | null) => void;
  readOnly?: boolean;
}

// Component to handle map clicks
function LocationMarker({ 
  position, 
  setPosition,
  readOnly = false
}: { 
  position: [number, number] | null; 
  setPosition?: (pos: [number, number]) => void;
  readOnly?: boolean;
}) {
  useMapEvents({
    click(e) {
      if (!readOnly && setPosition) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
      }
    },
  });

  return position ? (
    <Marker 
      position={position} 
      draggable={!readOnly} 
      eventHandlers={!readOnly && setPosition ? {
        dragend: (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          setPosition([position.lat, position.lng]);
        },
      } : {}}
    />
  ) : null;
}

export default function LocationPicker({ 
  initialLat, 
  initialLng, 
  onLocationChange,
  readOnly = false
}: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  );
  const [isMounted, setIsMounted] = useState(false);

  // Only render map on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update parent when position changes (only if not readOnly)
  useEffect(() => {
    if (!readOnly && onLocationChange) {
      if (position) {
        onLocationChange(position[0], position[1]);
      } else {
        onLocationChange(null, null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, readOnly]); // Intentionally omit onLocationChange to avoid infinite loop

  const handleClear = () => {
    if (!readOnly) {
      setPosition(null);
    }
  };

  if (!isMounted) {
    return (
      <div className="h-96 w-full bg-muted rounded-md flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative h-96 w-full rounded-md overflow-hidden border">
        <MapContainer
          center={position || GAZA_CENTER}
          zoom={position ? 13 : DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={readOnly ? undefined : setPosition} readOnly={readOnly} />
        </MapContainer>
      </div>
      
      {!readOnly && (
        <>
          <div className="flex items-center justify-between text-sm">
            {position ? (
              <>
                <p className="text-muted-foreground">
                  Location selected: {position[0].toFixed(6)}, {position[1].toFixed(6)}
                </p>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-destructive hover:underline"
                >
                  Clear location
                </button>
              </>
            ) : (
              <p className="text-muted-foreground">
                Click on the map to set location of death
              </p>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground">
            💡 Tip: Click to place marker, drag to adjust position
          </p>
        </>
      )}
      
      {readOnly && position && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Coordinates: {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </p>
          <a
            href={`https://www.google.com/maps?q=${position[0]},${position[1]}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            View on Google Maps
          </a>
        </div>
      )}
    </div>
  );
}

