"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { fetchApi } from "@/lib/api";
import { 
  Loader2, 
  Truck, 
  MapPin, 
  Clock, 
  Navigation, 
  Radio, 
  Smartphone, 
  RefreshCw, 
  ExternalLink, 
  Share2, 
  Copy, 
  Check, 
  ArrowLeft,
  ShieldCheck,
  Gauge,
  Phone,
  MessageSquare
} from "lucide-react";
import { Panel } from "@/components/PrototypeUI";

const FleetMap = dynamic(() => import('@/components/FleetMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[480px] flex flex-col items-center justify-center bg-slate-900 text-white gap-2">
      <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      <span className="text-xs text-slate-400">Loading satellite map...</span>
    </div>
  )
});

export default function TripTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const tripIdStr = params?.id as string;
  const tripId = parseInt(tripIdStr, 10);

  const [trip, setTrip] = useState<any>(null);
  const [vehicleTelemetry, setVehicleTelemetry] = useState<any>(null);
  const [trailHistory, setTrailHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [pollingSim, setPollingSim] = useState(false);

  const getDriverTrackingUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/driver/trip/${tripId}`;
    }
    return `/driver/trip/${tripId}`;
  };

  const loadTripData = useCallback(async () => {
    if (!tripId || isNaN(tripId)) return;
    try {
      const [tripData, liveFleet, historyData] = await Promise.all([
        fetchApi(`/Trips/${tripId}`).catch(() => null),
        fetchApi(`/Locations/live`).catch(() => []),
        fetchApi(`/Locations/trip/${tripId}/history`).catch(() => [])
      ]);

      setTrip(tripData);

      if (Array.isArray(liveFleet)) {
        const found = liveFleet.find((v: any) => v.tripId === tripId);
        if (found) {
          setVehicleTelemetry(found);
        } else if (tripData) {
          // Construct fallback telemetry from trip's origin
          setVehicleTelemetry({
            id: `V-${tripData.vehicleId || 0}`,
            tripId: tripData.id,
            vehicleId: tripData.vehicleId || 0,
            num: tripData.vehicle?.vehicleNumber || "Assigned Vehicle",
            driver: tripData.driver?.name || "Driver",
            driverPhone: tripData.driver?.phone,
            source: tripData.indent?.source || "Origin",
            srcLat: 12.9716,
            srcLng: 77.5946,
            dest: tripData.indent?.destination || "Destination",
            destLat: 19.0760,
            destLng: 72.8777,
            currentLat: 12.9716,
            currentLng: 77.5946,
            accuracy: 15,
            speed: 0,
            status: tripData.status,
            trackingType: tripData.driver?.trackingType || "MOBILE_GPS",
            trackingProvider: tripData.driver?.trackingProvider || "MOBILE",
            trackingStatus: tripData.status === "Assigned" ? "ASSIGNED" : "OFFLINE",
            currentAddress: `Awaiting Driver Start at ${tripData.indent?.source || "Origin"}`,
            lastPingAgo: "Awaiting Start"
          });
        }
      }

      if (Array.isArray(historyData)) {
        setTrailHistory(historyData);
      }
    } catch (e) {
      console.error("Failed to load trip telemetry:", e);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadTripData();
    // Refresh live telemetry every 10 seconds
    const interval = setInterval(loadTripData, 10000);
    return () => clearInterval(interval);
  }, [loadTripData]);

  const handleCopyDriverLink = () => {
    const url = getDriverTrackingUrl();
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePollSimTower = async () => {
    setPollingSim(true);
    try {
      await fetchApi(`/Locations/sim/ping/${tripId}`, { method: 'POST' });
      await loadTripData();
    } catch (e: any) {
      alert(e?.message || "SIM query processed");
    } finally {
      setPollingSim(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-sm font-semibold">Connecting to Live Vehicle GPS Stream...</span>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="text-red-500 font-bold text-lg">Trip #{tripIdStr} Not Found</div>
        <Link href="/trips" className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Trips
        </Link>
      </div>
    );
  }

  const isSim = vehicleTelemetry?.trackingType === "SIM_TRACKING";
  const driverLink = getDriverTrackingUrl();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/trips" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <span>TRP-{trip.id} Live Fleet Radar</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                trip.status === "In_Transit" || trip.status === "Started" ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                trip.status === "Delivered" || trip.status === "Completed" ? "bg-blue-100 text-blue-800 border border-blue-300" :
                "bg-purple-100 text-purple-800 border border-purple-300"
              }`}>
                ● {trip.status}
              </span>
            </h1>
          </div>
          <p className="text-slate-500 text-xs mt-1 pl-8">
            Vehicle <strong className="text-slate-800">{trip.vehicle?.vehicleNumber || "Assigned Vehicle"}</strong> • Driver <strong className="text-slate-800">{trip.driver?.name || "Assigned Driver"}</strong> ({trip.driver?.phone || "No phone"})
          </p>
        </div>

        {/* Quick Driver Link / Sharing Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyDriverLink}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-300"
            title="Copy driver tracking link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Link Copied!" : "Copy Driver Link"}</span>
          </button>

          <a
            href={driverLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Driver Phone Console</span>
          </a>

          {trip.driver?.phone && (
            <a
              href={`https://wa.me/${trip.driver.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`🚛 *TransitFlow · Live Location Link*\n\nHello *${trip.driver.name}*,\nPlease open this link on your smartphone to start the trip and share live GPS location with fleet dispatch:\n👉 ${driverLink}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-current" />
              <span>WhatsApp Driver</span>
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* The Live Interactive Map */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-800 h-[520px] relative">
            {vehicleTelemetry && (
              <FleetMap 
                activeVehicle={vehicleTelemetry}
                fleet={[vehicleTelemetry]}
                trailHistory={trailHistory}
                autoFollow={true}
                recenterTrigger={0}
              />
            )}

            {/* Map Top-Right Status Badge */}
            <div className="absolute top-4 right-4 z-[999] bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 text-white flex items-center gap-2 shadow-lg">
              <span className={`w-2.5 h-2.5 rounded-full ${
                vehicleTelemetry?.trackingStatus === "LIVE" ? "bg-emerald-400 animate-ping" : "bg-purple-400"
              }`} />
              <div className="text-xs font-bold">
                {isSim ? "🟢 SIM Cell Tower Tracking" : "🔵 Mobile Phone GPS Stream"}
              </div>
            </div>
          </div>

          {/* Telemetry Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="text-[11px] text-slate-400 font-bold uppercase block">Current Speed</span>
              <span className="text-xl font-black text-blue-600">{vehicleTelemetry?.speed || 0}</span>
              <span className="text-xs text-slate-500 font-medium ml-1">km/h</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="text-[11px] text-slate-400 font-bold uppercase block">GPS Precision</span>
              <span className="text-xl font-black text-emerald-600">±{vehicleTelemetry?.accuracy || (isSim ? 500 : 8)}</span>
              <span className="text-xs text-slate-500 font-medium ml-1">m</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="text-[11px] text-slate-400 font-bold uppercase block">Breadcrumbs</span>
              <span className="text-xl font-black text-slate-800">{trailHistory.length}</span>
              <span className="text-xs text-slate-500 font-medium ml-1">points</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="text-[11px] text-slate-400 font-bold uppercase block">Last Updated</span>
              <span className="text-xs font-bold text-slate-800 block mt-1">{vehicleTelemetry?.lastPingAgo || "Just now"}</span>
            </div>
          </div>
        </div>

        {/* Right Info Sidebar */}
        <div className="space-y-4">
          
          {/* Driver & Trip Assignment Card */}
          <Panel title="Trip & Driver Details" className="shadow-sm border-slate-200">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Route Corridor</span>
                <span className="font-bold text-slate-800">{trip.indent?.source} ➔ {trip.indent?.destination}</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Vehicle Assigned</span>
                <span className="font-mono font-bold text-slate-900">{trip.vehicle?.vehicleNumber || "—"}</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Driver</span>
                <span className="font-bold text-slate-800">{trip.driver?.name || "—"}</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Driver Mobile</span>
                <span className="font-bold text-slate-800 font-mono">{trip.driver?.phone || "—"}</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Tracking Technology</span>
                <span className="font-bold text-blue-600">
                  {isSim ? "Keypad Phone SIM (Cell-ID)" : "Smartphone GPS (Satellite)"}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500 font-medium">Estimated Arrival</span>
                <span className="font-bold text-emerald-600">{vehicleTelemetry?.eta || "Calculating..."}</span>
              </div>
            </div>
          </Panel>

          {/* SIM & GPS Quick Actions */}
          <Panel title="Real-Time Telemetry Controls" className="shadow-sm border-slate-200">
            <div className="space-y-2.5 text-xs">
              {isSim ? (
                <button
                  onClick={handlePollSimTower}
                  disabled={pollingSim}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow"
                >
                  {pollingSim ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
                  <span>Poll Dotmove SIM Cell Tower Now</span>
                </button>
              ) : (
                <a
                  href={driverLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow text-center"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Open Driver Location Broadcast</span>
                </a>
              )}

              <Link
                href="/map"
                className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition flex items-center justify-center gap-2 text-center"
              >
                <Navigation className="w-4 h-4 text-blue-600" />
                <span>Open Full Fleet Map (All Vehicles)</span>
              </Link>
            </div>
          </Panel>

          {/* Driver Magic Link Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2 text-xs text-blue-900">
            <div className="flex items-center gap-2 font-bold text-blue-950">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Driver Live Link Explained</span>
            </div>
            <p className="text-[11.5px] text-blue-800 leading-relaxed">
              When the driver opens the link on their smartphone and taps <strong>START TRIP & SHARE SATELLITE GPS</strong>, their phone browser automatically transmits live coordinates to this screen every 3-5 seconds.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
