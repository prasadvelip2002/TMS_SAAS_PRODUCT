"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  Truck, 
  MapPin, 
  Clock, 
  Navigation, 
  Phone, 
  Share2, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw, 
  ChevronRight, 
  Package, 
  Headphones, 
  MessageSquare,
  ArrowRight,
  Gauge,
  Calendar,
  CheckCircle2,
  ExternalLink
} from "lucide-react";

// Dynamically import CustomerMap to prevent SSR Leaflet window errors
const CustomerMap = dynamic(() => import("@/components/CustomerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
      <div className="relative w-12 h-12">
        <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin"></div>
        <Truck className="w-5 h-5 text-blue-400 absolute inset-0 m-auto" />
      </div>
      <p className="text-xs font-semibold tracking-wide">Initializing Satellite Telemetry Map...</p>
    </div>
  )
});

interface CustomerTrackingData {
  shareToken: string;
  tripId: number;
  vehicleNumber: string;
  vehicleType: string;
  driverName: string;
  driverPhone: string;
  supportHotline: string;
  sourceCity: string;
  srcLat: number;
  srcLng: number;
  destCity: string;
  destLat: number;
  destLng: number;
  currentLat: number;
  currentLng: number;
  speed: number;
  heading: number;
  trackingStatus: string;
  currentAddress: string;
  lastPingAgo: string;
  lastPingTime: string;
  status: string;
  eta: string;
  distanceRemainingKm: number;
  distanceTraveledKm: number;
  totalRouteDistanceKm: number;
  progressPercent: number;
  lrNumber: string;
  ewayBillNumber: string | null;
  material: string;
  weight: number;
  customerName: string;
  currentMilestone: 'ORIGIN_HUB' | 'IN_TRANSIT' | 'APPROACHING_DEST' | 'DEST_DOCK';
  currentMilestoneTitle: string;
  currentMilestoneDescription: string;
  isInsideOriginGeofence: boolean;
  isInsideDestGeofence: boolean;
  loadingTatMinutes: number;
  loadingTatFormatted: string;
  dispatchedAt: string;
  estimatedDeliveryAt: string;
}

