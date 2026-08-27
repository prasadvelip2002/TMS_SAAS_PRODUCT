import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Polyline } from "react-leaflet";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Top-Down Truck SVG with dynamic rotation
const getTruckIcon = (bearing: number) => {
  return L.divIcon({
    className: 'custom-truck-icon',
    html: `
      <div style="transform: rotate(${bearing}deg); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
        <svg viewBox="0 0 100 200" width="24" height="48" xmlns="http://www.w3.org/2000/svg">
          <!-- Trailer -->
          <rect x="10" y="45" width="80" height="150" rx="5" fill="#1e40af" stroke="#ffffff" stroke-width="2" />
          <!-- Cab -->
          <rect x="15" y="5" width="70" height="35" rx="8" fill="#3b82f6" stroke="#ffffff" stroke-width="2" />
          <!-- Windshield -->
          <rect x="20" y="10" width="60" height="15" rx="3" fill="#93c5fd" />
          <!-- Mirrors -->
          <rect x="8" y="15" width="5" height="10" rx="2" fill="#3b82f6" />
          <rect x="87" y="15" width="5" height="10" rx="2" fill="#3b82f6" />
        </svg>
      </div>
    `,
    iconSize: [32, 48],
    iconAnchor: [16, 24],
    popupAnchor: [0, -24],
  });
};

function calculateBearing(startLat: number, startLng: number, destLat: number, destLng: number) {
  const startLatRad = startLat * Math.PI / 180;
  const startLngRad = startLng * Math.PI / 180;
  const destLatRad = destLat * Math.PI / 180;
  const destLngRad = destLng * Math.PI / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x = Math.cos(startLatRad) * Math.sin(destLatRad) -
            Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

  let brng = Math.atan2(y, x);
  brng = brng * 180 / Math.PI;
  return (brng + 360) % 360;
}

// Source Icon (Green Pulse)
const SourceIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div style="position: relative; display: flex; justify-content: center; align-items: center; width: 24px; height: 24px;">
      <div style="position: absolute; width: 100%; height: 100%; background-color: #22c55e; border-radius: 50%; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 12px; height: 12px; background-color: #16a34a; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); z-index: 10;"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Destination Icon (Red Pin)
const DestIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div style="display: flex; flex-direction: column; align-items: center; transform: translateY(-50%);">
      <div style="width: 24px; height: 24px; background-color: #ef4444; border-radius: 50% 50% 50% 0; border: 3px solid white; transform: rotate(-45deg); box-shadow: -2px 2px 6px rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center;">
        <div style="width: 6px; height: 6px; background-color: white; border-radius: 50%;"></div>
      </div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 30]
});

export default function FleetMap({ activeVehicle, fleet }: any) {
  const centerPos: [number, number] = [21.5937, 78.9629]; 

  return (
    <MapContainer 
      center={activeVehicle ? [activeVehicle.currentLat, activeVehicle.currentLng] : centerPos} 
      zoom={activeVehicle ? 6 : 5} 
      zoomControl={false} 
      className="w-full h-full z-0"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      
      {fleet.map((v: any) => (
        <div key={v.id}>
          
          {/* Only show routes for the active vehicle to prevent map clutter */}
          {activeVehicle?.id === v.id && (
            <>
              {/* Source Marker (Green Dot) */}
              <Marker position={[v.srcLat, v.srcLng]} icon={SourceIcon}>
                <Tooltip permanent direction="bottom" className="font-bold border-0 shadow-md rounded-lg">Source: {v.source}</Tooltip>
              </Marker>
              
              {/* Destination Marker (Red Pin) */}
              <Marker position={[v.destLat, v.destLng]} icon={DestIcon}>
                <Tooltip permanent direction="bottom" className="font-bold border-0 shadow-md rounded-lg">Dest: {v.dest}</Tooltip>
              </Marker>

              {/* Pending Route (Dashed Gray/Blue) */}
              <Polyline 
                positions={[[v.currentLat, v.currentLng], [v.destLat, v.destLng]]} 
                color="#94a3b8" 
                weight={4} 
                dashArray="8, 8" 
                opacity={0.7}
              />
              
              {/* Completed Route (Solid Bright Blue) */}
              <Polyline 
                positions={[[v.srcLat, v.srcLng], [v.currentLat, v.currentLng]]} 
                color="#3b82f6" 
                weight={5} 
              />
            </>
          )}

          {/* The Moving Truck Marker */}
          <Marker 
            position={[v.currentLat, v.currentLng]} 
            icon={getTruckIcon(calculateBearing(v.currentLat, v.currentLng, v.destLat, v.destLng))}
          >
            <Popup className="rounded-2xl overflow-hidden shadow-2xl border-0 p-0 m-0">
              <div className="w-[240px]">
                <div className="bg-slate-900 px-4 py-3 text-white flex justify-between items-center">
                  <span className="font-black text-lg">{v.num}</span>
                  <span className="flex items-center gap-1.5 text-xs font-bold bg-white/20 px-2 py-1 rounded-md">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-ping"></span> Live
                  </span>
                </div>
                <div className="p-4 bg-white space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500 text-xs font-semibold">Route</span>
                    <span className="font-bold text-sm text-slate-800">{v.source} ➔ {v.dest}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500 text-xs font-semibold">Driver</span>
                    <span className="font-bold text-sm text-slate-800">{v.driver}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500 text-xs font-semibold">Current Speed</span>
                    <span className="font-black text-sm text-blue-600">{v.speed} km/h</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-500 text-xs font-semibold">Status</span>
                    <span className={`font-black text-sm px-2 py-1 rounded-md ${
                      v.status === 'Moving' ? 'text-green-600 bg-green-50' : 
                      v.status === 'Delayed' ? 'text-blue-700 bg-blue-50' : 
                      'text-red-600 bg-red-50'
                    }`}>{v.status}</span>
                  </div>
                </div>
              </div>
            </Popup>
            
            {/* Tooltip on hover/active showing speed */}
            <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={activeVehicle?.id !== v.id} className="border-0 shadow-lg rounded-lg font-bold bg-slate-900 text-white">
              {v.num} <span className="text-blue-300 ml-1 font-black">{v.speed} km/h</span>
            </Tooltip>
          </Marker>

        </div>
      ))}
    </MapContainer>
  );
}
