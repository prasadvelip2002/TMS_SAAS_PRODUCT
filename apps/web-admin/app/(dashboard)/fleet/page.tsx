"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td } from "@/components/PrototypeUI";
import { Search, Grid, List, Plus, Truck, X, Activity } from "lucide-react";

interface Vendor {
  id: number;
  name: string;
  code: string;
  gstin: string;
  pan: string;
  bankName: string;
  bankAccountNumber: string;
  bankIFSC: string;
  tdsInfo: string;
  contactPerson: string;
  email: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  routeRemarks: string;
  status: string;
  createdAt: string;
}

const DEFAULT_FORM = {
  id: 0,
  name: "",
  code: "",
  gstin: "",
  pan: "",
  bankName: "",
  bankAccountNumber: "",
  bankIFSC: "",
  tdsInfo: "",
  contactPerson: "",
  email: "",
  address: "",
  city: "",
  state: "",
  phone: "",
  routeRemarks: "",
  status: "Active"
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const filteredVendors = vendors.filter(v => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      v.name?.toLowerCase().includes(q) ||
      v.code?.toLowerCase().includes(q) ||
      v.phone?.toLowerCase().includes(q) ||
      v.pan?.toLowerCase().includes(q) ||
      v.gstin?.toLowerCase().includes(q) ||
      v.city?.toLowerCase().includes(q) ||
      v.state?.toLowerCase().includes(q) ||
      v.contactPerson?.toLowerCase().includes(q) ||
      v.routeRemarks?.toLowerCase().includes(q) ||
      v.status?.toLowerCase().includes(q)
    );
  });

  const loadVendors = async () => {
    try {
      const data = await fetchApi("/Vendors");
      setVendors(data);
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (formData.id > 0) {
        await fetchApi(`/Vendors/${formData.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
      } else {
        await fetchApi("/Vendors", {
          method: "POST",
          body: JSON.stringify({ ...formData, id: undefined }),
        });
      }
      setFormData(DEFAULT_FORM);
      setIsFormOpen(false);
      loadVendors();
    } catch (error) {
      console.error(error);
      alert("Failed to save vendor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (v: Vendor) => {
    setFormData({
      id: v.id,
      name: v.name || "",
      code: v.code || "",
      gstin: v.gstin || "",
      pan: v.pan || "",
      bankName: v.bankName || "",
      bankAccountNumber: v.bankAccountNumber || "",
      bankIFSC: v.bankIFSC || "",
      tdsInfo: v.tdsInfo || "",
      contactPerson: v.contactPerson || "",
      email: v.email || "",
      address: v.address || "",
      city: v.city || "",
      state: v.state || "",
      phone: v.phone || "",
      routeRemarks: v.routeRemarks || "",
      status: v.status || "Active"
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;
    try {
      await fetchApi(`/Vendors/${id}`, { method: "DELETE" });
      loadVendors();
    } catch (error) {
      alert("Failed to delete vendor");
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "Active") return <span className="px-[8px] py-[3px] bg-[#dcfce7] text-[#166534] rounded-[6px] text-[11px] font-medium border border-[#bbf7d0]">Active</span>;
    if (status === "Blacklisted") return <span className="px-[8px] py-[3px] bg-[#fee2e2] text-[#991b1b] rounded-[6px] text-[11px] font-medium border border-[#fecaca]">Blacklisted</span>;
    return <span className="px-[8px] py-[3px] bg-gray-100 text-gray-700 rounded-[6px] text-[11px] font-medium border border-gray-200">{status || 'Draft'}</span>;
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fleet Vendor Management</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage your transport partners, documentation, and compliance.</p>
        </div>
        <button 
          onClick={() => { setFormData(DEFAULT_FORM); setIsFormOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Vendor
        </button>
      </div>

      {/* Search & Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 p-2 mb-6 flex items-center justify-between">
        <div className="flex items-center px-4 gap-3 flex-1">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search vendors by name, code, PAN, city, remarks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none focus:outline-none text-sm text-slate-700 font-medium placeholder:text-slate-400 py-2.5"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
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
      ) : filteredVendors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-20 flex flex-col items-center justify-center text-center mt-2">
           <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
             <Truck className="w-8 h-8" />
           </div>
           <h3 className="text-xl font-bold text-slate-900 mb-2">
             {searchQuery ? "No matching vendors found" : "No vendors found"}
           </h3>
           <p className="text-slate-500 text-[14.5px] mb-8 max-w-sm">
             {searchQuery 
               ? `No vendors matched "${searchQuery}". Try another search keyword.` 
               : "You haven't added any fleet vendors to the system yet."}
           </p>
           {searchQuery ? (
             <button
               onClick={() => setSearchQuery("")}
               className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl transition-all"
             >
               Clear Search Filter
             </button>
           ) : (
             <button 
               onClick={() => { setFormData(DEFAULT_FORM); setIsFormOpen(true); }}
               className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center gap-2"
             >
               <Plus className="w-5 h-5" />
               Add First Vendor
             </button>
           )}
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 overflow-hidden">
          <ProtoTable headers={["CODE", "VENDOR", "PAN", "STATUS", "REMARKS", "ACTIONS"]}>
            {filteredVendors.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => handleEdit(v)}>
                <Td className="font-mono text-[12px]">{v.code || "—"}</Td>
                <Td>{v.name}</Td>
                <Td className="font-mono text-[12px]">{v.pan}</Td>
                <Td>{getStatusBadge(v.status)}</Td>
                <Td className="text-muted-text text-[12px] max-w-[120px] truncate" title={v.routeRemarks}>{v.routeRemarks || "—"}</Td>
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
          {filteredVendors.map((v) => (
            <div key={v.id} onClick={() => handleEdit(v)} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer group relative flex flex-col h-full overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg line-clamp-1">{v.name}</h3>
                  <p className="text-xs font-mono text-slate-500 mt-1">{v.code || "NO-CODE"}</p>
                </div>
                {getStatusBadge(v.status)}
              </div>
              
              <div className="flex-1 space-y-3 mb-6 mt-2">
                <div className="flex items-center text-sm text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center mr-3 border border-slate-100"><span className="text-[10px]">🏢</span></div>
                  <span className="truncate">{v.city ? `${v.city}, ${v.state}` : 'No Address Info'}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center mr-3 border border-slate-100"><span className="text-[10px]">📞</span></div>
                  <span>{v.phone || 'No Phone'}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center mr-3 border border-slate-100"><span className="text-[10px]">👤</span></div>
                  <span className="truncate">{v.contactPerson || 'No Contact Person'}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">PAN</div>
                  <div className="text-xs font-mono font-medium text-slate-700">{v.pan || 'N/A'}</div>
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
                 <h3 className="font-bold text-lg text-slate-900 tracking-tight">{formData.id > 0 ? "Edit Vendor" : "New Vendor"}</h3>
                 <p className="text-[13px] font-medium text-slate-500 mt-0.5">{formData.id > 0 ? "Update details" : "Onboard a new transport partner"}</p>
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
               <form id="vendorForm" onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Vendor Name</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="e.g. Ramesh Transport" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Code</label>
                      <input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="e.g. VEND-001" />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Status</label>
                      <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm">
                        <option value="Active">Active</option>
                        <option value="Blacklisted">Blacklisted</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">PAN Number</label>
                      <input required value={formData.pan} onChange={e => setFormData({...formData, pan: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="Required for TDS" />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">GSTIN</label>
                      <input value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="Optional" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Phone</label>
                      <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="Phone number" />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Contact Person</label>
                      <input value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="e.g. Ramesh" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="Vendor email" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">City</label>
                      <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="e.g. Mumbai" />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">State</label>
                      <input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="e.g. Maharashtra" />
                    </div>
                  </div>
                  <hr className="border-slate-200" />
                  <div>
                    <label className="block text-[11.5px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Bank Details</label>
                    <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Bank Name</label>
                        <input value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-[14px] bg-white hover:bg-slate-50 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="e.g. State Bank of India" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Account Number</label>
                          <input value={formData.bankAccountNumber} onChange={e => setFormData({...formData, bankAccountNumber: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-[14px] bg-white hover:bg-slate-50 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="e.g. 123456789012" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">IFSC Code</label>
                          <input value={formData.bankIFSC} onChange={e => setFormData({...formData, bankIFSC: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-[14px] bg-white hover:bg-slate-50 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm uppercase" placeholder="e.g. SBIN0001234" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Route Remarks</label>
                      <textarea value={formData.routeRemarks} onChange={e => setFormData({...formData, routeRemarks: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm min-h-[80px]" placeholder="e.g. Reliable on Blr-Mysore" />
                    </div>
                  </div>
               </form>
             </div>
             
             {/* Form Footer */}
             <div className="p-6 border-t border-slate-100 bg-white">
               <button 
                 type="submit" 
                 form="vendorForm" 
                 disabled={isSubmitting}
                 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
               >
                 {isSubmitting ? (
                   <><Activity className="w-5 h-5 mr-2 animate-spin" /> Saving...</>
                 ) : (
                   formData.id > 0 ? "Update Vendor" : "Save Vendor"
                 )}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
