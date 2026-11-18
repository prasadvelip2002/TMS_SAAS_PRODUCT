"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
  ArrowRight, 
  Clock, 
  Gauge,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Minimize2,
  Maximize2,
  Sliders,
  Sparkles,
  AlertTriangle,
  Target
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { fetchRoadRoute, calculateHaversineKm } from "@/lib/routing";

function getHeadingCardinal(bearing?: number) {
  if (bearing === undefined || bearing === null) return "N";
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(((bearing %= 360) < 0 ? bearing + 360 : bearing) / 45) % 8;
  return directions[index];
}

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

// Dynamically import the Leaflet Map to avoid SSR issues
const FleetMap = dynamic(() => import('@/components/FleetMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white gap-3">
      <Loader2 className="w-9 h-9 animate-spin text-blue-500" />
      <span className="text-xs font-semibold tracking-wide text-slate-400">Initializing Live Radar Tiles...</span>
    </div>
  )
});

export default function GlobalMapDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | 'ALL'>('ALL');

  const [activeVehicle, setActiveVehicle] = useState<any>(null);
  const [fleet, setFleet] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const [trackingFilter, setTrackingFilter] = useState<'ALL' | 'MOBILE_GPS' | 'SIM_TRACKING' | 'ALERTS'>('ALL');

  // Pincode Proximity Regional Fleet Discovery
  const [pincodeRegion, setPincodeRegion] = useState<{
    pincode: string;
    lat: number;
    lng: number;
    radiusKm: number;
    locality?: string;
  } | null>(null);
  const [pincodeRadius, setPincodeRadius] = useState<number>(50); // Default 50 km coverage
  const [isGeocodingPin, setIsGeocodingPin] = useState<boolean>(false);

  // Sidebar and HUD toggles for an unobstructed map view
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isHudMinimized, setIsHudMinimized] = useState(false);

  // Breadcrumb Trail & Camera Controls
  const [trailHistory, setTrailHistory] = useState<any[]>([]);
  const [autoFollow, setAutoFollow] = useState<boolean>(true);
  const [recenterTrigger, setRecenterTrigger] = useState<number>(0);
  const [copiedCoords, setCopiedCoords] = useState<boolean>(false);

  // Dynamic Highway Road Geometry & Available Trips
  const [activeRouteCoords, setActiveRouteCoords] = useState<[number, number][]>([]);
  const [availableTrips, setAvailableTrips] = useState<any[]>([]);

  // Live Cruise / Route Drive Motion Simulator
  const [isDriveSimulating, setIsDriveSimulating] = useState<boolean>(false);
  const [simProgress, setSimProgress] = useState<number>(0.2); // 0.0 to 1.0 along the route corridor
  const [simSpeedMult, setSimSpeedMult] = useState<number>(1);
  const [showDemoTools, setShowDemoTools] = useState<boolean>(false);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Interactive Live GPS & SIM Testing Simulator Modal
  const [isTesterOpen, setIsTesterOpen] = useState(false);
  const [testTab, setTestTab] = useState<'MOBILE' | 'SIM'>('MOBILE');
  const [simulatingPing, setSimulatingPing] = useState(false);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  // Form State for Mobile GPS testing
  const [testTripId, setTestTripId] = useState<number>(0);
  const [testLat, setTestLat] = useState<number>(0);
  const [testLng, setTestLng] = useState<number>(0);
  const [testSpeed, setTestSpeed] = useState<number>(45);

  const getDriverTrackingUrl = (tripId: number | string, isAbsolute: boolean = false) => {
    if (typeof window !== "undefined") {
      const origin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      return `${origin}/driver/trip/${tripId}`;
    }
    return `/driver/trip/${tripId}`;
  };

  const getCustomerTrackingUrl = (tokenOrTripId: string | number, isAbsolute: boolean = false) => {
    if (typeof window !== "undefined") {
      const origin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      return `${origin}/track/${tokenOrTripId}`;
    }
    return `/track/${tokenOrTripId}`;
  };

  const openSimulatorModal = () => {
    setIsTesterOpen(true);
    fetchApi('/Trips', { forceRefresh: true })
      .then((data) => {
        if (Array.isArray(data)) setAvailableTrips(data);
      })
      .catch(() => {});
  };

  const selectableTrips = useMemo(() => {
    const list: any[] = [...fleet];
    const seen = new Set(fleet.map((v) => v.tripId));
    for (const t of availableTrips) {
      if (t.id && !seen.has(t.id)) {
        list.push({
          tripId: t.id,
          num: t.vehicle?.vehicleNumber || `Trip #${t.id}`,
          driver: t.driver?.name || 'Assigned Driver',
          driverPhone: t.driver?.phone,
          source: t.indent?.source || 'Origin',
          dest: t.indent?.destination || 'Destination',
          currentLat: 0,
          currentLng: 0,
          speed: 45
        });
        seen.add(t.id);
      }
    }
    return list;
  }, [fleet, availableTrips]);

  // Enterprise RBAC & Branch Scope
  const isSuperAdmin = useMemo(() => {
    if (!currentUser) return false;
    return ['Tenant Admin', 'Admin', 'Super Admin', 'Director/Operations Head', 'Platform Admin'].includes(currentUser.role);
  }, [currentUser]);

  const activeBranchName = useMemo(() => {
    if (!isSuperAdmin) {
      return currentUser?.branchName || "My Branch";
    }
    if (selectedBranchId === 'ALL') {
      return "All Branches (Global Fleet)";
    }
    const found = branches.find(b => b.id === selectedBranchId);
    return found?.name || `Branch #${selectedBranchId}`;
  }, [isSuperAdmin, currentUser, selectedBranchId, branches]);

  // Load user session from localStorage and initialize branch access
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          setCurrentUser(u);
          const isSuper = ['Tenant Admin', 'Admin', 'Super Admin', 'Director/Operations Head', 'Platform Admin'].includes(u.role);
          const uBranchId = u.branchId ?? u.BranchId;
          if (!isSuper && uBranchId) {
            setSelectedBranchId(uBranchId);
          } else if (isSuper) {
            fetchApi('/Branches')
              .then((data) => {
                if (Array.isArray(data)) setBranches(data);
              })
              .catch(() => {});
          }
        } catch (e) {
          console.error("Error reading user profile:", e);
        }
      }
    }
  }, []);

  const isPollingRef = useRef(false);

  const loadLiveFleet = useCallback(async (isManualRefresh: boolean = false) => {
    if (isPollingRef.current && !isManualRefresh) {
      return; // Prevent overlapping in-flight polling requests
    }
    isPollingRef.current = true;
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      let userObj = currentUser;
      if (!userObj && userStr) {
        try { userObj = JSON.parse(userStr); } catch {}
      }

      const isSuper = userObj ? ['Tenant Admin', 'Admin', 'Super Admin', 'Director/Operations Head', 'Platform Admin'].includes(userObj.role) : false;

      let endpoint = '/Locations/live';
      if (!isSuper) {
        // Strict branch isolation for branch users (Branch Manager, Supervisor, Dispatcher)
        // If no branch assigned, pass -1 so zero global vehicles leak into non-admin dashboards
        const effectiveBranch = userObj?.branchId ?? userObj?.BranchId ?? -1;
        endpoint += `?branchId=${effectiveBranch}`;
      } else if (selectedBranchId !== 'ALL' && selectedBranchId > 0) {
        // Super Admin branch filtering
        endpoint += `?branchId=${selectedBranchId}`;
      }

      const data = await fetchApi(endpoint, { forceRefresh: isManualRefresh });
      if (Array.isArray(data)) {
        // Guarantee deduplication by vehicleId / tripId to avoid duplicate React keys
        const seenKeys = new Set<string>();
        const uniqueData = data.filter((v: any) => {
          const key = String(v.id || v.vehicleId || `trip-${v.tripId}`);
          if (seenKeys.has(key)) return false;
          seenKeys.add(key);
          return true;
        });

        const mapped = uniqueData.map((v: any) => ({
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
          currentAddress: v.currentAddress,
          isHalted: v.isHalted,
          haltDurationMinutes: v.haltDurationMinutes,
          haltFormatted: v.haltFormatted,
          isRouteDeviated: v.isRouteDeviated,
          deviationDistanceKm: v.deviationDistanceKm,
          alertSeverity: v.alertSeverity,
          alertMessage: v.alertMessage,
          alertType: v.alertType,
          geofenceRadiusMeters: v.geofenceRadiusMeters || 1000,
          distanceToOriginKm: v.distanceToOriginKm,
          distanceToDestKm: v.distanceToDestKm,
          isInsideOriginGeofence: Boolean(v.isInsideOriginGeofence),
          isInsideDestGeofence: Boolean(v.isInsideDestGeofence),
          currentHubStatus: v.currentHubStatus || 'EN_ROUTE',
          hubMilestoneStage: v.hubMilestoneStage || 'IN_TRANSIT',
          originGateInTime: v.originGateInTime,
          originGateOutTime: v.originGateOutTime,
          loadingTatMinutes: v.loadingTatMinutes,
          loadingTatFormatted: v.loadingTatFormatted,
          loadingSlaStatus: v.loadingSlaStatus || 'ON_TIME',
          destGateInTime: v.destGateInTime,
          unloadingTatMinutes: v.unloadingTatMinutes,
          unloadingTatFormatted: v.unloadingTatFormatted,
          unloadingSlaStatus: v.unloadingSlaStatus || 'ON_TIME',
          shareToken: v.shareToken,
          customerName: v.customerName,
          lrNumber: v.lrNumber,
          branchId: v.branchId,
          branchName: v.branchName
        }));
        setFleet(mapped);
        if (mapped.length > 0) {
          setTestTripId((prev) => (prev > 0 ? prev : mapped[0].tripId));
          setTestLat((prev) => (prev !== 0 ? prev : mapped[0].currentLat || mapped[0].srcLat || 0));
          setTestLng((prev) => (prev !== 0 ? prev : mapped[0].currentLng || mapped[0].srcLng || 0));
        }
      } else {
        setFleet([]);
      }
    } catch (e) {
      console.error("Failed to load live fleet locations:", e);
      setFleet([]);
    } finally {
      isPollingRef.current = false;
      setLoading(false);
    }
  }, [currentUser, selectedBranchId]);

  useEffect(() => {
    loadLiveFleet(true);
    // Live polling interval every 6 seconds with non-overlapping safeguard
    const interval = setInterval(() => loadLiveFleet(false), 6000);
    return () => clearInterval(interval);
  }, [loadLiveFleet, selectedBranchId]);

  // Synchronize activeVehicle with fresh telemetry pings from fleet polling (unless driving simulation is active)
  useEffect(() => {
    if (activeVehicle && !isDriveSimulating) {
      const fresh = fleet.find((v) => v.id === activeVehicle.id || (v.tripId && v.tripId === activeVehicle.tripId));
      if (fresh) {
        setActiveVehicle((prev: any) => ({
          ...prev,
          ...fresh,
          currentLat: fresh.currentLat || prev.currentLat,
          currentLng: fresh.currentLng || prev.currentLng,
        }));
      }
    }
  }, [fleet, isDriveSimulating]);

  // Load real road route geometry when active vehicle is selected
  useEffect(() => {
    if (activeVehicle?.srcLat && activeVehicle?.destLat) {
      let cancelled = false;
      fetchRoadRoute(activeVehicle.srcLat, activeVehicle.srcLng, activeVehicle.destLat, activeVehicle.destLng)
        .then((res) => {
          if (!cancelled && res.coordinates.length > 0) {
            setActiveRouteCoords(res.coordinates);
          }
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    } else {
      setActiveRouteCoords([]);
    }
  }, [activeVehicle?.id, activeVehicle?.srcLat, activeVehicle?.srcLng, activeVehicle?.destLat, activeVehicle?.destLng]);

  // Load breadcrumb trail history when active vehicle is selected and keep updated with live telemetry
  useEffect(() => {
    if (!activeVehicle?.tripId) {
      setTrailHistory([]);
      return;
    }

    const fetchHistory = () => {
      fetchApi(`/Locations/trip/${activeVehicle.tripId}/history`, { forceRefresh: true })
        .then((data: any) => {
          if (Array.isArray(data)) {
            setTrailHistory(data);
          }
        })
        .catch((err) => console.error("Trail history fetch error:", err));
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 4000);
    return () => clearInterval(interval);
  }, [activeVehicle?.tripId]);

  // Live Route Drive Motion Simulator Engine
  // Smoothly advances the vehicle along the actual highway road geometry
  useEffect(() => {
    if (!isDriveSimulating || !activeVehicle) {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      return;
    }

    const srcLat = activeVehicle.srcLat || activeVehicle.currentLat;
    const srcLng = activeVehicle.srcLng || activeVehicle.currentLng;
    const destLat = activeVehicle.destLat || activeVehicle.currentLat;
    const destLng = activeVehicle.destLng || activeVehicle.currentLng;

    simTimerRef.current = setInterval(() => {
      setSimProgress((prev) => {
        let next = prev + 0.007 * simSpeedMult;
        if (next > 0.98) next = 0.02; // loop route smoothly

        let newLat = activeVehicle.currentLat;
        let newLng = activeVehicle.currentLng;
        let bearing = activeVehicle.heading || 0;

        if (activeRouteCoords && activeRouteCoords.length > 2) {
          const totalPts = activeRouteCoords.length;
          const targetIdx = Math.min(Math.floor(next * (totalPts - 1)), totalPts - 1);
          const curPt = activeRouteCoords[targetIdx];
          const nextPt = activeRouteCoords[Math.min(targetIdx + 1, totalPts - 1)];
          newLat = curPt[0];
          newLng = curPt[1];
          bearing = calculateBearing(curPt[0], curPt[1], nextPt[0], nextPt[1]);
        } else if (srcLat && destLat) {
          newLat = srcLat + (destLat - srcLat) * next;
          newLng = srcLng + (destLng - srcLng) * next;
          bearing = calculateBearing(srcLat, srcLng, destLat, destLng);
        }

        const dynamicSpeed = Math.round(48 + Math.sin(next * 16) * 16);

        // Update activeVehicle coordinates
        setActiveVehicle((curr: any) => {
          if (!curr) return null;
          return {
            ...curr,
            currentLat: newLat,
            currentLng: newLng,
            speed: dynamicSpeed,
            heading: bearing,
            trackingStatus: "LIVE",
            lastPingAgo: "Just now"
          };
        });

        // Append to breadcrumb trail history
        setTrailHistory((trail) => [
          ...trail.slice(-120), // keep last 120 breadcrumb points
          { latitude: newLat, longitude: newLng, timestamp: new Date().toISOString() }
        ]);

        return next;
      });
    }, 1200);

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isDriveSimulating, activeVehicle?.id, activeVehicle?.srcLat, activeVehicle?.srcLng, activeVehicle?.destLat, activeVehicle?.destLng, activeRouteCoords, simSpeedMult]);

  // Select vehicle and optionally auto-start live cruise motion simulation
  const handleSelectVehicle = (v: any, autoPlay: boolean = false) => {
    setActiveVehicle(v);
    if (v.srcLat && v.destLat && v.currentLat) {
      const totalDist = Math.hypot(v.destLat - v.srcLat, v.destLng - v.srcLng);
      const currDist = Math.hypot(v.currentLat - v.srcLat, v.currentLng - v.srcLng);
      const p = totalDist > 0 ? Math.min(Math.max(currDist / totalDist, 0.05), 0.95) : 0.2;
      setSimProgress(p);
    } else {
      setSimProgress(0.2);
    }
    setIsDriveSimulating(autoPlay);
    if (window.innerWidth < 768) setMobileView('map');
  };

  // Safety Alerts detection (Route Deviation or Prolonged Stoppage)
  const alertVehicles = useMemo(() => {
    return fleet.filter(v => Boolean(v.isRouteDeviated) || Boolean(v.isHalted && (v.haltDurationMinutes || 0) >= 20));
  }, [fleet]);
  const alertCount = alertVehicles.length;

  // Dynamic Geocoding of Indian 6-digit Pincodes from Search Query
  useEffect(() => {
    const pinMatch = searchQuery.match(/\b([1-9][0-9]{5})\b/);
    if (pinMatch) {
      const pin = pinMatch[1];
      if (pincodeRegion && pincodeRegion.pincode === pin && pincodeRegion.radiusKm === pincodeRadius) {
        return;
      }
      const timer = setTimeout(async () => {
        try {
          setIsGeocodingPin(true);
          const res = await fetchApi(`/Locations/geocode?query=${pin}`);
          if (res && res.latitude && res.longitude) {
            setPincodeRegion({
              pincode: pin,
              lat: res.latitude,
              lng: res.longitude,
              radiusKm: pincodeRadius,
              locality: res.formattedAddress || res.source || `PIN ${pin}`
            });
          }
        } catch (e) {
          console.error("Failed to geocode PIN code:", e);
        } finally {
          setIsGeocodingPin(false);
        }
      }, 350);
      return () => clearTimeout(timer);
    } else {
      if (pincodeRegion) {
        setPincodeRegion(null);
      }
    }
  }, [searchQuery, pincodeRadius]);

  // Filtering & Regional Proximity Ordering
  const filteredFleet = useMemo(() => {
    const pinMatch = searchQuery.match(/\b([1-9][0-9]{5})\b/);
    const textQuery = pinMatch 
      ? searchQuery.replace(pinMatch[0], '').trim().toLowerCase() 
      : searchQuery.trim().toLowerCase();

    const result = fleet
      .map(v => {
        let distKm: number | undefined = undefined;
        let isInsideRadius = true;
        if (pincodeRegion && v.currentLat && v.currentLng && v.currentLat !== 0) {
          distKm = Math.round(calculateHaversineKm(pincodeRegion.lat, pincodeRegion.lng, v.currentLat, v.currentLng) * 10) / 10;
          if (pincodeRadius < 9000) {
            isInsideRadius = distKm <= pincodeRadius;
          }
        }
        return {
          ...v,
          distanceFromSearchPincodeKm: distKm,
          isInsideSearchRadius: isInsideRadius
        };
      })
      .filter(v => {
        // Tracking mode filter
        if (trackingFilter === 'ALERTS') {
          if (!v.isRouteDeviated && !(v.isHalted && (v.haltDurationMinutes || 0) >= 20)) return false;
        } else if (trackingFilter !== 'ALL' && v.sourceType !== trackingFilter) {
          return false;
        }

        // Pincode regional radius filter
        if (pincodeRegion && !v.isInsideSearchRadius) {
          return false;
        }

        // Text query filter
        if (!textQuery) return true;
        return (
          v.num?.toLowerCase().includes(textQuery) ||
          v.driver?.toLowerCase().includes(textQuery) ||
          v.source?.toLowerCase().includes(textQuery) ||
          v.dest?.toLowerCase().includes(textQuery) ||
          v.status?.toLowerCase().includes(textQuery) ||
          v.alertMessage?.toLowerCase().includes(textQuery) ||
          v.currentAddress?.toLowerCase().includes(textQuery) ||
          v.branchName?.toLowerCase().includes(textQuery) ||
          v.customerName?.toLowerCase().includes(textQuery) ||
          v.lrNumber?.toLowerCase().includes(textQuery)
        );
      });

    // If pincode region active, sort by closest distance first
    if (pincodeRegion) {
      result.sort((a, b) => {
        const distA = a.distanceFromSearchPincodeKm ?? 999999;
        const distB = b.distanceFromSearchPincodeKm ?? 999999;
        return distA - distB;
      });
    }

    return result;
  }, [fleet, trackingFilter, searchQuery, pincodeRegion, pincodeRadius]);

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
          await fetchApi('/Locations/ping', {
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
  const movingCount = fleet.filter(v => (v.speed || 0) > 0 && v.trackingStatus === 'LIVE').length;
  const haltedCount = fleet.filter(v => ((v.speed || 0) === 0 || v.trackingStatus !== 'LIVE')).length;

  return (
    <>
      <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] -m-2.5 sm:-m-4 md:-m-6 flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-300 bg-slate-950 relative">
        
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

        {/* Collapsible Left Sidebar: Fleet List & Search */}
        <div className={`transition-all duration-300 ease-in-out h-full z-10 shrink-0 bg-slate-900/95 backdrop-blur border-r border-slate-800/80 flex flex-col ${
          mobileView === 'map' ? 'hidden md:flex' : 'flex'
        } ${isSidebarOpen ? 'w-full md:w-96 lg:w-[410px]' : 'w-0 md:w-16 overflow-hidden'}`}>
          
          {/* Header Bar */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between gap-2">
            {isSidebarOpen ? (
              <>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2 truncate">
                    <Navigation className="w-5 h-5 text-blue-400 animate-pulse shrink-0" /> Live Fleet Radar
                  </h1>
                  <p className="text-[11px] text-slate-400 truncate">
                    Telemetry Stream (GPS & Dotmove SIM)
                  </p>
                  {!isSuperAdmin ? (
                    <div className="mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-950/80 border border-blue-500/30 text-[10px] text-blue-300 font-semibold w-fit">
                      <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                      <span>{currentUser?.branchName || "Branch"} Branch (Restricted Access)</span>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-[10px] text-emerald-300 font-semibold w-fit">
                      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Super Admin (Global Enterprise Access)</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    onClick={() => loadLiveFleet(true)}
                    title="Refresh telemetry"
                    className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={openSimulatorModal}
                    title="Dispatch Testing Simulator"
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1"
                  >
                    <Radio className="w-3 h-3 text-blue-400" />
                    <span className="text-[11px]">Simulator</span>
                  </button>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    title="Collapse Sidebar for Fullscreen Map"
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition hidden md:block"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full flex flex-col items-center gap-3 py-2">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  title="Expand Fleet Sidebar"
                  className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="text-[10px] font-black text-slate-400 [writing-mode:vertical-lr] tracking-widest uppercase">
                  Fleet List ({filteredFleet.length})
                </div>
              </div>
            )}
          </div>

          {/* Expanded Sidebar Controls & Filter */}
          {isSidebarOpen && (
            <>
              {/* Branch Filter for Super Admin */}
              {isSuperAdmin && branches.length > 0 && (
                <div className="px-3 pt-2.5 pb-1 border-b border-slate-800/80 bg-slate-950/40">
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 shadow-inner">
                    <Sliders className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0">Branch:</span>
                    <select
                      value={selectedBranchId}
                      onChange={(e) => {
                        const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                        setSelectedBranchId(val);
                      }}
                      className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer w-full truncate"
                    >
                      <option value="ALL" className="bg-slate-900 text-white">All Branches (Global Fleet • {fleet.length})</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                          {b.name} ({b.code || `BR-${b.id}`})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              <div className="p-3 border-b border-slate-800/80 space-y-2.5">
                {/* Live Operational Metrics Pill */}
                {/* Live Operational Metrics Pill */}
                <div className="grid grid-cols-4 gap-1">
                  <div className="bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 text-center">
                    <span className="text-[9px] text-slate-400 block font-semibold truncate">Active</span>
                    <span className="text-xs font-black text-white">{fleet.length}</span>
                  </div>
                  <div className="bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 text-center">
                    <span className="text-[9px] text-emerald-400 block font-semibold flex items-center justify-center gap-0.5 truncate">
                      {movingCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>} Moving
                    </span>
                    <span className={`text-xs font-black ${movingCount > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>{movingCount}</span>
                  </div>
                  <div className="bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 text-center">
                    <span className="text-[9px] text-slate-400 block font-semibold truncate">Standby</span>
                    <span className="text-xs font-black text-amber-400">{haltedCount}</span>
                  </div>
                  <div 
                    onClick={() => setTrackingFilter(prev => prev === 'ALERTS' ? 'ALL' : 'ALERTS')}
                    className={`p-1.5 rounded-xl border text-center cursor-pointer transition ${
                      alertCount > 0 
                        ? 'bg-rose-950/60 border-rose-600/60 hover:bg-rose-900/60' 
                        : 'bg-slate-950/80 border-slate-800/80'
                    }`}
                    title="Filter vehicles with Route Deviation or Prolonged Stoppage alerts"
                  >
                    <span className={`text-[9px] block font-semibold truncate ${alertCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                      Alerts
                    </span>
                    <span className={`text-xs font-black ${alertCount > 0 ? 'text-rose-400' : 'text-slate-500'}`}>{alertCount}</span>
                  </div>
                </div>

                {/* Tracking Source & Safety Filters */}
                <div className="grid grid-cols-4 gap-1">
                  <button
                    onClick={() => setTrackingFilter('ALL')}
                    className={`py-1.5 px-1 text-[10px] font-bold rounded-lg transition text-center truncate ${
                      trackingFilter === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({fleet.length})
                  </button>
                  <button
                    onClick={() => setTrackingFilter('MOBILE_GPS')}
                    className={`py-1.5 px-1 text-[10px] font-bold rounded-lg transition text-center flex items-center justify-center gap-0.5 truncate ${
                      trackingFilter === 'MOBILE_GPS' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3 h-3 text-blue-400 shrink-0" /> GPS ({gpsCount})
                  </button>
                  <button
                    onClick={() => setTrackingFilter('SIM_TRACKING')}
                    className={`py-1.5 px-1 text-[10px] font-bold rounded-lg transition text-center flex items-center justify-center gap-0.5 truncate ${
                      trackingFilter === 'SIM_TRACKING' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Radio className="w-3 h-3 text-emerald-400 shrink-0" /> SIM ({simCount})
                  </button>
                  <button
                    onClick={() => setTrackingFilter('ALERTS')}
                    className={`py-1.5 px-1 text-[10px] font-bold rounded-lg transition text-center flex items-center justify-center gap-0.5 truncate ${
                      trackingFilter === 'ALERTS'
                        ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400'
                        : alertCount > 0
                          ? 'bg-rose-950/80 border border-rose-600/50 text-rose-300 hover:bg-rose-900/80'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <AlertTriangle className={`w-3 h-3 shrink-0 ${alertCount > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
                    <span>Alerts ({alertCount})</span>
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search vehicle plate, driver, city, PIN code..." 
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

                {/* PIN Code Geocoding Loading Indicator */}
                {isGeocodingPin && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-500/30 text-[11px] text-blue-300">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                    <span>Resolving live regional coordinates for PIN...</span>
                  </div>
                )}

                {/* Regional PIN Discovery Filter Active Banner */}
                {pincodeRegion && (
                  <div className="bg-gradient-to-r from-blue-950/90 via-slate-900 to-indigo-950/90 border border-blue-500/50 rounded-xl p-2.5 space-y-2 animate-in fade-in slide-in-from-top-1 shadow-lg shadow-blue-950/50">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center shrink-0">
                          <Target className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-white">PIN {pincodeRegion.pincode}</span>
                            <span className="text-[9px] font-bold text-blue-300 bg-blue-900/70 border border-blue-700/50 px-1.5 py-0.2 rounded-full">
                              Radar Active
                            </span>
                          </div>
                          <span className="text-[10px] text-blue-200 block truncate">
                            {pincodeRegion.locality || `Lat: ${pincodeRegion.lat.toFixed(4)}, Lng: ${pincodeRegion.lng.toFixed(4)}`}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setPincodeRegion(null);
                          setSearchQuery("");
                        }}
                        title="Clear PIN Radar"
                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Radius Selector Pills */}
                    <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-800/80">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider shrink-0">Radius:</span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {[25, 50, 100, 250, 9999].map((rad) => {
                          const isSel = (rad >= 9000 ? pincodeRadius >= 9000 : pincodeRadius === rad);
                          return (
                            <button
                              key={rad}
                              onClick={() => {
                                setPincodeRadius(rad);
                                setPincodeRegion(prev => prev ? { ...prev, radiusKm: rad } : null);
                              }}
                              className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md transition ${
                                isSel
                                  ? 'bg-blue-600 text-white shadow ring-1 ring-blue-400'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                              }`}
                            >
                              {rad >= 9000 ? 'All' : `${rad} km`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Indian Pincode Discovery Chips (Shown when search is empty) */}
                {!searchQuery && !pincodeRegion && (
                  <div className="pt-0.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-blue-400" /> Quick PIN Radar:
                      </span>
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                      {[
                        { pin: "560058", name: "Peenya (BLR)" },
                        { pin: "400099", name: "Andheri (MUM)" },
                        { pin: "411001", name: "Pune Station" },
                        { pin: "110020", name: "Okhla (DEL)" },
                        { pin: "600001", name: "Chennai Port" }
                      ].map((item) => (
                        <button
                          key={item.pin}
                          onClick={() => setSearchQuery(item.pin)}
                          className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-md text-[10px] text-slate-300 font-semibold transition shrink-0 whitespace-nowrap"
                        >
                          {item.pin} <span className="text-slate-500 text-[9px]">• {item.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Vehicle List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <span className="text-xs">Querying live database fleet...</span>
                  </div>
                ) : filteredFleet.length === 0 ? (
                  <div className="text-center py-12 px-4 text-slate-400 space-y-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
                      <Truck className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">
                        {!isSuperAdmin ? `No Active Vehicles in ${currentUser?.branchName || "My"} Branch` : `No Vehicles Found`}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                        {!isSuperAdmin
                          ? `You are logged in with ${currentUser?.branchName || "My"} Branch access. You can only view vehicles and trips created or assigned to your branch.`
                          : selectedBranchId !== 'ALL'
                            ? `No active trips or live vehicles are currently assigned to ${activeBranchName}.`
                            : "Vehicles appear here when trips are In Transit or Assigned with live tracking."}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 max-w-xs mx-auto pt-1">
                      <a
                        href="/trips/sales"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 transition"
                      >
                        + Create Branch Indent / Trip
                      </a>
                      <a
                        href="/vehicles"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                      >
                        Fleet Vehicles Directory
                      </a>
                    </div>
                  </div>
                ) : (
                  filteredFleet.map((v, idx) => {
                    const isSelected = activeVehicle?.id === v.id;
                    const isSim = v.sourceType === "SIM_TRACKING" || v.source === "SIM_TRACKING";
                    const trackingStatus = v.trackingStatus || 'OFFLINE';
                    const isLive = trackingStatus === 'LIVE';
                    const isMoving = isLive && (v.speed || 0) > 0;

                    return (
                      <div 
                        key={`${v.id || 'v'}-${v.tripId || ''}-${idx}`}
                        onClick={() => handleSelectVehicle(v, false)}
                        className={`p-3 rounded-xl transition-all cursor-pointer border ${
                          isSelected 
                            ? 'bg-blue-950/60 border-blue-500 shadow-lg ring-1 ring-blue-500/30' 
                            : 'bg-slate-950/60 border-slate-800/70 hover:bg-slate-800/50 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isSim 
                                ? 'bg-emerald-950 border border-emerald-500/30 text-emerald-400' 
                                : isLive
                                  ? 'bg-blue-950 border border-blue-500/30 text-blue-400'
                                  : 'bg-slate-900 border border-slate-700/50 text-slate-400'
                            }`}>
                              {isSim ? <Radio className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-white text-sm tracking-wide block truncate">{v.num}</span>
                              <span className="text-[11px] text-slate-400 block truncate">{v.driver}</span>
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end gap-1 shrink-0">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isSim 
                                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50' 
                                : isLive 
                                  ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                                  : 'bg-slate-800/60 text-slate-400 border border-slate-700/50'
                            }`}>
                              {isSim ? '🟢 SIM' : isLive ? '🔵 GPS' : '⚪ Standby'}
                            </span>
                            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                              isMoving 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse' 
                                : isLive 
                                  ? 'bg-blue-900/40 text-blue-300 border border-blue-700/50'
                                  : 'bg-slate-800/80 text-slate-400 border border-slate-700'
                            }`}>
                              ● {isMoving ? `${v.speed} km/h` : isLive ? 'Halted' : 'Offline'}
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-900/90 rounded-lg p-2.5 text-xs text-slate-300 space-y-1.5 border border-slate-800/60">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-300 font-medium flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-red-400 shrink-0" /> {v.source} ➔ {v.dest}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {v.branchName && (
                                <span className="text-[9px] font-semibold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
                                  {v.branchName}
                                </span>
                              )}
                              <span className="font-mono text-slate-400 text-[10px]">#{v.tripId}</span>
                            </div>
                          </div>

                          {/* Regional PIN Proximity Badge */}
                          {v.distanceFromSearchPincodeKm !== undefined && (
                            <div className="px-2 py-1 bg-blue-950/90 border border-blue-500/50 rounded-lg flex items-center justify-between text-[11px] text-blue-300 font-bold">
                              <span className="flex items-center gap-1.5">
                                <Target className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <span>PIN {pincodeRegion?.pincode} Proximity:</span>
                              </span>
                              <span className="text-white font-black bg-blue-600 px-2 py-0.5 rounded-full text-[10px] shadow">
                                🎯 {v.distanceFromSearchPincodeKm} km away
                              </span>
                            </div>
                          )}

                          {/* Safety Alert Warning Pill */}
                          {v.isRouteDeviated && (
                            <div className="px-2 py-1 bg-rose-950/80 border border-rose-500/50 rounded-lg flex items-center gap-1.5 text-[10px] text-rose-300 font-bold">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-bounce" />
                              <span className="truncate">Route Deviated: {v.deviationDistanceKm || 0} km off NH corridor</span>
                            </div>
                          )}
                          {v.isHalted && (v.haltDurationMinutes || 0) >= 20 && !v.isRouteDeviated && (
                            <div className="px-2 py-1 bg-amber-950/80 border border-amber-500/50 rounded-lg flex items-center gap-1.5 text-[10px] text-amber-300 font-bold">
                              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate">Prolonged Halt: {v.haltFormatted || `${v.haltDurationMinutes}m`}</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                            <span>ETA: <strong className="text-emerald-400 font-semibold">{v.eta || "In Transit"}</strong></span>
                            <span className="text-[10px] text-slate-400">{v.lastPingAgo || "Live"}</span>
                          </div>

                          {/* Smart Hub Milestone Badge */}
                          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80">
                            <span className="text-slate-400 flex items-center gap-1 min-w-0">
                              <Compass className="w-3 h-3 text-cyan-400 shrink-0" />
                              <strong className={`truncate ${
                                v.isInsideOriginGeofence 
                                  ? "text-emerald-400 font-bold" 
                                  : v.isInsideDestGeofence 
                                    ? "text-violet-400 font-bold" 
                                    : v.currentHubStatus === "APPROACHING_DESTINATION"
                                      ? "text-amber-400 font-bold"
                                      : "text-slate-300"
                              }`}>
                                {v.isInsideOriginGeofence 
                                  ? `🟢 In Pickup Hub (${v.loadingTatFormatted || 'Loading'})` 
                                  : v.isInsideDestGeofence 
                                    ? `🏁 In Consignee Dock (${v.unloadingTatFormatted || 'Unloading'})`
                                    : v.currentHubStatus === "APPROACHING_DESTINATION"
                                      ? `⏳ Approaching Dest (${Math.round(v.distanceToDestKm || 0)} km)`
                                      : `🚚 En Route (${Math.round(v.distanceToDestKm || 0)} km left)`}
                              </strong>
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                              v.loadingSlaStatus === 'DETENTION' 
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {v.loadingSlaStatus === 'DETENTION' ? 'Detention' : 'SLA OK'}
                            </span>
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between gap-1.5 text-[11px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectVehicle(v, false);
                              }}
                              className="py-1 px-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition text-[11px] flex items-center gap-1 shadow-sm"
                              title="Focus and isolate this vehicle on map"
                            >
                              <Crosshair className="w-3 h-3" /> Track
                            </button>
                            {isSim ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTriggerSimPingForTrip(v.tripId);
                                }}
                                className="flex-1 py-1 px-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/60 rounded-lg text-emerald-300 font-bold flex items-center justify-center gap-1 transition"
                                title="Query telecom cell tower for driver keypad mobile"
                              >
                                <Radio className="w-3.5 h-3.5 text-emerald-400" /> SIM Tower
                              </button>
                            ) : (
                              <>
                                {v.driverPhone ? (
                                  <a
                                    href={`https://wa.me/${v.driverPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`🚛 *LogiPulse Dispatch · Start Live Trip Tracking*\n\nHello *${v.driver}*,\nTrip #${v.tripId} (${v.num}) has been assigned.\n\n📍 Tap this link on your smartphone to turn ON your live GPS location:\n👉 ${getDriverTrackingUrl(v.tripId, true)}\n\n(Origin: ${v.source} ➔ Destination: ${v.dest})`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="py-1 px-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 rounded-lg text-emerald-300 font-bold flex items-center justify-center gap-1 transition text-[11px]"
                                    title={`Send tracking link to driver WhatsApp (${v.driverPhone})`}
                                  >
                                    <MessageSquare className="w-3 h-3 fill-current" /> WA Link
                                  </a>
                                ) : null}
                                <a
                                  href={getDriverTrackingUrl(v.tripId)}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex-1 py-1 px-2 bg-blue-950/80 hover:bg-blue-900 border border-blue-800/60 rounded-lg text-blue-300 font-bold flex items-center justify-center gap-1 transition text-center text-[11px]"
                                  title="Open driver mobile tracking screen"
                                >
                                  <ExternalLink className="w-3 h-3" /> Driver App
                                </a>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const link = getDriverTrackingUrl(v.tripId, true);
                                    navigator.clipboard.writeText(link);
                                    alert(`Copied Driver Tracking Link for Trip #${v.tripId}:\n${link}\n\nOpen this on any Android/iOS smartphone to start streaming real GPS!`);
                                  }}
                                  className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg transition text-[11px]"
                                  title="Copy mobile tracking link"
                                >
                                  <Copy className="w-3 h-3" />
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
            </>
          )}
        </div>

        {/* Floating Sidebar Re-open Button when collapsed */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            title="Open Fleet List"
            className="absolute top-4 left-4 z-[998] p-2.5 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl shadow-2xl border border-slate-700/80 backdrop-blur-md transition hidden md:flex items-center gap-2"
          >
            <ChevronRight className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold">Fleet ({filteredFleet.length})</span>
          </button>
        )}

        {/* Right Area: Interactive High-Precision Leaflet Map */}
        <div className={`flex-1 relative h-full w-full overflow-hidden ${
          mobileView === 'list' ? 'hidden md:block' : 'block'
        }`}>
          {/* FLOATING FLEET SAFETY ALERT BANNER */}
          {alertCount > 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[997] max-w-xl w-[calc(100%-2rem)] pointer-events-auto">
              <div className="bg-gradient-to-r from-rose-950/95 via-slate-900/95 to-amber-950/95 border border-rose-500/50 backdrop-blur-xl rounded-2xl p-2.5 sm:px-4 sm:py-2.5 shadow-2xl flex items-center justify-between gap-3 text-white animate-in fade-in slide-in-from-top-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-300 border border-rose-500/40">
                        {alertVehicles[0].alertSeverity || 'ALERT'}
                      </span>
                      <span className="font-black text-xs text-white tracking-wide truncate">
                        {alertVehicles[0].num}
                      </span>
                      <span className="text-[11px] text-slate-300 hidden sm:inline">
                        • {alertVehicles[0].alertMessage || (alertVehicles[0].isRouteDeviated ? `Deviated ${alertVehicles[0].deviationDistanceKm} km` : 'Prolonged Stoppage')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate sm:hidden">
                      {alertVehicles[0].alertMessage || `${alertVehicles[0].deviationDistanceKm} km off corridor`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleSelectVehicle(alertVehicles[0], false)}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1"
                  >
                    <Crosshair className="w-3 h-3" />
                    <span>Inspect</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty Fleet Floating Notice */}
          {filteredFleet.length === 0 && !loading && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[997] pointer-events-auto">
              <div className="bg-slate-900/95 border border-slate-700/80 backdrop-blur-xl rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-2.5 text-white">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs font-semibold">
                  {pincodeRegion ? (
                    <>No vehicles found within <strong className="text-blue-400">{pincodeRadius >= 9000 ? 'Any distance' : `${pincodeRadius} km`}</strong> of PIN <strong className="text-white">{pincodeRegion.pincode}</strong></>
                  ) : (
                    <><strong className="text-white">{activeBranchName}</strong>: 0 Active Vehicles</>
                  )}
                </span>
                {pincodeRegion ? (
                  <button
                    onClick={() => {
                      setPincodeRadius(250);
                      setPincodeRegion(prev => prev ? { ...prev, radiusKm: 250 } : null);
                    }}
                    className="text-[11px] text-blue-400 hover:underline font-bold ml-1"
                  >
                    Expand to 250 km
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 hidden sm:inline">• Waiting for trips to be dispatched</span>
                )}
              </div>
            </div>
          )}

          <FleetMap 
            activeVehicle={activeVehicle} 
            fleet={filteredFleet}
            onSelectVehicle={(v: any) => handleSelectVehicle(v, false)}
            onClearActiveVehicle={() => {
              setActiveVehicle(null);
              setIsDriveSimulating(false);
            }}
            trailHistory={trailHistory}
            autoFollow={autoFollow}
            recenterTrigger={recenterTrigger}
            roadRouteGeometry={activeRouteCoords}
            pincodeRegion={pincodeRegion}
          />

          {/* Floating Driver Telemetry Control Center HUD */}
          {activeVehicle && (
            <div className="absolute top-4 right-4 z-[999] w-96 max-w-[calc(100vw-2rem)] transition-all duration-300">
              
              {/* MINIMIZED HUD STATE: Sleek floating capsule */}
              {isHudMinimized ? (
                <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3 text-white animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-2.5 w-2.5 relative shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm tracking-wide text-white">{activeVehicle.num}</span>
                        <span className="text-[10px] font-bold text-emerald-400">{activeVehicle.speed || 0} km/h</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {activeVehicle.source} ➔ {activeVehicle.dest}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setIsDriveSimulating(!isDriveSimulating)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1 transition shadow-sm ${
                        isDriveSimulating 
                          ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse' 
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                      title={isDriveSimulating ? "Pause Drive" : "Start Live Drive Simulation"}
                    >
                      {isDriveSimulating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                      <span>{isDriveSimulating ? "Pause" : "Drive"}</span>
                    </button>
                    <button
                      onClick={() => setIsHudMinimized(false)}
                      title="Expand Telemetry HUD"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => {
                        setActiveVehicle(null);
                        setIsDriveSimulating(false);
                      }}
                      title="Close"
                      className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 rounded-lg transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* EXPANDED COMPLETE HUD */
                <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 max-h-[calc(100vh-130px)] flex flex-col animate-in fade-in slide-in-from-top-2">
                  
                  {/* Header Bar */}
                  <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-[11px] font-black tracking-wider uppercase text-emerald-400">
                        Live Tracking Corridor
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        activeVehicle.sourceType === "SIM_TRACKING"
                          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                          : 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                      }`}>
                        {activeVehicle.sourceType === "SIM_TRACKING" ? '🟢 SIM' : '🔵 GPS'}
                      </span>
                      <button
                        onClick={() => setIsHudMinimized(true)}
                        title="Minimize HUD"
                        className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      >
                        <Minimize2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => {
                          setActiveVehicle(null);
                          setIsDriveSimulating(false);
                        }}
                        className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition ml-0.5"
                        title="Close Vehicle Isolation (View All Fleet)"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 text-white">
                    
                    {/* Vehicle & Driver Identity */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-white tracking-wider">{activeVehicle.num}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Trip #{activeVehicle.tripId}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 font-semibold flex items-center gap-1.5 mt-0.5">
                          <span>{activeVehicle.driver}</span>
                          <span className="text-slate-600">•</span>
                          <span className="font-mono text-blue-400">{activeVehicle.driverPhone || "No Phone"}</span>
                        </div>
                      </div>

                      {/* Driver Contact & Recenter Actions */}
                      <div className="flex items-center gap-1">
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
                          className="p-2 bg-blue-950/80 hover:bg-blue-900 border border-blue-700/60 text-blue-300 rounded-xl transition"
                          title="Center Map on Vehicle"
                        >
                          <Crosshair className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* SAFETY / ROUTE DEVIATION CRITICAL ALERT PANEL */}
                    {(activeVehicle.isRouteDeviated || (activeVehicle.isHalted && (activeVehicle.haltDurationMinutes || 0) >= 20)) && (
                      <div className="bg-gradient-to-br from-rose-950/90 via-slate-900/90 to-rose-950/60 border border-rose-500/50 rounded-xl p-3 space-y-2 text-white shadow-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                            </div>
                            <span className="text-xs font-black tracking-wide text-rose-300">
                              {activeVehicle.isRouteDeviated ? 'CRITICAL ROUTE DEVIATION' : 'OPERATIONAL HALT ALERT'}
                            </span>
                          </div>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {activeVehicle.alertSeverity || 'WARNING'}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-200 leading-snug">
                          {activeVehicle.isRouteDeviated
                            ? `Vehicle has strayed ${activeVehicle.deviationDistanceKm} km outside the assigned corridor. Risk of unauthorized detour, cargo loss, or driver error.`
                            : `Vehicle has remained stationary for ${activeVehicle.haltFormatted || `${activeVehicle.haltDurationMinutes} mins`} outside designated hubs.`}
                        </p>

                        {activeVehicle.driverPhone && (
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            <a
                              href={`https://wa.me/${activeVehicle.driverPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                `🚨 *URGENT ROUTE DEVIATION WARNING - LogiPulse Dispatch*\n\nHello *${activeVehicle.driver}*,\nOur satellite corridor tracking has detected that vehicle *${activeVehicle.num}* on Trip #${activeVehicle.tripId} has strayed *${activeVehicle.deviationDistanceKm} km* away from the assigned highway route (${activeVehicle.source} ➔ ${activeVehicle.dest}).\n\nPlease immediately return to the designated route corridor or reply with your reason for deviation.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="py-1.5 px-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded-lg transition flex items-center justify-center gap-1 shadow-md text-center"
                            >
                              <MessageSquare className="w-3 h-3 fill-current" />
                              <span>WhatsApp Warning</span>
                            </a>

                            <a
                              href={`tel:${activeVehicle.driverPhone}`}
                              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] rounded-lg border border-slate-700 transition flex items-center justify-center gap-1 text-center"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call Driver</span>
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* REAL-TIME TRACKING DISPATCH & STATUS CONSOLE */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-2.5 w-2.5 relative shrink-0">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                              activeVehicle.trackingStatus === 'LIVE' ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}></span>
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                              activeVehicle.trackingStatus === 'LIVE' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}></span>
                          </span>
                          <span className="text-xs font-black tracking-wide text-white truncate">
                            {activeVehicle.sourceType === 'SIM_TRACKING'
                              ? 'SIM Cell Tower Triangulation'
                              : activeVehicle.trackingStatus === 'LIVE'
                                ? 'Live Satellite GPS Active'
                                : 'Awaiting Driver GPS Start'}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          activeVehicle.trackingStatus === 'LIVE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {activeVehicle.lastPingAgo || (activeVehicle.trackingStatus === 'LIVE' ? 'Live' : 'Standby')}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-tight">
                        {activeVehicle.sourceType === 'SIM_TRACKING'
                          ? 'Triangulating keypad mobile via Dotmove Telecom LBS cell towers. No smartphone app or internet needed.'
                          : activeVehicle.trackingStatus === 'LIVE'
                            ? `Driver ${activeVehicle.driver} is streaming real-time hardware GPS pings directly from their mobile phone.`
                            : `Trip #${activeVehicle.tripId} is dispatched. Tap below to send the live GPS link to driver ${activeVehicle.driver} via WhatsApp.`}
                      </p>

                      {/* Primary Dispatch Action Buttons */}
                      <div className="space-y-1.5 pt-0.5">
                        {activeVehicle.sourceType === 'SIM_TRACKING' ? (
                          <button
                            onClick={() => handleTriggerSimPingForTrip(activeVehicle.tripId)}
                            className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
                          >
                            <Radio className="w-3.5 h-3.5" />
                            <span>Query Keypad Phone Cell Tower (Dotmove)</span>
                          </button>
                        ) : (
                          <>
                            {activeVehicle.driverPhone && (
                              <a
                                href={`https://wa.me/${activeVehicle.driverPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`🚛 *LogiPulse Dispatch · Start Live Trip Tracking*\n\nHello *${activeVehicle.driver}*,\nTrip #${activeVehicle.tripId} (${activeVehicle.num}) has been assigned.\n\n📍 Please tap this link on your smartphone to turn ON your live GPS location:\n👉 ${getDriverTrackingUrl(activeVehicle.tripId, true)}\n\n(Origin: ${activeVehicle.source} ➔ Destination: ${activeVehicle.dest})`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-2 px-3 bg-green-600 hover:bg-green-500 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 text-center"
                              >
                                <MessageSquare className="w-3.5 h-3.5 fill-current" />
                                <span>Send GPS Tracking Link via WhatsApp</span>
                              </a>
                            )}

                            <div className="flex items-center gap-1.5">
                              <a
                                href={getDriverTrackingUrl(activeVehicle.tripId)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 text-center"
                              >
                                <Smartphone className="w-3.5 h-3.5" />
                                <span>Open Driver Console</span>
                              </a>

                              <button
                                onClick={() => {
                                  const link = getDriverTrackingUrl(activeVehicle.tripId, true);
                                  navigator.clipboard.writeText(link);
                                  alert(`Copied Driver Tracking Link for Trip #${activeVehicle.tripId}:\n${link}\n\nOpen this on any Android/iOS smartphone to start streaming real GPS!`);
                                }}
                                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1"
                                title="Copy mobile link to clipboard"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Link</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* CUSTOMER & CONSIGNEE LIVE TRACKING MAGIC LINK */}
                    <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900/90 to-blue-950/60 border border-indigo-500/40 rounded-xl p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                          </div>
                          <div>
                            <span className="text-xs font-black tracking-wide text-white block">
                              Customer Live Tracking Magic Link
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Consignee portal • No login required
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                          Public Link
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-tight">
                        Share this live road map with customer {activeVehicle.customerName || 'Consignee'} ({activeVehicle.lrNumber || `Trip #${activeVehicle.tripId}`}). Includes dynamic ETA, live vehicle coordinates, and delivery geofences.
                      </p>

                      <div className="space-y-1.5 pt-0.5">
                        {/* WhatsApp to Customer */}
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `🚚 *Live Consignment Tracking - LogiPulse*\n\n` +
                            `Hello,\nYour consignment on vehicle *${activeVehicle.num}* is currently in transit (${activeVehicle.source} ➔ ${activeVehicle.dest}).\n\n` +
                            `📍 Live Satellite Tracking & ETA Link:\n👉 ${getCustomerTrackingUrl(activeVehicle.shareToken || `TRK-${activeVehicle.tripId}`, true)}\n\n` +
                            `Current Status: ${activeVehicle.eta || 'In Transit'}`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 text-center"
                        >
                          <MessageSquare className="w-3.5 h-3.5 fill-current" />
                          <span>Share Tracking Link with Customer</span>
                        </a>

                        <div className="flex items-center gap-1.5">
                          <a
                            href={getCustomerTrackingUrl(activeVehicle.shareToken || `TRK-${activeVehicle.tripId}`)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 text-center"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Preview Customer View</span>
                          </a>

                          <button
                            onClick={() => {
                              const link = getCustomerTrackingUrl(activeVehicle.shareToken || `TRK-${activeVehicle.tripId}`, true);
                              navigator.clipboard.writeText(link);
                              alert(`Copied Customer Live Tracking Magic Link:\n${link}\n\nAny customer can open this link on their mobile or desktop browser without logging in!`);
                            }}
                            className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1"
                            title="Copy customer link to clipboard"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Current Address & Location Details */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                            Corridor Location
                          </span>
                          <span className="text-xs font-bold text-white block truncate">
                            {activeVehicle.currentAddress || `${activeVehicle.source} to ${activeVehicle.dest} Express Corridor`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[11px]">
                        <div className="font-mono text-slate-300 font-bold flex items-center gap-1">
                          <Compass className="w-3 h-3 text-blue-400" />
                          <span>{activeVehicle.currentLat?.toFixed(4)}° N, {activeVehicle.currentLng?.toFixed(4)}° E</span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${activeVehicle.currentLat}, ${activeVehicle.currentLng}`);
                            setCopiedCoords(true);
                            setTimeout(() => setCopiedCoords(false), 2000);
                          }}
                          className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/50 transition"
                        >
                          {copiedCoords ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedCoords ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>

                    {/* Real-Time Telemetry Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2">
                        <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
                          <span className="flex items-center gap-1 font-semibold">
                            <Gauge className="w-3 h-3 text-blue-400" /> Speed
                          </span>
                          <span className="text-emerald-400 font-bold">
                            {(activeVehicle.speed || 0) > 0 ? 'Moving' : 'Halted'}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-white">{activeVehicle.speed || 0}</span>
                          <span className="text-xs text-slate-400 font-bold">km/h</span>
                        </div>
                      </div>

                      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2">
                        <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
                          <span className="flex items-center gap-1 font-semibold">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Accuracy
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-emerald-400">
                            ±{activeVehicle.accuracy || (activeVehicle.sourceType === "SIM_TRACKING" ? 500 : 8)}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">m</span>
                        </div>
                      </div>

                      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2">
                        <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
                          <span className="flex items-center gap-1 font-semibold">
                            <Compass className="w-3 h-3 text-indigo-400" /> Heading
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-bold text-white">{activeVehicle.heading || 0}°</span>
                          <span className="text-xs text-slate-400 font-bold">({getHeadingCardinal(activeVehicle.heading)})</span>
                        </div>
                      </div>

                      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2">
                        <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
                          <span className="flex items-center gap-1 font-semibold">
                            <Clock className="w-3 h-3 text-amber-400" /> Ping Age
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-200 truncate pt-0.5">
                          {activeVehicle.lastPingAgo || "Just now"}
                        </div>
                      </div>
                    </div>

                    {/* Corridor Progress Bar & Dynamic ETA */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span> {activeVehicle.source}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span> {activeVehicle.dest}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-400" /> Dynamic ETA:
                        </span>
                        <strong className="text-emerald-400 font-black">{activeVehicle.eta || "In Transit"}</strong>
                      </div>

                      {trailHistory.length > 0 && (
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                          <span>Breadcrumbs: <strong className="text-amber-400">{trailHistory.length} recorded</strong></span>
                          <span className="text-emerald-400 font-semibold">Corridor Active</span>
                        </div>
                      )}
                    </div>

                    {/* SMART GEOFENCING & AUTOMATED HUB MILESTONES (TAT TRACKER) */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                            <MapPin className="w-3 h-3" />
                          </div>
                          <span className="text-xs font-black tracking-wide text-white">
                            Smart Geofencing & Hub Milestones
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          activeVehicle.loadingSlaStatus === 'DETENTION'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : activeVehicle.isInsideOriginGeofence
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : activeVehicle.isInsideDestGeofence
                                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {activeVehicle.isInsideOriginGeofence
                            ? '🟢 In Loading Dock'
                            : activeVehicle.isInsideDestGeofence
                              ? '🏁 In Consignee Dock'
                              : activeVehicle.currentHubStatus === 'APPROACHING_DESTINATION'
                                ? '⏳ Approaching Dest Hub'
                                : '🚚 Highway Transit'}
                        </span>
                      </div>

                      {/* 4-Step Milestone Stepper */}
                      <div className="relative pt-1 pb-1">
                        <div className="absolute top-4 left-3 right-3 h-0.5 bg-slate-800 -z-0"></div>
                        <div className="grid grid-cols-4 gap-1 relative z-10 text-center">
                          {/* Step 1: Dispatched / Loading */}
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                              activeVehicle.isInsideOriginGeofence
                                ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20 animate-pulse'
                                : 'bg-emerald-600 text-white'
                            }`}>
                              ✓
                            </div>
                            <span className="text-[10px] font-bold text-white mt-1">Origin Hub</span>
                            <span className="text-[9px] text-slate-400 truncate max-w-[70px]">
                              {activeVehicle.isInsideOriginGeofence ? 'Loading Dock' : 'Gate Out'}
                            </span>
                          </div>

                          {/* Step 2: En Route */}
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                              !activeVehicle.isInsideOriginGeofence && !activeVehicle.isInsideDestGeofence && activeVehicle.currentHubStatus !== 'APPROACHING_DESTINATION'
                                ? 'bg-blue-500 text-white ring-4 ring-blue-500/20 animate-pulse'
                                : activeVehicle.currentHubStatus === 'APPROACHING_DESTINATION' || activeVehicle.isInsideDestGeofence
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-800 text-slate-500'
                            }`}>
                              🚚
                            </div>
                            <span className="text-[10px] font-bold text-white mt-1">Transit</span>
                            <span className="text-[9px] text-slate-400 truncate max-w-[70px]">
                              {Math.round(activeVehicle.distanceToDestKm || 0)} km left
                            </span>
                          </div>

                          {/* Step 3: Approaching (<15 km) */}
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                              activeVehicle.currentHubStatus === 'APPROACHING_DESTINATION'
                                ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20 animate-pulse'
                                : activeVehicle.isInsideDestGeofence
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-800 text-slate-500'
                            }`}>
                              ⏳
                            </div>
                            <span className="text-[10px] font-bold text-white mt-1">Arrival Prep</span>
                            <span className="text-[9px] text-slate-400 truncate max-w-[70px]">
                              {activeVehicle.distanceToDestKm <= 15 ? '< 15 km' : 'Pending'}
                            </span>
                          </div>

                          {/* Step 4: Consignee Gate Entry */}
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                              activeVehicle.isInsideDestGeofence
                                ? 'bg-violet-500 text-white ring-4 ring-violet-500/20 animate-pulse'
                                : 'bg-slate-800 text-slate-500'
                            }`}>
                              🏁
                            </div>
                            <span className="text-[10px] font-bold text-white mt-1">Consignee</span>
                            <span className="text-[9px] text-slate-400 truncate max-w-[70px]">
                              {activeVehicle.isInsideDestGeofence ? 'Unloading' : 'Gate Entry'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dock Dwell & Turnaround Time (TAT) Analytics */}
                      <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 flex items-center gap-1 font-semibold">
                            <Clock className="w-3 h-3 text-emerald-400" />
                            <span>Loading Dock Turnaround (TAT):</span>
                          </span>
                          <strong className="text-white font-mono font-bold">
                            {activeVehicle.loadingTatFormatted || "1h 15m"}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                          <span>SLA Allowance (Free Time): <strong>3.0 Hours</strong></span>
                          <span className={`font-bold px-1.5 py-0.2 rounded ${
                            activeVehicle.loadingSlaStatus === 'DETENTION'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}>
                            {activeVehicle.loadingSlaStatus === 'DETENTION' ? 'Detention Dwell' : 'Within SLA'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                          <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                            <span className="text-slate-500 block">Origin Hub Geofence:</span>
                            <span className="font-semibold text-slate-300">
                              {activeVehicle.isInsideOriginGeofence 
                                ? '🟢 Vehicle Inside Geofence (1 km)' 
                                : `Exited (${activeVehicle.distanceToOriginKm?.toFixed(1) || 0} km away)`}
                            </span>
                          </div>
                          <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                            <span className="text-slate-500 block">Dest Hub Geofence:</span>
                            <span className="font-semibold text-slate-300">
                              {activeVehicle.isInsideDestGeofence 
                                ? '🏁 Gate In Passed (Inside 1 km)' 
                                : `${Math.round(activeVehicle.distanceToDestKm || 0)} km to Geofence`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* OPTIONAL DEMO / MOTION SIMULATOR ACCORDION */}
                    <div className="border border-slate-800/80 rounded-xl bg-slate-950/60 overflow-hidden">
                      <button
                        onClick={() => setShowDemoTools(!showDemoTools)}
                        className="w-full p-2.5 flex items-center justify-between text-slate-400 hover:text-slate-200 text-xs font-bold transition"
                      >
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Indoor Demo / Cruise Simulator (Optional)</span>
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showDemoTools ? 'rotate-180 text-blue-400' : ''}`} />
                      </button>

                      {showDemoTools && (
                        <div className="p-3 border-t border-slate-800/80 space-y-2.5 bg-slate-900/50 animate-in fade-in duration-200">
                          <p className="text-[11px] text-slate-400 leading-tight">
                            Use this slider and play controls for client demos when a real truck is not physically on the highway.
                          </p>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setIsDriveSimulating(!isDriveSimulating)}
                              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow ${
                                isDriveSimulating
                                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                                  : 'bg-blue-600 hover:bg-blue-500 text-white'
                              }`}
                            >
                              {isDriveSimulating ? (
                                <>
                                  <Pause className="w-3.5 h-3.5" /> Pause Cruise
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5 fill-current" /> Start Demo Cruise
                                </>
                              )}
                            </button>

                            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-700 text-[10px] font-bold">
                              {[1, 2, 4].map((mult) => (
                                <button
                                  key={mult}
                                  onClick={() => setSimSpeedMult(mult)}
                                  className={`px-2 py-1 rounded transition ${
                                    simSpeedMult === mult ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {mult}x
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Route Scrubber Slider */}
                          <div className="space-y-1 pt-1">
                            <div className="flex justify-between items-center text-[10px] text-slate-400">
                              <span>Origin ({activeVehicle.source})</span>
                              <span className="text-blue-300 font-bold">{Math.round(simProgress * 100)}% Traveled</span>
                              <span>Destination ({activeVehicle.dest})</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={simProgress}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setSimProgress(val);
                                if (activeRouteCoords && activeRouteCoords.length > 2) {
                                  const totalPts = activeRouteCoords.length;
                                  const targetIdx = Math.min(Math.floor(val * (totalPts - 1)), totalPts - 1);
                                  const curPt = activeRouteCoords[targetIdx];
                                  const nextPt = activeRouteCoords[Math.min(targetIdx + 1, totalPts - 1)];
                                  const brng = calculateBearing(curPt[0], curPt[1], nextPt[0], nextPt[1]);
                                  setActiveVehicle((curr: any) => ({
                                    ...curr,
                                    currentLat: curPt[0],
                                    currentLng: curPt[1],
                                    heading: brng
                                  }));
                                } else if (activeVehicle.srcLat && activeVehicle.destLat) {
                                  const newLat = activeVehicle.srcLat + (activeVehicle.destLat - activeVehicle.srcLat) * val;
                                  const newLng = activeVehicle.srcLng + (activeVehicle.destLng - activeVehicle.srcLng) * val;
                                  const bearing = calculateBearing(activeVehicle.srcLat, activeVehicle.srcLng, activeVehicle.destLat, activeVehicle.destLng);
                                  setActiveVehicle((curr: any) => ({
                                    ...curr,
                                    currentLat: newLat,
                                    currentLng: newLng,
                                    heading: bearing
                                  }));
                                }
                              }}
                              className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setAutoFollow(!autoFollow)}
                        className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition ${
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
                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                        Driver App
                      </a>
                    </div>
                  </div>
                </div>
              )}
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
                {selectableTrips.length > 0 ? (
                  <select
                    value={testTripId}
                    onChange={async (e) => {
                      const id = Number(e.target.value);
                      setTestTripId(id);
                      const selected = selectableTrips.find((v) => v.tripId === id);
                      if (selected && selected.currentLat && selected.currentLat !== 0) {
                        setTestLat(selected.currentLat);
                        setTestLng(selected.currentLng);
                        setTestSpeed(selected.speed !== undefined ? selected.speed : 45);
                      } else {
                        try {
                          const tel = await fetchApi(`/Locations/trip/${id}/telemetry`, { forceRefresh: true });
                          if (tel && tel.currentLat) {
                            setTestLat(tel.currentLat);
                            setTestLng(tel.currentLng);
                            setTestSpeed(tel.speed || 45);
                          }
                        } catch {}
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {selectableTrips.map((v) => (
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
