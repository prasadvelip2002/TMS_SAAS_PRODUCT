"use client";

import { useEffect, useRef, useState, useMemo, Fragment } from "react";
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Polyline, 
  Circle, 
  ZoomControl, 
  useMap 
} from "react-leaflet";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Compass, Crosshair, ArrowLeft, Eye, Navigation, Sparkles } from "lucide-react";
import { 
  fetchRoadRoute, 
  fetchTripCorridor, 
  splitRouteAtVehicle, 
  generateFallbackCorridor, 
  calculateHaversineKm, 
  RouteGeometryResult 
} from "@/lib/routing";

// Fix Leaflet default icon issues in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Calculate bearing between two GPS coordinates
function calculateBearing(startLat: number, startLng: number, destLat: number, destLng: number) {
  if (!startLat || !startLng || !destLat || !destLng) return 0;
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
  return Math.round((brng + 360) % 360);
}

// 1. Sleek Fleet Overview Radar Marker (Used when showing all vehicles)
const getFleetOverviewMarkerIcon = (vehicle: any, isSelected: boolean) => {
  const isLive = vehicle.trackingStatus === "LIVE";
  const isMoving = isLive && (vehicle.speed || 0) > 0;
  const isSim = vehicle.sourceType === "SIM_TRACKING" || vehicle.trackingType === "SIM_TRACKING";
  const isDeviated = Boolean(vehicle.isRouteDeviated);
  const isHaltedAlert = Boolean(vehicle.isHalted && (vehicle.haltDurationMinutes || 0) >= 20);

  // Alert color precedence: Critical Red (Deviation) > Warning Amber (Prolonged Halt) > Emerald (Moving) > Blue/Slate
  const statusColor = isDeviated 
    ? "#ef4444" 
    : isHaltedAlert 
    ? "#f59e0b" 
    : isMoving 
    ? "#10b981" 
    : isLive 
    ? "#3b82f6" 
    : "#64748b";

  const borderColor = isSelected 
    ? "#3b82f6" 
    : isDeviated 
    ? "#ef4444" 
    : isHaltedAlert 
    ? "#f59e0b" 
    : isMoving 
    ? "#10b981" 
    : "#334155";

  let statusText = isMoving ? `${vehicle.speed} km/h` : isLive ? "Halted" : "Offline";
  if (isDeviated) {
    statusText = `⚠️ Deviated (${vehicle.deviationDistanceKm || 0} km)`;
  } else if (isHaltedAlert) {
    statusText = `⏸️ ${vehicle.haltFormatted || `${vehicle.haltDurationMinutes}m`}`;
  }

  // If filtered by regional PIN code, display exact physical distance to PIN code
  if (vehicle.distanceFromSearchPincodeKm !== undefined && vehicle.distanceFromSearchPincodeKm !== null) {
    statusText = `🎯 ${vehicle.distanceFromSearchPincodeKm} km • ${statusText}`;
  }

  const html = `
    <div class="group relative flex items-center cursor-pointer transition-transform duration-200 hover:scale-110 hover:z-50 select-none">
      <!-- Radar Pulse Ring for Moving Vehicles & Safety Alerts -->
      ${(isMoving || isDeviated || isHaltedAlert) ? `
        <div style="
          position: absolute; 
          left: 0; 
          top: 0; 
          width: 36px; 
          height: 36px; 
          border-radius: 50%; 
          background: ${statusColor}; 
          opacity: ${isDeviated ? 0.6 : 0.35}; 
          animation: ping ${isDeviated ? '1s' : '1.8s'} cubic-bezier(0, 0, 0.2, 1) infinite; 
          pointer-events: none;
        "></div>
      ` : ''}

      <!-- Main Badge Container -->
      <div style="
        background: ${isSelected ? '#1e3a8a' : '#0f172a'};
        border: 2px solid ${borderColor};
        border-radius: 9999px;
        padding: 4px 10px 4px 6px;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: ${isDeviated ? '0 0 16px rgba(239, 68, 68, 0.6)' : isHaltedAlert ? '0 0 14px rgba(245, 158, 11, 0.5)' : '0 10px 25px -5px rgba(0, 0, 0, 0.5)'};
        color: white;
      ">
        <!-- Vehicle Status Icon Badge -->
        <div style="
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: ${isDeviated ? '#dc2626' : isHaltedAlert ? '#d97706' : isMoving ? '#059669' : '#334155'};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: inset 0 1px 2px rgba(255,255,255,0.25);
        ">
          ${isDeviated ? `
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          ` : `
            <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
          `}
        </div>

        <!-- Vehicle Number & Status -->
        <div style="display: flex; flex-direction: column; line-height: 1.1;">
          <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.02em; white-space: nowrap; color: ${isDeviated ? '#fca5a5' : isHaltedAlert ? '#fde68a' : 'white'};">
            ${vehicle.num || 'Vehicle'}
          </span>
          <span style="font-size: 9px; font-weight: 700; color: ${statusColor};">
            ${isSim ? 'SIM • ' : ''}${statusText}
          </span>
        </div>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-fleet-overview-icon',
    html: html,
    iconSize: [130, 36],
    iconAnchor: [17, 18],
    popupAnchor: [0, -22]
  });
};

// 2. High-Precision Animated Marker for Single Focused Vehicle
const getSingleFocusedVehicleIcon = (vehicle: any, bearing: number) => {
  const isLive = vehicle.trackingStatus === "LIVE";
  const isMoving = isLive && (vehicle.speed || 0) > 0;
  const isSim = vehicle.sourceType === "SIM_TRACKING" || vehicle.trackingType === "SIM_TRACKING";
  const isDeviated = Boolean(vehicle.isRouteDeviated);
  const isHaltedAlert = Boolean(vehicle.isHalted && (vehicle.haltDurationMinutes || 0) >= 20);

  // Google Navigation Palette: Google Blue #1a73e8, Deviated Red #ea4335, Warning Amber #fbbc04, SIM Emerald #34a853
  const primaryColor = isDeviated ? "#ea4335" : isHaltedAlert ? "#fbbc04" : isSim ? "#34a853" : isMoving ? "#1a73e8" : "#5f6368";
  const glowColor = isDeviated ? "rgba(234, 67, 53, 0.4)" : isMoving ? "rgba(26, 115, 232, 0.4)" : "rgba(95, 99, 104, 0.25)";

  let statusText = isMoving ? `${Math.round(vehicle.speed)} km/h` : isLive ? "Halted" : "Offline";
  if (isDeviated) {
    statusText = `⚠️ Route Deviated (${vehicle.deviationDistanceKm || 0} km)`;
  } else if (isHaltedAlert) {
    statusText = `⏸️ Halted (${vehicle.haltFormatted || `${vehicle.haltDurationMinutes}m`})`;
  }

  const html = `
    <div class="relative flex flex-col items-center justify-center select-none" style="filter: drop-shadow(0 8px 18px rgba(0,0,0,0.45));">
      
      <!-- Google Navigation Forward Light Beam (Points in direction of travel) -->
      ${isMoving ? `
      <div style="
        position: absolute;
        width: 100px;
        height: 100px;
        top: -30px;
        left: 5px;
        transform: rotate(${bearing}deg);
        pointer-events: none;
        background: radial-gradient(circle at 50% 80%, ${glowColor} 0%, transparent 68%);
        clip-path: polygon(50% 80%, 15% 0%, 85% 0%);
        animation: pulse 2.5s ease-in-out infinite;
      "></div>
      ` : ''}

      <!-- Google Radar Ping when Deviated or Alert -->
      ${isDeviated ? `
      <div style="
        position: absolute;
        width: 74px;
        height: 74px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(234, 67, 53, 0.5) 0%, transparent 70%);
        animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;
        pointer-events: none;
      "></div>
      ` : ''}

      <!-- Google 3D Navigation Chevron Puck (Rotates with Bearing) -->
      <div style="
        transform: rotate(${bearing}deg);
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #ffffff;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 3.5px ${primaryColor};
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
        <span>${vehicle.num}</span>
        <span style="color: ${isMoving ? '#8ab4f8' : '#bdc1c6'}; font-weight: 900;">• ${statusText}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-single-vehicle-icon',
    html: html,
    iconSize: [110, 80],
    iconAnchor: [55, 22],
    popupAnchor: [0, -28]
  });
};

