"use client";

import { useEffect, useRef, useState } from "react";
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Polyline, 
  Circle, 
  useMap 
} from "react-leaflet";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Crosshair, Navigation, Maximize2, ShieldCheck, Compass } from "lucide-react";
import { fetchTripCorridor, calculateHaversineKm, TripCorridorResult } from "@/lib/routing";

// Fix Leaflet default icon issues in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Single Moving Vehicle Marker (Google 3D Navigation Chevron & Forward Light Beam)
const createVehicleIcon = (vehicleNumber: string, speed: number, heading: number) => {
  const isMoving = speed > 0;
  const primaryColor = isMoving ? "#1a73e8" : "#5f6368";
  const glowColor = isMoving ? "rgba(26, 115, 232, 0.45)" : "rgba(95, 99, 104, 0.25)";

  const html = `
    <div class="relative flex flex-col items-center justify-center select-none" style="cursor: pointer; filter: drop-shadow(0 8px 18px rgba(0,0,0,0.45));">
      
      <!-- Google Navigation Forward Light Beam (Points in direction of travel) -->
      ${isMoving ? `
      <div style="
        position: absolute;
        width: 100px;
        height: 100px;
        top: -30px;
        left: 5px;
        transform: rotate(${heading || 0}deg);
        pointer-events: none;
        background: radial-gradient(circle at 50% 80%, ${glowColor} 0%, transparent 68%);
        clip-path: polygon(50% 80%, 15% 0%, 85% 0%);
        animation: pulse 2.5s ease-in-out infinite;
      "></div>
      ` : ''}

      <!-- Google 3D Navigation Chevron Puck (Rotates with Heading) -->
      <div style="
        transform: rotate(${heading || 0}deg);
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #ffffff;
        box-shadow: 0 4px 14px rgba(0,0,0,0.35), 0 0 0 3.5px ${primaryColor};
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="${primaryColor}" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.25));">
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
        </svg>
      </div>

      <!-- Google Floating Navigation Pill Badge -->
      <div style="
        margin-top: 5px;
        background: #202124;
        border: 1.5px solid ${primaryColor};
        border-radius: 9999px;
        padding: 2.5px 10px;
        color: #ffffff;
        font-family: Roboto, -apple-system, sans-serif;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.02em;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        gap: 5px;
      ">
        <span>${vehicleNumber}</span>
        <span style="color: ${isMoving ? '#8ab4f8' : '#bdc1c6'}; font-weight: 900;">• ${isMoving ? `${Math.round(speed)} km/h` : 'Stopped'}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-customer-vehicle-icon',
    html: html,
    iconSize: [110, 80],
    iconAnchor: [55, 22],
    popupAnchor: [0, -28]
  });
};

// Origin Hub Pin (Emerald)
const createOriginIcon = (cityName: string) => L.divIcon({
  className: 'custom-hub-icon',
  html: `
    <div style="display: flex; align-items: center; gap: 6px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.4));">
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        background: #059669;
        border: 3px solid #ffffff;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 12px rgba(5, 150, 105, 0.6);
      ">
        <div style="width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
      </div>
      <div style="
        background: rgba(6, 78, 59, 0.95);
        backdrop-filter: blur(8px);
        color: #a7f3d0;
        font-size: 11px;
        font-weight: 800;
        padding: 3px 8px;
        border-radius: 8px;
        border: 1px solid #10b981;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      ">
        Origin: ${cityName}
      </div>
    </div>
  `,
  iconSize: [160, 36],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Destination Hub Pin (Violet / Crimson)
const createDestinationIcon = (cityName: string) => L.divIcon({
  className: 'custom-hub-icon',
  html: `
    <div style="display: flex; align-items: center; gap: 6px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.4));">
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        background: #7c3aed;
        border: 3px solid #ffffff;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 12px rgba(124, 58, 237, 0.6);
      ">
        <div style="width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
      </div>
      <div style="
        background: rgba(76, 29, 149, 0.95);
        backdrop-filter: blur(8px);
        color: #ddd6fe;
        font-size: 11px;
        font-weight: 800;
        padding: 3px 8px;
        border-radius: 8px;
        border: 1px solid #8b5cf6;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      ">
        Delivery: ${cityName}
      </div>
    </div>
  `,
  iconSize: [160, 36],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Controller to auto-fit bounds on load or auto-center on vehicle
function MapViewController({ 
  currentLat, 
  currentLng, 
  srcLat, 
  srcLng, 
  destLat, 
  destLng, 
  recenterTrigger,
  fitRouteTrigger 
}: { 
  currentLat: number; 
  currentLng: number; 
  srcLat?: number; 
  srcLng?: number; 
  destLat?: number; 
  destLng?: number;
  recenterTrigger: number;
  fitRouteTrigger: number;
}) {
  const map = useMap();
  const initialFitDone = useRef(false);

  // Initial fit to route bounds
  useEffect(() => {
    if (!initialFitDone.current && currentLat && currentLng) {
      const bounds = L.latLngBounds([[currentLat, currentLng]]);
      if (srcLat && srcLng) bounds.extend([srcLat, srcLng]);
      if (destLat && destLng) bounds.extend([destLat, destLng]);
      
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
      initialFitDone.current = true;
    }
  }, [map, currentLat, currentLng, srcLat, srcLng, destLat, destLng]);

  // Recenter explicitly on vehicle
  useEffect(() => {
    if (recenterTrigger > 0 && currentLat && currentLng) {
      map.flyTo([currentLat, currentLng], 14, { duration: 1.2 });
    }
  }, [map, recenterTrigger, currentLat, currentLng]);

  // Fit whole route explicitly
  useEffect(() => {
    if (fitRouteTrigger > 0) {
      const bounds = L.latLngBounds([[currentLat, currentLng]]);
      if (srcLat && srcLng) bounds.extend([srcLat, srcLng]);
      if (destLat && destLng) bounds.extend([destLat, destLng]);
      map.fitBounds(bounds, { padding: [70, 70], maxZoom: 14 });
    }
  }, [map, fitRouteTrigger, currentLat, currentLng, srcLat, srcLng, destLat, destLng]);

  return null;
}

export interface CustomerMapProps {
  vehicleNumber: string;
  driverName?: string;
  driverPhone?: string;
  speed?: number;
  heading?: number;
  currentLat: number;
  currentLng: number;
  currentAddress?: string;
  sourceCity: string;
  srcLat?: number;
  srcLng?: number;
  destCity: string;
  destLat?: number;
  destLng?: number;
  isInsideOriginGeofence?: boolean;
  isInsideDestGeofence?: boolean;
}

export default function CustomerMap({
  vehicleNumber,
  driverName,
  driverPhone,
  speed = 0,
  heading = 0,
  currentLat,
  currentLng,
  currentAddress,
  sourceCity,
  srcLat,
  srcLng,
  destCity,
  destLat,
  destLng,
  isInsideOriginGeofence = false,
  isInsideDestGeofence = false
}: CustomerMapProps) {
  const [mapStyle, setMapStyle] = useState<'GOOGLE' | 'TRAFFIC' | 'SATELLITE' | 'TERRAIN' | 'DARK'>('GOOGLE');
  const [corridor, setCorridor] = useState<TripCorridorResult>({ traveledCoordinates: [], remainingCoordinates: [] });
  const [recenterCount, setRecenterCount] = useState(0);
  const [fitRouteCount, setFitRouteCount] = useState(0);

  // Fetch curved road corridor
  useEffect(() => {
    let isCancelled = false;
    async function loadCorridor() {
      if (!currentLat || !currentLng) return;
      const res = await fetchTripCorridor(srcLat, srcLng, currentLat, currentLng, destLat, destLng);
      if (!isCancelled) {
        setCorridor(res);
      }
    }
    loadCorridor();
    return () => { isCancelled = true; };
  }, [srcLat, srcLng, currentLat, currentLng, destLat, destLng]);

  const tileLayerUrls: Record<string, string> = {
    GOOGLE: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    TRAFFIC: 'https://mt1.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}',
    SATELLITE: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    TERRAIN: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    DARK: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
  };

  const tileAttributions: Record<string, string> = {
    GOOGLE: '&copy; Google Maps',
    TRAFFIC: '&copy; Google Maps Traffic',
    SATELLITE: '&copy; Google Satellite',
    TERRAIN: '&copy; Google Terrain',
    DARK: '&copy; CartoDB &copy; OpenStreetMap'
  };

  return (
    <div className="relative w-full h-full min-h-[420px] bg-slate-950 overflow-hidden">
      <style jsx global>{`
        @keyframes customer-ping {
          0% { transform: scale(0.6); opacity: 0.9; }
          80%, 100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>

      {/* Floating Google Map Style Selector & Action Tools */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-auto">
        {/* Google Layer Selector Pill */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 rounded-2xl p-1 shadow-2xl flex items-center gap-1">
          <button
            onClick={() => setMapStyle('GOOGLE')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-xl transition flex items-center gap-1 ${
              mapStyle === 'GOOGLE' ? 'bg-[#1a73e8] text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>🗺️</span>
            <span>Google</span>
          </button>
          <button
            onClick={() => setMapStyle('TRAFFIC')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-xl transition flex items-center gap-1 ${
              mapStyle === 'TRAFFIC' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Live Traffic Congestion"
          >
            <span>🚦</span>
            <span>Traffic</span>
          </button>
          <button
            onClick={() => setMapStyle('SATELLITE')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-xl transition flex items-center gap-1 ${
              mapStyle === 'SATELLITE' ? 'bg-[#1a73e8] text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>🛰️</span>
            <span>Satellite</span>
          </button>
          <button
            onClick={() => setMapStyle('TERRAIN')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-xl transition flex items-center gap-1 ${
              mapStyle === 'TERRAIN' ? 'bg-[#1a73e8] text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>⛰️</span>
            <span>Terrain</span>
          </button>
        </div>

        {/* Quick Map Navigation Controls */}
        <div className="flex flex-col gap-1.5 self-end">
          <button
            onClick={() => setRecenterCount(c => c + 1)}
            title="Focus on Vehicle"
            className="p-2.5 bg-white/95 dark:bg-slate-900/95 hover:bg-slate-100 dark:hover:bg-slate-800 backdrop-blur-md text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-xl transition flex items-center justify-center group"
          >
            <Crosshair className="w-4 h-4 text-[#1a73e8] group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={() => setFitRouteCount(c => c + 1)}
            title="View Full Route"
            className="p-2.5 bg-white/95 dark:bg-slate-900/95 hover:bg-slate-100 dark:hover:bg-slate-800 backdrop-blur-md text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-xl transition flex items-center justify-center group"
          >
            <Maximize2 className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      <MapContainer
        center={[currentLat || 12.9716, currentLng || 77.5946]}
        zoom={12}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          url={tileLayerUrls[mapStyle]}
          attribution={tileAttributions[mapStyle]}
        />

        <MapViewController
          currentLat={currentLat}
          currentLng={currentLng}
          srcLat={srcLat}
          srcLng={srcLng}
          destLat={destLat}
          destLng={destLng}
          recenterTrigger={recenterCount}
          fitRouteTrigger={fitRouteCount}
        />

        {/* Origin Geofence (1.0 km) */}
        {srcLat && srcLng && (
          <>
            <Circle
              center={[srcLat, srcLng]}
              radius={1000}
              pathOptions={{
                color: isInsideOriginGeofence ? '#10b981' : '#059669',
                fillColor: '#10b981',
                fillOpacity: isInsideOriginGeofence ? 0.25 : 0.08,
                weight: 2,
                dashArray: '5, 6'
              }}
            />
            <Marker position={[srcLat, srcLng]} icon={createOriginIcon(sourceCity)}>
              <Popup>
                <div className="p-1 text-slate-900">
                  <div className="text-xs font-bold text-emerald-700">Origin Hub Geofence (1.0 km)</div>
                  <div className="text-sm font-black">{sourceCity}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {isInsideOriginGeofence ? '🟢 Vehicle currently at loading dock' : '✅ Dispatched from origin hub'}
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Destination Geofence (1.0 km) */}
        {destLat && destLng && (
          <>
            <Circle
              center={[destLat, destLng]}
              radius={1000}
              pathOptions={{
                color: isInsideDestGeofence ? '#8b5cf6' : '#7c3aed',
                fillColor: '#8b5cf6',
                fillOpacity: isInsideDestGeofence ? 0.3 : 0.08,
                weight: 2,
                dashArray: '5, 6'
              }}
            />
            <Marker position={[destLat, destLng]} icon={createDestinationIcon(destCity)}>
              <Popup>
                <div className="p-1 text-slate-900">
                  <div className="text-xs font-bold text-purple-700">Consignee Unloading Dock (1.0 km)</div>
                  <div className="text-sm font-black">{destCity}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {isInsideDestGeofence ? '🟣 Vehicle reached consignee dock' : '🚚 Awaiting vehicle gate arrival'}
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Real Highway Road Route - Traveled Corridor (Google Navigation Double-Cased Polyline) */}
        {corridor.traveledCoordinates.length > 1 && (
          <>
            {/* Outer Contrast Border Casing */}
            <Polyline
              positions={corridor.traveledCoordinates}
              pathOptions={{
                color: mapStyle === 'DARK' || mapStyle === 'SATELLITE' ? '#0f172a' : '#ffffff',
                weight: 9,
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
            {/* Inner Core: Google Navigation Royal Blue */}
            <Polyline
              positions={corridor.traveledCoordinates}
              pathOptions={{
                color: '#1a73e8',
                weight: 5.5,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
          </>
        )}

        {/* Remaining Muted Slate / Grey Google Navigation Route */}
        {corridor.remainingCoordinates.length > 1 && (
          <>
            {/* Outer Contrast Border Casing */}
            <Polyline
              positions={corridor.remainingCoordinates}
              pathOptions={{
                color: mapStyle === 'DARK' || mapStyle === 'SATELLITE' ? '#0f172a' : '#ffffff',
                weight: 7,
                opacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
            {/* Google Slate Grey Dashed Line */}
            <Polyline
              positions={corridor.remainingCoordinates}
              pathOptions={{
                color: '#80868b',
                weight: 4.5,
                opacity: 0.9,
                dashArray: '7, 9',
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
          </>
        )}

        {/* Vehicle Marker */}
        {currentLat && currentLng && (
          <Marker
            position={[currentLat, currentLng]}
            icon={createVehicleIcon(vehicleNumber, speed, heading)}
          >
            <Popup>
              <div className="p-1.5 text-slate-900 space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black tracking-wide">{vehicleNumber}</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {speed > 0 ? `${Math.round(speed)} km/h` : 'Stationary'}
                  </span>
                </div>
                {driverName && (
                  <div className="text-xs text-slate-600">
                    Driver: <span className="font-semibold text-slate-900">{driverName}</span>
                  </div>
                )}
                {currentAddress && (
                  <div className="text-[11px] text-slate-500 line-clamp-2">
                    📍 {currentAddress}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
