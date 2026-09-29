import { useEffect, useRef } from "react";
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Tooltip, 
  Polyline, 
  Circle, 
  CircleMarker, 
  ZoomControl, 
  useMap 
} from "react-leaflet";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Top-Down Truck SVG with dynamic rotation & source color coding (Green for SIM, Blue for Mobile GPS)
const getTruckIcon = (bearing: number, source?: string, trackingStatus?: string, isActive?: boolean) => {
  const isSim = source === "SIM_TRACKING";
  const isOffline = trackingStatus === "OFFLINE";
  const isStale = trackingStatus === "STALE";

  const trailerColor = isOffline ? "#64748b" : isStale ? "#d97706" : isSim ? "#15803d" : "#1e40af";
  const cabColor = isOffline ? "#94a3b8" : isStale ? "#f59e0b" : isSim ? "#22c55e" : "#3b82f6";
  const glassColor = isOffline ? "#cbd5e1" : isStale ? "#fde68a" : isSim ? "#bbf7d0" : "#93c5fd";
  const scale = isActive ? 1.25 : 1.0;

  return L.divIcon({
    className: 'custom-truck-icon',
    html: `
      <div style="transform: rotate(${bearing}deg) scale(${scale}); width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 6px 10px rgba(0,0,0,0.45)); transition: transform 0.3s ease;">
        <svg viewBox="0 0 100 200" width="28" height="56" xmlns="http://www.w3.org/2000/svg">
          <!-- Trailer -->
          <rect x="10" y="45" width="80" height="150" rx="6" fill="${trailerColor}" stroke="#ffffff" stroke-width="${isActive ? '3.5' : '2'}" />
          <!-- Cab -->
          <rect x="15" y="5" width="70" height="35" rx="8" fill="${cabColor}" stroke="#ffffff" stroke-width="${isActive ? '3.5' : '2'}" />
          <!-- Windshield -->
          <rect x="20" y="10" width="60" height="15" rx="3" fill="${glassColor}" />
          <!-- Mirrors -->
          <rect x="8" y="15" width="5" height="10" rx="2" fill="${cabColor}" />
          <rect x="87" y="15" width="5" height="10" rx="2" fill="${cabColor}" />
        </svg>
      </div>
    `,
    iconSize: [36, 56],
    iconAnchor: [18, 28],
    popupAnchor: [0, -28],
  });
};

function calculateBearing(startLat: number, startLng: number, destLat: number, destLng: number) {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLngRad = (destLng * Math.PI) / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

  let brng = Math.atan2(y, x);
  brng = (brng * 180) / Math.PI;
  return (brng + 360) % 360;
}

// Source Icon (Green Pulse)
const SourceIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div style="position: relative; display: flex; justify-content: center; align-items: center; width: 28px; height: 28px;">
      <div style="position: absolute; width: 100%; height: 100%; background-color: #22c55e; border-radius: 50%; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 14px; height: 14px; background-color: #16a34a; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35); z-index: 10;"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

// Destination Icon (Red Pin)
const DestIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div style="display: flex; flex-direction: column; align-items: center; transform: translateY(-50%);">
      <div style="width: 26px; height: 26px; background-color: #ef4444; border-radius: 50% 50% 50% 0; border: 3px solid white; transform: rotate(-45deg); box-shadow: -2px 2px 8px rgba(0,0,0,0.35); display: flex; justify-content: center; align-items: center;">
        <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

