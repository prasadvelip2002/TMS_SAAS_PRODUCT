"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td, ProtoButton } from "@/components/PrototypeUI";
import { Search, Grid, List, Plus, Users, UserPlus, X, Activity } from "lucide-react";

interface Customer {
  id: number;
  name: string;
  gstin: string;
  address: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  pan: string;
  creditLimit: number;
  paymentTerms: string;
  code: string;
  rateContract: string;
  status: string;
  createdAt: string;
}

const DEFAULT_FORM = {
  id: 0,
  name: "",
  gstin: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pan: "",
  creditLimit: 0,
  paymentTerms: "Net 30",
  contactPerson: "",
  code: "",
  rateContract: "",
  status: "Active",
  customerType: "Spot"
};

export default function SpotCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const loadCustomers = async () => {
    try {
      const data = await fetchApi("/Customers?customerType=Spot");
      setCustomers(data);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (formData.id > 0) {
        // Edit
        await fetchApi(`/Customers/${formData.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
      } else {
        // Create
        await fetchApi("/Customers", {
          method: "POST",
          body: JSON.stringify({ ...formData, id: undefined }), // Let backend assign ID
        });
      }
      setFormData(DEFAULT_FORM);
      setIsFormOpen(false);
      loadCustomers();
    } catch (error) {
      console.error(error);
      alert("Failed to save customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (c: Customer) => {
    setFormData({
      id: c.id,
      name: c.name || "",
      gstin: c.gstin || "",
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
      city: c.city || "",
      state: c.state || "",
      pan: c.pan || "",
      creditLimit: c.creditLimit || 0,
      paymentTerms: c.paymentTerms || "Net 30",
      contactPerson: c.contactPerson || "",
      code: c.code || "",
      rateContract: c.rateContract || "",
      status: c.status || "Active",
      customerType: "Spot"
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      await fetchApi(`/Customers/${id}`, { method: "DELETE" });
      loadCustomers();
    } catch (error) {
      alert("Failed to delete customer");
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "Active") return <span className="px-[8px] py-[3px] bg-[#dcfce7] text-[#166534] rounded-[6px] text-[11px] font-medium border border-[#bbf7d0]">Active</span>;
    if (status === "Pending KYC") return <span className="px-[8px] py-[3px] bg-[#fef9c3] text-[#a16207] rounded-[6px] text-[11px] font-medium border border-[#fef08a]">Pending KYC</span>;
    if (status === "On Hold") return <span className="px-[8px] py-[3px] bg-[#fee2e2] text-[#991b1b] rounded-[6px] text-[11px] font-medium border border-[#fecaca]">On Hold</span>;
    return <span className="px-[8px] py-[3px] bg-gray-100 text-gray-700 rounded-[6px] text-[11px] font-medium border border-gray-200">{status || 'Draft'}</span>;
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Spot Customers (One-off)</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage one-off shipment customers and brokers.</p>
        </div>
        <button 
          onClick={() => { setFormData(DEFAULT_FORM); setIsFormOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      {/* Search & Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 p-2 mb-6 flex items-center justify-between">
        <div className="flex items-center px-4 gap-3 flex-1">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search customers by name, phone, or GSTIN..." 
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
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-20 flex flex-col items-center justify-center text-center mt-2">
           <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
             <Users className="w-8 h-8" />
           </div>
           <h3 className="text-xl font-bold text-slate-900 mb-2">No customers found</h3>
           <p className="text-slate-500 text-[14.5px] mb-8 max-w-sm">You haven't added any customers to the system yet.</p>
           <button 
             onClick={() => { setFormData(DEFAULT_FORM); setIsFormOpen(true); }}
             className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center gap-2"
           >
             <UserPlus className="w-5 h-5" />
             Add First Customer
           </button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 overflow-hidden">
          <ProtoTable headers={["CODE", "CUSTOMER", "GSTIN", "RATE CONTRACT", "STATUS", "ACTIONS"]}>
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => handleEdit(c)}>
                <Td className="font-mono text-[12px]">{c.code || "—"}</Td>
                <Td>{c.name}</Td>
                <Td className="font-mono text-[12px]">{c.gstin || "—"}</Td>
                <Td className="text-[12px] text-muted-text font-medium">{c.rateContract || "Draft"}</Td>
                <Td>{getStatusBadge(c.status)}</Td>
                <Td>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                    className="text-muted-text hover:text-alert text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
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
          {customers.map((c) => (
            <div key={c.id} onClick={() => handleEdit(c)} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer group relative flex flex-col h-full overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg line-clamp-1">{c.name}</h3>
                  <p className="text-xs font-mono text-slate-500 mt-1">{c.code || "NO-CODE"}</p>
                </div>
                {getStatusBadge(c.status)}
              </div>
              
              <div className="flex-1 space-y-3 mb-6 mt-2">
                <div className="flex items-center text-sm text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center mr-3 border border-slate-100"><span className="text-[10px]">🏢</span></div>
                  <span className="truncate">{c.city ? `${c.city}, ${c.state}` : 'No Address Info'}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center mr-3 border border-slate-100"><span className="text-[10px]">📞</span></div>
                  <span>{c.phone || 'No Phone'}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center mr-3 border border-slate-100"><span className="text-[10px]">✉️</span></div>
                  <span className="truncate">{c.email || 'No Email'}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">GSTIN</div>
                  <div className="text-xs font-mono font-medium text-slate-700">{c.gstin || 'N/A'}</div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
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
                 <h3 className="font-bold text-lg text-slate-900 tracking-tight">{formData.id > 0 ? "Edit Customer" : "New Customer"}</h3>
                 <p className="text-[13px] font-medium text-slate-500 mt-0.5">{formData.id > 0 ? "Update details" : "Create a new customer profile"}</p>
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
               <form id="customerForm" onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Customer Name</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="e.g. ABC Cement Ltd" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Code</label>
                      <input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="e.g. CUST-001" />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Status</label>
                      <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm">
                        <option value="Active">Active</option>
                        <option value="Pending KYC">Pending KYC</option>
                        <option value="On Hold">On Hold</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">GSTIN</label>
                    <input required value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="GST number" />
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">City</label>
                      <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="e.g. Bangalore" />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">State</label>
                      <input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="e.g. Karnataka" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Billing Address</label>
                    <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm min-h-[100px] resize-y" placeholder="Full address" />
                  </div>

               </form>
             </div>
             
             {/* Form Footer */}
             <div className="p-6 border-t border-slate-100 bg-white">
               <button 
                 type="submit" 
                 form="customerForm" 
                 disabled={isSubmitting}
                 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
               >
                 {isSubmitting ? (
                   <><Activity className="w-5 h-5 mr-2 animate-spin" /> Saving...</>
                 ) : (
                   formData.id > 0 ? "Update Customer" : "Save Customer"
                 )}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