// Origin Hub Marker (Emerald Green Flag Pin)
const OriginHubIcon = (cityName: string) => L.divIcon({
  className: 'custom-hub-icon',
  html: `
    <div class="flex items-center gap-1.5 select-none" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));">
      <div style="
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        background: #10b981;
        border: 3px solid #ffffff;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
      </div>
      <span style="
        background: #064e3b;
        color: #a7f3d0;
        font-size: 10px;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 6px;
        border: 1px solid #10b981;
        white-space: nowrap;
      ">
        Origin: ${cityName}
      </span>
    </div>
  `,
  iconSize: [140, 32],
  iconAnchor: [15, 30]
});

// Destination Hub Marker (Red Flag Pin)
const DestinationHubIcon = (cityName: string) => L.divIcon({
  className: 'custom-hub-icon',
  html: `
    <div class="flex items-center gap-1.5 select-none" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));">
      <div style="
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        background: #ef4444;
        border: 3px solid #ffffff;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
      </div>
      <span style="
        background: #7f1d1d;
        color: #fecaca;
        font-size: 10px;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 6px;
        border: 1px solid #ef4444;
        white-space: nowrap;
      ">
        Dest: ${cityName}
      </span>
    </div>
  `,
  iconSize: [140, 32],
  iconAnchor: [15, 30]
});