export default function CustomerTrackingPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<CustomerTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTracking = async (isBackground = false) => {
    if (!token) return;
    if (!isBackground) setIsRefreshing(true);
    try {
      const apiUrl = `/api/proxy/Locations/track/${encodeURIComponent(token)}`;
      const res = await fetch(apiUrl, { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Invalid tracking link or shipment not found.");
        }
        throw new Error(`Tracking service returned status: ${res.status}`);
      }
      const json: CustomerTrackingData = await res.json();
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      if (!isBackground) {
        setError(err.message || "Failed to load live tracking details.");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTracking(false);

    // Live auto-polling every 4 seconds
    pollingRef.current = setInterval(() => {
      fetchTracking(true);
    }, 4000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [token]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    if (!data) return;
    const trackingUrl = typeof window !== "undefined" ? window.location.href : "";
    const text = `🚚 *Live Consignment Tracking - LogiPulse*\n\n` +
      `*LR No:* ${data.lrNumber || `Trip #${data.tripId}`}\n` +
      `*Route:* ${data.sourceCity} ➔ ${data.destCity}\n` +
      `*Vehicle:* ${data.vehicleNumber} (${data.vehicleType})\n` +
      `*Live ETA:* ${data.eta}\n` +
      `*Driver:* ${data.driverName}\n\n` +
      `📍 Track live location & route on the map:\n👉 ${trackingUrl}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center animate-pulse">
            <Truck className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <h2 className="text-lg font-bold">Connecting to Live Consignment Telemetry...</h2>
        <p className="text-xs text-slate-400 mt-1">Establishing high-speed satellite GPS link</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-4 text-rose-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Tracking Link Expired or Unavailable</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          {error || "We could not find active satellite telemetry for this tracking link. Please contact the logistics support desk or your dispatcher for an updated link."}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => fetchTracking(false)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
          </button>
          <a
            href="tel:+918000012345"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-2"
          >
            <Phone className="w-3.5 h-3.5" /> Call Support
          </a>
        </div>
      </div>
    );
  }

  const milestones = [
    {
      id: 'ORIGIN_HUB',
      title: 'Dispatched',
      location: data.sourceCity,
      completed: true,
      active: data.currentMilestone === 'ORIGIN_HUB',
      timestamp: data.dispatchedAt ? new Date(data.dispatchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Gate Out'
    },
    {
      id: 'IN_TRANSIT',
      title: 'In Highway Transit',
      location: 'National Highway Corridor',
      completed: data.currentMilestone !== 'ORIGIN_HUB',
      active: data.currentMilestone === 'IN_TRANSIT',
      timestamp: data.speed > 0 ? `${Math.round(data.speed)} km/h` : 'Moving'
    },
    {
      id: 'APPROACHING_DEST',
      title: 'Arrival Prep',
      location: 'Within 15 km Hub Buffer',
      completed: data.currentMilestone === 'DEST_DOCK',
      active: data.currentMilestone === 'APPROACHING_DEST',
      timestamp: 'Approaching'
    },
    {
      id: 'DEST_DOCK',
      title: 'Consignee Dock',
      location: data.destCity,
      completed: data.isInsideDestGeofence,
      active: data.currentMilestone === 'DEST_DOCK',
      timestamp: data.isInsideDestGeofence ? 'Arrived' : 'ETA Dock'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      
      {/* 1. TOP BRANDED NAVIGATION BAR */}
      <header className="h-14 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Truck className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-white">LogiPulse Live Tracking</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" /> Verified Consignment
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium flex items-center gap-2">
              <span>LR: <strong className="text-slate-200">{data.lrNumber || `TRK-${data.tripId}`}</strong></span>
              {data.customerName && (
                <>
                  <span className="text-slate-600">•</span>
                  <span>Consignee: <strong className="text-slate-200">{data.customerName}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Ping Beacon */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-medium text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Telemetry</span>
          </div>

          {/* WhatsApp Share Button */}
          <button
            onClick={handleShareWhatsApp}
            className="p-2 sm:px-3 sm:py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-green-600/30"
            title="Share via WhatsApp"
          >
            <MessageSquare className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          {/* Copy Tracking URL */}
          <button
            onClick={handleCopyLink}
            className="p-2 sm:px-3 sm:py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            title="Copy Public Tracking Link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? "Link Copied" : "Copy Link"}</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN INTERACTIVE LAYOUT (Split Screen Desktop, Stacked Mobile) */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* LEFT / TOP CONSIGNMENT CONTROL SHEET */}
        <div className="w-full lg:w-[460px] xl:w-[500px] flex flex-col bg-slate-900/95 lg:border-r border-slate-800/80 z-20 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* Hero ETA Card */}
          <div className="p-4 sm:p-5 bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-900 border-b border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Estimated Delivery Time
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {data.trackingStatus} • {data.lastPingAgo}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {data.eta}
                </h1>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  {data.distanceRemainingKm > 0 
                    ? `${data.distanceRemainingKm.toFixed(1)} km remaining to ${data.destCity}`
                    : `Consignment arrived at ${data.destCity}`}
                </p>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Speed</div>
                <div className="text-xl font-black text-emerald-400 font-mono">
                  {Math.round(data.speed)} <span className="text-xs text-slate-400">km/h</span>
                </div>
              </div>
            </div>

            {/* Traveled Progress Bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" /> {data.sourceCity}
                </span>
                <span className="text-blue-400">{data.progressPercent}% Completed</span>
                <span className="text-slate-300 flex items-center gap-1">
                  {data.destCity} <MapPin className="w-3 h-3 text-violet-400" />
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 rounded-full transition-all duration-700 ease-out shadow-sm"
                  style={{ width: `${Math.min(100, Math.max(5, data.progressPercent))}%` }}
                />
              </div>
            </div>
          </div>

          {/* 4-Stage Live Milestone Stepper */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-blue-400" /> Consignment Journey Milestones
            </h3>

            <div className="relative pl-6 space-y-5 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {milestones.map((m, idx) => {
                const isCurrent = m.active;
                const isPassed = m.completed && !m.active;

                return (
                  <div key={m.id} className="relative flex items-start justify-between group">
                    {/* Stepper Dot */}
                    <div className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCurrent 
                        ? 'bg-blue-600 border-white shadow-md shadow-blue-500/50 scale-110' 
                        : isPassed 
                          ? 'bg-emerald-600 border-emerald-400 text-white' 
                          : 'bg-slate-900 border-slate-700 text-slate-500'
                    }`}>
                      {isPassed ? (
                        <Check className="w-3 h-3 stroke-[3]" />
                      ) : isCurrent ? (
                        <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                      )}
                    </div>

                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black tracking-wide ${
                          isCurrent ? 'text-blue-400' : isPassed ? 'text-white' : 'text-slate-400'
                        }`}>
                          {m.title}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Current Stage
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{m.location}</p>
                    </div>

                    <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                      {m.timestamp}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Real-time Address */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/40">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-blue-400 animate-bounce" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Live Satellite Position
                </span>
                <p className="text-xs font-bold text-slate-200 leading-snug mt-0.5">
                  {data.currentAddress || `${data.sourceCity} to ${data.destCity} Highway Expressway Corridor`}
                </p>
                <div className="text-[10px] font-mono text-slate-500 mt-1">
                  GPS: {data.currentLat?.toFixed(4)}° N, {data.currentLng?.toFixed(4)}° E • {data.lastPingAgo}
                </div>
              </div>
            </div>
          </div>

          {/* Shipment & Driver Details */}
          <div className="p-4 sm:p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-blue-400" /> Consignment Specifications
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Vehicle Assigned</span>
                <span className="text-sm font-black text-white block mt-0.5">{data.vehicleNumber}</span>
                <span className="text-[10px] text-slate-400 block">{data.vehicleType || "Commercial Freight"}</span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Material Cargo</span>
                <span className="text-sm font-black text-white block mt-0.5">{data.material || "Industrial Cargo"}</span>
                <span className="text-[10px] text-slate-400 block">{data.weight ? `${data.weight} Metric Tons` : "Standard Payload"}</span>
              </div>
            </div>

            {/* Direct Driver Contact Card */}
            <div className="bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                  {data.driverName ? data.driverName.charAt(0) : "D"}
                </div>
                <div>
                  <div className="text-xs font-black text-white">{data.driverName || "Assigned Driver"}</div>
                  <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> On Duty Pilot
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {data.driverPhone && (
                  <>
                    <a
                      href={`tel:${data.driverPhone}`}
                      className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition shadow-md shadow-emerald-600/20"
                      title="Call Driver"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <a
                      href={`https://wa.me/${data.driverPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Hi ${data.driverName}, checking in regarding consignment LR ${data.lrNumber || `Trip #${data.tripId}`} from ${data.sourceCity} to ${data.destCity}.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl transition shadow-md shadow-green-600/20"
                      title="WhatsApp Driver"
                    >
                      <MessageSquare className="w-4 h-4 fill-current" />
                    </a>
                  </>
                )}
                {data.supportHotline && (
                  <a
                    href={`tel:${data.supportHotline}`}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition"
                    title="Call 24/7 Logistics Support"
                  >
                    <Headphones className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-auto p-4 text-center border-t border-slate-800/80 bg-slate-950/80 text-[10px] text-slate-500">
            Powered by LogiPulse Intelligent Logistics Operating System • Updated every 4s
          </div>
        </div>

        {/* RIGHT / MAIN INTERACTIVE MAP CONTAINER */}
        <div className="flex-1 w-full h-[450px] lg:h-auto min-h-[450px] relative">
          <CustomerMap
            vehicleNumber={data.vehicleNumber}
            driverName={data.driverName}
            driverPhone={data.driverPhone}
            speed={data.speed}
            heading={data.heading}
            currentLat={data.currentLat}
            currentLng={data.currentLng}
            currentAddress={data.currentAddress}
            sourceCity={data.sourceCity}
            srcLat={data.srcLat}
            srcLng={data.srcLng}
            destCity={data.destCity}
            destLat={data.destLat}
            destLng={data.destLng}
            isInsideOriginGeofence={data.isInsideOriginGeofence}
            isInsideDestGeofence={data.isInsideDestGeofence}
          />
        </div>
      </main>
    </div>
  );
}
