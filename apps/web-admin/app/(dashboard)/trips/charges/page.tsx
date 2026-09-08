"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td, Badge } from "@/components/PrototypeUI";
import { 
  Search, Grid, List, Receipt, Plus, X, HandCoins, Loader2, 
  Clock, CheckCircle, XCircle, AlertTriangle, Fuel, Scale, 
  Truck, ArrowRight, DollarSign, Building2, UserCheck, Filter
} from "lucide-react";

export default function AdditionalChargesPage() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [charges, setCharges] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");

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

  const handleLogCharge = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const payload = {
      tripId: parseInt(formData.get("tripId") as string) || 0,
      chargeType: formData.get("chargeType"),
      amount: parseFloat(formData.get("amount") as string) || 0,
      description: formData.get("description") as string,
      payableToVendor: formData.get("payableToVendor") === "on",
      billableToCustomer: formData.get("billableToCustomer") === "on",
      status: "Approved" // Logged directly by admin
    };

    try {
      await fetchApi("/AdditionalCharges", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setIsPanelOpen(false);
      loadData();
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
      loadData();
      alert("Charge approved successfully!");
    } catch (e) {
      alert("Failed to approve charge");
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm("Are you sure you want to reject this charge?")) return;
    try {
      await fetchApi(`/AdditionalCharges/${id}/reject`, { method: "POST" });
      loadData();
      alert("Charge rejected");
    } catch (e) {
      alert("Failed to reject charge");
    }
  };

  const getChargeTypeBadge = (type: string) => {
    switch (type) {
      case "Detention":
      case "Halting":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3" /> Detention / Halting</span>;
      case "Loading":
      case "Hamali":
      case "Labour":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200"><Truck className="w-3 h-3" /> Loading / Hamali</span>;
      case "Toll":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200"><Receipt className="w-3 h-3" /> Toll Charges</span>;
      case "Weighbridge":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"><Scale className="w-3 h-3" /> Weighbridge</span>;
      case "Fuel":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><Fuel className="w-3 h-3" /> Fuel Advance</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">{type || "Extra Charge"}</span>;
    }
  };

  // Metrics
  const totalAmount = charges.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const pendingCharges = charges.filter(c => c.status === "Pending" || !c.status);
  const pendingAmount = pendingCharges.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const approvedCharges = charges.filter(c => c.status === "Approved");
  const approvedAmount = approvedCharges.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const billableAmount = charges.filter(c => c.billableToCustomer).reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

  // Filtered List
  const filteredCharges = charges.filter(c => {
    const matchesSearch = 
      (c.id?.toString().includes(searchQuery)) ||
      (c.tripId?.toString().includes(searchQuery)) ||
      (c.chargeType?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.trip?.indent?.source?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.trip?.indent?.destination?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.trip?.indent?.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = 
      statusFilter === "All" ? true :
      statusFilter === "Pending" ? (c.status === "Pending" || !c.status) :
      c.status === statusFilter;

    const matchesType = typeFilter === "All" ? true : c.chargeType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="relative h-full flex flex-col pb-8">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h1 className="font-disp font-bold text-[28px] text-slate-900 tracking-tight leading-tight">Additional Charges</h1>
          <p className="text-[14px] text-slate-500 mt-1 font-medium">
            Centrally manage, verify, and approve route expenses, detention, tolls, and loading charges.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsPanelOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Log New Charge
          </button>
        </div>
      </div>

      {/* KPI METRICS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Extra Charges</span>
            <span className="p-2 rounded-xl bg-slate-100 text-slate-700"><Receipt className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">₹{totalAmount.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">{charges.length} total claims recorded</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Approvals</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700"><Clock className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">₹{pendingAmount.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">{pendingCharges.length} waiting for verification</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Approved & Costed</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700"><CheckCircle className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">₹{approvedAmount.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">{approvedCharges.length} active in trip costing</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Billable to Customer</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700"><Building2 className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2">₹{billableAmount.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Added to customer invoice</span>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        {/* Status Filter Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
          {["All", "Pending", "Approved", "Rejected"].map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                statusFilter === tab 
                  ? 'bg-white text-slate-900 shadow-sm font-black' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Category Dropdown */}
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
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
              placeholder="Search charges, trips, routes..." 
              className="w-[260px] h-10 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-xs outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* CHARGES DATA TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="overflow-auto flex-1">
          <ProtoTable headers={["CHARGE ID & DATE", "TRIP & ROUTE", "CUSTOMER / VENDOR", "CHARGE CATEGORY", "AMOUNT", "ALLOCATION", "STATUS", "ACTIONS"]}>
            {isLoading ? (
              <tr>
                <Td colSpan={8} className="text-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-300 mx-auto" />
                  <span className="text-xs text-slate-400 mt-2 block">Loading charges...</span>
                </Td>
              </tr>
            ) : filteredCharges.length === 0 ? (
              <tr>
                <Td colSpan={8} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <Receipt className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 mb-1">No Additional Charges Found</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto text-center">
                      No extra detention, loading, or toll charges match your current filter.
                    </p>
                    <button 
                      onClick={() => setIsPanelOpen(true)}
                      className="mt-5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Log a Charge
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
                      <div className="font-mono text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                        TRP-{1000 + (charge.tripId || 0)}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-700 mt-0.5 flex items-center gap-1">
                        <span>{indent?.source || "Route N/A"}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                        <span>{indent?.destination || ""}</span>
                      </div>
                    </Td>

                    {/* Customer & Vendor */}
                    <Td>
                      <div className="font-semibold text-xs text-slate-800">{indent?.customer?.name || "Customer N/A"}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {trip?.vendor?.name || (trip?.legType === "Direct" ? "Own Fleet" : "Vendor N/A")} • {trip?.vehicle?.vehicleNumber || ""}
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

                    {/* Allocation */}
                    <Td>
                      <div className="flex flex-col gap-1">
                        {charge.billableToCustomer ? (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Billable to Customer
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">
                            Internal Company Cost
                          </span>
                        )}
                        {charge.payableToVendor && (
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            Vendor Payable
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
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                            title="Approve Charge"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button 
                            onClick={() => handleReject(charge.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                            title="Reject Charge"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : status === "Approved" ? (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Disallowed
                        </span>
                      )}
                    </Td>
                  </tr>
                );
              })
            )}
          </ProtoTable>
        </div>
      </div>

      {/* OVERLAY */}
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsPanelOpen(false)}
      />

      {/* SLIDE-OVER PANEL: LOG CHARGE */}
      <div 
        className={`fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-200 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <HandCoins className="w-5 h-5 text-blue-600" /> Log Additional Charge
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">Record extra expenses incurred during route execution.</p>
          </div>
          <button 
            onClick={() => setIsPanelOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <form id="charge-form" onSubmit={handleLogCharge} className="space-y-5">
            
            {/* Trip Selector Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Trip *</label>
              <select 
                name="tripId" 
                required 
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs bg-white text-slate-900 font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
              >
                <option value="">Choose an active trip...</option>
                {trips.map(t => (
                  <option key={t.id} value={t.id}>
                    TRP-{1000 + t.id}: {t.indent?.source} → {t.indent?.destination} ({t.indent?.customer?.name || 'Customer'} • {t.vendor?.name || 'Fleet'})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">Charges will be linked to this trip's costing sheet and settlement.</span>
            </div>

            {/* Charge Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Charge Category *</label>
              <select 
                name="chargeType" 
                required 
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs bg-white text-slate-900 font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
              >
                <option value="">Select Category</option>
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
                  name="amount"
                  required 
                  type="number" 
                  step="any"
                  className="w-full border border-slate-300 rounded-xl pl-8 pr-4 py-2.5 text-sm bg-white text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" 
                  placeholder="0.00" 
                />
              </div>
            </div>

            {/* Billing Allocation Checkboxes */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <label className="text-xs font-bold text-slate-700 block mb-1">Billing & Settlement Allocation</label>
              
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="payableToVendor" 
                  defaultChecked
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500" 
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Payable to Vendor / Transporter</span>
                  <span className="text-[11px] text-slate-500 block">Adds this amount to the vendor's final settlement payout.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-slate-200">
                <input 
                  type="checkbox" 
                  name="billableToCustomer" 
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500" 
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Billable to Customer</span>
                  <span className="text-[11px] text-slate-500 block">Recovers this charge on the customer's final freight invoice.</span>
                </div>
              </label>
            </div>

            {/* Description & Remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Description & Reason *</label>
              <textarea 
                name="description"
                required 
                rows={3}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs bg-white text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm resize-none" 
                placeholder="e.g. 24 hours detention at factory gate due to crane breakdown. Verified by warehouse gate slip." 
              />
            </div>
            
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white shrink-0">
          <button 
            type="submit" 
            form="charge-form"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
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
