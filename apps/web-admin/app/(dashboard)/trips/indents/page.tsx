"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td } from "@/components/PrototypeUI";
import { Search, Grid, List, Plus, FileText, X, Activity } from "lucide-react";

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
  status: string;
  destinationsJson?: string;
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
  status: "New",
  customerRate: "",
  pricingModel: "CaseToCase"
};

export default function IndentsPage() {
  const [indents, setIndents] = useState<Indent[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const loadData = async () => {
    try {
      const [indData, custData] = await Promise.all([
        fetchApi("/Indents"),
        fetchApi("/Customers")
      ]);
      setIndents(indData);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        customerId: parseInt(formData.customerId),
        weight: parseFloat(formData.weight),
        loadingDate: new Date(formData.loadingDate).toISOString(),
        destinationsJson: JSON.stringify([formData.destination]),
        customerRate: formData.customerRate ? parseFloat(formData.customerRate) : null,
        pricingModel: formData.pricingModel
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
      setIsFormOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to save indent");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (ind: Indent) => {
    setFormData({
      id: ind.id,
      customerId: ind.customerId?.toString() || "",
      source: ind.source || "",
      destination: ind.destination || "",
      material: ind.material || "",
      weight: ind.weight?.toString() || "",
      vehicleType: ind.vehicleType || "",
      loadingDate: ind.loadingDate ? ind.loadingDate.split('T')[0] : "",
      status: ind.status || "New",
      customerRate: (ind as any).customerRate?.toString() || "",
      pricingModel: (ind as any).pricingModel || "CaseToCase"
    });
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

  const getStatusBadge = (status: string) => {
    if (status === "Assigned") return <span className="px-[8px] py-[3px] bg-[#dcfce7] text-[#166534] rounded-[6px] text-[11px] font-medium border border-[#bbf7d0]">Assigned</span>;
    if (status === "Confirmed") return <span className="px-[8px] py-[3px] bg-[#dcfce7] text-[#166534] rounded-[6px] text-[11px] font-medium border border-[#bbf7d0]">Confirmed</span>;
    if (status === "Pending" || status === "Open") return <span className="px-[8px] py-[3px] bg-[#ffedd5] text-[#1E40AF] rounded-[6px] text-[11px] font-medium border border-[#fdba74]">Open</span>;
    return <span className="px-[8px] py-[3px] bg-[#e0f2fe] text-[#075985] rounded-[6px] text-[11px] font-medium border border-[#bae6fd]">New</span>;
  };

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
              className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 p-5 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="font-mono font-bold text-slate-900 text-[13px] mb-1">IND-{1000 + ind.id}</div>
                  <div className="text-[13px] font-medium text-slate-600 line-clamp-1">{ind.customer?.name || `Customer #${ind.customerId}`}</div>
                </div>
                {getStatusBadge(ind.status)}
              </div>
              
              <div className="space-y-3 mb-5">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center text-[12px] text-slate-700 font-medium mb-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></div>
                    {ind.source}
                  </div>
                  <div className="flex items-center text-[12px] text-slate-700 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></div>
                    {ind.destination}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                    <div className="text-slate-400 font-medium text-[10px] uppercase tracking-wider mb-0.5">Vehicle</div>
                    <div className="font-semibold text-slate-700 line-clamp-1">{ind.vehicleType}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                    <div className="text-slate-400 font-medium text-[10px] uppercase tracking-wider mb-0.5">Rate</div>
                    <div className="font-semibold text-slate-700 line-clamp-1">
                      {(ind as any).customerRate ? `₹${(ind as any).customerRate.toLocaleString()}` : 'TBD'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="text-[11.5px] font-medium text-slate-500">
                  <span className="text-slate-400 mr-1">Pickup:</span>
                  {new Date(ind.loadingDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(ind.id); }}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-md text-[11.5px] font-bold opacity-0 group-hover:opacity-100 transition-all"
                >
                  Delete
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
                <Td className="text-[12px] whitespace-nowrap">{new Date(ind.loadingDate).toLocaleDateString()}</Td>
                <Td>{getStatusBadge(ind.status)}</Td>
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
                  <div className="col-span-2">
                    <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Customer</label>
                    <select required value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm">
                      <option value="">Select Customer</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Source</label>
                      <input required value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="e.g. Mumbai" />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Destination</label>
                      <input required value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="e.g. Pune" />
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Vehicle Type Req.</label>
                      <input required value={formData.vehicleType} onChange={e => setFormData({...formData, vehicleType: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="e.g. 10 Wheeler" />
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
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Loading Date</label>
                      <input required type="date" value={formData.loadingDate} onChange={e => setFormData({...formData, loadingDate: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Pricing Model</label>
                      <select required value={formData.pricingModel} onChange={e => setFormData({...formData, pricingModel: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm">
                        <option value="CaseToCase">Case to Case / Spot Rate</option>
                        <option value="AnnualContract">Annual Contract</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Customer Rate (₹)</label>
                      <input type="number" step="0.01" value={formData.customerRate} onChange={e => setFormData({...formData, customerRate: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="e.g. 15000" />
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
