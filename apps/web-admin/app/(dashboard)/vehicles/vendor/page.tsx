"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td } from "@/components/PrototypeUI";
import { 
  Search, 
  Grid, 
  List, 
  Plus, 
  CreditCard, 
  X, 
  Activity, 
  Target, 
  MapPin, 
  Truck, 
  Phone, 
  Radio, 
  ShieldCheck, 
  Compass, 
  ExternalLink 
} from "lucide-react";
import { calculateHaversineKm } from "@/lib/routing";

interface Vehicle {
  id: number;
  vehicleNumber: string;
  code: string;
  type: string;
  capacity: number;
  ownerName: string;
  rcNumber: string;
  insuranceExpiry: string;
  permitExpiry: string;
  fitnessExpiry: string;
  vendorId: number;
  vendor?: { name: string; phone?: string; city?: string; state?: string };
  status: string;

  // Dynamic Location & Proximity Fields
  currentLat?: number;
  currentLng?: number;
  currentAddress?: string;
  trackingStatus?: string;
  trackingType?: string;
  distanceFromPincodeKm?: number;
  isNearby?: boolean;
}

interface Vendor {
  id: number;
  name: string;
  phone?: string;
  city?: string;
  state?: string;
}

const DEFAULT_FORM = {
  id: 0,
  vehicleNumber: "",
  code: "",
  type: "",
  capacity: "",
  ownerName: "",
  rcNumber: "",
  insuranceExpiry: "",
  permitExpiry: "",
  fitnessExpiry: "",
  vendorId: "",
  status: "Active"
};