// Map Controller: Automatically fly to and follow the active vehicle with smooth animations
function MapController({ 
  activeVehicle, 
  autoFollow, 
  recenterTrigger 
}: { 
  activeVehicle: any; 
  autoFollow: boolean; 
  recenterTrigger: number; 
}) {
  const map = useMap();
  const lastActiveVehicleIdRef = useRef<any>(null);

  useEffect(() => {
    if (!activeVehicle?.currentLat || !activeVehicle?.currentLng) return;

    const targetPos: [number, number] = [activeVehicle.currentLat, activeVehicle.currentLng];

    if (lastActiveVehicleIdRef.current !== activeVehicle.id) {
      lastActiveVehicleIdRef.current = activeVehicle.id;
      // Fly to the newly clicked driver at high zoom level to show complete street/corridor context
      map.flyTo(targetPos, 13, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    } else if (autoFollow) {
      // Pan smoothly as new live GPS coordinates stream in
      map.panTo(targetPos, { animate: true, duration: 0.8 });
    }
  }, [activeVehicle?.id, activeVehicle?.currentLat, activeVehicle?.currentLng, autoFollow, map]);

  useEffect(() => {
    if (recenterTrigger > 0 && activeVehicle?.currentLat && activeVehicle?.currentLng) {
      map.flyTo([activeVehicle.currentLat, activeVehicle.currentLng], 14, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  }, [recenterTrigger]);

  return null;
}

// Dynamic Fleet Bounds: automatically fits view to current active fleet on load
function FleetBoundsController({ fleet, activeVehicle }: { fleet: any[]; activeVehicle: any }) {
  const map = useMap();
  const initialFittedRef = useRef(false);

  useEffect(() => {
    if (activeVehicle) return;

    const validPositions = fleet
      .filter((v) => typeof v.currentLat === "number" && typeof v.currentLng === "number" && v.currentLat !== 0)
      .map((v) => [v.currentLat, v.currentLng] as [number, number]);

    if (validPositions.length === 0) return;

    if (!initialFittedRef.current) {
      initialFittedRef.current = true;
      if (validPositions.length === 1) {
        map.setView(validPositions[0], 12, { animate: true });
      } else {
        const bounds = L.latLngBounds(validPositions);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13, animate: true });
      }
    }
  }, [fleet, activeVehicle, map]);

  return null;
}

interface FleetMapProps {
  activeVehicle: any;
  fleet: any[];
  onSelectVehicle?: (vehicle: any) => void;
  trailHistory?: any[];
  autoFollow?: boolean;
  recenterTrigger?: number;
}

export default function FleetMap({ 
  activeVehicle, 
  fleet, 
  onSelectVehicle, 
  trailHistory = [], 
  autoFollow = true, 
  recenterTrigger = 0 
}: FleetMapProps) {
  const centerPos: [number, number] = [21.5937, 78.9629]; 

  // Format breadcrumbs from history
  const breadcrumbPositions: [number, number][] = trailHistory
    .filter((p: any) => p.latitude && p.longitude)
    .map((p: any) => [p.latitude, p.longitude]);

  return (
    <MapContainer 
      center={activeVehicle ? [activeVehicle.currentLat, activeVehicle.currentLng] : centerPos} 
      zoom={activeVehicle ? 12 : 5} 
      zoomControl={false} 
      className="w-full h-full z-0"
    >
      {/* Clean OpenStreetMap Tiles without any watermark */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />

      <ZoomControl position="bottomright" />

      {/* Map Pan & Zoom Controller */}
      <MapController 
        activeVehicle={activeVehicle} 
        autoFollow={autoFollow} 
        recenterTrigger={recenterTrigger} 
      />

      {/* Dynamic Fleet Auto-Fitting Bounds */}
      <FleetBoundsController 
        fleet={fleet} 
        activeVehicle={activeVehicle} 
      />
      
      {fleet.map((v: any) => {
        const isSelected = activeVehicle?.id === v.id;
        const isSim = v.sourceType === "SIM_TRACKING" || v.source === "SIM_TRACKING" || v.trackingType === "SIM_TRACKING";
        const status = v.trackingStatus || (v.status === "Halted" ? "OFFLINE" : "LIVE");
        const statusColor = status === "LIVE" ? "bg-emerald-500" : status === "ASSIGNED" ? "bg-purple-500" : status === "STALE" ? "bg-amber-500" : "bg-red-500";
        const providerName = v.trackingProvider || (isSim ? "DOTMOVE" : "MOBILE");
        const accuracyRadius = Number(v.accuracy) || (isSim ? 500 : 10);
        const bearing = calculateBearing(v.currentLat, v.currentLng, v.destLat, v.destLng);

        return (
          <div key={v.id}>
            
            {/* Show journey route lines when active */}
            {isSelected && (
              <>
                {/* Source Marker (Green Dot) */}
                <Marker position={[v.srcLat, v.srcLng]} icon={SourceIcon}>
                  <Tooltip permanent direction="bottom" className="font-bold border-0 shadow-md rounded-lg text-xs">
                    Origin: {v.source}
                  </Tooltip>
                </Marker>
                
                {/* Destination Marker (Red Pin) */}
                <Marker position={[v.destLat, v.destLng]} icon={DestIcon}>
                  <Tooltip permanent direction="bottom" className="font-bold border-0 shadow-md rounded-lg text-xs">
                    Dest: {v.dest}
                  </Tooltip>
                </Marker>

                {/* Remaining Route (Dashed Slate Line) */}
                <Polyline 
                  positions={[[v.currentLat, v.currentLng], [v.destLat, v.destLng]]} 
                  color="#64748b" 
                  weight={4} 
                  dashArray="8, 8" 
                  opacity={0.7}
                />
                
                {/* Completed Leg (Solid Bright Blue Line) */}
                <Polyline 
                  positions={[[v.srcLat, v.srcLng], [v.currentLat, v.currentLng]]} 
                  color={isSim ? "#10b981" : "#3b82f6"} 
                  weight={5} 
                />

                {/* Breadcrumb Trail of actual recorded pings */}
                {breadcrumbPositions.length > 1 && (
                  <Polyline
                    positions={breadcrumbPositions}
                    color="#f59e0b"
                    weight={3}
                    dashArray="4, 4"
                    opacity={0.85}
                  />
                )}
              </>
            )}

            {/* Radar Pulse Rings for Active Driver */}
            {isSelected && (
              <>
                <CircleMarker
                  center={[v.currentLat, v.currentLng]}
                  radius={28}
                  pathOptions={{
                    color: isSim ? '#10b981' : '#3b82f6',
                    fillColor: isSim ? '#10b981' : '#3b82f6',
                    fillOpacity: 0.15,
                    weight: 2
                  }}
                />
                <CircleMarker
                  center={[v.currentLat, v.currentLng]}
                  radius={48}
                  pathOptions={{
                    color: isSim ? '#10b981' : '#3b82f6',
                    fillColor: 'transparent',
                    fillOpacity: 0,
                    weight: 1,
                    dashArray: '3, 3'
                  }}
                />
              </>
            )}

            {/* Accuracy Halo (Large Cell-ID halo for SIM, pinpoint for GPS) */}
            <Circle 
              center={[v.currentLat, v.currentLng]} 
              radius={accuracyRadius} 
              pathOptions={{ 
                color: isSim ? '#16a34a' : '#2563eb', 
                fillColor: isSim ? '#22c55e' : '#3b82f6', 
                fillOpacity: isSim ? 0.12 : 0.08, 
                weight: 1.5, 
                dashArray: isSim ? '4, 4' : undefined 
              }} 
            />

            {/* Moving Truck Marker */}
            <Marker 
              position={[v.currentLat, v.currentLng]} 
              icon={getTruckIcon(bearing, isSim ? "SIM_TRACKING" : "MOBILE_GPS", status, isSelected)}
              eventHandlers={{
                click: () => {
                  if (onSelectVehicle) onSelectVehicle(v);
                }
              }}
            >
              <Popup className="rounded-2xl overflow-hidden shadow-2xl border-0 p-0 m-0">
                <div className="w-[300px]">
                  <div className="bg-slate-900 px-4 py-3 text-white flex justify-between items-center">
                    <div>
                      <span className="font-black text-base block">{v.num}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-block mt-0.5 ${
                        isSim ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {isSim ? `🟢 SIM (${providerName})` : `🔵 Mobile GPS (${providerName})`}
                      </span>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-bold bg-white/15 px-2 py-1 rounded-md">
                      <span className={`w-2 h-2 rounded-full ${statusColor} ${status === 'LIVE' ? 'animate-pulse' : ''}`}></span> 
                      {status}
                    </span>
                  </div>
                  <div className="p-3.5 bg-white space-y-2 text-xs">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500 font-semibold">Location</span>
                      <span className="font-bold text-slate-800 text-right max-w-[170px] truncate">{v.currentAddress || "In Corridor"}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500 font-semibold">Coordinates</span>
                      <span className="font-mono text-[11px] font-bold text-blue-600">
                        {v.currentLat?.toFixed(4)}, {v.currentLng?.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500 font-semibold">Driver</span>
                      <span className="font-bold text-slate-800">{v.driver}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500 font-semibold">Live Speed</span>
                      <span className="font-black text-sm text-blue-600">{v.speed} km/h</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500 font-semibold">Precision</span>
                      <span className="font-bold text-slate-700">±{accuracyRadius}m</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-semibold">Last Telemetry</span>
                      <span className="font-bold text-slate-700">{v.lastPingAgo || "Just now"}</span>
                    </div>
                  </div>
                </div>
              </Popup>
              
              {/* Tooltip */}
              <Tooltip 
                direction="top" 
                offset={[0, -24]} 
                opacity={1} 
                permanent={!isSelected} 
                className="border-0 shadow-lg rounded-lg font-bold bg-slate-900 text-white text-xs"
              >
                {v.num} <span className={isSim ? 'text-emerald-400 font-black' : 'text-blue-300 font-black'}>{v.speed} km/h</span>
              </Tooltip>
            </Marker>

          </div>
        );
      })}
    </MapContainer>
  );
}
