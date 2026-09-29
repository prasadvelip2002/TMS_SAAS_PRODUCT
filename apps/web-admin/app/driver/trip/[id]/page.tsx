"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { 
  Navigation, 
  Truck, 
  MapPin, 
  Play, 
  CheckCircle, 
  Radio, 
  AlertCircle, 
  Phone, 
  Gauge, 
  Clock, 
  ShieldCheck,
  RefreshCw,
  Loader2,
  ExternalLink,
  Compass,
  Check,
  Search,
  Crosshair,
  X
} from "lucide-react";

export default function DriverTripMobilePage() {
  const params = useParams();

  // Robust Trip ID resolution (Next.js route params + window.location.pathname fallback)
  const [resolvedTripId, setResolvedTripId] = useState<number | null>(() => {
    if (params?.id) {
      const p = Number(params.id);
      if (!isNaN(p) && p > 0) return p;
    }
    if (typeof window !== "undefined") {
      const match = window.location.pathname.match(/\/driver\/trip\/(\d+)/);
      if (match && match[1]) {
        const p = Number(match[1]);
        if (!isNaN(p) && p > 0) return p;
      }
    }
    return null;
  });

  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live GPS Tracking State on this phone
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [currentAccuracy, setCurrentAccuracy] = useState<number | null>(null);
  const [lastPingTime, setLastPingTime] = useState<string | null>(null);
  const [pingCount, setPingCount] = useState<number>(0);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [currentAddressName, setCurrentAddressName] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isPingingNow, setIsPingingNow] = useState(false);
  const [completingTrip, setCompletingTrip] = useState(false);
  
  // Live Demo Highway Driving Simulation State
  const [isDrivingSim, setIsDrivingSim] = useState(false);
  const simProgressRef = useRef(0.08);
  const simTimerRef = useRef<any>(null);
  const heartbeatTimerRef = useRef<any>(null);

  // Manual / Custom Location Search States (allows driver/tester to set exact neighborhood/locality)
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingLoc, setIsSearchingLoc] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const searchLocation = async (q: string) => {
    if (!q || q.trim().length < 2) return;
    setIsSearchingLoc(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=6&q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn("Location search error:", e);
    } finally {
      setIsSearchingLoc(false);
    }
  };

  const applyCustomLocation = async (lat: number, lng: number, address: string) => {
    setCurrentCoords({ lat, lng });
    setCurrentAddressName(address);
    setIsStreaming(true);
    setShowLocationPicker(false);
    setPermissionError(null);

    // Send immediate ping
    const pos = {
      coords: {
        latitude: lat,
        longitude: lng,
        accuracy: 10,
        speed: 0,
        heading: 0
      }
    } as unknown as GeolocationPosition;
    await sendGpsPing(pos);
  };

  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);

  const getApiBase = () => {
    if (typeof window !== "undefined") {
      // Use local Next.js proxy route on port 3000 to bypass Windows Firewall port 5063 restrictions
      return "/api/proxy";
    }
    return "http://127.0.0.1:5063/api";
  };

  useEffect(() => {
    if (!resolvedTripId) {
      if (params?.id) {
        const p = Number(params.id);
        if (!isNaN(p) && p > 0) setResolvedTripId(p);
      } else if (typeof window !== "undefined") {
        const match = window.location.pathname.match(/\/driver\/trip\/(\d+)/);
        if (match && match[1]) {
          const p = Number(match[1]);
          if (!isNaN(p) && p > 0) setResolvedTripId(p);
        }
      }
    }
  }, [params?.id, resolvedTripId]);

  const loadTripDetails = useCallback(async () => {
    let idToLoad = resolvedTripId;
    if (!idToLoad && typeof window !== "undefined") {
      const match = window.location.pathname.match(/\/driver\/trip\/(\d+)/);
      if (match && match[1]) {
        idToLoad = Number(match[1]);
      }
    }

    if (!idToLoad) {
      setError("Trip ID not detected from URL. Please check your link.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${getApiBase()}/Locations/driver/trip/${idToLoad}`, {
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) {
        throw new Error(`Trip #${idToLoad} not found or inactive.`);
      }
      const data = await res.json();
      setTrip(data);
    } catch (err: any) {
      setError(err?.name === "AbortError" ? "Connection timed out. Please tap 'Try Again'." : (err?.message || "Failed to load trip details."));
    } finally {
      setLoading(false);
    }
  }, [resolvedTripId]);

  useEffect(() => {
    loadTripDetails();
  }, [loadTripDetails]);

  // Screen WakeLock to prevent mobile browser from sleeping during tracking
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch (e) {
      console.log("WakeLock not supported or denied.");
    }
  };

  // Send GPS coordinate payload to TMS backend
  const sendGpsPing = async (pos: GeolocationPosition) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const speed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0;
    const accuracy = Math.round(pos.coords.accuracy);

    setCurrentCoords({ lat, lng });
    setCurrentSpeed(speed);
    setCurrentAccuracy(accuracy);
    setLastPingTime(new Date().toLocaleTimeString());
    setPingCount((prev) => prev + 1);

    // Non-blocking background reverse geocode (NEVER waits or blocks telemetry)
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`, {
      signal: AbortSignal.timeout(2500)
    })
      .then((r) => r.json())
      .then((geoData) => {
        const parts = geoData.display_name?.split(",") || [];
        const addr = parts.slice(0, 3).join(", ").trim();
        if (addr) setCurrentAddressName(addr);
      })
      .catch(() => {});

    try {
      // 1. Ensure trip status is In_Transit on backend
      fetch(`${getApiBase()}/Locations/driver/start/${resolvedTripId}`, { method: "POST" }).catch(() => {});

      // 2. Transmit coordinates ping
      await fetch(`${getApiBase()}/Locations/ping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: Number(resolvedTripId),
          latitude: lat,
          longitude: lng,
          accuracy: accuracy,
          speed: speed,
          address: currentAddressName || (trip?.sourceCity ? `Near ${trip.sourceCity}` : undefined),
          source: "MOBILE_GPS",
          provider: "MOBILE",
          deviceId: "PHONE-" + (typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 20) : "BROWSER"),
          recordedAt: new Date().toISOString()
        })
      });

      // Update trip state to In_Transit locally
      setTrip((prev: any) => prev ? { ...prev, status: "In_Transit" } : prev);
    } catch (err) {
      console.warn("Telemetry transmission notice:", err);
    }
  };

  // Start Live Streaming GPS from this Phone
  const startLiveStreaming = useCallback(() => {
    // Proactively call start trip endpoint
    if (resolvedTripId) {
      fetch(`${getApiBase()}/Locations/driver/start/${resolvedTripId}`, { method: "POST" }).catch(() => {});
    }

    if (!navigator.geolocation) {
      alert("GPS Geolocation is not supported by your phone browser.");
      return;
    }

    setPermissionError(null);
    requestWakeLock();

    // 1. Initial Immediate GPS ping
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsStreaming(true);
        sendGpsPing(pos);
      },
      (err) => {
        console.warn("Initial GPS warning:", err);
        const isInsecureHttp = typeof window !== "undefined" && window.location.protocol === "http:" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
        
        if (err.code === err.PERMISSION_DENIED) {
          if (isInsecureHttp) {
            setPermissionError("Mobile Chrome restricts hardware GPS over plain HTTP (LAN IP). Tap 'Broadcast Location Now' below to stream live, or enable the Chrome flag in 10 seconds.");
          } else {
            setPermissionError("Location permission denied. Please allow location access in your mobile browser settings to enable live tracking.");
          }
        } else {
          setPermissionError(`GPS signal acquiring: ${err.message || "Position unavailable"}. You can tap 'Broadcast Location Now' below.`);
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );

    // 2. Continuous GPS tracking watcher
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setIsStreaming(true);
        sendGpsPing(pos);
      },
      (err) => {
        console.warn("GPS stream warning:", err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 4000,
        timeout: 15000
      }
    );

    watchIdRef.current = id;
  }, [resolvedTripId, trip]);

  // Network/IP Location Fallback (Works seamlessly when mobile browser blocks hardware GPS over plain HTTP)
  const handleFallbackNetworkLocation = async () => {
    setIsPingingNow(true);
    setPermissionError(null);

    // Proactively notify backend trip has started
    if (resolvedTripId) {
      fetch(`${getApiBase()}/Locations/driver/start/${resolvedTripId}`, { method: "POST" }).catch(() => {});
    }

    try {
      // 1. Try ipapi.co
      let lat = 0;
      let lng = 0;
      try {
        const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) });
        const geo = await res.json();
        if (geo.latitude && geo.longitude) {
          lat = geo.latitude;
          lng = geo.longitude;
        }
      } catch {
        // 2. Try ipwho.is as backup
        try {
          const res2 = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(4000) });
          const geo2 = await res2.json();
          if (geo2.latitude && geo2.longitude) {
            lat = geo2.latitude;
            lng = geo2.longitude;
          }
        } catch {}
      }

      if (!lat || !lng) {
        // Fallback to origin or Bangalore coordinate
        lat = 12.9141; // Mangalore / Bangalore region
        lng = 74.8560;
      }

      setIsStreaming(true);
      const mockPos = {
        coords: {
          latitude: lat,
          longitude: lng,
          accuracy: 150,
          speed: 0,
          heading: 0
        }
      } as unknown as GeolocationPosition;
      await sendGpsPing(mockPos);
    } catch {
      setIsStreaming(true);
    } finally {
      setIsPingingNow(false);
    }
  };

  // Force single manual GPS ping
  const handleManualPing = () => {
    if (!navigator.geolocation) return;
    setIsPingingNow(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sendGpsPing(pos);
        setIsPingingNow(false);
      },
      (err) => {
        alert("GPS Error: " + err.message);
        setIsPingingNow(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handler: Driver clicks 'ARRIVED / COMPLETE TRIP'
  const handleCompleteTrip = async () => {
    if (!confirm("Are you sure you have arrived at the destination and want to complete this trip?")) return;

    setCompletingTrip(true);
    try {
      const res = await fetch(`${getApiBase()}/Locations/driver/complete/${resolvedTripId}`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Could not complete trip.");

      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      setIsStreaming(false);
      setTrip((prev: any) => ({ ...prev, status: "Completed" }));
    } catch (e: any) {
      alert(e?.message || "Failed to complete trip.");
    } finally {
      setCompletingTrip(false);
    }
  };

  // Toggle Live Driving Simulation along Highway Corridor (Ideal for indoor client demos)
  const toggleDriveSimulation = useCallback(() => {
    if (isDrivingSim) {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      setIsDrivingSim(false);
      setCurrentSpeed(0);
      return;
    }

    if (!trip) return;
    setIsDrivingSim(true);
    setIsStreaming(true);
    setPermissionError(null);

    // Notify backend trip has started
    if (resolvedTripId) {
      fetch(`${getApiBase()}/Locations/driver/start/${resolvedTripId}`, { method: "POST" }).catch(() => {});
    }

    const srcLat = trip.srcLat || 12.9716;
    const srcLng = trip.srcLng || 77.5946;
    const destLat = trip.destLat || 19.0760;
    const destLng = trip.destLng || 72.8777;

    const stepSimulation = async () => {
      simProgressRef.current += 0.012; // Advance along corridor
      if (simProgressRef.current > 0.96) {
        simProgressRef.current = 0.08; // Loop for continuous demo
      }

      const progress = simProgressRef.current;
      // Add subtle highway curvature jitter
      const jitterLat = Math.sin(progress * Math.PI * 4) * 0.008;
      const jitterLng = Math.cos(progress * Math.PI * 4) * 0.008;

      const lat = Math.round((srcLat + progress * (destLat - srcLat) + jitterLat) * 1000000) / 1000000;
      const lng = Math.round((srcLng + progress * (destLng - srcLng) + jitterLng) * 1000000) / 1000000;
      const speed = Math.floor(48 + Math.random() * 16); // 48 - 64 km/h
      const percentInt = Math.round(progress * 100);

      const simPos = {
        coords: {
          latitude: lat,
          longitude: lng,
          accuracy: 8,
          speed: speed / 3.6,
          heading: 45
        }
      } as unknown as GeolocationPosition;

      setCurrentAddressName(`NH Highway Corridor (${percentInt}% towards ${trip.destCity})`);
      await sendGpsPing(simPos);
    };

    // Immediate initial step
    stepSimulation();
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    simTimerRef.current = setInterval(stepSimulation, 3500);
  }, [isDrivingSim, trip, resolvedTripId]);

  // Telemetry Heartbeat: keeps admin map marked 'LIVE' even while stationary
  useEffect(() => {
    if (isStreaming && !isDrivingSim) {
      heartbeatTimerRef.current = setInterval(() => {
        if (currentCoords) {
          const pos = {
            coords: {
              latitude: currentCoords.lat,
              longitude: currentCoords.lng,
              accuracy: currentAccuracy || 10,
              speed: 0,
              heading: 0
            }
          } as unknown as GeolocationPosition;
          sendGpsPing(pos);
        }
      }, 5000);
    } else {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    }
    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [isStreaming, isDrivingSim, currentCoords, currentAccuracy]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-2" />
        <p className="text-sm font-semibold text-slate-300">Connecting to Trip Console...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
        <h2 className="text-lg font-bold text-white mb-1">Trip Not Found</h2>
        <p className="text-xs text-slate-400 max-w-xs mb-4">{error || "Please verify your trip link."}</p>
        <button
          onClick={loadTripDetails}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans pb-10">
      
      {/* Mobile App Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-sm text-white shadow-md">
            TF
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white leading-tight">TransitFlow Driver</h1>
            <span className="text-[10px] text-slate-400 block font-medium">GPS Telemetry Console</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
          <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`}></span>
          <span className="text-[10px] font-bold text-slate-300">
            {isStreaming ? "GPS BROADCASTING" : "STANDBY"}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        
        {/* Trip Overview Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Assigned Trip</span>
              <span className="text-lg font-black text-white">TRIP #{trip.tripId}</span>
            </div>
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
              trip.status === 'Completed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
              trip.status === 'In_Transit' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
              'bg-amber-950 text-amber-300 border border-amber-800'
            }`}>
              ● {trip.status.replace('_', ' ')}
            </span>
          </div>

          {/* Vehicle & Driver Info */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
              <span className="text-[10px] text-slate-400 block flex items-center gap-1 mb-0.5">
                <Truck className="w-3 h-3 text-blue-400" /> Vehicle
              </span>
              <strong className="text-white font-bold">{trip.vehicleNumber}</strong>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
              <span className="text-[10px] text-slate-400 block flex items-center gap-1 mb-0.5">
                <Phone className="w-3 h-3 text-emerald-400" /> Driver
              </span>
              <strong className="text-white font-bold truncate block">{trip.driverName}</strong>
            </div>
          </div>

          {/* Route Visualizer */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex-1">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Origin</span>
              <strong className="text-sm font-bold text-white flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {trip.sourceCity}
              </strong>
            </div>
            <div className="px-3 text-slate-500 font-bold text-xs">➔</div>
            <div className="flex-1 text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Destination</span>
              <strong className="text-sm font-bold text-white flex items-center justify-end gap-1">
                {trip.destCity} <MapPin className="w-3.5 h-3.5 text-red-400" />
              </strong>
            </div>
          </div>

          {trip.material && (
            <div className="text-[11px] text-slate-400 pt-1">
              Cargo: <strong className="text-slate-200">{trip.material}</strong>
            </div>
          )}
        </div>

        {/* PRIMARY GPS ACTIVATION BUTTON (When not yet streaming) */}
        {!isStreaming && trip.status !== "Completed" && (
          <div className="space-y-3 pt-1">
            <button
              onClick={startLiveStreaming}
              className="w-full py-4 px-4 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-base rounded-2xl shadow-xl shadow-emerald-950/70 border border-emerald-400/40 transition flex flex-col items-center justify-center gap-1 active:scale-95 animate-pulse"
            >
              <div className="flex items-center gap-2 text-base">
                <Play className="w-5 h-5 fill-current" />
                <span>START TRIP & SHARE SATELLITE GPS</span>
              </div>
              <span className="text-[11px] font-medium text-emerald-100 opacity-90">
                Uses your phone's built-in GPS sensor
              </span>
            </button>

            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
                setShowLocationPicker(true);
              }}
              className="w-full py-3 px-4 bg-blue-950/60 hover:bg-blue-900/70 text-blue-200 font-bold text-xs rounded-xl border border-blue-700/60 transition flex items-center justify-center gap-2 shadow"
            >
              <Search className="w-4 h-4 text-blue-400" />
              <span>📍 Search & Set My Exact Locality (Avalahalli, etc.)</span>
            </button>

            <button
              onClick={handleFallbackNetworkLocation}
              disabled={isPingingNow}
              className="w-full py-2.5 px-4 bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 shadow"
            >
              {isPingingNow ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> : <MapPin className="w-4 h-4 text-blue-400" />}
              <span>Cellular Network / Wi-Fi IP Broadcast</span>
            </button>

            {permissionError && (
              <div className="p-4 bg-amber-950/80 border border-amber-800 rounded-2xl text-amber-200 text-xs space-y-3 shadow-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <span className="leading-relaxed">{permissionError}</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                      setShowLocationPicker(true);
                    }}
                    className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Set Exact Locality
                  </button>
                  <button
                    onClick={startLiveStreaming}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
                  >
                    Retry GPS
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ACTIVE LIVE GPS TELEMETRY DASHBOARD (When streaming) */}
        {isStreaming && (
          <div className="bg-gradient-to-br from-blue-950/60 to-slate-900 border border-blue-800/80 rounded-2xl p-4 shadow-xl space-y-3.5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-blue-900/60 pb-2.5">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-300">Live Phone GPS Broadcasting</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{pingCount} pings sent</span>
            </div>

            {/* Current Real Locality Detected */}
            <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-bounce" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Detected Location</span>
                  <strong className="text-xs text-white block truncate">
                    {currentAddressName || "Reading your phone's real locality..."}
                  </strong>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                {currentCoords && (
                  <div className="font-mono text-[11px] text-blue-400 pl-6">
                    {currentCoords.lat.toFixed(6)}° N, {currentCoords.lng.toFixed(6)}° E
                  </div>
                )}
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowLocationPicker(true);
                  }}
                  className="text-[10px] font-bold text-blue-400 hover:text-blue-300 underline flex items-center gap-1 ml-auto"
                >
                  <MapPin className="w-3 h-3" /> Change Location
                </button>
              </div>
            </div>

            {/* Speedometer & Precision Meters */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
                <Gauge className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Speed</span>
                <span className="text-2xl font-black text-white">{currentSpeed}</span>
                <span className="text-[10px] text-slate-400 font-medium ml-1">km/h</span>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">GPS Precision</span>
                <span className="text-2xl font-black text-emerald-400">
                  {currentAccuracy !== null ? `±${currentAccuracy}` : "±8"}
                </span>
                <span className="text-[10px] text-slate-400 font-medium ml-1">meters</span>
              </div>
            </div>

            {/* Demo Live Driving Simulation Toggle */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Navigation className="w-3.5 h-3.5 text-blue-400" />
                  <span>Highway Drive Simulation (Demo Mode)</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isDrivingSim ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isDrivingSim ? 'Active' : 'Off'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Moves your truck along the actual highway route at ~55 km/h for client presentations.
              </p>
              <button
                onClick={toggleDriveSimulation}
                className={`w-full py-2 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
                  isDrivingSim 
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow'
                }`}
              >
                {isDrivingSim ? "🛑 Pause Route Simulation" : "🚗 Simulate Live Highway Driving"}
              </button>
            </div>

            {/* Instant Ping & Ping Status */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Last ping: <strong className="text-slate-200">{lastPingTime || "Just now"}</strong>
              </span>

              <button
                onClick={handleManualPing}
                disabled={isPingingNow}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 font-semibold rounded-lg text-xs flex items-center gap-1 border border-slate-700 transition"
              >
                <RefreshCw className={`w-3 h-3 ${isPingingNow ? 'animate-spin text-blue-400' : ''}`} />
                Send Ping Now
              </button>
            </div>

            <p className="text-[11px] text-slate-400 text-center pt-1 border-t border-slate-800/80">
              💡 Keep this tab open while driving. Your dispatcher sees your truck on the map in real time.
            </p>
          </div>
        )}

        {/* ARRIVED / END TRIP BUTTON */}
        {trip.status === "In_Transit" && (
          <div className="pt-2">
            <button
              onClick={handleCompleteTrip}
              disabled={completingTrip}
              className="w-full py-3.5 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-red-950/50 transition flex items-center justify-center gap-2 active:scale-98"
            >
              {completingTrip ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              ARRIVED AT DESTINATION (END TRIP)
            </button>
          </div>
        )}

        {trip.status === "Completed" && (
          <div className="bg-emerald-950/40 border border-emerald-800/60 p-5 rounded-2xl text-center space-y-2">
            <Check className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-black text-white">Trip Completed Successfully</h3>
            <p className="text-xs text-emerald-300">
              Thank you for driving safely! GPS broadcasting has ended.
            </p>
          </div>
        )}

        {/* Dynamic Location Picker / Search Modal */}
        {showLocationPicker && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="text-sm font-black text-white">Pin Your Exact Location</h3>
                    <p className="text-[11px] text-slate-400">Search any neighborhood, hub, or address across India</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLocationPicker(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Form */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") searchLocation(searchQuery); }}
                    placeholder="e.g. Avalahalli, Whitefield, Electronic City..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={() => searchLocation(searchQuery)}
                  disabled={isSearchingLoc}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0"
                >
                  {isSearchingLoc ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                </button>
              </div>

              {/* Quick Suggestions */}
              <div className="flex flex-wrap gap-1.5">
                {["Avalahalli, Bengaluru", "Whitefield", "Electronic City", "Peenya", "Hosur"].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setSearchQuery(preset);
                      searchLocation(preset);
                    }}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 transition"
                  >
                    + {preset}
                  </button>
                ))}
              </div>

              {/* Search Results List */}
              <div className="flex-1 overflow-y-auto space-y-2 max-h-60 pt-1">
                {searchResults.length > 0 ? (
                  searchResults.map((res: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => applyCustomLocation(parseFloat(res.lat), parseFloat(res.lon), res.display_name.split(",").slice(0, 3).join(", "))}
                      className="w-full text-left p-3 bg-slate-950/80 hover:bg-blue-950/50 border border-slate-800 hover:border-blue-700 rounded-xl transition space-y-0.5 group"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-blue-300">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{res.display_name.split(",")[0]}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate pl-5">
                        {res.display_name}
                      </p>
                    </button>
                  ))
                ) : isSearchingLoc ? (
                  <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    Searching OpenStreetMap...
                  </div>
                ) : searchQuery.length >= 2 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No matching places found. Try another spelling or city.
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500">
                    Type your neighborhood or town above to pin it immediately.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
