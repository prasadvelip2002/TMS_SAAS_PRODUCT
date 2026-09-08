"use client";

import { useState, useEffect } from "react";
import { createIndent, getCustomers, getCustomerRates } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatTime12H } from "@/lib/utils";
import { Sparkles, CheckCircle2 } from "lucide-react";

export function IndentForm({ onSuccess }: { onSuccess: () => void }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Contract customer rates
  const [customerContractRates, setCustomerContractRates] = useState<any[]>([]);
  const [isContractLoading, setIsContractLoading] = useState(false);
  const [isCustomSource, setIsCustomSource] = useState(false);
  const [isCustomDestination, setIsCustomDestination] = useState(false);
  const [contractRateBadge, setContractRateBadge] = useState<string | null>(null);

  // Customer Type filter: 'Contract' | 'Spot' | 'All'
  const [customerTypeFilter, setCustomerTypeFilter] = useState<'Contract' | 'Spot' | 'All'>('Contract');

  const [formData, setFormData] = useState({
    customerId: "",
    source: "",
    destinations: [""],
    material: "",
    weight: "",
    vehicleType: "",
    loadingDate: new Date().toISOString().split('T')[0],
    loadingTime: "10:00",
    customerRate: "",
    pricingModel: "CaseToCase",
    warehouseLocation: "",
  });

  useEffect(() => {
    getCustomers().then(setCustomers).catch(console.error);
  }, []);

  const handleCustomerSelect = async (selectedId: string) => {
    setFormData(prev => ({
      ...prev,
      customerId: selectedId,
      source: "",
      destinations: [""],
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

        const uniqueSrcs: string[] = Array.from(new Set(rates.map((r: any) => String(r.source))));
        if (uniqueSrcs.length === 1) {
          const onlySrc: string = uniqueSrcs[0];
          const destsForSrc: string[] = Array.from(new Set(rates.filter((r: any) => r.source === onlySrc).map((r: any) => String(r.destination))));

          let nextDest = "";
          let nextVeh = formData.vehicleType;
          let nextRate = "";

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
            destinations: [nextDest],
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

  const handleSourceSelect = (srcVal: string) => {
    if (srcVal === "__custom__") {
      setIsCustomSource(true);
      setFormData(prev => ({ ...prev, source: "", destinations: [""], customerRate: "" }));
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
      destinations: [nextDest],
      vehicleType: nextVeh,
      customerRate: nextRate || prev.customerRate
    }));
  };

  const handleDestinationSelect = (destVal: string, index: number = 0) => {
    if (destVal === "__custom__") {
      setIsCustomDestination(true);
      const newDests = [...formData.destinations];
      newDests[index] = "";
      setFormData(prev => ({ ...prev, destinations: newDests, customerRate: "" }));
      setContractRateBadge(null);
      return;
    }

    const newDests = [...formData.destinations];
    newDests[index] = destVal;

    let nextVeh = formData.vehicleType;
    let nextRate = "";

    if (index === 0 && formData.source) {
      const matchingRates = customerContractRates.filter(r => 
        r.source.toLowerCase() === formData.source.toLowerCase() && 
        r.destination.toLowerCase() === destVal.toLowerCase()
      );

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
    }

    setFormData(prev => ({
      ...prev,
      destinations: newDests,
      vehicleType: nextVeh,
      customerRate: nextRate || prev.customerRate
    }));
  };

  const handleVehicleTypeSelect = (vehVal: string) => {
    let nextRate = formData.customerRate;
    let badge = null;

    if (formData.source && formData.destinations[0] && customerContractRates.length > 0) {
      const match = customerContractRates.find(r => 
        r.source.toLowerCase() === formData.source.toLowerCase() && 
        r.destination.toLowerCase() === formData.destinations[0].toLowerCase() &&
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
    setLoading(true);
    try {
      await createIndent({
        ...formData,
        customerId: parseInt(formData.customerId),
        weight: parseFloat(formData.weight),
        loadingDate: new Date(formData.loadingDate).toISOString(),
        loadingTime: formData.loadingTime || null,
        destination: formData.destinations[0] || "",
        destinationsJson: JSON.stringify(formData.destinations),
        customerRate: formData.customerRate ? parseFloat(formData.customerRate) : null,
        pricingModel: formData.pricingModel
      });
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("Failed to create indent");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerTypeFilterChange = (type: 'Contract' | 'Spot' | 'All') => {
    setCustomerTypeFilter(type);
    if (formData.customerId) {
      const cust = customers.find(c => c.id.toString() === formData.customerId);
      if (cust) {
        if (type === 'Contract' && cust.customerType !== 'Contract') {
          handleCustomerSelect("");
        } else if (type === 'Spot' && cust.customerType === 'Contract') {
          handleCustomerSelect("");
        }
      }
    }
  };

  const selectedCustomer = customers.find(c => c.id.toString() === formData.customerId);
  const filteredCustomersByType = customers.filter(c => {
    if (customerTypeFilter === 'Contract') return c.customerType === 'Contract';
    if (customerTypeFilter === 'Spot') return c.customerType !== 'Contract';
    return true;
  });
  const contractSources: string[] = Array.from(new Set(customerContractRates.map((r: any) => String(r.source))));
  const contractDestinations: string[] = formData.source
    ? Array.from(new Set(customerContractRates.filter((r: any) => r.source.toLowerCase() === formData.source.toLowerCase()).map((r: any) => String(r.destination))))
    : Array.from(new Set(customerContractRates.map((r: any) => String(r.destination))));

  const routeContractedRates = formData.source && formData.destinations[0]
    ? customerContractRates.filter((r: any) => 
        r.source.toLowerCase() === formData.source.toLowerCase() && 
        r.destination.toLowerCase() === formData.destinations[0].toLowerCase()
      )
    : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Customer Selection */}
        <div className="space-y-2 col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <label className="text-sm font-medium">Customer *</label>

            {/* Customer Type Quick Filter Switcher */}
            <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => handleCustomerTypeFilterChange("Contract")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                  customerTypeFilter === "Contract" 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <span>🏢 Contract</span>
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${customerTypeFilter === "Contract" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>
                  {customers.filter(c => c.customerType === "Contract").length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleCustomerTypeFilterChange("Spot")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                  customerTypeFilter === "Spot" 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <span>⚡ Spot</span>
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${customerTypeFilter === "Spot" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>
                  {customers.filter(c => c.customerType !== "Contract").length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleCustomerTypeFilterChange("All")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  customerTypeFilter === "All" 
                    ? "bg-white text-slate-800 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                All ({customers.length})
              </button>
            </div>
          </div>

          {isContractLoading && (
            <div className="text-xs text-blue-600 animate-pulse font-medium">
              Fetching contract rates...
            </div>
          )}

          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.customerId}
            onChange={e => handleCustomerSelect(e.target.value)}
            required
          >
            <option value="">
              {customerTypeFilter === "Contract" 
                ? "— Select a Contract Customer —" 
                : customerTypeFilter === "Spot" 
                ? "— Select a Spot Customer —" 
                : "— Select a customer... —"}
            </option>
            {filteredCustomersByType.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.gstin || "No GST"}) {c.customerType === "Contract" ? "★ [Contract]" : ""}
              </option>
            ))}
          </select>

          {selectedCustomer && (
            <div className="mt-1 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs flex items-center justify-between">
              <span className="font-semibold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                {selectedCustomer.customerType === "Contract" ? "Annual Contract Account" : "Spot Customer"}
              </span>
              {customerContractRates.length > 0 && (
                <span className="font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                  {customerContractRates.length} Contract Routes
                </span>
              )}
            </div>
          )}
        </div>

        {/* Source Field */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Source *</label>
            {contractSources.length > 0 && isCustomSource && (
              <button 
                type="button" 
                onClick={() => setIsCustomSource(false)} 
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Use Contract Dropdown
              </button>
            )}
          </div>

          {contractSources.length > 0 && !isCustomSource ? (
            <select
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={formData.source}
              onChange={e => handleSourceSelect(e.target.value)}
            >
              <option value="">Select Contract Source...</option>
              {contractSources.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="__custom__">✏️ Custom / Other Source...</option>
            </select>
          ) : (
            <input 
              type="text" 
              required 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.source}
              onChange={e => setFormData({...formData, source: e.target.value})}
              placeholder="e.g. Bangalore"
            />
          )}
        </div>

        {/* Destination Field */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Destination *</label>
            {contractDestinations.length > 0 && isCustomDestination && (
              <button 
                type="button" 
                onClick={() => setIsCustomDestination(false)} 
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Use Contract Dropdown
              </button>
            )}
          </div>

          {contractDestinations.length > 0 && !isCustomDestination ? (
            <select
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={formData.destinations[0] || ""}
              onChange={e => handleDestinationSelect(e.target.value, 0)}
            >
              <option value="">Select Contract Destination...</option>
              {contractDestinations.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
              <option value="__custom__">✏️ Custom / Other Destination...</option>
            </select>
          ) : (
            <input 
              type="text" 
              required 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.destinations[0] || ""}
              onChange={e => {
                const newDests = [...formData.destinations];
                newDests[0] = e.target.value;
                setFormData({...formData, destinations: newDests});
              }}
              placeholder="e.g. Pune"
            />
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Material</label>
          <input 
            type="text" 
            required 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.material}
            onChange={e => setFormData({...formData, material: e.target.value})}
            placeholder="e.g. Cement"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Weight (Tons)</label>
          <input 
            type="number" 
            step="0.01" 
            required 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.weight}
            onChange={e => setFormData({...formData, weight: e.target.value})}
            placeholder="e.g. 20"
          />
        </div>

        {/* Vehicle Type Req. */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Vehicle Type Req. *</label>
            {contractRateBadge && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Agreed
              </span>
            )}
          </div>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={formData.vehicleType}
            onChange={e => handleVehicleTypeSelect(e.target.value)}
            required
          >
            <option value="">Select Vehicle Type...</option>
            {routeContractedRates.length > 0 && (
              <optgroup label="⭐ Pre-agreed Contract Rates on this Route">
                {routeContractedRates.map((r: any) => (
                  <option key={r.id} value={r.vehicleType}>
                    {r.vehicleType} — Agreed: ₹{Number(r.rate).toLocaleString()}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Standard Vehicles">
              <option value="20 Ft Container">20 Ft Container</option>
              <option value="32 Ft Single Axle (SXL)">32 Ft Single Axle (SXL)</option>
              <option value="32 Ft Multi-Axle (MXL)">32 Ft Multi-Axle (MXL)</option>
              <option value="10 Wheeler (16 Ton)">10 Wheeler (16 Ton)</option>
              <option value="14 Wheeler (25 Ton)">14 Wheeler (25 Ton)</option>
              <option value="40 Ft Trailer">40 Ft Trailer</option>
              <option value="14 ft Open Body">14 ft Open Body</option>
              <option value="20 ft Open Body">20 ft Open Body</option>
              <option value="32 ft Open Body">32 ft Open Body</option>
            </optgroup>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Loading Date</label>
          <input 
            type="date" 
            required 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.loadingDate}
            onChange={e => setFormData({...formData, loadingDate: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Pickup Time</label>
            {formData.loadingTime && (
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                {formatTime12H(formData.loadingTime)}
              </span>
            )}
          </div>
          <input 
            type="time" 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.loadingTime}
            onChange={e => setFormData({...formData, loadingTime: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Pricing Model</label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.pricingModel}
            onChange={e => setFormData({...formData, pricingModel: e.target.value})}
          >
            <option value="CaseToCase">Case to Case / Spot Rate</option>
            <option value="AnnualContract">Annual Contract</option>
          </select>
        </div>

        {formData.pricingModel === "AnnualContract" && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Customer Rate (₹)</label>
              {contractRateBadge && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  ✓ Auto-filled
                </span>
              )}
            </div>
            <input 
              type="number" 
              step="0.01" 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono font-bold ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.customerRate}
              onChange={e => setFormData({...formData, customerRate: e.target.value})}
              placeholder={contractRateBadge ? "Auto-filled from contract" : "e.g. 15000"}
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Intermediate Warehouse (Optional)</label>
          <input 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.warehouseLocation}
            onChange={e => setFormData({...formData, warehouseLocation: e.target.value})}
            placeholder="e.g. Bhiwandi Hub"
          />
        </div>
      </div>
      
      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
          {loading ? "Creating..." : "Create Indent"}
        </Button>
      </div>
    </form>
  );
}
