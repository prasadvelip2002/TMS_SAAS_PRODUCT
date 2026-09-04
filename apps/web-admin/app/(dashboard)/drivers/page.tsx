"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td } from "@/components/PrototypeUI";
import { Search, Grid, List, Plus, Users, User, X, Activity } from "lucide-react";

interface Driver {
  id: number;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  aadhaar: string;
  experienceYears: number | null;
  currentStatus: string;
  vendorId?: number | null;
  vendor?: { name: string };
}

const DEFAULT_FORM = {
  id: 0,
  name: "",
  phone: "",
  licenseNumber: "",
  licenseExpiry: "",
  aadhaar: "",
  experienceYears: "",
  currentStatus: "Available"
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const loadDrivers = async () => {
    try {
      const data = await fetchApi("/Drivers");
      setDrivers(data);
    } catch (error) {
      console.error("Failed to fetch drivers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : null,
      };

      if (formData.id > 0) {
        await fetchApi(`/Drivers/${formData.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi("/Drivers", {
          method: "POST",
          body: JSON.stringify({ ...payload, id: undefined }),
        });
      }
      setFormData(DEFAULT_FORM);
      setIsFormOpen(false);
      loadDrivers();
    } catch (error) {
      console.error(error);
      alert("Failed to save driver");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (d: Driver) => {
    setFormData({
      id: d.id,
      name: d.name || "",
      phone: d.phone || "",
      licenseNumber: d.licenseNumber || "",
      licenseExpiry: d.licenseExpiry ? d.licenseExpiry.split('T')[0] : "",
      aadhaar: d.aadhaar || "",
      experienceYears: d.experienceYears?.toString() || "",
      currentStatus: d.currentStatus || "Available"
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this driver?")) return;
    try {
      await fetchApi(`/Drivers/${id}`, { method: "DELETE" });
      loadDrivers();
    } catch (error) {
      alert("Failed to delete driver");
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "Available") return <span className="px-[8px] py-[3px] bg-[#dcfce7] text-[#166534] rounded-[6px] text-[11px] font-medium border border-[#bbf7d0]">Available</span>;
    if (status === "On Trip") return <span className="px-[8px] py-[3px] bg-[#e0e7ff] text-[#3730a3] rounded-[6px] text-[11px] font-medium border border-[#c7d2fe]">On Trip</span>;
    if (status === "On Leave") return <span className="px-[8px] py-[3px] bg-[#fee2e2] text-[#991b1b] rounded-[6px] text-[11px] font-medium border border-[#fecaca]">On Leave</span>;
    return <span className="px-[8px] py-[3px] bg-gray-100 text-gray-700 rounded-[6px] text-[11px] font-medium border border-gray-200">{status || 'Draft'}</span>;
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Driver Management</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage driver profiles, licenses, and availability.</p>
        </div>
        <button 
          onClick={() => { setFormData(DEFAULT_FORM); setIsFormOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Driver
        </button>
      </div>

      {/* Search & Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 p-2 mb-6 flex items-center justify-between">
        <div className="flex items-center px-4 gap-3 flex-1">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search drivers by name, phone, or license..." 
            className="w-full bg-transparent border-none focus:outline-none text-sm text-slate-700 font-medium placeholder:text-slate-400 py-2.5"
          />
        </div>
        <div className="flex items-center gap-2 pr-2">
          <button onClick={() => setViewMode('grid')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${viewMode === 'grid' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>
            <Grid className="w-4 h-4" /> Grid
          </button>
          <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${viewMode === 'list' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>
            <List className="w-4 h-4" /> Table
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex justify-center p-16">
          <Activity className="animate-spin text-blue-600 w-8 h-8" />
        </div>
      ) : drivers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-20 flex flex-col items-center justify-center text-center mt-2">
           <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
             <User className="w-8 h-8" />
           </div>
           <h3 className="text-xl font-bold text-slate-900 mb-2">No drivers found</h3>
           <p className="text-slate-500 text-[14.5px] mb-8 max-w-sm">You haven't added any drivers to the system yet.</p>
           <button 
             onClick={() => { setFormData(DEFAULT_FORM); setIsFormOpen(true); }}
             className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center gap-2"
           >
             <Plus className="w-5 h-5" />
             Add First Driver
           </button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 overflow-hidden">
          <ProtoTable headers={["DRIVER NAME", "PHONE", "LICENSE", "EXPIRY", "STATUS", "ACTIONS"]}>
            {drivers.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => handleEdit(d)}>
                <Td className="font-medium text-ink">{d.name}</Td>
                <Td className="font-mono text-[12px]">{d.phone}</Td>
                <Td className="font-mono text-[12px]">{d.licenseNumber}</Td>
                <Td className="text-[12px]">
                  {d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString() : "—"}
                </Td>
                <Td>{getStatusBadge(d.currentStatus)}</Td>
                <Td>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }}
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
          {drivers.map((d) => {
            const isExpiring = d.licenseExpiry && new Date(d.licenseExpiry).getTime() < Date.now() + 30 * 24 * 60 * 60 * 1000;
            return (
              <div key={d.id} onClick={() => handleEdit(d)} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer group relative flex flex-col h-full overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                      <span className="text-[16px]">👤</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{d.name}</h3>
                      <p className="text-xs font-mono text-slate-500">{d.phone}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 space-y-3 mb-6 mt-2">
                  <div className="flex items-center text-sm text-slate-600">
                    <span className="w-[80px] text-xs font-bold text-slate-400 uppercase tracking-wider">License</span>
                    <span className="font-mono font-medium">{d.licenseNumber}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <span className="w-[80px] text-xs font-bold text-slate-400 uppercase tracking-wider">Expiry</span>
                    <span className={`font-medium ${isExpiring ? 'text-red-600 font-bold' : ''}`}>
                      {d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString() : "—"}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <span className="w-[80px] text-xs font-bold text-slate-400 uppercase tracking-wider">Vendor</span>
                    <span className="truncate">{d.vendor?.name || `Vendor #${d.vendorId}`}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div>
                    {getStatusBadge(d.currentStatus)}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }}
                    className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
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
                 <h3 className="font-bold text-lg text-slate-900 tracking-tight">{formData.id > 0 ? "Edit Driver" : "New Driver"}</h3>
                 <p className="text-[13px] font-medium text-slate-500 mt-0.5">{formData.id > 0 ? "Update details" : "Register a new driver"}</p>
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
               <form id="driverForm" onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Driver Name</label>
                      <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="e.g. Ramesh Kumar" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Phone Number</label>
                      <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="Mobile number" />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Current Status</label>
                      <select value={formData.currentStatus} onChange={e => setFormData({...formData, currentStatus: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm">
                        <option value="Available">Available</option>
                        <option value="On Trip">On Trip</option>
                        <option value="On Leave">On Leave</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">License Number</label>
                      <input required value={formData.licenseNumber} onChange={e => setFormData({...formData, licenseNumber: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm uppercase" placeholder="DL12345" />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">License Expiry</label>
                      <input type="date" value={formData.licenseExpiry} onChange={e => setFormData({...formData, licenseExpiry: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Aadhaar Number</label>
                      <input value={formData.aadhaar} onChange={e => setFormData({...formData, aadhaar: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="12-digit Aadhaar" />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Experience (Yrs)</label>
                      <input type="number" value={formData.experienceYears} onChange={e => setFormData({...formData, experienceYears: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="e.g. 5" />
                    </div>
                  </div>
               </form>
             </div>
             
             {/* Form Footer */}
             <div className="p-6 border-t border-slate-100 bg-white">
               <button 
                 type="submit" 
                 form="driverForm" 
                 disabled={isSubmitting}
                 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
               >
                 {isSubmitting ? (
                   <><Activity className="w-5 h-5 mr-2 animate-spin" /> Saving...</>
                 ) : (
                   formData.id > 0 ? "Update Driver" : "Save Driver"
                 )}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
