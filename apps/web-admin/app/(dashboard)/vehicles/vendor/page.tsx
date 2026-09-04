"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td } from "@/components/PrototypeUI";
import { Search, Grid, List, Plus, CreditCard, X, Activity } from "lucide-react";

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
  vendor?: { name: string };
  status: string;
}

interface Vendor {
  id: number;
  name: string;
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
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const loadData = async () => {
    try {
      const [vehData, venData] = await Promise.all([
        fetchApi("/Vehicles?isOwnFleet=false"),
        fetchApi("/Vendors")
      ]);
      setVehicles(vehData);
      setVendors(venData);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Vendor Fleet Vehicles</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage external 3PL and broker fleet capacity.</p>
        </div>
        <button 
          onClick={() => { setFormData(DEFAULT_FORM); setIsFormOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Vehicle
        </button>
      </div>

      {/* Search & Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 p-2 mb-6 flex items-center justify-between">
        <div className="flex items-center px-4 gap-3 flex-1">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search vehicles by registration number or type..." 
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
      ) : vehicles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-20 flex flex-col items-center justify-center text-center mt-2">
           <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
             <CreditCard className="w-8 h-8" />
           </div>
           <h3 className="text-xl font-bold text-slate-900 mb-2">No vehicles found</h3>
           <p className="text-slate-500 text-[14.5px] mb-8 max-w-sm">You haven't added any vehicles to your fleet yet.</p>
           <button 
             onClick={() => { setFormData(DEFAULT_FORM); setIsFormOpen(true); }}
             className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center gap-2"
           >
             <Plus className="w-5 h-5" />
             Add First Vehicle
           </button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 overflow-hidden">
          <ProtoTable headers={["CODE", "REG. NUMBER", "TYPE", "CAPACITY", "VENDOR", "STATUS", "ACTIONS"]}>
            {vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => handleEdit(v)}>
                <Td className="font-mono text-[12px]">{v.code || "—"}</Td>
                <Td className="font-mono font-semibold">{v.vehicleNumber}</Td>
                <Td>{v.type}</Td>
                <Td>{v.capacity} Tons</Td>
                <Td className="text-[12px]">{v.vendor?.name || `Vendor #${v.vendorId}`}</Td>
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
          {vehicles.map((v) => (
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
                 <h3 className="font-bold text-lg text-slate-900 tracking-tight">{formData.id > 0 ? "Edit Vehicle" : "New Vehicle"}</h3>
                 <p className="text-[13px] font-medium text-slate-500 mt-0.5">{formData.id > 0 ? "Update details" : "Add a new vehicle to fleet"}</p>
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
               <form id="vehicleForm" onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Reg. Number</label>
                      <input required value={formData.vehicleNumber} onChange={e => setFormData({...formData, vehicleNumber: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm uppercase" placeholder="KA01AB1234" />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Code</label>
                      <input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm uppercase" placeholder="VEH-001" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Capacity (Tons)</label>
                      <input required type="number" step="0.5" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="e.g. 20" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Vendor</label>
                      <select required value={formData.vendorId} onChange={e => setFormData({...formData, vendorId: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm">
                        <option value="">Select Vendor</option>
                        {vendors.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Status</label>
                      <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm">
                        <option value="Active">Active</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Owner Name</label>
                      <input value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="Vehicle Owner" />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">RC Number</label>
                      <input value={formData.rcNumber} onChange={e => setFormData({...formData, rcNumber: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="RC12345" />
                    </div>
                  </div>
                  <hr className="border-slate-200" />
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Insurance Expiry</label>
                      <input type="date" value={formData.insuranceExpiry} onChange={e => setFormData({...formData, insuranceExpiry: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Permit Expiry</label>
                      <input type="date" value={formData.permitExpiry} onChange={e => setFormData({...formData, permitExpiry: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Fitness Expiry</label>
                      <input type="date" value={formData.fitnessExpiry} onChange={e => setFormData({...formData, fitnessExpiry: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" />
                    </div>
                  </div>
               </form>
             </div>
             
             {/* Form Footer */}
             <div className="p-6 border-t border-slate-100 bg-white">
               <button 
                 type="submit" 
                 form="vehicleForm" 
                 disabled={isSubmitting}
                 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
               >
                 {isSubmitting ? (
                   <><Activity className="w-5 h-5 mr-2 animate-spin" /> Saving...</>
                 ) : (
                   formData.id > 0 ? "Update Vehicle" : "Save Vehicle"
                 )}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
