"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from 'next/dynamic';
import { 
  Loader2, 
  Truck, 
  Navigation, 
  Search, 
  X, 
  Radio, 
  Smartphone, 
  Send, 
  RefreshCw, 
  Compass, 
  ShieldCheck,
  MapPin,
  WifiOff,
  ExternalLink,
  Phone,
  MessageSquare,
  Crosshair,
  Eye,
  Copy,
  Check,
  Share2,
  ArrowRight,
  Clock,
  Activity,
  Gauge
} from "lucide-react";
import { fetchApi } from "@/lib/api";

function getHeadingCardinal(bearing?: number) {
  if (bearing === undefined || bearing === null) return "N";
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(((bearing %= 360) < 0 ? bearing + 360 : bearing) / 45) % 8;
  return directions[index];
}

// Dynamically import the entire Map component to strictly avoid any SSR/Node DOM issues
const FleetMap = dynamic(() => import('@/components/FleetMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-slate-900"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
});

export default function GlobalMapDashboard() {
  const [activeVehicle, setActiveVehicle] = useState<any>(null);
  const [fleet, setFleet] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const [trackingFilter, setTrackingFilter] = useState<'ALL' | 'MOBILE_GPS' | 'SIM_TRACKING'>('ALL');

  // Breadcrumb Trail & Camera Controls
  const [trailHistory, setTrailHistory] = useState<any[]>([]);
  const [autoFollow, setAutoFollow] = useState<boolean>(true);
  const [recenterTrigger, setRecenterTrigger] = useState<number>(0);
  const [copiedCoords, setCopiedCoords] = useState<boolean>(false);
  
  // Interactive Live GPS & SIM Testing Simulator State
  const [isTesterOpen, setIsTesterOpen] = useState(false);
  const [testTab, setTestTab] = useState<'MOBILE' | 'SIM'>('MOBILE');
  const [simulatingPing, setSimulatingPing] = useState(false);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  // Form State for Mobile GPS testing
  const [testTripId, setTestTripId] = useState<number>(0);
  const [testLat, setTestLat] = useState<number>(0);
  const [testLng, setTestLng] = useState<number>(0);
  const [testSpeed, setTestSpeed] = useState<number>(45);

  const getDriverTrackingUrl = (tripId: number | string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/driver/trip/${tripId}`;
    }
    return `/driver/trip/${tripId}`;
  };

  const loadLiveFleet = useCallback(async () => {
    try {
      const data = await fetchApi('/Locations/live');
      if (Array.isArray(data)) {
        const mapped = data.map((v: any) => ({
          id: v.id,
          tripId: v.tripId,
          vehicleId: v.vehicleId,
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
          trackingProvider: v.trackingProvider,
          trackingBadge: v.trackingBadge,
          trackingStatus: v.trackingStatus || 'LIVE',
          sourceType: v.trackingType || v.source,
          lastPingAgo: v.lastPingAgo,
          currentAddress: v.currentAddress
        }));
        setFleet(mapped);
        if (mapped.length > 0) {
          setTestTripId((prev) => (prev > 0 ? prev : mapped[0].tripId));
          setTestLat((prev) => (prev !== 0 ? prev : mapped[0].currentLat || 12.9716));
          setTestLng((prev) => (prev !== 0 ? prev : mapped[0].currentLng || 77.5946));
        }
      } else {
        setFleet([]);
      }
    } catch (e) {
      console.error("Failed to load live fleet locations:", e);
      setFleet([]);
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

  // Synchronize activeVehicle with fresh telemetry pings from fleet polling
  useEffect(() => {
    if (activeVehicle) {
      const fresh = fleet.find((v) => v.id === activeVehicle.id);
      if (fresh) {
        setActiveVehicle(fresh);
      }
    }
  }, [fleet]);

  // Load breadcrumb trail history when active vehicle is selected
  useEffect(() => {
    if (activeVehicle?.tripId) {
      fetchApi(`/Locations/trip/${activeVehicle.tripId}/history`)
        .then((data: any) => {
          if (Array.isArray(data)) {
            setTrailHistory(data);
          }
        })
        .catch((err) => console.error("Trail history fetch error:", err));
    } else {
      setTrailHistory([]);
    }
  }, [activeVehicle?.tripId, activeVehicle?.lastPingTime]);

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

  // Handler: Capture real browser geolocation (Test Tool)
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
          const res = await fetchApi('/Locations/ping', {
            method: 'POST',
            body: JSON.stringify({
              tripId: testTripId || 1,
              latitude: lat,
              longitude: lng,
              accuracy: accuracy,
              speed: speed,
              source: "MOBILE_GPS",
              provider: "MOBILE",
              deviceId: "BROWSER-TEST-CLIENT",
              recordedAt: new Date().toISOString()
            })
          });
          setTestFeedback(`✅ GPS Ping sent! Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} (Accuracy: ±${accuracy}m). Telemetry ingested into PostgreSQL.`);
          await loadLiveFleet();
        } catch (err: any) {
          setTestFeedback(`⚠️ ${err?.message || "Trip not found or awaiting assignment."}`);
        } finally {
          setSimulatingPing(false);
        }
      },
      (err) => {
        setSimulatingPing(false);
        setTestFeedback(`⚠️ Could not access device GPS: ${err.message}. You can also type coordinates manually below.`);
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
          tripId: testTripId || 1,
          latitude: Number(testLat),
          longitude: Number(testLng),
          accuracy: 8.0,
          speed: Number(testSpeed),
          source: "MOBILE_GPS",
          provider: "MOBILE",
          deviceId: "MANUAL-SIMULATOR",
          recordedAt: new Date().toISOString()
        })
      });
      setTestFeedback(`✅ Real Mobile GPS ping sent for Trip #${testTripId}: [${testLat}, ${testLng}] at ${testSpeed} km/h.`);
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
      const res = await fetchApi(`/Locations/sim/ping/${testTripId || 1}`, {
        method: 'POST'
      });
      setTestFeedback(`🟢 SIM Cell-Tower ping received via Dotmove LBS! Lat: ${res.location?.latitude?.toFixed(4)}, Lng: ${res.location?.longitude?.toFixed(4)} (Accuracy: ±${res.location?.accuracy}m).`);
      await loadLiveFleet();
    } catch (e: any) {
      setTestFeedback(`SIM tracking query: ${e?.message || "Could not fetch SIM location."}`);
    } finally {
      setSimulatingPing(false);
    }
  };

  const handleTriggerSimPingForTrip = async (tripId: number) => {
    try {
      await fetchApi(`/Locations/sim/ping/${tripId}`, { method: 'POST' });
      await loadLiveFleet();
    } catch (e: any) {
      alert(`Dotmove SIM poll: ${e?.message || 'Processed'}`);
    }
  };

  const gpsCount = fleet.filter(v => v.sourceType === "MOBILE_GPS").length;
  const simCount = fleet.filter(v => v.sourceType === "SIM_TRACKING").length;
  const movingCount = fleet.filter(v => (v.speed || 0) > 0).length;
  const haltedCount = fleet.filter(v => (v.speed || 0) === 0).length;

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
            <Compass className="w-3.5 h-3.5" /> Fleet Map
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

        {/* Left Sidebar: Vehicle List & Telemetry Stats */}
        <div className={`w-full md:w-96 lg:w-[420px] bg-slate-900/95 backdrop-blur border-r border-slate-800/80 flex flex-col h-full z-10 shrink-0 ${
          mobileView === 'map' ? 'hidden md:flex' : 'flex'
        }`}>
          
          {/* Header */}
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-blue-400 animate-pulse" /> Live Fleet Radar
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real Database Telemetry (Mobile GPS + Dotmove SIM)
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => loadLiveFleet()}
                  title="Refresh telemetry"
                  className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsTesterOpen(true)}
                  title="Dispatch Testing Simulator"
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1.5"
                >
                  <Radio className="w-3 h-3 text-blue-400" />
                  <span className="text-[11px]">Simulator</span>
                </button>
              </div>
            </div>

            {/* Live Operational Metrics Pill */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80 text-center">
                <span className="text-[10px] text-slate-400 block font-semibold">Active</span>
                <span className="text-sm font-black text-white">{fleet.length}</span>
              </div>
              <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80 text-center">
                <span className="text-[10px] text-emerald-400 block font-semibold flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Moving
                </span>
                <span className="text-sm font-black text-emerald-400">{movingCount}</span>
              </div>
              <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80 text-center">
                <span className="text-[10px] text-amber-400 block font-semibold">Halted</span>
                <span className="text-sm font-black text-amber-400">{haltedCount}</span>
              </div>
            </div>

            {/* Tracking Source Filters */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={() => setTrackingFilter('ALL')}
                className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition text-center ${
                  trackingFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All ({fleet.length})
              </button>
              <button
                onClick={() => setTrackingFilter('MOBILE_GPS')}
                className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition text-center flex items-center justify-center gap-1 ${
                  trackingFilter === 'MOBILE_GPS' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3 h-3 text-blue-400" /> GPS ({gpsCount})
              </button>
              <button
                onClick={() => setTrackingFilter('SIM_TRACKING')}
                className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition text-center flex items-center justify-center gap-1 ${
                  trackingFilter === 'SIM_TRACKING' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="w-3 h-3 text-emerald-400" /> SIM ({simCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search vehicle number, driver, city..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")} 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Vehicle List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1.5">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-xs">Querying live database fleet...</span>
              </div>
            ) : filteredFleet.length === 0 ? (
              <div className="text-center py-12 px-4 text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                  <WifiOff className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">No Vehicles Currently in Transit</h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Dummy data is now turned off. Vehicles will appear here as soon as a real trip is created, assigned, and placed <strong>In Transit</strong>.
                  </p>
                </div>
                <button
                  onClick={() => setIsTesterOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  <Radio className="w-3.5 h-3.5" /> Send Test Telemetry Ping
                </button>
              </div>
            ) : (
              filteredFleet.map((v) => {
                const isSelected = activeVehicle?.id === v.id;
                const isSim = v.sourceType === "SIM_TRACKING" || v.source === "SIM_TRACKING";
                const trackingStatus = v.trackingStatus || 'LIVE';

                return (
                  <div 
                    key={v.id}
                    onClick={() => {
                      setActiveVehicle(v);
                      if (window.innerWidth < 768) setMobileView('map');
                    }}
                    className={`p-3.5 rounded-xl transition-all cursor-pointer border ${
                      isSelected 
                        ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500/20' 
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSim ? 'bg-emerald-950 border border-emerald-500/30 text-emerald-400' : 'bg-blue-950 border border-blue-500/30 text-blue-400'
                        }`}>
                          {isSim ? <Radio className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                        </div>
                        <div>
                          <span className="font-bold text-white text-sm tracking-wide block">{v.num}</span>
                          <span className="text-[11px] text-slate-400 block">{v.driver}</span>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isSim ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50' : 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                        }`}>
                          {isSim ? '🟢 SIM' : '🔵 GPS'}
                        </span>
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                          trackingStatus === 'LIVE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          trackingStatus === 'ASSIGNED' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          trackingStatus === 'STALE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          ● {trackingStatus === 'ASSIGNED' ? 'ASSIGNED' : trackingStatus}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-900/80 rounded-lg p-2.5 text-xs text-slate-300 space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-400" /> {v.source} ➔ {v.dest}
                        </span>
                        <span className="font-bold text-blue-400">{v.speed} km/h</span>
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-400 pt-0.5 border-t border-slate-800">
                        <span>ETA: <strong className="text-emerald-400 font-semibold">{v.eta || "In Transit"}</strong></span>
                        <span className="text-[10px] text-slate-400">{v.lastPingAgo || "Just now"}</span>
                      </div>

                      {/* Quick Driver Actions */}
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5 text-[11px]">
                        {isSim ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTriggerSimPingForTrip(v.tripId);
                            }}
                            className="w-full py-1.5 px-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/60 rounded-lg text-emerald-300 font-bold flex items-center justify-center gap-1.5 transition"
                          >
                            <Radio className="w-3.5 h-3.5 text-emerald-400" /> Poll Dotmove SIM Tower
                          </button>
                        ) : (
                          <>
                            {v.driverPhone ? (
                              <a
                                href={`https://wa.me/${v.driverPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`🚛 *TransitFlow · Turn ON Live Location*\n\nHello *${v.driver}*,\nTrip #${v.tripId} (${v.num}) has started.\n\n📍 Tap this link to turn ON your location so dispatch can track your truck:\n👉 ${getDriverTrackingUrl(v.tripId)}`)}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="py-1.5 px-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/60 rounded-lg text-emerald-300 font-bold flex items-center justify-center gap-1 transition"
                                title={`Send tracking link to driver WhatsApp (${v.driverPhone})`}
                              >
                                <MessageSquare className="w-3 h-3 fill-current" /> WA
                              </a>
                            ) : null}
                            <a
                              href={getDriverTrackingUrl(v.tripId)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 py-1.5 px-2 bg-blue-950/80 hover:bg-blue-900 border border-blue-800/60 rounded-lg text-blue-300 font-bold flex items-center justify-center gap-1.5 transition text-center"
                            >
                              <ExternalLink className="w-3 h-3" /> Driver Link
                            </a>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const link = getDriverTrackingUrl(v.tripId);
                                navigator.clipboard.writeText(link);
                                alert(`Copied Driver Tracking Link for Trip #${v.tripId}:\n${link}`);
                              }}
                              className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg transition"
                              title="Copy link to send to driver via WhatsApp / SMS"
                            >
                              Copy Link
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Interactive Leaflet Map */}
        <div className={`flex-1 relative h-full w-full overflow-hidden ${
          mobileView === 'list' ? 'hidden md:block' : 'block'
        }`}>
          <FleetMap 
            activeVehicle={activeVehicle} 
            fleet={filteredFleet}
            onSelectVehicle={(v: any) => {
              setActiveVehicle(v);
              if (window.innerWidth < 768) setMobileView('map');
            }}
            trailHistory={trailHistory}
            autoFollow={autoFollow}
            recenterTrigger={recenterTrigger}
          />

          {/* Floating Driver Complete Live Telemetry HUD */}
          {activeVehicle && (
            <div className="absolute top-4 right-4 z-[999] w-[400px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-140px)] overflow-y-auto bg-slate-950/95 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-2 scrollbar-thin scrollbar-thumb-slate-700">
              
              {/* Header Bar */}
              <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-black tracking-wider uppercase text-emerald-400">
                    Live Telemetry Stream
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeVehicle.sourceType === "SIM_TRACKING"
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                      : 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                  }`}>
                    {activeVehicle.sourceType === "SIM_TRACKING" ? '🟢 SIM (Dotmove)' : '🔵 Mobile GPS (High Precision)'}
                  </span>
                  <button 
                    onClick={() => setActiveVehicle(null)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition ml-1"
                    title="Close Telemetry"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Driver & Vehicle Header Card */}
              <div className="p-4 space-y-3.5">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-white tracking-wider">{activeVehicle.num}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Trip #{activeVehicle.tripId}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                      <span>{activeVehicle.driver}</span>
                      <span className="text-slate-600">•</span>
                      <span className="font-mono text-blue-400">{activeVehicle.driverPhone || "No Phone Registered"}</span>
                    </div>
                  </div>

                  {/* Driver Direct Contact & Recenter */}
                  <div className="flex items-center gap-1.5">
                    {activeVehicle.driverPhone && (
                      <>
                        <a
                          href={`tel:${activeVehicle.driverPhone}`}
                          className="p-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 rounded-xl transition"
                          title="Call Driver"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`https://wa.me/${activeVehicle.driverPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${activeVehicle.driver}, checking in on Trip #${activeVehicle.tripId} (${activeVehicle.num}).`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-green-950/80 hover:bg-green-900 border border-green-700/60 text-green-300 rounded-xl transition"
                          title="WhatsApp Driver"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      </>
                    )}
                    <button
                      onClick={() => setRecenterTrigger(p => p + 1)}
                      className="p-2 bg-blue-950/80 hover:bg-blue-900 border border-blue-700/60 text-blue-300 rounded-xl transition flex items-center gap-1"
                      title="Center Map on Driver"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Complete Current Live Location */}
                <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Current Live Location
                      </span>
                      <span className="text-xs font-bold text-white block leading-snug break-words">
                        {activeVehicle.currentAddress || `${activeVehicle.source} to ${activeVehicle.dest} Corridor`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 text-[11px]">
                    <div className="font-mono text-slate-300 font-bold flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-blue-400" />
                      <span>{activeVehicle.currentLat?.toFixed(6)}° N, {activeVehicle.currentLng?.toFixed(6)}° E</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${activeVehicle.currentLat}, ${activeVehicle.currentLng}`);
                        setCopiedCoords(true);
                        setTimeout(() => setCopiedCoords(false), 2000);
                      }}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 bg-blue-950/60 px-2 py-1 rounded-lg border border-blue-800/50 transition"
                    >
                      {copiedCoords ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedCoords ? "Copied!" : "Copy Coords"}
                    </button>
                  </div>
                </div>

                {/* Real-Time Telemetry Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Speed */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                      <span className="flex items-center gap-1 font-semibold">
                        <Gauge className="w-3.5 h-3.5 text-blue-400" /> Speed
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold">
                        {(activeVehicle.speed || 0) > 0 ? 'Moving' : 'Halted'}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black text-white">{activeVehicle.speed || 0}</span>
                      <span className="text-xs text-slate-400 font-bold">km/h</span>
                    </div>
                  </div>

                  {/* Precision */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                      <span className="flex items-center gap-1 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Accuracy
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black text-emerald-400">
                        ±{activeVehicle.accuracy || (activeVehicle.sourceType === "SIM_TRACKING" ? 500 : 8)}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">meters</span>
                    </div>
                  </div>

                  {/* Heading */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                      <span className="flex items-center gap-1 font-semibold">
                        <Compass className="w-3.5 h-3.5 text-indigo-400" /> Bearing
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-bold text-white">{activeVehicle.heading || 0}°</span>
                      <span className="text-xs text-slate-400 font-bold">({getHeadingCardinal(activeVehicle.heading)})</span>
                    </div>
                  </div>

                  {/* Telemetry Age */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                      <span className="flex items-center gap-1 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> Last Ping
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-200 truncate pt-0.5">
                      {activeVehicle.lastPingAgo || "Just now"}
                    </div>
                  </div>
                </div>

                {/* Route Journey Status & Dynamic ETA */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>{activeVehicle.source}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>{activeVehicle.dest}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1.5 border-t border-slate-800">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-400" /> Dynamic ETA:
                    </span>
                    <strong className="text-emerald-400 font-black">{activeVehicle.eta || "In Transit"}</strong>
                  </div>

                  {trailHistory.length > 0 && (
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                      <span>Breadcrumb Trail: <strong className="text-amber-400">{trailHistory.length} points recorded</strong></span>
                      <span className="text-emerald-400 font-semibold">Route Active</span>
                    </div>
                  )}
                </div>

                {/* Send GPS Link via WhatsApp or Copy Link */}
                {activeVehicle.driverPhone ? (
                  <a
                    href={`https://wa.me/${activeVehicle.driverPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`🚛 *TransitFlow · Trip Dispatched & Started*\n\nHello *${activeVehicle.driver}*,\nTrip #${activeVehicle.tripId} (${activeVehicle.num}) has started.\n\n📍 *Please turn ON your location:*\nTap this link on your phone and click 'START TRIP & SHARE LIVE GPS' so dispatch can track the truck:\n👉 ${getDriverTrackingUrl(activeVehicle.tripId)}\n\nSafe journey!`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 text-center"
                  >
                    <MessageSquare className="w-4 h-4 fill-current" />
                    Send WhatsApp GPS Link ({activeVehicle.driverPhone})
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      const link = getDriverTrackingUrl(activeVehicle.tripId);
                      navigator.clipboard.writeText(link);
                      alert(`Copied Driver Tracking Link for Trip #${activeVehicle.tripId}:\n${link}`);
                    }}
                    className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 text-center"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Tracking Link (Driver has no phone)
                  </button>
                )}

                {/* Action Bar */}
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    onClick={() => setAutoFollow(!autoFollow)}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                      autoFollow 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Auto-Follow: {autoFollow ? "ON" : "OFF"}
                  </button>

                  <a
                    href={`/driver/trip/${activeVehicle.tripId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    Driver Screen
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Driver Live GPS Test Tool (Simulator) Modal */}
      {isTesterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Driver Live GPS Test Tool</h3>
                  <p className="text-xs text-slate-400">Emulates mobile driver app GPS and Dotmove SIM LBS pings</p>
                </div>
              </div>
              <button 
                onClick={() => setIsTesterOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Note banner on Test Tool vs Native Driver App */}
            <div className="bg-blue-950/40 border-b border-blue-900/40 px-4 py-2.5 flex items-start gap-2 text-xs text-blue-300">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong>Testing Utility:</strong> Sends live GPS or SIM telemetry into your PostgreSQL database for an active Trip ID.
              </span>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/50">
              <button
                onClick={() => setTestTab('MOBILE')}
                className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  testTab === 'MOBILE' ? 'border-b-2 border-blue-500 text-blue-400 bg-blue-500/5' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" /> Smartphone GPS (Browser / App)
              </button>
              <button
                onClick={() => setTestTab('SIM')}
                className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  testTab === 'SIM' ? 'border-b-2 border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="w-4 h-4" /> Dotmove SIM LBS (Keypad Phone)
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              
              {/* Dynamic Trip Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Target Active Trip</label>
                {fleet.length > 0 ? (
                  <select
                    value={testTripId}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setTestTripId(id);
                      const selected = fleet.find((v) => v.tripId === id);
                      if (selected) {
                        if (selected.currentLat) setTestLat(selected.currentLat);
                        if (selected.currentLng) setTestLng(selected.currentLng);
                        if (selected.speed !== undefined) setTestSpeed(selected.speed);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {fleet.map((v) => (
                      <option key={v.tripId} value={v.tripId}>
                        Trip #{v.tripId} — {v.num} ({v.driver} · {v.source} ➔ {v.dest})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    value={testTripId || ""}
                    onChange={(e) => setTestTripId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    placeholder="Enter active TripId"
                  />
                )}
              </div>

              {testTab === 'MOBILE' ? (
                <div className="space-y-3">
                  {/* One-Click Device GPS Ping */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-white block mb-1">1-Click Live Device GPS</span>
                    <p className="text-[11px] text-slate-400 mb-3">
                      Capture your smartphone/laptop GPS coordinates via <code>navigator.geolocation</code> and send a real ping into your TMS backend.
                    </p>
                    <button
                      onClick={handleCaptureDeviceGps}
                      disabled={simulatingPing}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
                    >
                      {simulatingPing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                      Use My Current Device GPS
                    </button>
                  </div>

                  {/* Manual Coordinates Input */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                    <span className="text-xs font-bold text-white block">Or Set Coordinates Manually</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Latitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={testLat}
                          onChange={(e) => setTestLat(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Longitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={testLng}
                          onChange={(e) => setTestLng(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Speed (km/h)</label>
                        <input
                          type="number"
                          value={testSpeed}
                          onChange={(e) => setTestSpeed(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSendManualPing}
                      disabled={simulatingPing}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" /> Dispatch GPS Telemetry
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-white block">Telecom Cell Tower Triangulation (Dotmove)</span>
                  <p className="text-[11px] text-slate-400">
                    Triggers a network LBS tower query using the driver's registered MSISDN (works on basic feature & keypad phones without any app or internet).
                  </p>
                  <button
                    onClick={handleTriggerSimPing}
                    disabled={simulatingPing}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
                  >
                    {simulatingPing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
                    Trigger Dotmove SIM Query
                  </button>
                </div>
              )}

              {/* Feedback Message */}
              {testFeedback && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200">
                  {testFeedback}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-950 border-t border-slate-800 text-right">
              <button
                onClick={() => setIsTesterOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
