"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { Loader2, Truck, MapPin, Clock, AlertTriangle, CheckCircle, Navigation } from "lucide-react";
import dynamic from 'next/dynamic';
import { Panel } from "@/components/PrototypeUI";

// Dynamically import Leaflet components to avoid SSR errors
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false });

// We need to import the CSS in a global way, usually we'd put this in layout, but we'll do it here
import 'leaflet/dist/leaflet.css';

// Fix leaflet icon issue in Next.js
let DefaultIcon: any;
if (typeof window !== 'undefined') {
  const L = require('leaflet');
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
  DefaultIcon = L.Icon.Default;
}

export default function TripTrackingPage() {
  const params = useParams();
  const id = params.id as string;
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Demo Coordinates for the map
  const sourcePos: [number, number] = [19.0760, 72.8777]; // Mumbai
  const destPos: [number, number] = [28.7041, 77.1025]; // Delhi
  const currentPos: [number, number] = [23.0225, 72.5714]; // Ahmedabad (In-transit)

  useEffect(() => {
    const loadTrip = async () => {
      try {
        const data = await fetchApi(`/Trips/${id}`);
        setTrip(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadTrip();
  }, [id]);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  if (!trip) return <div className="p-8 text-center text-red-500 font-bold">Trip not found.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Live GPS Tracking</h1>
          <p className="text-slate-500 text-sm mt-1">Vehicle {trip.vehicle?.vehicleNumber} • TRP-{trip.id}</p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold border border-blue-200 shadow-sm flex items-center gap-2">
          <Navigation className="w-4 h-4" /> En Route to Destination
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* The Map */}
        <div className="lg:col-span-2">
          <Panel className="p-0 overflow-hidden shadow-md">
            <div className="h-[500px] w-full bg-slate-100 relative">
              {typeof window !== 'undefined' && (
                <MapContainer center={currentPos} zoom={6} scrollWheelZoom={false} className="w-full h-full">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Source Marker */}
                  <Marker position={sourcePos}>
                    <Popup>
                      <strong>Source</strong><br/>{trip.indent?.source}
                    </Popup>
                  </Marker>
                  
                  {/* Destination Marker */}
                  <Marker position={destPos}>
                    <Popup>
                      <strong>Destination</strong><br/>{trip.indent?.destination}
                    </Popup>
                  </Marker>
                  
                  {/* Truck Marker (Current Position) */}
                  <Marker position={currentPos}>
                    <Popup>
                      <strong>Live Position</strong><br/>{trip.vehicle?.vehicleNumber}<br/>Speed: 62 km/h
                    </Popup>
                  </Marker>

                  {/* Route Line */}
                  <Polyline positions={[sourcePos, currentPos, destPos]} color="#3b82f6" weight={4} dashArray="5, 10" />
                  <Polyline positions={[sourcePos, currentPos]} color="#2563eb" weight={5} />
                </MapContainer>
              )}
            </div>
            <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-slate-600 font-semibold"><Clock className="w-4 h-4 text-blue-500" /> ETA: 14 Hours (On Time)</div>
              <div className="text-xs text-slate-400 font-medium">Last updated: Just now</div>
            </div>
          </Panel>
        </div>

        {/* Milestones Sidebar */}
        <div className="space-y-6">
          <Panel title="Trip Milestones" className="border-indigo-100 shadow-sm">
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 py-2">
              
              <div className="relative">
                <span className="absolute -left-[21px] top-1 bg-green-500 w-4 h-4 rounded-full border-4 border-white shadow-sm" />
                <div className="pl-4">
                  <h4 className="font-bold text-slate-800 text-sm">Dispatched from Source</h4>
                  <p className="text-xs text-slate-500">{trip.indent?.source} • {new Date(trip.tripStartDate || Date.now()).toLocaleString()}</p>
                </div>
              </div>

              <div className="relative">
                <span className="absolute -left-[21px] top-1 bg-green-500 w-4 h-4 rounded-full border-4 border-white shadow-sm" />
                <div className="pl-4">
                  <h4 className="font-bold text-slate-800 text-sm">Crossed Toll Plaza</h4>
                  <p className="text-xs text-slate-500">Mumbai-Pune Expwy • Yesterday, 21:40</p>
                </div>
              </div>

              <div className="relative">
                <span className="absolute -left-[21px] top-1 bg-blue-500 w-4 h-4 rounded-full border-4 border-white shadow-sm animate-pulse" />
                <div className="pl-4">
                  <h4 className="font-bold text-blue-700 text-sm">In Transit (Current)</h4>
                  <p className="text-xs text-slate-500">Near Ahmedabad Hwy • Today, 12:15</p>
                </div>
              </div>

              <div className="relative opacity-50">
                <span className="absolute -left-[21px] top-1 bg-slate-300 w-4 h-4 rounded-full border-4 border-white shadow-sm" />
                <div className="pl-4">
                  <h4 className="font-bold text-slate-700 text-sm">Expected Arrival</h4>
                  <p className="text-xs text-slate-500">{trip.indent?.destination} • Tomorrow, 08:00</p>
                </div>
              </div>

            </div>
          </Panel>

          <Panel title="Quick Actions">
            <div className="space-y-3">
              <button className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl hover:bg-slate-100 text-sm flex items-center justify-center gap-2 transition-colors">
                <AlertTriangle className="w-4 h-4 text-blue-600" /> Report Delay / Halt
              </button>
              <button className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl hover:bg-slate-100 text-sm flex items-center justify-center gap-2 transition-colors">
                <MapPin className="w-4 h-4 text-indigo-500" /> Update Coordinates
              </button>
            </div>
          </Panel>
        </div>

      </div>

    </div>
  );
}
