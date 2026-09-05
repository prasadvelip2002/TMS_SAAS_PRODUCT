"use client";

import { useEffect, useState } from "react";
import { fetchApi, getCustomerRates } from "@/lib/api";
import { ProtoTable, Td } from "@/components/PrototypeUI";
import { Search, Grid, List, Plus, FileText, X, Activity, MapPin, Trash2, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { formatTime12H } from "@/lib/utils";

interface Indent {
  id: number;
  customerId: number;
  customer?: { name: string; gstin: string };
  source: string;
  destination: string;
  material: string;
  weight: number;
  vehicleType: string;
  loadingDate: string;
  loadingTime?: string;
  status: string;
  destinationsJson?: string;
  warehouseLocation?: string;
}

const DEFAULT_FORM = {
  id: 0,
  customerId: "",
  source: "",
  destination: "",
  material: "",
  weight: "",
  vehicleType: "",
  loadingDate: new Date().toISOString().split('T')[0],
  loadingTime: "10:00",
  status: "New",
  customerRate: "",
  pricingModel: "CaseToCase",
  warehouseLocation: ""
};

export default function IndentsPage() {
  const [indents, setIndents] = useState<Indent[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Annual Contract state for active customer
  const [customerContractRates, setCustomerContractRates] = useState<any[]>([]);
  const [isContractLoading, setIsContractLoading] = useState(false);
  const [isCustomSource, setIsCustomSource] = useState(false);
  const [isCustomDestination, setIsCustomDestination] = useState(false);
  const [contractRateBadge, setContractRateBadge] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [indData, custData, tripsData] = await Promise.all([
        fetchApi("/Indents"),
        fetchApi("/Customers"),
        fetchApi("/Trips")
      ]);
      
      const tripsByIndent = (tripsData || []).reduce((acc: any, trip: any) => {
        acc[trip.indentId] = trip;
        return acc;
      }, {});

      setIndents((indData || []).map((i: any) => {
        i.trip = tripsByIndent[i.id];
        return i;
      }));
      setCustomers(custData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Customer Selection
  const handleCustomerSelect = async (selectedId: string) => {
    setFormData(prev => ({
      ...prev,
      customerId: selectedId,
      source: "",
      destination: "",
      customerRate: ""
    }));
    setCustomerContractRates([]);
    setIsCustomSource(false);
    setIsCustomDestination(false);
    setContractRateBadge(null);

    if (!selectedId) return;

    const cust = customers.find(c => c.id.toString() === selectedId);
    if (!cust) return;

    const isContract = cust.customerType === "Contract" || (cust.rateContract && cust.rateContract !== "Draft");
    if (isContract) {
      setFormData(prev => ({ ...prev, pricingModel: "AnnualContract" }));
    } else {
      setFormData(prev => ({ ...prev, pricingModel: "CaseToCase" }));
    }

    setIsContractLoading(true);
    try {
      const rates = await getCustomerRates(parseInt(selectedId));
      if (rates && rates.length > 0) {
        setCustomerContractRates(rates);
        setFormData(prev => ({ ...prev, pricingModel: "AnnualContract" }));

        // Check unique sources
        const uniqueSrcs: string[] = Array.from(new Set(rates.map((r: any) => String(r.source))));
        if (uniqueSrcs.length === 1) {
          const onlySrc: string = uniqueSrcs[0];
          const destsForSrc: string[] = Array.from(new Set(rates.filter((r: any) => r.source === onlySrc).map((r: any) => String(r.destination))));
          
          let nextDest: string = "";
          let nextVeh: string = formData.vehicleType;
          let nextRate: string = "";

          if (destsForSrc.length === 1) {
            nextDest = destsForSrc[0];
            const matchingRates = rates.filter((r: any) => r.source === onlySrc && r.destination === nextDest);
            if (matchingRates.length === 1) {
              nextVeh = matchingRates[0].vehicleType || nextVeh;
              nextRate = matchingRates[0].rate.toString();
              setContractRateBadge(`₹${Number(matchingRates[0].rate).toLocaleString()} (${matchingRates[0].vehicleType})`);
            }
          }

          setFormData(prev => ({
            ...prev,
            source: onlySrc,
            destination: nextDest,
            vehicleType: nextVeh,
            customerRate: nextRate || prev.customerRate
          }));
        }
      }
    } catch (err) {
      console.error("Failed to load customer rates:", err);
    } finally {
      setIsContractLoading(false);
    }
  };

  // Handle Source Selection
  const handleSourceSelect = (srcVal: string) => {
    if (srcVal === "__custom__") {
      setIsCustomSource(true);
      setFormData(prev => ({ ...prev, source: "", destination: "", customerRate: "" }));
      setContractRateBadge(null);
      return;
    }

    const destsForSrc = Array.from(new Set(customerContractRates.filter(r => r.source.toLowerCase() === srcVal.toLowerCase()).map(r => r.destination)));
    let nextDest = "";
    let nextVeh = formData.vehicleType;
    let nextRate = "";

    if (destsForSrc.length === 1) {
      nextDest = destsForSrc[0];
      const match = customerContractRates.find(r => 
        r.source.toLowerCase() === srcVal.toLowerCase() && 
        r.destination.toLowerCase() === nextDest.toLowerCase()
      );
      if (match) {
        nextVeh = match.vehicleType || nextVeh;
        nextRate = match.rate.toString();
        setContractRateBadge(`₹${Number(match.rate).toLocaleString()} (${match.vehicleType})`);
      }
    }

    setFormData(prev => ({
      ...prev,
      source: srcVal,
      destination: nextDest,
      vehicleType: nextVeh,
      customerRate: nextRate || prev.customerRate
    }));
  };

  // Handle Destination Selection
  const handleDestinationSelect = (destVal: string) => {
    if (destVal === "__custom__") {
      setIsCustomDestination(true);
      setFormData(prev => ({ ...prev, destination: "", customerRate: "" }));
      setContractRateBadge(null);
      return;
    }

    const matchingRates = customerContractRates.filter(r => 
      r.source.toLowerCase() === formData.source.toLowerCase() && 
      r.destination.toLowerCase() === destVal.toLowerCase()
    );

    let nextVeh = formData.vehicleType;
    let nextRate = "";

    if (matchingRates.length === 1) {
      nextVeh = matchingRates[0].vehicleType || nextVeh;
      nextRate = matchingRates[0].rate.toString();
      setContractRateBadge(`₹${Number(matchingRates[0].rate).toLocaleString()} (${matchingRates[0].vehicleType})`);
    } else if (matchingRates.length > 1 && formData.vehicleType) {
      const match = matchingRates.find(r => 
        r.vehicleType?.toLowerCase() === formData.vehicleType.toLowerCase() ||
        formData.vehicleType.toLowerCase().includes((r.vehicleType || "").toLowerCase()) ||
        (r.vehicleType || "").toLowerCase().includes(formData.vehicleType.toLowerCase())
      );
      if (match) {
        nextRate = match.rate.toString();
        setContractRateBadge(`₹${Number(match.rate).toLocaleString()} (${match.vehicleType})`);
      }
    }

    setFormData(prev => ({
      ...prev,
      destination: destVal,
      vehicleType: nextVeh,
      customerRate: nextRate || prev.customerRate
    }));
  };

  // Handle Vehicle Type Selection
  const handleVehicleTypeSelect = (vehVal: string) => {
    let nextRate = formData.customerRate;
    let badge = null;

    if (formData.source && formData.destination && customerContractRates.length > 0) {
      const match = customerContractRates.find(r => 
        r.source.toLowerCase() === formData.source.toLowerCase() && 
        r.destination.toLowerCase() === formData.destination.toLowerCase() &&
        (r.vehicleType?.toLowerCase() === vehVal.toLowerCase() ||
         vehVal.toLowerCase().includes((r.vehicleType || "").toLowerCase()) ||
         (r.vehicleType || "").toLowerCase().includes(vehVal.toLowerCase()))
      );

      if (match) {
        nextRate = match.rate.toString();
        badge = `₹${Number(match.rate).toLocaleString()} (${match.vehicleType})`;
      }
    }

    setContractRateBadge(badge);
    setFormData(prev => ({
      ...prev,
      vehicleType: vehVal,
      customerRate: nextRate
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        customerId: parseInt(formData.customerId),
        weight: parseFloat(formData.weight),
        loadingDate: new Date(formData.loadingDate).toISOString(),
        loadingTime: formData.loadingTime,
        destinationsJson: JSON.stringify([formData.destination]),
        customerRate: formData.customerRate ? parseFloat(formData.customerRate) : null,
        pricingModel: formData.pricingModel,
        warehouseLocation: formData.warehouseLocation
      };

      if (formData.id > 0) {
        await fetchApi(`/Indents/${formData.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi("/Indents", {
          method: "POST",
          body: JSON.stringify({ ...payload, id: undefined }),
        });
      }
      setFormData(DEFAULT_FORM);
      setCustomerContractRates([]);
      setContractRateBadge(null);
      setIsFormOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to save indent");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (ind: Indent) => {
    setFormData({
      id: ind.id,
      customerId: ind.customerId?.toString() || "",
      source: ind.source || "",
      destination: ind.destination || "",
      material: ind.material || "",
      weight: ind.weight?.toString() || "",
      vehicleType: ind.vehicleType || "",
      loadingDate: ind.loadingDate ? ind.loadingDate.split('T')[0] : "",
      loadingTime: ind.loadingTime || "10:00",
      status: ind.status || "New",
      customerRate: (ind as any).customerRate?.toString() || "",
      pricingModel: (ind as any).pricingModel || "CaseToCase",
      warehouseLocation: ind.warehouseLocation || ""
    });

    setCustomerContractRates([]);
    setIsCustomSource(false);
    setIsCustomDestination(false);
    setContractRateBadge(null);

    if (ind.customerId) {
      try {
        const rates = await getCustomerRates(ind.customerId);
        if (rates && rates.length > 0) {
          setCustomerContractRates(rates);
          // Check if current source/dest match contract
          const hasSrc = rates.some((r: any) => r.source.toLowerCase() === (ind.source || "").toLowerCase());
          const hasDest = rates.some((r: any) => r.destination.toLowerCase() === (ind.destination || "").toLowerCase());
          if (!hasSrc && ind.source) setIsCustomSource(true);
          if (!hasDest && ind.destination) setIsCustomDestination(true);

          // Check if rate matches
          const match = rates.find((r: any) => 
            r.source.toLowerCase() === (ind.source || "").toLowerCase() &&
            r.destination.toLowerCase() === (ind.destination || "").toLowerCase() &&
            r.vehicleType?.toLowerCase() === (ind.vehicleType || "").toLowerCase()
          );
          if (match) {
            setContractRateBadge(`₹${Number(match.rate).toLocaleString()} (${match.vehicleType})`);
          }
        }
      } catch (err) {
        console.error("Failed to load rates for edit:", err);
      }
    }

    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this indent?")) return;
    try {
      await fetchApi(`/Indents/${id}`, { method: "DELETE" });
      loadData();
    } catch (error) {
      alert("Failed to delete indent");
    }
  };

  const getStatusBadge = (indentOrStatus: any) => {
    const indent = typeof indentOrStatus === 'object' && indentOrStatus !== null ? indentOrStatus : { status: indentOrStatus };
    const status = indent.status;
    const trip = indent.trip;

    // 1. If associated trip exists, check actual live operational execution status first
    if (trip) {
      if (trip.status === "Delivered" || trip.status === "Completed" || status === "Completed") {
        return <span className="px-[8px] py-[3px] bg-[#dcfce7] text-[#166534] rounded-[6px] text-[11px] font-bold border border-[#bbf7d0]">Completed</span>;
      }
      if (trip.status === "Started" || trip.status === "InTransit" || status === "InTransit") {
        return <span className="px-[8px] py-[3px] bg-[#e0e7ff] text-[#3730a3] rounded-[6px] text-[11px] font-bold border border-[#c7d2fe]">In Transit</span>;
      }
      if (trip.vehicleId && trip.driverId) {
        return <span className="px-[8px] py-[3px] bg-[#dbeafe] text-[#1e40af] rounded-[6px] text-[11px] font-bold border border-[#bfdbfe]">Fleet Assigned</span>;
      }
      return <span className="px-[8px] py-[3px] bg-[#fef3c7] text-[#92400e] rounded-[6px] text-[11px] font-medium border border-[#fde68a]">Awaiting Fleet</span>;
    }

    // 2. Direct Indent Lifecycle Statuses
    if (status === "Completed" || status === "Delivered") {
      return <span className="px-[8px] py-[3px] bg-[#dcfce7] text-[#166534] rounded-[6px] text-[11px] font-bold border border-[#bbf7d0]">Completed</span>;
    }
    if (status === "Started" || status === "InTransit") {
      return <span className="px-[8px] py-[3px] bg-[#e0e7ff] text-[#3730a3] rounded-[6px] text-[11px] font-bold border border-[#c7d2fe]">In Transit</span>;
    }
    if (status === "Assigned") {
      return <span className="px-[8px] py-[3px] bg-[#fef3c7] text-[#92400e] rounded-[6px] text-[11px] font-medium border border-[#fde68a]">Awaiting Fleet</span>;
    }
    if (status === "Supplier_Shortlisted") {
      return <span className="px-[8px] py-[3px] bg-[#fef9c3] text-[#854d0e] rounded-[6px] text-[11px] font-medium border border-[#fef08a]">Supplier Shortlisted</span>;
    }
    if (status === "SQ_Generated") {
      return <span className="px-[8px] py-[3px] bg-[#f0fdf4] text-[#15803d] rounded-[6px] text-[11px] font-medium border border-[#bbf7d0]">SQ Generated</span>;
    }
    if (status === "PO_Received") {
      return <span className="px-[8px] py-[3px] bg-[#ecfdf5] text-[#047857] rounded-[6px] text-[11px] font-medium border border-[#a7f3d0]">PO Received</span>;
    }
    if (status === "Confirmed") {
      return <span className="px-[8px] py-[3px] bg-[#dcfce7] text-[#166534] rounded-[6px] text-[11px] font-medium border border-[#bbf7d0]">Confirmed</span>;
    }
    if (status === "Pending" || status === "Open") {
      return <span className="px-[8px] py-[3px] bg-[#ffedd5] text-[#9a3412] rounded-[6px] text-[11px] font-medium border border-[#fdba74]">Open</span>;
    }
    return <span className="px-[8px] py-[3px] bg-[#e0f2fe] text-[#075985] rounded-[6px] text-[11px] font-medium border border-[#bae6fd]">New</span>;
  };

  const selectedCustomer = customers.find(c => c.id.toString() === formData.customerId);
  const contractSources: string[] = Array.from(new Set(customerContractRates.map((r: any) => String(r.source))));
  const contractDestinations: string[] = formData.source
    ? Array.from(new Set(customerContractRates.filter((r: any) => r.source.toLowerCase() === formData.source.toLowerCase()).map((r: any) => String(r.destination))))
    : Array.from(new Set(customerContractRates.map((r: any) => String(r.destination))));
  const routeContractedRates = formData.source && formData.destination
    ? customerContractRates.filter((r: any) => 
        r.source.toLowerCase() === formData.source.toLowerCase() && 
        r.destination.toLowerCase() === formData.destination.toLowerCase()
      )
    : [];

  return (
    <div className="max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Indent Management</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage and track customer requests and load requirements.</p>
        </div>
        <button 
          onClick={() => { setFormData(DEFAULT_FORM); setIsFormOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Indent
        </button>
      </div>

      {/* Search & Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 p-2 mb-6 flex items-center justify-between">
        <div className="flex items-center px-4 gap-3 flex-1">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search indents by customer or route..." 
            className="w-full bg-transparent border-none focus:outline-none text-sm text-slate-700 font-medium placeholder:text-slate-400 py-2.5"
          />
        </div>
        <div className="flex items-center gap-2 pr-2">
          <button 
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${viewMode === 'grid' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}
          >
            <Grid className="w-4 h-4" /> Grid
          </button>
          <button 
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${viewMode === 'table' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}
          >
            <List className="w-4 h-4" /> Table
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex justify-center p-16">
          <Activity className="animate-spin text-blue-600 w-8 h-8" />
        </div>
      ) : indents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-20 flex flex-col items-center justify-center text-center mt-2">
           <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
             <FileText className="w-8 h-8" />
           </div>
           <h3 className="text-xl font-bold text-slate-900 mb-2">No indents found</h3>
           <p className="text-slate-500 text-[14.5px] mb-8 max-w-sm">You haven't added any indents to the system yet.</p>
           <button 
             onClick={() => { setFormData(DEFAULT_FORM); setIsFormOpen(true); }}
             className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center gap-2"
           >
             <Plus className="w-5 h-5" />
             Add First Indent
           </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {indents.map((ind) => (
            <div 
              key={ind.id} 
              onClick={() => handleEdit(ind)}
              className="bg-white rounded-2xl p-0 shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-all cursor-pointer group"
            >
              {/* Ticket Header */}
              <div className="bg-slate-50/80 p-4 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-700 p-1.5 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-mono font-bold text-slate-900 text-sm">IND-{1000 + ind.id}</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-1">{ind.customer?.name || `Customer #${ind.customerId}`}</div>
                  </div>
                </div>
                {getStatusBadge(ind)}
              </div>
              
              {/* Ticket Route */}
              <div className="px-5 py-5 border-b border-slate-100 border-dashed relative">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Source</div>
                    <div className="font-semibold text-slate-800 text-sm truncate" title={ind.source}>{ind.source}</div>
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-center">
                    <div className="w-8 h-px bg-slate-300"></div>
                    <div className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center mx-1 bg-white shadow-sm z-10">
                      <MapPin className="w-3 h-3 text-blue-500" />
                    </div>
                    <div className="w-8 h-px bg-slate-300"></div>
                  </div>
                  <div className="flex-1 text-right">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Destination</div>
                    <div className="font-semibold text-slate-800 text-sm truncate" title={ind.destination}>{ind.destination}</div>
                  </div>
                </div>
              </div>
              
              {/* Ticket Details */}
              <div className="px-5 py-4 bg-slate-50/30 flex-1 grid grid-cols-2 gap-y-4 gap-x-2">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Material</div>
                  <div className="font-medium text-slate-700 text-[13px]">{ind.material}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Weight</div>
                  <div className="font-medium text-slate-700 text-[13px]">{ind.weight} Tons</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pickup Schedule</div>
                  <div className="font-medium text-slate-700 text-[12px]">
                    {new Date(ind.loadingDate).toLocaleDateString()} {ind.loadingTime ? `@ ${formatTime12H(ind.loadingTime)}` : ''}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</div>
                  <div className="font-medium text-slate-700 text-[13px]">{(ind as any).truckType || ind.vehicleType}</div>
                </div>
              </div>
              
              {/* Ticket Action */}
              <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11.5px] font-bold text-slate-700">
                  <span className="text-slate-400 font-medium mr-1">Rate:</span>
                  {(ind as any).customerRate ? `₹${(ind as any).customerRate.toLocaleString()}` : 'TBD'}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(ind.id); }}
                  className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 overflow-hidden">
          <ProtoTable headers={["INDENT #", "CUSTOMER", "ROUTE", "VEHICLE TYPE", "RATE", "PICKUP", "STATUS", "ACTIONS"]}>
            {indents.map((ind) => (
              <tr key={ind.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => handleEdit(ind)}>
                <Td className="font-mono font-semibold text-[12.5px]">IND-{1000 + ind.id}</Td>
                <Td>{ind.customer?.name || `Customer #${ind.customerId}`}</Td>
                <Td className="text-[12px]">{ind.source} → {ind.destination}</Td>
                <Td className="text-[12px]">{ind.vehicleType}</Td>
                <Td className="text-[12px]">
                  {(ind as any).pricingModel === 'CaseToCase' ? 'Spot: ' : 'Contract: '}
                  <span className="font-semibold text-slate-700">
                    {(ind as any).customerRate ? `₹${(ind as any).customerRate.toLocaleString()}` : 'TBD'}
                  </span>
                </Td>
                <Td className="text-[12px] whitespace-nowrap">
                  <div>{new Date(ind.loadingDate).toLocaleDateString()}</div>
                  {ind.loadingTime && <div className="text-[11px] font-bold text-blue-600">@ {formatTime12H(ind.loadingTime)}</div>}
                </Td>
                <Td>{getStatusBadge(ind)}</Td>
                <Td>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(ind.id); }}
                    className="text-muted-text hover:text-red-500 text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Delete
                  </button>
                </Td>
              </tr>
            ))}
          </ProtoTable>
        </div>
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
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200">
             {/* Form Header */}
             <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <div>
                 <h3 className="font-bold text-lg text-slate-900 tracking-tight">{formData.id > 0 ? "Edit Indent" : "New Indent"}</h3>
                 <p className="text-[13px] font-medium text-slate-500 mt-0.5">{formData.id > 0 ? "Update indent details" : "Create a new indent record"}</p>
               </div>
               <button 
                 onClick={() => setIsFormOpen(false)} 
                 className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>
             
             {/* Form Body - Scrollable */}
             <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
               <form id="indentForm" onSubmit={handleSubmit} className="space-y-5">
                  {/* Customer Selection */}
                  <div className="col-span-2">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[11.5px] font-bold text-slate-500 uppercase tracking-wider">Customer *</label>
                      {isContractLoading && (
                        <span className="text-[11px] text-blue-600 flex items-center gap-1 font-medium">
                          <Activity className="w-3 h-3 animate-spin" /> Fetching contract rates...
                        </span>
                      )}
                    </div>
                    <select 
                      required 
                      value={formData.customerId} 
                      onChange={e => handleCustomerSelect(e.target.value)} 
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                    >
                      <option value="">Select Customer</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.customerType === "Contract" ? "★ (Annual Contract)" : ""}
                        </option>
                      ))}
                    </select>

                    {/* Contract Customer Notification Badge */}
                    {selectedCustomer && (
                      <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200/80 rounded-xl text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="font-semibold text-blue-900">
                            {selectedCustomer.customerType === "Contract" ? "Annual Contract Customer" : "Spot Customer"}
                          </span>
                        </div>
                        {customerContractRates.length > 0 ? (
                          <span className="font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200 text-[11px]">
                            {customerContractRates.length} Contracted Routes Available
                          </span>
                        ) : selectedCustomer.customerType === "Contract" ? (
                          <span className="text-slate-500 italic text-[11px]">No rate sheet saved yet</span>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Route Corridor: Source & Destination */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Source */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[11.5px] font-bold text-slate-500 uppercase tracking-wider">Source *</label>
                        {contractSources.length > 0 && isCustomSource && (
                          <button 
                            type="button" 
                            onClick={() => setIsCustomSource(false)} 
                            className="text-[10px] font-bold text-blue-600 hover:underline"
                          >
                            Use Contract Dropdown
                          </button>
                        )}
                      </div>

                      {contractSources.length > 0 && !isCustomSource ? (
                        <select 
                          required 
                          value={formData.source} 
                          onChange={e => handleSourceSelect(e.target.value)} 
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                        >
                          <option value="">Select Contract Source</option>
                          {contractSources.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                          <option value="__custom__">✏️ Custom / Other Source...</option>
                        </select>
                      ) : (
                        <input 
                          required 
                          value={formData.source} 
                          onChange={e => setFormData({...formData, source: e.target.value})} 
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
                          placeholder="e.g. Mumbai" 
                        />
                      )}
                    </div>

                    {/* Destination */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[11.5px] font-bold text-slate-500 uppercase tracking-wider">Destination *</label>
                        {contractDestinations.length > 0 && isCustomDestination && (
                          <button 
                            type="button" 
                            onClick={() => setIsCustomDestination(false)} 
                            className="text-[10px] font-bold text-blue-600 hover:underline"
                          >
                            Use Contract Dropdown
                          </button>
                        )}
                      </div>

                      {contractDestinations.length > 0 && !isCustomDestination ? (
                        <select 
                          required 
                          value={formData.destination} 
                          onChange={e => handleDestinationSelect(e.target.value)} 
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                        >
                          <option value="">Select Contract Destination</option>
                          {contractDestinations.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                          <option value="__custom__">✏️ Custom / Other Destination...</option>
                        </select>
                      ) : (
                        <input 
                          required 
                          value={formData.destination} 
                          onChange={e => setFormData({...formData, destination: e.target.value})} 
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
                          placeholder="e.g. Pune" 
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Material</label>
                      <input required value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="e.g. Auto Parts" />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Weight (Tons)</label>
                      <input required type="number" step="0.5" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="e.g. 20" />
                    </div>
                  </div>

                  {/* Vehicle Type Req. */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[11.5px] font-bold text-slate-500 uppercase tracking-wider">Vehicle Type Req. *</label>
                        {contractRateBadge && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Agreed
                          </span>
                        )}
                      </div>
                      <select 
                        required 
                        value={formData.vehicleType} 
                        onChange={e => handleVehicleTypeSelect(e.target.value)} 
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                      >
                        <option value="">Select Vehicle Type</option>
                        {routeContractedRates.length > 0 && (
                          <optgroup label="⭐ Pre-agreed Contract Rates on this Route">
                            {routeContractedRates.map((r: any) => (
                              <option key={r.id} value={r.vehicleType}>
                                {r.vehicleType} — Agreed: ₹{Number(r.rate).toLocaleString()}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label="Open Body">
                          <option value="14 ft Open Body">14 ft Open Body</option>
                          <option value="17 ft Open Body">17 ft Open Body</option>
                          <option value="19 ft Open Body">19 ft Open Body</option>
                          <option value="20 ft Open Body">20 ft Open Body</option>
                          <option value="22 ft Open Body">22 ft Open Body</option>
                          <option value="24 ft Open Body">24 ft Open Body</option>
                          <option value="32 ft Open Body">32 ft Open Body</option>
                          <option value="40 ft Open Body">40 ft Open Body</option>
                        </optgroup>
                        <optgroup label="Container">
                          <option value="14 ft Container">14 ft Container</option>
                          <option value="17 ft Container">17 ft Container</option>
                          <option value="19 ft Container">19 ft Container</option>
                          <option value="20 ft Container">20 ft Container</option>
                          <option value="22 ft Container">22 ft Container</option>
                          <option value="24 ft Container">24 ft Container</option>
                          <option value="32 ft Container">32 ft Container</option>
                          <option value="40 ft Container">40 ft Container</option>
                        </optgroup>
                        <optgroup label="Heavy">
                          <option value="40 ft Trailer">40 ft Trailer</option>
                        </optgroup>
                        <optgroup label="Other">
                          <option value="Pickup">Pickup</option>
                          <option value="Canter">Canter</option>
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Status</label>
                      <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm">
                        <option value="New">New</option>
                        <option value="Pending">Pending</option>
                        <option value="Assigned">Assigned</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Loading Date</label>
                      <input required type="date" value={formData.loadingDate} onChange={e => setFormData({...formData, loadingDate: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[11.5px] font-bold text-slate-500 uppercase tracking-wider">Pickup Time</label>
                        {formData.loadingTime && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            {formatTime12H(formData.loadingTime)}
                          </span>
                        )}
                      </div>
                      <input type="time" value={formData.loadingTime} onChange={e => setFormData({...formData, loadingTime: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Intermediate Warehouse (Optional for 3PL)</label>
                      <input value={formData.warehouseLocation} onChange={e => setFormData({...formData, warehouseLocation: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="e.g. Central Hub (Mumbai)" />
                    </div>
                  </div>

                  {/* Pricing Model & Auto-filled Customer Rate */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Pricing Model</label>
                      <select required value={formData.pricingModel} onChange={e => setFormData({...formData, pricingModel: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm">
                        <option value="CaseToCase">Case to Case / Spot Rate</option>
                        <option value="AnnualContract">Annual Contract</option>
                      </select>
                    </div>
                    <div>
                      {formData.pricingModel === "AnnualContract" && (
                        <>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-[11.5px] font-bold text-slate-500 uppercase tracking-wider">Customer Rate (₹)</label>
                            {contractRateBadge && (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                ✓ Auto-filled from Contract
                              </span>
                            )}
                          </div>
                          <input 
                            type="number" 
                            step="0.01" 
                            value={formData.customerRate} 
                            onChange={e => setFormData({...formData, customerRate: e.target.value})} 
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-bold font-mono outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
                            placeholder={contractRateBadge ? "Auto-filled" : "Enter agreed rate"} 
                          />
                        </>
                      )}
                    </div>
                  </div>
               </form>
             </div>
             
             {/* Form Footer */}
             <div className="p-6 border-t border-slate-100 bg-white">
               <button 
                 type="submit" 
                 form="indentForm" 
                 disabled={isSubmitting}
                 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
               >
                 {isSubmitting ? (
                   <><Activity className="w-5 h-5 mr-2 animate-spin" /> Saving...</>
                 ) : (
                   formData.id > 0 ? "Update Indent" : "Save Indent"
                 )}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
