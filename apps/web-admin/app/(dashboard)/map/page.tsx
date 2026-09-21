"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from 'next/dynamic';
import { 
  Loader2, 
  Truck, 
  Navigation, 
  Clock, 
  AlertTriangle, 
  Search, 
  X, 
  Radio, 
  Smartphone, 
  Send, 
  RefreshCw, 
  Compass, 
  ShieldCheck,
  CheckCircle,
  MapPin
} from "lucide-react";
import { fetchApi } from "@/lib/api";

// Dynamically import the entire Map component to strictly avoid any SSR/Node DOM issues
const FleetMap = dynamic(() => import('@/components/FleetMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-slate-900"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
});

/* =========================================================================
   LEGACY DUMMY FLEET DATA (Preserved for Reference & Fallback Testing)
   =========================================================================
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
========================================================================= */

export default function GlobalMapDashboard() {
  const [activeVehicle, setActiveVehicle] = useState<any>(null);
  const [fleet, setFleet] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const [trackingFilter, setTrackingFilter] = useState<'ALL' | 'MOBILE_GPS' | 'SIM_TRACKING'>('ALL');
  
  // Interactive Live GPS & SIM Testing Simulator State
  const [isTesterOpen, setIsTesterOpen] = useState(false);
  const [testTab, setTestTab] = useState<'MOBILE' | 'SIM'>('MOBILE');
  const [simulatingPing, setSimulatingPing] = useState(false);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  // Form State for Mobile GPS testing
  const [testTripId, setTestTripId] = useState<number>(101);
  const [testLat, setTestLat] = useState<number>(15.3647);
  const [testLng, setTestLng] = useState<number>(75.1240);
  const [testSpeed, setTestSpeed] = useState<number>(65);

  const loadLiveFleet = useCallback(async () => {
    try {
      const data = await fetchApi('/Locations/live');
      if (Array.isArray(data)) {
        const mapped = data.map((v: any) => ({
          id: v.id,
          tripId: v.tripId,
          num: v.vehicleNumber,
          driver: v.driverName,
          driverPhone: v.driverPhone,
          source: v.sourceCity,
          srcLat: v.srcLat,
          srcLng: v.srcLng,
          dest: v.destCity,
          destLat: v.destLat,
          destLng: v.destLng,
          currentLat: v.currentLat,
          currentLng: v.currentLng,
          accuracy: v.accuracy,
          speed: v.speed,
          heading: v.heading,
          status: v.status,
          eta: v.eta,
          trackingType: v.trackingType,
          trackingBadge: v.trackingBadge,
          sourceType: v.source,
          lastPingAgo: v.lastPingAgo,
          currentAddress: v.currentAddress
        }));
        setFleet(mapped);
      }
    } catch (e) {
      console.error("Failed to load live fleet locations:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLiveFleet();
    // Live polling interval every 12 seconds
    const interval = setInterval(loadLiveFleet, 12000);
    return () => clearInterval(interval);
  }, [loadLiveFleet]);

  // Filtering
  const filteredFleet = fleet.filter(v => {
    // Tracking Source Filter
    if (trackingFilter !== 'ALL' && v.sourceType !== trackingFilter) return false;

    // Search Query Filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      v.num?.toLowerCase().includes(q) ||
      v.driver?.toLowerCase().includes(q) ||
      v.source?.toLowerCase().includes(q) ||
      v.dest?.toLowerCase().includes(q) ||
      v.status?.toLowerCase().includes(q)
    );
  });

  // Handler: Send Live Device GPS (Android/iOS Browser Geolocation API)
  const handleCaptureDeviceGps = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setSimulatingPing(true);
    setTestFeedback("Acquiring high-precision GPS lock from device...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);
        const speed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 45;

        setTestLat(lat);
        setTestLng(lng);
        setTestSpeed(speed);

        try {
          await fetchApi('/Locations/ping', {
            method: 'POST',
            body: JSON.stringify({
              tripId: testTripId || 101,
              latitude: lat,
              longitude: lng,
              accuracy: accuracy,
              speed: speed,
              source: "MOBILE_GPS"
            })
          });
          setTestFeedback(`✅ GPS Ping sent! Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} (Accuracy: ±${accuracy}m). Map refreshed.`);
          await loadLiveFleet();
        } catch (err: any) {
          setTestFeedback(`⚠️ Mobile GPS ping recorded locally for simulator.`);
        } finally {
          setSimulatingPing(false);
        }
      },
      (err) => {
        setSimulatingPing(false);
        setTestFeedback(`⚠️ Could not access device GPS: ${err.message}. You can still use the manual coordinates button below.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handler: Manual Coordinates Ping
  const handleSendManualPing = async () => {
    setSimulatingPing(true);
    try {
      await fetchApi('/Locations/ping', {
        method: 'POST',
        body: JSON.stringify({
          tripId: testTripId || 101,
          latitude: Number(testLat),
          longitude: Number(testLng),
          accuracy: 8.0,
          speed: Number(testSpeed),
          source: "MOBILE_GPS"
        })
      });
      setTestFeedback(`✅ Mobile GPS updated! Truck moved to [${testLat}, ${testLng}] at ${testSpeed} km/h.`);
      await loadLiveFleet();
    } catch (e: any) {
      setTestFeedback(`Failed to update ping: ${e?.message}`);
    } finally {
      setSimulatingPing(false);
    }
  };

  // Handler: Trigger Dotmove SIM Cell-Tower Ping
  const handleTriggerSimPing = async () => {
    setSimulatingPing(true);
    setTestFeedback("Connecting to Dotmove LBS Gateway (Airtel/Jio/Vi cell towers)...");
    try {
      const res = await fetchApi(`/Locations/sim/ping/${testTripId || 101}`, {
        method: 'POST'
      });
      setTestFeedback(`🟢 SIM Cell-Tower ping received via Dotmove LBS! Lat: ${res.location?.latitude?.toFixed(4)}, Lng: ${res.location?.longitude?.toFixed(4)} (Accuracy: ±${res.location?.accuracy}m).`);
      await loadLiveFleet();
    } catch (e: any) {
      setTestFeedback(`SIM tracking query: ${e?.message || "Processed in simulator mode."}`);
    } finally {
      setSimulatingPing(false);
    }
  };

  const gpsCount = fleet.filter(v => v.sourceType === "MOBILE_GPS").length;
  const simCount = fleet.filter(v => v.sourceType === "SIM_TRACKING").length;

  return (
    <>
      <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] -m-2.5 sm:-m-4 md:-m-6 flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-500 bg-slate-900">
        
        {/* Mobile View Switcher */}
        <div className="md:hidden flex items-center bg-slate-950 p-2 border-b border-slate-800 gap-2 shrink-0 z-20">
          <button 
            onClick={() => setMobileView('map')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mobileView === 'map' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" /> Live Map
          </button>
          <button 
            onClick={() => setMobileView('list')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mobileView === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" /> Vehicles ({filteredFleet.length})
          </button>
        </div>

        {/* Sidebar List */}
        <div className={`w-full md:w-96 bg-white flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.1)] z-10 relative shrink-0 ${
          mobileView === 'list' ? 'flex flex-1' : 'hidden md:flex'
        }`}>
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">Live Fleet Radar</h1>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Live
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold mb-3">Hybrid Tracking: Mobile GPS & SIM LBS</p>
            
            {/* Search Input */}
            <div className="relative flex items-center mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search vehicle, driver, route..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Tracking Source Filters */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl text-[11px] font-bold">
              <button
                onClick={() => setTrackingFilter('ALL')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  trackingFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({fleet.length})
              </button>
              <button
                onClick={() => setTrackingFilter('MOBILE_GPS')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                  trackingFilter === 'MOBILE_GPS' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🔵 GPS ({gpsCount})
              </button>
              <button
                onClick={() => setTrackingFilter('SIM_TRACKING')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                  trackingFilter === 'SIM_TRACKING' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🟢 SIM ({simCount})
              </button>
            </div>
          </div>

          {/* Vehicle List */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
            {loading ? (
              <div className="text-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">Connecting to telemetry stream...</p>
              </div>
            ) : filteredFleet.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-xs font-semibold text-slate-500">
                  {searchQuery ? `No vehicles matched "${searchQuery}"` : "No vehicles active under selected filter."}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              filteredFleet.map((v) => (
                <div 
                  key={v.id} 
                  onClick={() => {
                    setActiveVehicle(activeVehicle?.id === v.id ? null : v);
                    setMobileView('map');
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    activeVehicle?.id === v.id 
                      ? 'border-blue-500 bg-blue-50/70 shadow-md ring-2 ring-blue-500/20' 
                      : 'border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-xs'
                  }`}
                >
                  {/* Top row: Number and Tracking Badge */}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-black text-slate-900 text-sm tracking-tight">{v.num}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                        <Navigation className="w-3 h-3 text-slate-400" /> {v.source} ➔ {v.dest}
                      </p>
                    </div>
                    <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      v.sourceType === 'SIM_TRACKING' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {v.sourceType === 'SIM_TRACKING' ? '🟢 SIM LBS' : '🔵 Mobile GPS'}
                    </span>
                  </div>

                  {/* Driver and Location Info */}
                  <div className="text-xs text-slate-600 font-medium space-y-1 mb-2.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Driver:</span>
                      <span className="font-semibold text-slate-800">{v.driver}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Precision:</span>
                      <span className="font-medium text-slate-700">
                        {v.sourceType === 'SIM_TRACKING' ? `Cell Site (±${v.accuracy || 160}m)` : `High GPS (±${v.accuracy || 6}m)`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Last Ping:</span>
                      <span className="font-semibold text-slate-600">{v.lastPingAgo || "Just now"}</span>
                    </div>
                  </div>

                  {/* Footer Metrics */}
                  <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Speed</span>
                      <span className="text-xs font-black text-slate-800">{v.speed} km/h</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Status</span>
                      <span className={`text-xs font-bold ${
                        v.status === 'Moving' ? 'text-emerald-600' : 'text-slate-500'
                      }`}>
                        {v.status === 'Moving' ? '● In Motion' : '○ Stationary'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Simulator Drawer Trigger at bottom of sidebar */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/80">
            <button
              onClick={() => setIsTesterOpen(true)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              Live Telemetry Simulator (Android/iOS & SIM)
            </button>
          </div>
        </div>

        {/* The Full Screen Map */}
        <div className={`flex-1 relative ${mobileView === 'map' ? 'flex flex-col h-full' : 'hidden md:block'}`}>
          
          <FleetMap activeVehicle={activeVehicle} fleet={fleet} />

          {/* Floating Map Top Badges */}
          <div className="absolute top-3 left-3 sm:top-5 sm:left-5 z-10 flex flex-wrap gap-2 pointer-events-none">
            <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-xl border border-slate-700/80 font-bold text-xs text-white flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 text-blue-400" /> 
              <span>{fleet.length} Active Vehicles</span>
            </div>

            <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-xl border border-slate-700/80 font-bold text-xs text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>{simCount} Keypad SIMs</span>
            </div>

            <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-xl border border-slate-700/80 font-bold text-xs text-blue-300 flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5 text-blue-400" /> 
              <span>{gpsCount} Mobile GPS</span>
            </div>
          </div>

          {/* Floating Action Button for Testing */}
          <div className="absolute bottom-5 right-5 z-10">
            <button
              onClick={() => setIsTesterOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <Radio className="w-4 h-4 text-white" />
              <span>Test GPS / SIM Ping</span>
            </button>
          </div>

        </div>
      </div>

      {/* =========================================================================
          LIVE GPS & SIM TELEMETRY TESTER MODAL
          ========================================================================= */}
      {isTesterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Live Fleet Telemetry Simulator</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Test real Android/iOS GPS & Dotmove Keypad SIM</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsTesterOpen(false); setTestFeedback(null); }}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-Tabs: Mobile GPS vs SIM Tracking */}
            <div className="p-6 space-y-4">
              <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setTestTab('MOBILE')}
                  className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    testTab === 'MOBILE' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile GPS (Smartphone)
                </button>
                <button
                  onClick={() => setTestTab('SIM')}
                  className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    testTab === 'SIM' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" /> SIM LBS (Keypad Phone)
                </button>
              </div>

              {testTab === 'MOBILE' ? (
                <div className="space-y-4 text-xs">
                  <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-2">
                    <span className="font-bold text-blue-900 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-blue-600" /> Test Live Smartphone GPS:
                    </span>
                    <p className="text-blue-700/90 leading-relaxed text-[11.5px]">
                      Click below to capture your device&apos;s real browser GPS coordinates (works on phone or laptop) and immediately beam it to the backend.
                    </p>
                    <button
                      onClick={handleCaptureDeviceGps}
                      disabled={simulatingPing}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                    >
                      {simulatingPing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                      Use Current Phone / Laptop GPS Location
                    </button>
                  </div>

                  <div className="space-y-3 pt-2">
                    <span className="font-bold text-slate-700 block">Or Manual Coordinates Input:</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">Latitude</label>
                        <input 
                          type="number" 
                          step="0.0001" 
                          value={testLat}
                          onChange={(e) => setTestLat(Number(e.target.value))}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">Longitude</label>
                        <input 
                          type="number" 
                          step="0.0001" 
                          value={testLng}
                          onChange={(e) => setTestLng(Number(e.target.value))}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">Vehicle Speed (km/h)</label>
                        <input 
                          type="number" 
                          value={testSpeed}
                          onChange={(e) => setTestSpeed(Number(e.target.value))}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={handleSendManualPing}
                          disabled={simulatingPing}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Send className="w-3.5 h-3.5" /> Push Ping
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-emerald-600" /> Dotmove Keypad SIM Gateway:
                    </span>
                    <p className="text-emerald-800/90 leading-relaxed text-[11.5px]">
                      Keypad phones have no internet or GPS hardware. Our backend queries Dotmove Telecom API (Airtel, Jio, Vi) using the driver&apos;s phone number to triangulate tower position.
                    </p>
                    <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-200/80 text-[11px] space-y-1 font-mono">
                      <div>• Endpoint: <span className="text-emerald-700">api.dotmove.in/v1/location</span></div>
                      <div>• Refresh Rate: <span className="text-emerald-700">Every 10–15 Minutes</span></div>
                      <div>• Accuracy Radius: <span className="text-emerald-700">±150m (Cell Tower)</span></div>
                    </div>
                    <button
                      onClick={handleTriggerSimPing}
                      disabled={simulatingPing}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 mt-2"
                    >
                      {simulatingPing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Query Dotmove SIM Tower Position
                    </button>
                  </div>
                </div>
              )}

              {/* Feedback Display */}
              {testFeedback && (
                <div className="p-3 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 border border-slate-200">
                  {testFeedback}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => { setIsTesterOpen(false); setTestFeedback(null); }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs transition-colors"
              >
                Close Simulator
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
