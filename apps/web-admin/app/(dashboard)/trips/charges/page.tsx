"use client";

import { useState, useEffect, useMemo } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td, Badge } from "@/components/PrototypeUI";
import { 
  Search, Receipt, Plus, X, HandCoins, Loader2, 
  Clock, CheckCircle, XCircle, Fuel, Scale, 
  Truck, ArrowRight, Building2, Eye, ShieldCheck, Tag, Info
} from "lucide-react";

export default function AdditionalChargesPage() {
  const [activeTab, setActiveTab] = useState<"trips" | "claims">("trips");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [charges, setCharges] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");

  // Form State
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [chargeType, setChargeType] = useState<string>("Detention");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [payableToVendor, setPayableToVendor] = useState<boolean>(true);
  const [billableToCustomer, setBillableToCustomer] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [chargesData, tripsData] = await Promise.all([
        fetchApi("/AdditionalCharges"),
        fetchApi("/Trips")
      ]);
      setCharges(chargesData || []);
      setTrips(tripsData || []);
    } catch (e) {
      console.error("Failed to load charges", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddCharge = (tripId?: number) => {
    if (tripId) {
      setSelectedTripId(tripId.toString());
    } else if (trips.length > 0 && !selectedTripId) {
      setSelectedTripId(trips[0].id.toString());
    }
    setIsPanelOpen(true);
  };

  const handleLogCharge = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const parsedTripId = parseInt(selectedTripId, 10);
    const parsedAmount = parseFloat(amount);

    if (!parsedTripId || isNaN(parsedTripId)) {
      alert("Please select a valid trip.");
      setIsSubmitting(false);
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      alert("Please enter a valid positive charge amount.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      tripId: parsedTripId,
      chargeType,
      amount: parsedAmount,
      description,
      payableToVendor,
      billableToCustomer,
      status: "Approved" // Direct log by operations admin
    };

    try {
      await fetchApi("/AdditionalCharges", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setIsPanelOpen(false);
      // Reset form
      setAmount("");
      setDescription("");
      setPayableToVendor(true);
      setBillableToCustomer(false);
      await loadData();
      alert("Additional charge logged and applied successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to log charge");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await fetchApi(`/AdditionalCharges/${id}/approve`, { method: "POST" });
      await loadData();
      alert("Charge approved successfully!");
    } catch (e) {
      alert("Failed to approve charge");
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm("Are you sure you want to reject this charge?")) return;
    try {
      await fetchApi(`/AdditionalCharges/${id}/reject`, { method: "POST" });
      await loadData();
      alert("Charge rejected");
    } catch (e) {
      alert("Failed to reject charge");
    }
  };

  const getChargeTypeBadge = (type: string) => {
    switch (type) {
      case "Detention":
      case "Halting":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3" /> Detention</span>;
      case "Loading":
      case "Hamali":
      case "Labour":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200"><Truck className="w-3 h-3" /> Loading / Hamali</span>;
      case "Toll":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200"><Receipt className="w-3 h-3" /> Toll</span>;
      case "Weighbridge":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"><Scale className="w-3 h-3" /> Weighbridge</span>;
      case "Fuel":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><Fuel className="w-3 h-3" /> Fuel Advance</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{type || "Extra Charge"}</span>;
    }
  };

  // Metrics
  const totalAmount = charges.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const pendingCharges = charges.filter(c => c.status === "Pending" || !c.status);
  const approvedCharges = charges.filter(c => c.status === "Approved");
  const approvedAmount = approvedCharges.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const billableAmount = charges.filter(c => c.billableToCustomer && (c.status === "Approved" || !c.status)).reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const payableAmount = charges.filter(c => c.payableToVendor && (c.status === "Approved" || !c.status)).reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

  // Trips with charges map
  const tripsWithChargesCount = useMemo(() => {
    return trips.filter(t => (t.additionalCharges && t.additionalCharges.length > 0) || charges.some(c => c.tripId === t.id)).length;
  }, [trips, charges]);

  // Filtered Trips List
  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      const tripCharges = t.additionalCharges || charges.filter(c => c.tripId === t.id) || [];
      const hasCharges = tripCharges.length > 0;

      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery ||
        `TRP-${1000 + t.id}`.toLowerCase().includes(q) ||
        t.id.toString().includes(q) ||
        (t.indent?.source || "").toLowerCase().includes(q) ||
        (t.indent?.destination || "").toLowerCase().includes(q) ||
        (t.indent?.warehouseLocation || "").toLowerCase().includes(q) ||
        (t.indent?.customer?.name || "").toLowerCase().includes(q) ||
        (t.vendor?.name || "").toLowerCase().includes(q) ||
        (t.vehicle?.vehicleNumber || "").toLowerCase().includes(q);

      let matchesStatus = true;
      if (statusFilter === "WithCharges") {
        matchesStatus = hasCharges;
      } else if (statusFilter === "NoCharges") {
        matchesStatus = !hasCharges;
      } else if (statusFilter !== "All") {
        matchesStatus = t.status === statusFilter;
      }

      let matchesType = true;
      if (typeFilter !== "All") {
        matchesType = tripCharges.some((c: any) => c.chargeType === typeFilter);
      }

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [trips, charges, searchQuery, statusFilter, typeFilter]);

  // Filtered Claims List
  const filteredCharges = useMemo(() => {
    return charges.filter(c => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery ||
        (c.id?.toString().includes(q)) ||
        (c.tripId?.toString().includes(q)) ||
        `TRP-${1000 + (c.tripId || 0)}`.toLowerCase().includes(q) ||
        (c.chargeType?.toLowerCase().includes(q)) ||
        (c.description?.toLowerCase().includes(q)) ||
        (c.trip?.indent?.source?.toLowerCase().includes(q)) ||
        (c.trip?.indent?.destination?.toLowerCase().includes(q)) ||
        (c.trip?.indent?.customer?.name?.toLowerCase().includes(q));

      const matchesStatus = 
        statusFilter === "All" || statusFilter === "WithCharges" || statusFilter === "NoCharges" ? true :
        statusFilter === "Pending" ? (c.status === "Pending" || !c.status) :
        c.status === statusFilter;

      const matchesType = typeFilter === "All" ? true : c.chargeType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [charges, searchQuery, statusFilter, typeFilter]);

  return (
    <div className="relative h-full flex flex-col pb-8">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap justify-between items-end gap-4 mb-6 shrink-0">
        <div>
          <h1 className="font-disp font-bold text-[28px] text-slate-900 tracking-tight leading-tight">Additional Charges & Claims</h1>
          <p className="text-[14px] text-slate-500 mt-1 font-medium">
            Centrally manage, verify, and route trip extra expenses to Vendor Settlements or Customer Tax Invoices.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleOpenAddCharge()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Log New Charge
          </button>
        </div>
      </div>

      {/* KPI METRICS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Extra Logged</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700"><Receipt className="w-3.5 h-3.5" /></span>
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">₹{totalAmount.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{charges.length} claims across {tripsWithChargesCount} trips</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Vendor Payable</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700"><Truck className="w-3.5 h-3.5" /></span>
          </div>
          <div className="text-xl font-black text-purple-700 mt-1">₹{payableAmount.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Added to Vendor Settlements</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Customer Billable</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700"><Building2 className="w-3.5 h-3.5" /></span>
          </div>
          <div className="text-xl font-black text-blue-700 mt-1">₹{billableAmount.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Added to Customer Invoices</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pending Approvals</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700"><Clock className="w-3.5 h-3.5" /></span>
          </div>
          <div className="text-xl font-black text-amber-600 mt-1">{pendingCharges.length} claims</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Awaiting ops verification</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">System Trips</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700"><ShieldCheck className="w-3.5 h-3.5" /></span>
          </div>
          <div className="text-xl font-black text-emerald-600 mt-1">{trips.length} Active Trips</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Visible for charge logging</span>
        </div>
      </div>

      {/* VIEW SELECTION TABS & CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        {/* Main View Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab("trips")}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeTab === "trips" 
                  ? 'bg-blue-600 text-white shadow-sm font-black' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              All Trips & Charges ({trips.length})
            </button>
            <button
              onClick={() => setActiveTab("claims")}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeTab === "claims" 
                  ? 'bg-blue-600 text-white shadow-sm font-black' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Claims Audit Ledger ({charges.length})
            </button>
          </div>

          {/* Sub status filters */}
          {activeTab === "trips" ? (
            <div className="hidden sm:flex bg-slate-50 border border-slate-200 p-1 rounded-xl text-[11px] font-bold">
              {[
                { label: "All Trips", val: "All" },
                { label: "With Extra Charges", val: "WithCharges" },
                { label: "No Extra Charges", val: "NoCharges" }
              ].map(sub => (
                <button
                  key={sub.val}
                  onClick={() => setStatusFilter(sub.val)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    statusFilter === sub.val ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="hidden sm:flex bg-slate-50 border border-slate-200 p-1 rounded-xl text-[11px] font-bold">
              {["All", "Pending", "Approved", "Rejected"].map(sub => (
                <button
                  key={sub}
                  onClick={() => setStatusFilter(sub)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    statusFilter === sub ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Category Dropdown */}
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="All">All Categories</option>
            <option value="Detention">Detention / Halting</option>
            <option value="Loading">Loading / Hamali</option>
            <option value="Toll">Toll Charges</option>
            <option value="Weighbridge">Weighbridge</option>
            <option value="Fuel">Fuel Advance</option>
            <option value="Demurrage">Demurrage</option>
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === "trips" ? "Search trips, routes, customer..." : "Search claims, trips..."}
              className="w-[240px] h-9 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-xs outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="overflow-auto flex-1">
          {activeTab === "trips" ? (
            /* ================= VIEW 1: ALL TRIPS & CHARGES ================= */
            <ProtoTable headers={["TRIP ID & DATE", "ROUTE JOURNEY", "CUSTOMER & CARRIER", "TRIP STATUS", "EXTRA CHARGES LOGGED", "BILLING ALLOCATION", "ACTIONS"]}>
              {isLoading ? (
                <tr>
                  <Td colSpan={7} className="text-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-300 mx-auto" />
                    <span className="text-xs text-slate-400 mt-2 block">Loading trips and charges...</span>
                  </Td>
                </tr>
              ) : filteredTrips.length === 0 ? (
                <tr>
                  <Td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center">
                      <Truck className="w-8 h-8 text-slate-300 mb-2" />
                      <h3 className="text-sm font-bold text-slate-700">No Trips Found</h3>
                      <p className="text-xs text-slate-400 mt-1">Try clearing your search query or filters.</p>
                    </div>
                  </Td>
                </tr>
              ) : (
                filteredTrips.map(trip => {
                  const indent = trip.indent;
                  // Gather all charges for this trip
                  const tripCharges: any[] = trip.additionalCharges && trip.additionalCharges.length > 0
                    ? trip.additionalCharges
                    : charges.filter(c => c.tripId === trip.id);
                  
                  const totalTripCharges = tripCharges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
                  const hasVendorPayable = tripCharges.some(c => c.payableToVendor);
                  const hasCustomerBillable = tripCharges.some(c => c.billableToCustomer);

                  return (
                    <tr key={trip.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
                      {/* Trip ID & Date */}
                      <Td>
                        <div className="font-mono text-xs font-bold text-blue-700">
                          TRP-{1000 + trip.id}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(trip.createdAt).toLocaleDateString()}
                        </div>
                      </Td>

                      {/* Route Journey */}
                      <Td>
                        <div className="text-[11px] font-semibold text-slate-800 flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold">{indent?.source || "Route N/A"}</span>
                          {indent?.warehouseLocation ? (
                            <>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                              <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10px]">
                                {indent.warehouseLocation} (Hub)
                              </span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                            </>
                          ) : (
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                          )}
                          <span className="font-bold">{indent?.destination || ""}</span>
                        </div>
                      </Td>

                      {/* Customer & Carrier */}
                      <Td>
                        <div className="font-semibold text-xs text-slate-900">
                          {indent?.customer?.name || "Customer N/A"}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {trip.vendor?.name || (trip.legType === "Direct" ? "Own Fleet" : "Carrier N/A")} • {trip.vehicle?.vehicleNumber || "Vehicle N/A"}
                        </div>
                      </Td>

                      {/* Trip Status */}
                      <Td>
                        <Badge color={
                          trip.status === "Closed" || trip.status === "Completed" ? "green" :
                          trip.status === "In Transit" || trip.status === "Active" ? "blue" :
                          trip.status === "Assigned" ? "indigo" : "slate"
                        }>
                          {trip.status || "Planned"}
                        </Badge>
                      </Td>

                      {/* Extra Charges Logged */}
                      <Td>
                        {totalTripCharges > 0 ? (
                          <div>
                            <div className="font-black text-slate-900 text-sm">
                              ₹{totalTripCharges.toLocaleString('en-IN')}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {tripCharges.map((c, idx) => (
                                <span 
                                  key={c.id || idx}
                                  className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                                >
                                  {c.chargeType}: ₹{Number(c.amount).toLocaleString('en-IN')}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">
                            ₹0 (Standard Rate)
                          </span>
                        )}
                      </Td>

                      {/* Billing Allocation */}
                      <Td>
                        {totalTripCharges > 0 ? (
                          <div className="flex flex-col gap-1">
                            {hasCustomerBillable && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                <Building2 className="w-2.5 h-2.5" /> Added to Cust. Invoice
                              </span>
                            )}
                            {hasVendorPayable && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                <Truck className="w-2.5 h-2.5" /> Added to Vendor Payout
                              </span>
                            )}
                            {!hasCustomerBillable && !hasVendorPayable && (
                              <span className="text-[10px] font-medium text-slate-400">
                                Internal Absorption
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No extra claims</span>
                        )}
                      </Td>

                      {/* Actions */}
                      <Td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenAddCharge(trip.id)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Charge
                          </button>
                          {tripCharges.length > 0 && (
                            <button
                              onClick={() => {
                                setSearchQuery(`TRP-${1000 + trip.id}`);
                                setActiveTab("claims");
                              }}
                              className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                              title="Inspect Individual Claims"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                          )}
                        </div>
                      </Td>
                    </tr>
                  );
                })
              )}
            </ProtoTable>
          ) : (
            /* ================= VIEW 2: CLAIMS AUDIT LEDGER ================= */
            <ProtoTable headers={["CLAIM ID & DATE", "TRIP & ROUTE", "CUSTOMER / VENDOR", "CHARGE CATEGORY", "AMOUNT", "ALLOCATION TARGET", "STATUS", "ACTIONS"]}>
              {isLoading ? (
                <tr>
                  <Td colSpan={8} className="text-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-300 mx-auto" />
                    <span className="text-xs text-slate-400 mt-2 block">Loading claims...</span>
                  </Td>
                </tr>
              ) : filteredCharges.length === 0 ? (
                <tr>
                  <Td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center">
                      <Receipt className="w-8 h-8 text-slate-300 mb-2" />
                      <h3 className="text-sm font-bold text-slate-700">No Specific Claims Found</h3>
                      <p className="text-xs text-slate-400 mt-1">No claims match your search query or filter.</p>
                      <button 
                        onClick={() => handleOpenAddCharge()}
                        className="mt-4 bg-blue-50 text-blue-600 font-bold px-4 py-2 rounded-xl text-xs hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Log First Charge
                      </button>
                    </div>
                  </Td>
                </tr>
              ) : (
                filteredCharges.map(charge => {
                  const trip = charge.trip;
                  const indent = trip?.indent;
                  const status = charge.status || "Pending";

                  return (
                    <tr key={charge.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
                      {/* Charge ID & Date */}
                      <Td>
                        <div className="font-mono text-xs font-bold text-slate-800">CHG-{charge.id}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(charge.createdAt).toLocaleDateString()}
                        </div>
                      </Td>

                      {/* Trip & Route */}
                      <Td>
                        <div className="font-mono text-xs font-bold text-blue-600">
                          TRP-{1000 + (charge.tripId || 0)}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-700 mt-0.5 flex items-center gap-1 flex-wrap">
                          <span>{indent?.source || "Route N/A"}</span>
                          <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                          <span>{indent?.destination || ""}</span>
                        </div>
                      </Td>

                      {/* Customer & Vendor */}
                      <Td>
                        <div className="font-semibold text-xs text-slate-800">{indent?.customer?.name || "Customer N/A"}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {trip?.vendor?.name || (trip?.legType === "Direct" ? "Own Fleet" : "Carrier N/A")} • {trip?.vehicle?.vehicleNumber || ""}
                        </div>
                      </Td>

                      {/* Category */}
                      <Td>
                        {getChargeTypeBadge(charge.chargeType)}
                      </Td>

                      {/* Amount */}
                      <Td>
                        <span className="font-black text-slate-900 text-sm">₹{charge.amount?.toLocaleString('en-IN')}</span>
                        {charge.description && (
                          <div className="text-[11px] text-slate-400 max-w-[200px] truncate mt-0.5" title={charge.description}>
                            {charge.description}
                          </div>
                        )}
                      </Td>

                      {/* Allocation Target */}
                      <Td>
                        <div className="flex flex-col gap-1">
                          {charge.billableToCustomer ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              <Building2 className="w-2.5 h-2.5" /> Customer Invoice
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400">
                              Customer: ₹0 (Not Billed)
                            </span>
                          )}
                          {charge.payableToVendor ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              <Truck className="w-2.5 h-2.5" /> Vendor Settlement
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400">
                              Vendor: ₹0 (Not Paid)
                            </span>
                          )}
                        </div>
                      </Td>

                      {/* Status */}
                      <Td>
                        <Badge color={
                          status === "Approved" ? "green" :
                          status === "Rejected" ? "red" : "orange"
                        }>
                          {status}
                        </Badge>
                      </Td>

                      {/* Actions */}
                      <Td>
                        {status === "Pending" ? (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleApprove(charge.id)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Approve Charge"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button 
                              onClick={() => handleReject(charge.id)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Reject Charge"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        ) : status === "Approved" ? (
                          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Verified & Active
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Rejected
                          </span>
                        )}
                      </Td>
                    </tr>
                  );
                })
              )}
            </ProtoTable>
          )}
        </div>
      </div>

      {/* OVERLAY */}
      <div 
        className={`fixed inset-0 bg-slate-900/25 backdrop-blur-xs z-40 transition-opacity duration-300 ${isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsPanelOpen(false)}
      />

      {/* SLIDE-OVER PANEL: LOG CHARGE */}
      <div 
        className={`fixed top-0 right-0 h-full w-[490px] max-w-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-200 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <HandCoins className="w-5 h-5 text-blue-600" /> Log Additional Charge
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Record extra expenses with clear billing allocation.</p>
          </div>
          <button 
            onClick={() => setIsPanelOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-7">
          <form id="charge-form" onSubmit={handleLogCharge} className="space-y-4">
            
            {/* Trip Selector Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Trip *</label>
              <select 
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                required 
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs bg-white text-slate-900 font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
              >
                <option value="">-- Choose an active trip --</option>
                {trips.slice().sort((a, b) => b.id - a.id).map(t => (
                  <option key={t.id} value={t.id}>
                    TRP-{1000 + t.id}: {t.indent?.source} → {t.indent?.destination} ({t.indent?.customer?.name || 'Customer'} • {t.vendor?.name || (t.legType === 'Direct' ? 'Own Fleet' : 'Fleet')})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">Charges will attach directly to this trip's financial records.</span>
            </div>

            {/* Charge Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Charge Category *</label>
              <select 
                value={chargeType}
                onChange={(e) => setChargeType(e.target.value)}
                required 
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs bg-white text-slate-900 font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
              >
                <option value="Detention">⏳ Detention / Halting Charges</option>
                <option value="Loading">📦 Loading & Unloading (Hamali)</option>
                <option value="Toll">🛣️ Toll Charges / Highway Fastag</option>
                <option value="Weighbridge">⚖️ Weighbridge (Dharam Kanta)</option>
                <option value="Fuel">⛽ Extra Fuel / Diesel Advance</option>
                <option value="Demurrage">🚨 Demurrage / Penalties</option>
                <option value="Miscellaneous">📝 Other Route Miscellaneous</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Amount (₹) *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required 
                  type="number" 
                  step="any"
                  className="w-full border border-slate-300 rounded-xl pl-8 pr-4 py-2.5 text-sm bg-white text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs" 
                  placeholder="0.00" 
                />
              </div>
            </div>

            {/* Billing Allocation Checkboxes */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <label className="text-xs font-bold text-slate-700 block mb-0.5">Billing & Settlement Allocation</label>
              
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={payableToVendor}
                  onChange={(e) => setPayableToVendor(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" 
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Payable to Vendor / Transporter</span>
                  <span className="text-[11px] text-slate-500 block">Adds this charge to the vendor's final settlement payout balance.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-slate-200">
                <input 
                  type="checkbox" 
                  checked={billableToCustomer}
                  onChange={(e) => setBillableToCustomer(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" 
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Billable to Customer</span>
                  <span className="text-[11px] text-slate-500 block">Recovers this charge on the customer's final Tax Invoice.</span>
                </div>
              </label>

              {/* LIVE EXPLANATION BANNER */}
              <div className="mt-2 pt-2.5 border-t border-slate-200">
                <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 mb-1">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  Financial Allocation Summary:
                </div>
                {payableToVendor && !billableToCustomer && (
                  <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-[11px] text-purple-900 leading-relaxed">
                    <strong>Vendor Settlement:</strong> +₹{amount ? Number(amount).toLocaleString('en-IN') : '0'} added to vendor payout.<br />
                    <strong>Customer Invoice:</strong> ₹0 (Customer will <strong>NOT</strong> be charged).
                  </div>
                )}
                {!payableToVendor && billableToCustomer && (
                  <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-[11px] text-blue-900 leading-relaxed">
                    <strong>Customer Invoice:</strong> +₹{amount ? Number(amount).toLocaleString('en-IN') : '0'} added to customer tax invoice.<br />
                    <strong>Vendor Settlement:</strong> ₹0 (Vendor will <strong>NOT</strong> receive this payout).
                  </div>
                )}
                {payableToVendor && billableToCustomer && (
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 leading-relaxed">
                    <strong>Pass-Through:</strong> +₹{amount ? Number(amount).toLocaleString('en-IN') : '0'} paid to vendor in settlement AND billed to customer on invoice.
                  </div>
                )}
                {!payableToVendor && !billableToCustomer && (
                  <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-slate-700 leading-relaxed">
                    <strong>Internal Absorption:</strong> Absorbed by company operational cost. Neither vendor nor customer is billed.
                  </div>
                )}
              </div>
            </div>

            {/* Description & Remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Description & Reason *</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required 
                rows={3}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs bg-white text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs resize-none" 
                placeholder="e.g. 24 hours detention at factory gate due to crane breakdown. Verified by gate slip." 
              />
            </div>
            
          </form>
        </div>

        <div className="p-5 border-t border-slate-100 bg-white shrink-0">
          <button 
            type="submit" 
            form="charge-form"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50 text-xs cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" /> Save & Apply Additional Charge
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