// Pincode Search Hub Target Marker (Blue Pulsing Radar Pin)
const PincodeSearchCenterIcon = (pincode: string, locality?: string) => L.divIcon({
  className: 'custom-pincode-hub-icon',
  html: `
    <div class="flex items-center gap-1.5 select-none" style="filter: drop-shadow(0 6px 14px rgba(37,99,235,0.45));">
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        background: #2563eb;
        border: 3px solid #ffffff;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 16px rgba(37,99,235,0.7);
      ">
        <div style="width: 12px; height: 12px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <div style="width: 6px; height: 6px; background: #2563eb; border-radius: 50%;"></div>
        </div>
      </div>
      <div style="
        background: #1e3a8a;
        color: #dbeafe;
        font-size: 11px;
        font-weight: 800;
        padding: 3px 8px;
        border-radius: 8px;
        border: 1.5px solid #3b82f6;
        white-space: nowrap;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      ">
        🎯 PIN ${pincode}${locality ? ` • ${locality.split(',')[0]}` : ''}
      </div>
    </div>
  `,
  iconSize: [180, 36],
  iconAnchor: [16, 32]
});

// Smooth Moving Marker Component: Interpolates position smoothly via requestAnimationFrame
function SmoothMovingVehicleMarker({
  vehicle,
  bearing,
  onClick,
  isSingleMode
}: {
  vehicle: any;
  bearing: number;
  onClick: () => void;
  isSingleMode: boolean;
}) {
  const markerRef = useRef<L.Marker | null>(null);
  const currentPosRef = useRef<[number, number]>([vehicle.currentLat, vehicle.currentLng]);
  const currentBearingRef = useRef<number>(bearing);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const targetPos: [number, number] = [vehicle.currentLat, vehicle.currentLng];
    const startPos = currentPosRef.current;
    const startBearing = currentBearingRef.current;
    let targetBearing = bearing;

    // Normalize angular difference for smoothest rotation
    let diff = targetBearing - startBearing;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    targetBearing = startBearing + diff;

    const startTime = performance.now();
    const duration = 1200; // 1.2s smooth glide

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      const lat = startPos[0] + (targetPos[0] - startPos[0]) * ease;
      const lng = startPos[1] + (targetPos[1] - startPos[1]) * ease;
      const curBearing = startBearing + (targetBearing - startBearing) * ease;

      currentPosRef.current = [lat, lng];
      currentBearingRef.current = curBearing;

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        const el = markerRef.current.getElement();
        if (el) {
          const arrowEl = el.querySelector('.smooth-bearing-rotator') as HTMLElement;
          if (arrowEl) {
            arrowEl.style.transform = `rotate(${curBearing}deg)`;
          }
        }
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [vehicle.currentLat, vehicle.currentLng, bearing]);

  const icon = isSingleMode 
    ? getSingleFocusedVehicleIcon(vehicle, bearing) 
    : getFleetOverviewMarkerIcon(vehicle, false);

  return (
    <Marker
      ref={markerRef}
      position={currentPosRef.current}
      icon={icon}
      eventHandlers={{ click: onClick }}
    >
      <Popup className="rounded-2xl overflow-hidden shadow-2xl border-0 p-0 m-0">
        <div className="w-[280px]">
          <div className="bg-slate-900 px-4 py-3 text-white flex justify-between items-center">
            <div>
              <span className="font-black text-base block">{vehicle.num}</span>
              <span className="text-[10px] font-bold text-slate-400">Trip #{vehicle.tripId || 'N/A'}</span>
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              (vehicle.speed || 0) > 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-300'
            }`}>
              {(vehicle.speed || 0) > 0 ? `${vehicle.speed} km/h` : 'Halted'}
            </span>
          </div>
          <div className="p-3.5 bg-white space-y-2 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
              <span className="text-slate-500 font-semibold">Driver</span>
              <span className="font-bold text-slate-800">{vehicle.driver || 'Assigned Driver'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
              <span className="text-slate-500 font-semibold">Route</span>
              <span className="font-bold text-slate-800 text-right truncate max-w-[160px]">
                {vehicle.source} → {vehicle.dest}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
              <span className="text-slate-500 font-semibold">Location</span>
              <span className="font-bold text-blue-600 text-right truncate max-w-[160px]">
                {vehicle.currentAddress || 'In Corridor'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Telemetry Source</span>
              <span className="font-bold text-slate-700">
                {vehicle.sourceType === "SIM_TRACKING" ? "🟢 SIM Cell Tower" : "🔵 Mobile GPS"}
              </span>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

// Controller for camera transitions: single vehicle focus vs fleet overview vs pincode region
function MapCameraController({
  activeVehicle,
  fleet,
  autoFollow,
  recenterTrigger,
  roadCoordinates,
  pincodeRegion
}: {
  activeVehicle: any;
  fleet: any[];
  autoFollow: boolean;
  recenterTrigger: number;
  roadCoordinates?: [number, number][];
  pincodeRegion?: {
    pincode: string;
    lat: number;
    lng: number;
    radiusKm: number;
    locality?: string;
  } | null;
}) {
  const map = useMap();
  const lastActiveId = useRef<any>(null);

  useEffect(() => {
    if (activeVehicle) {
      const targetPos: [number, number] = [activeVehicle.currentLat, activeVehicle.currentLng];

      if (lastActiveId.current !== activeVehicle.id) {
        lastActiveId.current = activeVehicle.id;

        // Frame along real road route or bounding box of trip
        if (roadCoordinates && roadCoordinates.length > 1) {
          const bounds = L.latLngBounds(roadCoordinates);
          map.fitBounds(bounds, {
            padding: [70, 70],
            maxZoom: 14,
            animate: true,
            duration: 1.4
          });
        } else if (activeVehicle.srcLat && activeVehicle.destLat) {
          const tripBounds = L.latLngBounds([
            [activeVehicle.srcLat, activeVehicle.srcLng],
            [activeVehicle.destLat, activeVehicle.destLng],
            [activeVehicle.currentLat, activeVehicle.currentLng]
          ]);
          map.fitBounds(tripBounds, {
            padding: [80, 80],
            maxZoom: 14,
            animate: true,
            duration: 1.4
          });
        } else {
          map.flyTo(targetPos, 13, { duration: 1.4, easeLinearity: 0.25 });
        }
      } else if (autoFollow) {
        map.panTo(targetPos, { animate: true, duration: 0.8 });
      }
    } else if (pincodeRegion?.lat && pincodeRegion?.lng) {
      lastActiveId.current = null;
      // Focus camera on Pincode Search Hub with radial coverage bounding box
      const safeRadius = Math.min(pincodeRegion.radiusKm || 50, 300);
      const latOffset = safeRadius / 111.0;
      const lngOffset = safeRadius / (111.0 * Math.cos(pincodeRegion.lat * Math.PI / 180.0));
      const regionBounds = L.latLngBounds([
        [pincodeRegion.lat - latOffset, pincodeRegion.lng - lngOffset],
        [pincodeRegion.lat + latOffset, pincodeRegion.lng + lngOffset]
      ]);
      map.fitBounds(regionBounds, {
        padding: [50, 50],
        maxZoom: 13,
        animate: true,
        duration: 1.2
      });
    } else {
      lastActiveId.current = null;
      // Fleet overview auto-bounds
      const validPoints = fleet
        .filter(v => v.currentLat && v.currentLng && v.currentLat !== 0)
        .map(v => [v.currentLat, v.currentLng] as [number, number]);

      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, {
          padding: [60, 60],
          maxZoom: 11,
          animate: true,
          duration: 1.2
        });
      }
    }
  }, [activeVehicle?.id, activeVehicle?.currentLat, activeVehicle?.currentLng, autoFollow, map, fleet, roadCoordinates, pincodeRegion?.pincode, pincodeRegion?.lat, pincodeRegion?.lng, pincodeRegion?.radiusKm]);

  useEffect(() => {
    if (recenterTrigger > 0 && activeVehicle?.currentLat && activeVehicle?.currentLng) {
      map.flyTo([activeVehicle.currentLat, activeVehicle.currentLng], 16, {
        duration: 1.2
      });
    }
  }, [recenterTrigger, activeVehicle?.currentLat, activeVehicle?.currentLng, map]);

  return null;
}

export interface FleetMapProps {
  activeVehicle: any;
  fleet: any[];
  onSelectVehicle?: (vehicle: any) => void;
  onClearActiveVehicle?: () => void;
  trailHistory?: any[];
  autoFollow?: boolean;
  recenterTrigger?: number;
  roadRouteGeometry?: [number, number][];
  pincodeRegion?: {
    pincode: string;
    lat: number;
    lng: number;
    radiusKm: number;
    locality?: string;
  } | null;
}

export default function FleetMap({
  activeVehicle,
  fleet = [],
  onSelectVehicle,
  onClearActiveVehicle,
  trailHistory = [],
  autoFollow = true,
  recenterTrigger = 0,
  roadRouteGeometry,
  pincodeRegion
}: FleetMapProps) {
  // Google Maps Themes: Google Roadmap (Default), Google Live Traffic, Google Satellite Hybrid, Google Terrain, Esri Night
  const [mapTheme, setMapTheme] = useState<'google' | 'traffic' | 'satellite' | 'terrain' | 'dark'>('google');
  const [streetFocusTrigger, setStreetFocusTrigger] = useState<number>(0);
  const centerPos: [number, number] = [20.5937, 78.9629]; // Center of India

  const [corridorPaths, setCorridorPaths] = useState<{
    traveled: [number, number][];
    remaining: [number, number][];
  }>({ traveled: [], remaining: [] });

  // Fetch real road trip corridor (Traveled along roads in Blue, Remaining along highway in Grey)
  useEffect(() => {
    if (!activeVehicle?.currentLat || !activeVehicle?.currentLng) {
      setCorridorPaths({ traveled: [], remaining: [] });
      return;
    }

    let isCancelled = false;

    // Format breadcrumbs from history
    const breadcrumbs: [number, number][] = (trailHistory || [])
      .filter((p: any) => p.latitude && p.longitude && Number(p.latitude) !== 0 && Number(p.longitude) !== 0)
      .sort((a: any, b: any) => new Date(a.recordedAt || 0).getTime() - new Date(b.recordedAt || 0).getTime())
      .map((p: any) => [Number(p.latitude), Number(p.longitude)] as [number, number]);

    fetchTripCorridor(
      activeVehicle.srcLat,
      activeVehicle.srcLng,
      activeVehicle.currentLat,
      activeVehicle.currentLng,
      activeVehicle.destLat,
      activeVehicle.destLng,
      breadcrumbs
    )
      .then((res) => {
        if (!isCancelled) {
          setCorridorPaths({
            traveled: res.traveledCoordinates,
            remaining: res.remainingCoordinates
          });
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [
    activeVehicle?.id,
    activeVehicle?.srcLat,
    activeVehicle?.srcLng,
    activeVehicle?.currentLat,
    activeVehicle?.currentLng,
    activeVehicle?.destLat,
    activeVehicle?.destLng,
    trailHistory
  ]);

  // Dynamically provide Traveled (Blue) and Remaining (Grey) points with immediate highway fallback
  const { traveledPoints, remainingPoints } = useMemo(() => {
    const curLat = activeVehicle?.currentLat;
    const curLng = activeVehicle?.currentLng;
    const destLat = activeVehicle?.destLat;
    const destLng = activeVehicle?.destLng;

    if (!curLat || !curLng) {
      return { traveledPoints: [], remainingPoints: [] };
    }

    let traveled = corridorPaths.traveled;
    let remaining = corridorPaths.remaining;

    // Guaranteed fallback: If async remaining route is still loading, supply curved highway corridor immediately
    if (remaining.length === 0 && destLat && destLng) {
      remaining = generateFallbackCorridor(curLat, curLng, destLat, destLng, 35);
    }

    return { traveledPoints: traveled, remainingPoints: remaining };
  }, [corridorPaths, activeVehicle?.currentLat, activeVehicle?.currentLng, activeVehicle?.destLat, activeVehicle?.destLng]);

  const tileUrls = {
    google: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    traffic: "https://mt1.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}",
    satellite: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    terrain: "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
    dark: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
  };

  const tileAttributions = {
    google: '&copy; Google Maps',
    traffic: '&copy; Google Maps Live Traffic',
    satellite: '&copy; Google Satellite Imagery',
    terrain: '&copy; Google Terrain',
    dark: '&copy; Esri Night Radar'
  };

  // Format breadcrumbs from history
  const breadcrumbPositions: [number, number][] = trailHistory
    .filter((p: any) => p.latitude && p.longitude)
    .map((p: any) => [p.latitude, p.longitude]);

  const isSingleVehicleMode = Boolean(activeVehicle);
  const vehiclesToRender = isSingleVehicleMode ? [activeVehicle] : fleet;

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#e5e3df] dark:bg-slate-900 select-none">
      
      {/* Floating Map Top-Left: View All Fleet button (Only shown in isolated mode) */}
      {isSingleVehicleMode && (
        <div className="absolute top-4 left-4 z-[999] pointer-events-auto animate-in fade-in slide-in-from-top-1">
          <button
            onClick={onClearActiveVehicle}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/95 dark:bg-slate-900/95 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs rounded-2xl shadow-xl transition-all duration-200 border border-slate-200 dark:border-slate-800 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600" />
            <span>All Vehicles ({fleet.length})</span>
          </button>
        </div>
      )}

      {/* Google Navigation Floating Top Card in Single Vehicle Mode */}
      {isSingleVehicleMode && activeVehicle && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[999] pointer-events-auto w-[92%] max-w-md animate-in fade-in slide-in-from-top-2">
          <div className="bg-[#1a73e8] text-white px-3.5 py-2.5 rounded-2xl shadow-2xl flex items-center justify-between border border-blue-400/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <Navigation className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-100 block truncate">
                  Next Hub: {activeVehicle.dest || "Destination"}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs sm:text-sm font-black truncate">{activeVehicle.eta || "In Transit"}</span>
                  {activeVehicle.distanceToDestKm && (
                    <span className="text-[11px] text-blue-200 font-medium">({Math.round(activeVehicle.distanceToDestKm)} km left)</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2 py-0.5 rounded-full bg-white text-[#1a73e8] font-black text-xs shadow-sm">
                {Math.round(activeVehicle.speed || 0)} km/h
              </span>
              <button
                onClick={() => setStreetFocusTrigger(prev => prev + 1)}
                className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition"
                title="Focus on Vehicle"
              >
                <Crosshair className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Maps Layer Style Selector (Roadmap / Live Traffic / Satellite / Terrain / Dark) */}
      <div className="absolute bottom-6 left-4 z-[999] pointer-events-auto bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-1 rounded-2xl shadow-2xl flex items-center gap-1">
        <button
          onClick={() => setMapTheme('google')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            mapTheme === 'google' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>🗺️</span>
          <span>Google Map</span>
        </button>
        <button
          onClick={() => setMapTheme('traffic')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            mapTheme === 'traffic' 
              ? 'bg-emerald-600 text-white shadow-md' 
              : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Live highway congestion flow"
        >
          <span>🚦</span>
          <span>Traffic</span>
        </button>
        <button
          onClick={() => setMapTheme('satellite')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            mapTheme === 'satellite' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>🛰️</span>
          <span>Satellite</span>
        </button>
        <button
          onClick={() => setMapTheme('terrain')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            mapTheme === 'terrain' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>⛰️</span>
          <span>Terrain</span>
        </button>
        <button
          onClick={() => setMapTheme('dark')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            mapTheme === 'dark' 
              ? 'bg-slate-800 text-white shadow-md' 
              : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>🌙</span>
          <span>Night</span>
        </button>

        {activeVehicle && activeVehicle.currentLat && activeVehicle.currentLng && (
          <>
            <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-1"></div>
            <button
              onClick={() => setStreetFocusTrigger(prev => prev + 1)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center gap-1.5 transition-all"
              title="Zoom directly into vehicle at street level (16x)"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Street (16x)</span>
            </button>
          </>
        )}
      </div>

      <MapContainer
        center={activeVehicle ? [activeVehicle.currentLat, activeVehicle.currentLng] : centerPos}
        zoom={activeVehicle ? 12 : 5}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          url={tileUrls[mapTheme]}
          attribution={tileAttributions[mapTheme]}
          maxZoom={19}
        />

        <ZoomControl position="bottomright" />

        {/* Camera Transition & Bounds Controller */}
        <MapCameraController
          activeVehicle={activeVehicle}
          fleet={fleet}
          autoFollow={autoFollow}
          recenterTrigger={recenterTrigger + streetFocusTrigger}
          roadCoordinates={roadRouteGeometry && roadRouteGeometry.length > 0 ? roadRouteGeometry : remainingPoints}
          pincodeRegion={pincodeRegion}
        />

        {/* SINGLE VEHICLE FOCUSED CORRIDOR & ROUTE */}
        {isSingleVehicleMode && activeVehicle && (
          <>
            {/* Origin Hub Smart Geofence Zone (1 km radius) */}
            {activeVehicle.srcLat && activeVehicle.srcLng && (
              <Circle
                center={[activeVehicle.srcLat, activeVehicle.srcLng]}
                radius={activeVehicle.geofenceRadiusMeters || 1000}
                pathOptions={{
                  color: activeVehicle.isInsideOriginGeofence ? '#10b981' : '#059669',
                  fillColor: '#10b981',
                  fillOpacity: activeVehicle.isInsideOriginGeofence ? 0.22 : 0.08,
                  weight: activeVehicle.isInsideOriginGeofence ? 2.5 : 1.5,
                  dashArray: '6, 6'
                }}
              >
                <Popup className="rounded-xl overflow-hidden shadow-xl border-0 p-0 m-0">
                  <div className="bg-slate-900 text-white p-3 text-xs min-w-[200px] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                      🟢 Origin Hub Geofence (1 km)
                    </span>
                    <strong className="text-sm block font-black">{activeVehicle.source}</strong>
                    <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800 space-y-0.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Geofence Status:</span>
                        <strong className={activeVehicle.isInsideOriginGeofence ? "text-emerald-400 font-bold" : "text-slate-300"}>
                          {activeVehicle.isInsideOriginGeofence ? "Inside Loading Dock" : "Gate Out (Departed)"}
                        </strong>
                      </div>
                      {activeVehicle.loadingTatFormatted && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Loading TAT:</span>
                          <strong className="text-white font-bold">{activeVehicle.loadingTatFormatted}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Circle>
            )}

            {/* Origin Hub Pin */}
            {activeVehicle.srcLat && activeVehicle.srcLng && (
              <Marker 
                position={[activeVehicle.srcLat, activeVehicle.srcLng]} 
                icon={OriginHubIcon(activeVehicle.source || "Origin")} 
              >
                <Popup className="rounded-xl overflow-hidden shadow-xl border-0 p-0 m-0">
                  <div className="bg-slate-900 text-white p-3 text-xs min-w-[210px] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                      Origin Dispatch Hub
                    </span>
                    <strong className="text-sm block font-black">{activeVehicle.source}</strong>
                    <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800 flex justify-between">
                      <span className="text-slate-400">Assigned Truck:</span>
                      <strong className="text-white">{activeVehicle.num}</strong>
                    </div>
                    <span className="text-slate-400 text-[10px] block font-mono">
                      {activeVehicle.srcLat?.toFixed(4)}° N, {activeVehicle.srcLng?.toFixed(4)}° E
                    </span>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Destination Hub Smart Geofence Zone (1 km radius) */}
            {activeVehicle.destLat && activeVehicle.destLng && (
              <Circle
                center={[activeVehicle.destLat, activeVehicle.destLng]}
                radius={activeVehicle.geofenceRadiusMeters || 1000}
                pathOptions={{
                  color: activeVehicle.isInsideDestGeofence ? '#10b981' : '#8b5cf6',
                  fillColor: activeVehicle.isInsideDestGeofence ? '#10b981' : '#8b5cf6',
                  fillOpacity: activeVehicle.isInsideDestGeofence ? 0.24 : 0.08,
                  weight: activeVehicle.isInsideDestGeofence ? 2.5 : 1.5,
                  dashArray: '6, 6'
                }}
              >
                <Popup className="rounded-xl overflow-hidden shadow-xl border-0 p-0 m-0">
                  <div className="bg-slate-900 text-white p-3 text-xs min-w-[200px] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-violet-400 block tracking-wider">
                      🏁 Consignee Dock Geofence (1 km)
                    </span>
                    <strong className="text-sm block font-black">{activeVehicle.dest}</strong>
                    <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800 space-y-0.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Milestone:</span>
                        <strong className={activeVehicle.isInsideDestGeofence ? "text-emerald-400 font-bold" : "text-violet-300"}>
                          {activeVehicle.isInsideDestGeofence 
                            ? "Gate Entry (Unloading)" 
                            : activeVehicle.currentHubStatus === "APPROACHING_DESTINATION"
                              ? "Approaching Dock (<15 km)"
                              : `En Route (${Math.round(activeVehicle.distanceToDestKm || 0)} km)`}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Dynamic ETA:</span>
                        <strong className="text-emerald-400 font-bold">{activeVehicle.eta || "In Transit"}</strong>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Circle>
            )}

            {/* Destination Hub Pin */}
            {activeVehicle.destLat && activeVehicle.destLng && (
              <Marker 
                position={[activeVehicle.destLat, activeVehicle.destLng]} 
                icon={DestinationHubIcon(activeVehicle.dest || "Destination")} 
              >
                <Popup className="rounded-xl overflow-hidden shadow-xl border-0 p-0 m-0">
                  <div className="bg-slate-900 text-white p-3 text-xs min-w-[210px] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-rose-400 block tracking-wider">
                      Destination Consignee Hub
                    </span>
                    <strong className="text-sm block font-black">{activeVehicle.dest}</strong>
                    <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400">Dynamic ETA:</span>
                      <strong className="text-emerald-400 font-bold">{activeVehicle.eta || "In Transit"}</strong>
                    </div>
                    <span className="text-slate-400 text-[10px] block font-mono">
                      {activeVehicle.destLat?.toFixed(4)}° N, {activeVehicle.destLng?.toFixed(4)}° E
                    </span>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Real Highway Road Route - Traveled Corridor (Google Navigation Double-Cased Polyline) */}
            {traveledPoints.length > 1 && (
              <>
                {/* Outer Contrast Border Casing */}
                <Polyline
                  positions={traveledPoints}
                  color={mapTheme === 'dark' || mapTheme === 'satellite' ? "#0f172a" : "#ffffff"}
                  weight={9}
                  opacity={0.95}
                  lineCap="round"
                  lineJoin="round"
                />
                {/* Inner Core: Google Navigation Royal Blue or Deviated Red */}
                <Polyline
                  positions={traveledPoints}
                  color={activeVehicle.isRouteDeviated ? "#ea4335" : "#1a73e8"}
                  weight={5.5}
                  opacity={1}
                  lineCap="round"
                  lineJoin="round"
                />
              </>
            )}

            {/* Real Highway Road Route - Remaining Corridor (Google Grey Dashed Polyline) */}
            {remainingPoints.length > 1 && (
              <Polyline
                positions={remainingPoints}
                color={mapTheme === 'dark' || mapTheme === 'satellite' ? "#94a3b8" : "#80868b"}
                weight={4.5}
                dashArray="7, 9"
                opacity={0.85}
                lineCap="round"
                lineJoin="round"
              />
            )}

            {/* Radar Accuracy Circle */}
            <Circle
              center={[activeVehicle.currentLat, activeVehicle.currentLng]}
              radius={Number(activeVehicle.accuracy) || (activeVehicle.sourceType === "SIM_TRACKING" ? 600 : 15)}
              pathOptions={{
                color: activeVehicle.isRouteDeviated 
                  ? '#ef4444' 
                  : (activeVehicle.sourceType === "SIM_TRACKING" ? '#10b981' : '#3b82f6'),
                fillColor: activeVehicle.isRouteDeviated 
                  ? '#ef4444' 
                  : (activeVehicle.sourceType === "SIM_TRACKING" ? '#10b981' : '#3b82f6'),
                fillOpacity: activeVehicle.isRouteDeviated ? 0.22 : 0.08,
                weight: activeVehicle.isRouteDeviated ? 2.5 : 1.5,
                dashArray: activeVehicle.isRouteDeviated ? '6, 6' : (activeVehicle.sourceType === "SIM_TRACKING" ? '4, 4' : undefined)
              }}
            />
          </>
        )}

        {/* Pincode Regional Discovery Geofence & Hub Marker */}
        {pincodeRegion && !isSingleVehicleMode && (
          <>
            <Marker
              position={[pincodeRegion.lat, pincodeRegion.lng]}
              icon={PincodeSearchCenterIcon(pincodeRegion.pincode, pincodeRegion.locality)}
            >
              <Popup>
                <div className="p-1 text-slate-900">
                  <div className="font-black text-xs text-blue-600 flex items-center gap-1">
                    <span>🎯 Search Region: PIN {pincodeRegion.pincode}</span>
                  </div>
                  <div className="text-[11px] text-slate-700 font-semibold mt-0.5">
                    {pincodeRegion.locality || "Search Hub"}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 border-t pt-1">
                    Coverage Radius: <strong>{pincodeRegion.radiusKm} km</strong>
                  </div>
                </div>
              </Popup>
            </Marker>

            <Circle
              center={[pincodeRegion.lat, pincodeRegion.lng]}
              radius={pincodeRegion.radiusKm * 1000}
              pathOptions={{
                color: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.10,
                weight: 2,
                dashArray: '6, 8'
              }}
            />
          </>
        )}

        {/* RENDER VEHICLE MARKERS: Strictly isolated (Only active vehicle if selected, else all fleet) */}
        {vehiclesToRender.map((v: any) => {
          const bearing = calculateBearing(v.currentLat, v.currentLng, v.destLat, v.destLng);
          return (
            <SmoothMovingVehicleMarker
              key={`vehicle-${v.id || v.tripId || v.num}`}
              vehicle={v}
              bearing={v.heading || bearing}
              isSingleMode={isSingleVehicleMode}
              onClick={() => {
                if (onSelectVehicle) onSelectVehicle(v);
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
