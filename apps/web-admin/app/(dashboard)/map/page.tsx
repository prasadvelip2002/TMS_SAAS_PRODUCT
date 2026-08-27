"use client";

import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import { Loader2, Truck, Navigation, Clock, AlertTriangle, Search } from "lucide-react";

// Dynamically import the entire Map component to strictly avoid any SSR/Node DOM issues
const FleetMap = dynamic(() => import('@/components/FleetMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-slate-100"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
});

// Dummy Fleet Data for the Demo
const initialFleet = [
  { 
    id: "V1", num: "TN-01-AB-1234", driver: "Murugan V",
    srcLat: 13.0827, srcLng: 80.2707, source: "Chennai", 
    destLat: 28.7041, destLng: 77.1025, dest: "Delhi", 
    currentLat: 21.1458, currentLng: 79.0882, 
    status: "Moving", speed: 65, eta: "4h 30m" 
  }, 
  { 
    id: "V2", num: "KA-05-MN-4567", driver: "Arjun K",
    srcLat: 12.9716, srcLng: 77.5946, source: "Bangalore", 
    destLat: 19.0760, destLng: 72.8777, dest: "Mumbai", 
    currentLat: 15.3173, currentLng: 75.7139, 
    status: "Delayed", speed: 30, eta: "15h 45m" 
  },
  { 
    id: "V3", num: "MH-04-XY-9876", driver: "Rajesh S",
    srcLat: 19.0760, srcLng: 72.8777, source: "Mumbai", 
    destLat: 23.0225, destLng: 72.5714, dest: "Ahmedabad", 
    currentLat: 21.1702, currentLng: 72.8311, 
    status: "Halted", speed: 0, eta: "N/A" 
  },
  { 
    id: "V4", num: "DL-1C-AA-1111", driver: "Gurpreet",
    srcLat: 28.7041, srcLng: 77.1025, source: "Delhi", 
    destLat: 22.5726, destLng: 88.3639, dest: "Kolkata", 
    currentLat: 26.8467, currentLng: 80.9462, 
    status: "Moving", speed: 72, eta: "22h 10m" 
  },
];

export default function GlobalMapDashboard() {
  const [activeVehicle, setActiveVehicle] = useState<any>(null);
  const [fleet, setFleet] = useState(initialFleet);
  
  // Animation loop to simulate movement
  useEffect(() => {
    const interval = setInterval(() => {
      setFleet(currentFleet => 
        currentFleet.map(v => {
          if (v.status !== "Moving") return v;
          const stepSize = 0.0005; 
          let newLat = v.currentLat;
          let newLng = v.currentLng;
          if (v.currentLat < v.destLat) newLat += Math.abs(v.destLat - v.srcLat) * stepSize;
          else newLat -= Math.abs(v.destLat - v.srcLat) * stepSize;
          if (v.currentLng < v.destLng) newLng += Math.abs(v.destLng - v.srcLng) * stepSize;
          else newLng -= Math.abs(v.destLng - v.srcLng) * stepSize;
          return { ...v, currentLat: newLat, currentLng: newLng };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Inject custom CSS for animations */}
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>

      <div className="h-[calc(100vh-6rem)] -m-6 flex overflow-hidden animate-in fade-in duration-500 bg-slate-900">
        
        {/* Sidebar List */}
        <div className="w-96 bg-white flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.1)] z-10 relative">
          <div className="p-6 border-b border-slate-100">
            <h1 className="text-xl font-black tracking-tight text-slate-900 mb-1">Fleet Tracker</h1>
            <p className="text-xs text-slate-500 font-semibold mb-4">Live GPS & Telematics Integration</p>
            
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search vehicle or driver..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {fleet.map((v) => (
              <div 
                key={v.id} 
                onClick={() => setActiveVehicle(activeVehicle?.id === v.id ? null : v)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  activeVehicle?.id === v.id 
                    ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-500' 
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900">{v.num}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Navigation className="w-3 h-3" /> {v.source} to {v.dest}
                    </p>
                  </div>
                  {v.status === 'Moving' && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider animate-pulse flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"/> Moving</span>}
                  {v.status === 'Delayed' && <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-600 rounded-full"/> Delayed</span>}
                  {v.status === 'Halted' && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"/> Halted</span>}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Speed</span>
                    <span className="text-sm font-semibold text-slate-700">{v.speed} km/h</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">ETA</span>
                    <span className="text-sm font-semibold text-slate-700">{v.eta}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* The Full Screen Map */}
        <div className="flex-1 relative">
          
          <FleetMap activeVehicle={activeVehicle} fleet={fleet} />

          {/* Floating Map UI Overlays */}
          <div className="absolute top-6 left-6 z-10 flex gap-3 pointer-events-none">
            <div className="bg-slate-900/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl border border-slate-700 font-bold text-sm text-white flex items-center gap-3">
              <Truck className="w-5 h-5 text-blue-400" /> 
              <span>2 Active</span>
            </div>
            <div className="bg-slate-900/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl border border-slate-700 font-bold text-sm text-white flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-500" /> 
              <span>2 Issues</span>
            </div>
            <div className="bg-slate-900/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl border border-slate-700 font-bold text-sm text-white flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              GPS Online
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