export default function VendorFleetVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Pincode & Pickup Location Proximity Discovery State
  const [pickupPincodeInput, setPickupPincodeInput] = useState("");
  const [pincodeRegion, setPincodeRegion] = useState<{
    pincode: string;
    pickupLocation: string;
    lat: number;
    lng: number;
    radiusKm: number;
  } | null>(null);
  const [pickupRadius, setPickupRadius] = useState<number>(50); // Default 50 km coverage
  const [isSearchingPin, setIsSearchingPin] = useState<boolean>(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [vehData, venData, liveFleet] = await Promise.all([
        fetchApi("/Vehicles?isOwnFleet=false"),
        fetchApi("/Vendors"),
        fetchApi("/Locations/live").catch(() => [])
      ]);

      const liveMap = new Map<number, any>();
      if (Array.isArray(liveFleet)) {
        liveFleet.forEach((f: any) => {
          if (f.vehicleId) liveMap.set(f.vehicleId, f);
        });
      }

      const mergedVehicles = (Array.isArray(vehData) ? vehData : []).map((v: any) => {
        const live = liveMap.get(v.id);
        return {
          ...v,
          currentLat: live?.currentLat || 0,
          currentLng: live?.currentLng || 0,
          currentAddress: live?.currentAddress || (v.vendor?.city ? `${v.vendor.city}, ${v.vendor.state || 'India'}` : "Vendor Base Depot"),
          trackingStatus: live ? live.trackingStatus || "LIVE" : "BASE_DEPOT",
          trackingType: live ? live.trackingType || "MOBILE_GPS" : "DEPOT",
        };
      });

      setVehicles(mergedVehicles);
      setVendors(Array.isArray(venData) ? venData : []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Trigger Pincode or Locality Discovery Query
  const searchByPincode = async (queryOrPin: string, radius: number = pickupRadius) => {
    const cleanQuery = queryOrPin.trim();
    if (!cleanQuery || cleanQuery.length < 3) return;

    setIsSearchingPin(true);
    try {
      const res = await fetchApi(`/Vehicles/nearby?pincode=${encodeURIComponent(cleanQuery)}&radiusKm=${radius}&isOwnFleet=false`);
      if (res && res.latitude && res.longitude) {
        setPincodeRegion({
          pincode: res.pincode || cleanQuery,
          pickupLocation: res.pickupLocation || `PIN ${cleanQuery}`,
          lat: res.latitude,
          lng: res.longitude,
          radiusKm: radius
        });

        // Merge backend nearby/other vehicles into vehicles state with accurate distance
        const allList: Vehicle[] = [
          ...(res.nearbyVehicles || []).map((v: any) => ({ ...v, isNearby: true })),
          ...(res.otherVehicles || []).map((v: any) => ({ ...v, isNearby: false }))
        ];

        if (allList.length > 0) {
          setVehicles(prev => {
            const byId = new Map(allList.map(v => [v.id, v]));
            return prev.map(p => byId.get(p.id) || p);
          });
        }
      }
    } catch (err) {
      console.error("Pincode vehicle search error:", err);
    } finally {
      setIsSearchingPin(false);
    }
  };

  // Auto-detect PIN code or locality typed in pickup search bar
  useEffect(() => {
    const query = pickupPincodeInput.trim();
    if (/^[1-9][0-9]{5}$/.test(query)) {
      searchByPincode(query, pickupRadius);
    } else if (query.length >= 3) {
      const timer = setTimeout(() => {
        searchByPincode(query, pickupRadius);
      }, 500);
      return () => clearTimeout(timer);
    } else if (!query && pincodeRegion) {
      setPincodeRegion(null);
    }
  }, [pickupPincodeInput]);

  // When radius changes while pincode is active
  const handleRadiusChange = (newRadius: number) => {
    setPickupRadius(newRadius);
    if (pincodeRegion) {
      setPincodeRegion(prev => prev ? { ...prev, radiusKm: newRadius } : null);
      searchByPincode(pincodeRegion.pincode, newRadius);
    }
  };

  const clearPincodeFilter = () => {
    setPickupPincodeInput("");
    setPincodeRegion(null);
  };

  // Categorize vehicles into "Near Pickup Location" and "Other Locations"
  const { nearbyVehicles, otherVehicles, unifiedVehicles } = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch = (v: Vehicle) => {
      if (!q) return true;
      return (
        v.vehicleNumber?.toLowerCase().includes(q) ||
        v.code?.toLowerCase().includes(q) ||
        v.type?.toLowerCase().includes(q) ||
        v.capacity?.toString().includes(q) ||
        v.ownerName?.toLowerCase().includes(q) ||
        v.rcNumber?.toLowerCase().includes(q) ||
        v.status?.toLowerCase().includes(q) ||
        v.vendor?.name?.toLowerCase().includes(q) ||
        v.currentAddress?.toLowerCase().includes(q)
      );
    };

    if (!pincodeRegion) {
      return {
        nearbyVehicles: [],
        otherVehicles: [],
        unifiedVehicles: vehicles.filter(matchesSearch)
      };
    }

    const calculated = vehicles.map(v => {
      let dist = v.distanceFromPincodeKm;
      if (dist === undefined && v.currentLat && v.currentLng && v.currentLat !== 0) {
        dist = Math.round(calculateHaversineKm(pincodeRegion.lat, pincodeRegion.lng, v.currentLat, v.currentLng) * 10) / 10;
      }
      const isNearby = dist !== undefined ? dist <= pincodeRegion.radiusKm : false;
      return {
        ...v,
        distanceFromPincodeKm: dist,
        isNearby
      };
    });

    const nearby = calculated
      .filter(v => v.isNearby && matchesSearch(v))
      .sort((a, b) => (a.distanceFromPincodeKm ?? 99999) - (b.distanceFromPincodeKm ?? 99999));

    const others = calculated
      .filter(v => !v.isNearby && matchesSearch(v))
      .sort((a, b) => (a.distanceFromPincodeKm ?? 99999) - (b.distanceFromPincodeKm ?? 99999));

    return {
      nearbyVehicles: nearby,
      otherVehicles: others,
      unifiedVehicles: [...nearby, ...others]
    };
  }, [vehicles, searchQuery, pincodeRegion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        capacity: parseFloat(formData.capacity),
        vendorId: parseInt(formData.vendorId),
        insuranceExpiry: formData.insuranceExpiry || null,
        permitExpiry: formData.permitExpiry || null,
        fitnessExpiry: formData.fitnessExpiry || null,
      };

      if (formData.id > 0) {
        await fetchApi(`/Vehicles/${formData.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi("/Vehicles", {
          method: "POST",
          body: JSON.stringify({ ...payload, id: undefined }),
        });
      }
      setFormData(DEFAULT_FORM);
      setIsFormOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to save vehicle");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (v: Vehicle) => {
    setFormData({
      id: v.id,
      vehicleNumber: v.vehicleNumber || "",
      code: v.code || "",
      type: v.type || "",
      capacity: v.capacity?.toString() || "",
      ownerName: v.ownerName || "",
      rcNumber: v.rcNumber || "",
      insuranceExpiry: v.insuranceExpiry ? v.insuranceExpiry.split('T')[0] : "",
      permitExpiry: v.permitExpiry ? v.permitExpiry.split('T')[0] : "",
      fitnessExpiry: v.fitnessExpiry ? v.fitnessExpiry.split('T')[0] : "",
      vendorId: v.vendorId?.toString() || "",
      status: v.status || "Active"
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;
    try {
      await fetchApi(`/Vehicles/${id}`, { method: "DELETE" });
      loadData();
    } catch (error) {
      alert("Failed to delete vehicle");
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "Active") return <span className="px-[8px] py-[3px] bg-[#dcfce7] text-[#166534] rounded-[6px] text-[11px] font-medium border border-[#bbf7d0]">Active</span>;
    if (status === "Maintenance") return <span className="px-[8px] py-[3px] bg-[#fef9c3] text-[#a16207] rounded-[6px] text-[11px] font-medium border border-[#fef08a]">Maintenance</span>;
    return <span className="px-[8px] py-[3px] bg-gray-100 text-gray-700 rounded-[6px] text-[11px] font-medium border border-gray-200">{status || 'Draft'}</span>;
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Vendor Fleet Vehicles</h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">Manage external 3PL and broker fleet capacity with dynamic regional pickup discovery.</p>
        </div>
        <button 
          onClick={() => { setFormData(DEFAULT_FORM); setIsFormOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center justify-center gap-2 text-sm sm:text-base self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          Add Vehicle
        </button>
      </div>

      {/* Search & Pincode Discovery Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 p-3 sm:p-4 mb-6 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Main Keyword Search */}
          <div className="flex items-center px-3 gap-2.5 flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Search by reg number, type, capacity, vendor name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none text-xs sm:text-sm text-slate-800 font-medium placeholder:text-slate-400 py-2 sm:py-2.5 min-w-0"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors shrink-0"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Pickup PIN Code or Locality Search Input */}
          <div className="flex items-center px-3 gap-2.5 w-full lg:w-96 bg-blue-50/60 border border-blue-200 rounded-xl focus-within:bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <Target className="w-4 h-4 text-blue-600 shrink-0 animate-pulse" />
            <input 
              type="text" 
              placeholder="Search pickup PIN or Locality (e.g. 560058 or Peenya)..." 
              value={pickupPincodeInput}
              onChange={(e) => setPickupPincodeInput(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none text-xs sm:text-sm text-slate-900 font-bold placeholder:text-blue-400/80 placeholder:font-normal py-2 sm:py-2.5 min-w-0"
            />
            {isSearchingPin && <Activity className="w-4 h-4 text-blue-600 animate-spin shrink-0" />}
            {pickupPincodeInput && (
              <button 
                onClick={clearPincodeFilter}
                className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition-colors shrink-0"
                title="Clear PIN filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 justify-end shrink-0">
            <button onClick={() => setViewMode('grid')} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-colors ${viewMode === 'grid' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
              <Grid className="w-4 h-4" /> Grid
            </button>
            <button onClick={() => setViewMode('list')} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-colors ${viewMode === 'list' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
              <List className="w-4 h-4" /> Table
            </button>
          </div>
        </div>

        {/* Quick Indian Pickup PIN Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Compass className="w-3 h-3 text-blue-500" /> Quick Pickup Hubs:
          </span>
          {[
            { pin: "560058", name: "Peenya (Bangalore)" },
            { pin: "400099", name: "Andheri (Mumbai)" },
            { pin: "411001", name: "Pune Station" },
            { pin: "110020", name: "Okhla (Delhi)" },
            { pin: "600001", name: "Chennai Port" }
          ].map((preset) => (
            <button
              key={preset.pin}
              onClick={() => {
                setPickupPincodeInput(preset.pin);
                searchByPincode(preset.pin, pickupRadius);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all shrink-0 flex items-center gap-1 ${
                pincodeRegion?.pincode === preset.pin
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-200'
              }`}
            >
              <span className="font-mono font-bold">{preset.pin}</span>
              <span className="text-[10px] opacity-75">• {preset.name}</span>
            </button>
          ))}
        </div>

        {/* Active Pincode Region Discovery Radar Banner */}
        {pincodeRegion && (
          <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-3.5 sm:p-4 rounded-xl shadow-md border border-blue-500/40 animate-in fade-in slide-in-from-top-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-blue-400 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black tracking-wide text-white">
                      Pickup PIN: {pincodeRegion.pincode}
                    </span>
                    <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Regional Radar Active
                    </span>
                  </div>
                  <p className="text-xs text-blue-200 truncate mt-0.5">
                    {pincodeRegion.pickupLocation}
                  </p>
                </div>
              </div>

              {/* Radius Pills & Vehicle Counts */}
              <div className="flex items-center gap-3 flex-wrap justify-between sm:justify-end">
                <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-700/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Radius:</span>
                  {[25, 50, 100, 250].map((rad) => (
                    <button
                      key={rad}
                      onClick={() => handleRadiusChange(rad)}
                      className={`px-2 py-0.5 text-xs font-bold rounded-md transition ${
                        pickupRadius === rad
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {rad} km
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-600/50">
                    🎯 {nearbyVehicles.length} Nearby
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                    🚚 {otherVehicles.length} Other Locs
                  </span>
                  <button
                    onClick={clearPincodeFilter}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                    title="Clear PIN filter"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-3 text-slate-500">
          <Activity className="animate-spin text-blue-600 w-8 h-8" />
          <span className="text-sm font-semibold">Loading vendor fleet capacity...</span>
        </div>
      ) : unifiedVehicles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-20 flex flex-col items-center justify-center text-center mt-2">
           <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
             <CreditCard className="w-8 h-8" />
           </div>
           <h3 className="text-xl font-bold text-slate-900 mb-2">
             {searchQuery || pincodeRegion ? "No matching vehicles found" : "No vehicles found"}
           </h3>
           <p className="text-slate-500 text-[14.5px] mb-8 max-w-sm">
             {pincodeRegion
               ? `No vendor vehicles found near PIN ${pincodeRegion.pincode} or matching "${searchQuery}". Try expanding the radius to 250 km or clearing the filter.`
               : searchQuery 
                 ? `No vehicles matched "${searchQuery}". Try another search keyword.` 
                 : "You haven't added any vehicles to your fleet yet."}
           </p>
           {(searchQuery || pincodeRegion) ? (
             <button
               onClick={() => { setSearchQuery(""); clearPincodeFilter(); }}
               className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl transition-all"
             >
               Clear All Filters
             </button>
           ) : (
             <button 
               onClick={() => { setFormData(DEFAULT_FORM); setIsFormOpen(true); }}
               className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center gap-2"
             >
               <Plus className="w-5 h-5" />
               Add First Vehicle
             </button>
           )}
        </div>
      ) : pincodeRegion ? (
        /* TWO-TIER REGIONAL PINCODE VEHICLE LISTING */
        <div className="space-y-8">
          {/* SECTION 1: 🎯 NEAR PICKUP LOCATION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 font-black">
                  🎯
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    Available Near Pickup Location
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {nearbyVehicles.length} Vehicles within {pickupRadius} km
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Prioritized for fastest turnaround and immediate pickup at PIN {pincodeRegion.pincode}
                  </p>
                </div>
              </div>
            </div>

            {nearbyVehicles.length === 0 ? (
              <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-6 text-center text-slate-600">
                <p className="text-sm font-semibold text-emerald-900">
                  No vendor vehicles currently within {pickupRadius} km of PIN {pincodeRegion.pincode}.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Try expanding the radius to 100 km or 250 km above, or check available vehicles from other regions below.
                </p>
              </div>
            ) : viewMode === 'list' ? (
              <div className="bg-white rounded-2xl shadow-sm ring-1 ring-emerald-300/80 overflow-hidden">
                <ProtoTable headers={["CODE", "REG. NUMBER", "TYPE", "CAPACITY", "VENDOR", "PROXIMITY & LOCATION", "STATUS", "ACTIONS"]}>
                  {nearbyVehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-emerald-50/40 transition-colors cursor-pointer group bg-emerald-50/10" onClick={() => handleEdit(v)}>
                      <Td className="font-mono text-[12px]">{v.code || "—"}</Td>
                      <Td className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {v.vehicleNumber}
                      </Td>
                      <Td>{v.type}</Td>
                      <Td className="font-semibold">{v.capacity} Tons</Td>
                      <Td className="text-[12px]">
                        <div className="font-semibold text-slate-800">{v.vendor?.name || `Vendor #${v.vendorId}`}</div>
                        {v.vendor?.phone && <span className="text-[11px] text-slate-400 font-mono">📞 {v.vendor.phone}</span>}
                      </Td>
                      <Td>
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full w-fit">
                            <Target className="w-3 h-3 text-emerald-600" />
                            🎯 {v.distanceFromPincodeKm} km from Pickup
                          </span>
                          <span className="text-[11px] text-slate-500 truncate max-w-[200px]" title={v.currentAddress}>
                            📍 {v.currentAddress || "Depot Location"}
                          </span>
                        </div>
                      </Td>
                      <Td>{getStatusBadge(v.status)}</Td>
                      <Td>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }}
                          className="text-muted-text hover:text-red-500 text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Delete
                        </button>
                      </Td>
                    </tr>
                  ))}
                </ProtoTable>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {nearbyVehicles.map((v) => (
                  <div key={v.id} onClick={() => handleEdit(v)} className="bg-white border-2 border-emerald-300/80 rounded-2xl p-5 hover:shadow-xl transition-all cursor-pointer group relative flex flex-col h-full overflow-hidden shadow-emerald-500/5">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400" />
                    
                    <div className="flex justify-between items-start mb-3 pt-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-mono font-bold text-slate-900 text-base uppercase tracking-wider">{v.vehicleNumber}</h3>
                          <p className="text-[11px] font-mono text-slate-500">{v.code || "NO-CODE"}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                        🎯 {v.distanceFromPincodeKm} km
                      </span>
                    </div>

                    <div className="flex-1 space-y-2 mb-4 mt-1 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-400 uppercase">Type / Cap</span>
                        <span className="font-bold text-slate-800">{v.type} • {v.capacity}T</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-400 uppercase">Vendor</span>
                        <span className="font-bold text-slate-800 truncate max-w-[150px]">{v.vendor?.name || `Vendor #${v.vendorId}`}</span>
                      </div>
                      <div className="flex items-start justify-between text-xs pt-1 border-t border-slate-200/60">
                        <span className="font-semibold text-slate-400 uppercase">Location</span>
                        <span className="font-medium text-slate-700 text-right truncate max-w-[150px]" title={v.currentAddress}>
                          📍 {v.currentAddress || "Base Depot"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <div>{getStatusBadge(v.status)}</div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }}
                        className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: 🚚 OTHER FLEET LOCATIONS */}
          <div className="space-y-3 pt-4 border-t-2 border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-black">
                  🚚
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                    Other Fleet Locations
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {otherVehicles.length} Vehicles Outside Pickup Radius
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Vehicles located in other regional hubs, depots, and highway corridors
                  </p>
                </div>
              </div>
            </div>

            {otherVehicles.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-6 text-center text-slate-500 text-sm">
                All available matching vehicles are already within your pickup radius!
              </div>
            ) : viewMode === 'list' ? (
              <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 overflow-hidden">
                <ProtoTable headers={["CODE", "REG. NUMBER", "TYPE", "CAPACITY", "VENDOR", "PROXIMITY & LOCATION", "STATUS", "ACTIONS"]}>
                  {otherVehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => handleEdit(v)}>
                      <Td className="font-mono text-[12px]">{v.code || "—"}</Td>
                      <Td className="font-mono font-semibold">{v.vehicleNumber}</Td>
                      <Td>{v.type}</Td>
                      <Td>{v.capacity} Tons</Td>
                      <Td className="text-[12px]">{v.vendor?.name || `Vendor #${v.vendorId}`}</Td>
                      <Td>
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full w-fit">
                            <Compass className="w-3 h-3 text-slate-500" />
                            {v.distanceFromPincodeKm !== undefined ? `${v.distanceFromPincodeKm} km away` : "Distance N/A"}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate max-w-[200px]" title={v.currentAddress}>
                            📍 {v.currentAddress || "Depot Location"}
                          </span>
                        </div>
                      </Td>
                      <Td>{getStatusBadge(v.status)}</Td>
                      <Td>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }}
                          className="text-muted-text hover:text-red-500 text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Delete
                        </button>
                      </Td>
                    </tr>
                  ))}
                </ProtoTable>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {otherVehicles.map((v) => (
                  <div key={v.id} onClick={() => handleEdit(v)} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer group relative flex flex-col h-full overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-400 to-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                          <span className="text-[16px]">🚛</span>
                        </div>
                        <div>
                          <h3 className="font-mono font-bold text-slate-900 text-lg uppercase tracking-wider">{v.vehicleNumber}</h3>
                          <p className="text-xs font-mono text-slate-500">{v.code || "NO-CODE"}</p>
                        </div>
                      </div>
                      {v.distanceFromPincodeKm !== undefined && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {v.distanceFromPincodeKm} km
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-3 mb-6 mt-2">
                      <div className="flex items-center text-sm text-slate-600">
                        <span className="w-[80px] text-xs font-bold text-slate-400 uppercase tracking-wider">Type</span>
                        <span className="font-medium">{v.type}</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <span className="w-[80px] text-xs font-bold text-slate-400 uppercase tracking-wider">Capacity</span>
                        <span className="font-medium">{v.capacity} Tons</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <span className="w-[80px] text-xs font-bold text-slate-400 uppercase tracking-wider">Vendor</span>
                        <span className="truncate">{v.vendor?.name || `Vendor #${v.vendorId}`}</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <span className="w-[80px] text-xs font-bold text-slate-400 uppercase tracking-wider">Location</span>
                        <span className="truncate text-xs text-slate-500" title={v.currentAddress}>
                          📍 {v.currentAddress || "Base Depot"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <div>{getStatusBadge(v.status)}</div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }}
                        className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* STANDARD UNIFIED FLEET LISTING (WHEN NO PINCODE FILTER) */
        viewMode === 'list' ? (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 overflow-hidden">
            <ProtoTable headers={["CODE", "REG. NUMBER", "TYPE", "CAPACITY", "VENDOR", "CURRENT LOCATION", "STATUS", "ACTIONS"]}>
              {unifiedVehicles.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => handleEdit(v)}>
                  <Td className="font-mono text-[12px]">{v.code || "—"}</Td>
                  <Td className="font-mono font-semibold">{v.vehicleNumber}</Td>
                  <Td>{v.type}</Td>
                  <Td>{v.capacity} Tons</Td>
                  <Td className="text-[12px]">{v.vendor?.name || `Vendor #${v.vendorId}`}</Td>
                  <Td className="text-[12px] text-slate-600">
                    <span className="truncate block max-w-[220px]" title={v.currentAddress}>
                      📍 {v.currentAddress || "Base Depot"}
                    </span>
                  </Td>
                  <Td>{getStatusBadge(v.status)}</Td>
                  <Td>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }}
                      className="text-muted-text hover:text-red-500 text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Delete
                    </button>
                  </Td>
                </tr>
              ))}
            </ProtoTable>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {unifiedVehicles.map((v) => (
              <div key={v.id} onClick={() => handleEdit(v)} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer group relative flex flex-col h-full overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                      <span className="text-[16px]">🚛</span>
                    </div>
                    <div>
                      <h3 className="font-mono font-bold text-slate-900 text-lg uppercase tracking-wider">{v.vehicleNumber}</h3>
                      <p className="text-xs font-mono text-slate-500">{v.code || "NO-CODE"}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 space-y-3 mb-6 mt-2">
                  <div className="flex items-center text-sm text-slate-600">
                    <span className="w-[80px] text-xs font-bold text-slate-400 uppercase tracking-wider">Type</span>
                    <span className="font-medium">{v.type}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <span className="w-[80px] text-xs font-bold text-slate-400 uppercase tracking-wider">Capacity</span>
                    <span className="font-medium">{v.capacity} Tons</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <span className="w-[80px] text-xs font-bold text-slate-400 uppercase tracking-wider">Vendor</span>
                    <span className="truncate">{v.vendor?.name || `Vendor #${v.vendorId}`}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <span className="w-[80px] text-xs font-bold text-slate-400 uppercase tracking-wider">Location</span>
                    <span className="truncate text-xs text-slate-500" title={v.currentAddress}>
                      📍 {v.currentAddress || "Base Depot"}
                    </span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div>
                    {getStatusBadge(v.status)}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }}
                    className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Slide-over Form Panel */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsFormOpen(false)} 
          />
          
          {/* Slide-over Panel */}
          <div className="relative w-full sm:max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200">
             {/* Form Header */}
             <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <div>
                 <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">{formData.id > 0 ? "Edit Vehicle" : "New Vehicle"}</h3>
                 <p className="text-[12px] sm:text-[13px] font-medium text-slate-500 mt-0.5">{formData.id > 0 ? "Update details" : "Add a new vehicle to fleet"}</p>
               </div>
               <button 
                 onClick={() => setIsFormOpen(false)} 
                 className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>
             
             {/* Form Body - Scrollable */}
             <div className="flex-1 overflow-y-auto p-4 sm:p-6 touch-scroll custom-table-scroll">
               <form id="vehicleForm" onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Reg. Number</label>
                      <input required value={formData.vehicleNumber} onChange={e => setFormData({...formData, vehicleNumber: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm uppercase" placeholder="KA01AB1234" />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Code</label>
                      <input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm uppercase" placeholder="VEH-001" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Type</label>
                      <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm">
                        <option value="">Select Type</option>
                        <optgroup label="Open Body">
                          <option value="14 ft Open Body">14 ft Open Body</option>
                          <option value="17 ft Open Body">17 ft Open Body</option>
                          <option value="19 ft Open Body">19 ft Open Body</option>
                          <option value="20 ft Open Body">20 ft Open Body</option>
                          <option value="22 ft Open Body">22 ft Open Body</option>
                          <option value="24 ft Open Body">24 ft Open Body</option>
                          <option value="28 ft Open Body">28 ft Open Body</option>
                          <option value="32 ft Open Body">32 ft Open Body</option>
                        </optgroup>
                        <optgroup label="Container / Closed">
                          <option value="20 ft Container">20 ft Container</option>
                          <option value="24 ft Container">24 ft Container</option>
                          <option value="28 ft Container">28 ft Container</option>
                          <option value="32 ft Multi-Axle">32 ft Multi-Axle</option>
                          <option value="32 ft Single Axle">32 ft Single Axle</option>
                          <option value="32 ft HQ Container">32 ft HQ Container</option>
                        </optgroup>
                        <optgroup label="Trailers">
                          <option value="40 ft High Bed Trailer">40 ft High Bed Trailer</option>
                          <option value="40 ft Semi Bed Trailer">40 ft Semi Bed Trailer</option>
                          <option value="40 ft Low Bed Trailer">40 ft Low Bed Trailer</option>
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Capacity (Tons)</label>
                      <input type="number" step="0.1" required value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="e.g. 7.5" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Owner Name</label>
                      <input value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="Owner/Transporter name" />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">RC Number</label>
                      <input value={formData.rcNumber} onChange={e => setFormData({...formData, rcNumber: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm uppercase" placeholder="RC12345678" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Assign Vendor</label>
                    <select required value={formData.vendorId} onChange={e => setFormData({...formData, vendorId: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm">
                      <option value="">Select Vendor</option>
                      {vendors.map(ven => (
                        <option key={ven.id} value={ven.id}>{ven.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Insurance Exp</label>
                      <input type="date" value={formData.insuranceExpiry} onChange={e => setFormData({...formData, insuranceExpiry: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[13px] bg-slate-50 text-slate-800 font-medium outline-none focus:border-blue-500 shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Permit Exp</label>
                      <input type="date" value={formData.permitExpiry} onChange={e => setFormData({...formData, permitExpiry: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[13px] bg-slate-50 text-slate-800 font-medium outline-none focus:border-blue-500 shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Fitness Exp</label>
                      <input type="date" value={formData.fitnessExpiry} onChange={e => setFormData({...formData, fitnessExpiry: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[13px] bg-slate-50 text-slate-800 font-medium outline-none focus:border-blue-500 shadow-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm">
                      <option value="Active">Active</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
               </form>
             </div>
             
             {/* Form Footer */}
             <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex gap-3">
               <button 
                 type="button" 
                 onClick={() => setIsFormOpen(false)} 
                 className="flex-1 px-4 py-2.5 sm:py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition-colors text-sm"
               >
                 Cancel
               </button>
               <button 
                 type="submit" 
                 form="vehicleForm" 
                 disabled={isSubmitting} 
                 className="flex-1 px-4 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
               >
                 {isSubmitting ? <Activity className="w-4 h-4 animate-spin" /> : formData.id > 0 ? "Update Vehicle" : "Create Vehicle"}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
