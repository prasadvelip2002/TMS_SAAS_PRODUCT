"use client";

import { useState } from "react";
import { ProtoTable, Td } from "@/components/PrototypeUI";
import { Search, Grid, List, Receipt, Plus, X, HandCoins } from "lucide-react";

export default function AdditionalChargesPage() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In a real application, you would fetch these from the API.
  // We're leaving it as an empty state array to demonstrate the premium empty state UI.
  const [charges, setCharges] = useState<any[]>([]);

  const handleLogCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsPanelOpen(false);
      alert("Additional charge logged successfully! (Demo)");
    }, 1000);
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end mb-[20px] shrink-0">
        <div>
          <h1 className="font-disp font-bold text-[28px] text-slate-900 tracking-tight leading-tight">Additional Charges</h1>
          <p className="text-[14px] text-slate-500 mt-1 font-medium">Log and track tolls, detention, and loading/unloading fees.</p>
        </div>
        
        <div className="flex items-center gap-[16px]">
          <button 
            onClick={() => setIsPanelOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Log New Charge
          </button>
          
          <div className="h-[24px] w-[1px] bg-slate-200"></div>

          <div className="relative">
            <Search className="w-[16px] h-[16px] text-slate-400 absolute left-[14px] top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search charges..." 
              className="w-[240px] h-[42px] bg-white border border-slate-200 rounded-[12px] pl-[40px] pr-[14px] text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
            />
          </div>
          
          <div className="flex bg-white border border-slate-200 rounded-[12px] p-1 shadow-sm">
            <button className="p-1.5 bg-slate-100 text-slate-800 rounded-[8px] shadow-sm"><List className="w-4 h-4" /></button>
            <button className="p-1.5 text-slate-400 hover:text-slate-800 rounded-[8px]"><Grid className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* FULL WIDTH TABLE */}
      <div className="bg-white border border-slate-200 rounded-[16px] overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <ProtoTable headers={["CHARGE ID", "TRIP ID", "CHARGE TYPE", "AMOUNT", "DESCRIPTION", "ACTION"]}>
            {charges.length === 0 ? (
              <tr>
                <Td colSpan={6} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <Receipt className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-[16px] font-bold text-slate-800 mb-1">No Additional Charges Logged</h3>
                    <p className="text-[14px] text-slate-500 max-w-sm mx-auto">
                      All trips are running smoothly without any extra detention or toll charges.
                    </p>
                    <button 
                      onClick={() => setIsPanelOpen(true)}
                      className="mt-6 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-xl text-[13px] font-bold transition-all shadow-sm flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Log a Charge
                    </button>
                  </div>
                </Td>
              </tr>
            ) : (
              charges.map(charge => (
                <tr key={charge.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
                  {/* Rendering logic would go here when integrated with API */}
                </tr>
              ))
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
        className={`fixed top-0 right-0 h-full w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-200 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <HandCoins className="w-5 h-5 text-slate-400" /> Log Additional Charge
            </h2>
            <p className="text-[13px] text-slate-500 mt-1 font-medium">Record extra expenses for a specific trip.</p>
          </div>
          <button 
            onClick={() => setIsPanelOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <form id="charge-form" onSubmit={handleLogCharge} className="space-y-6">
            
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Trip ID</label>
              <input 
                required 
                type="text"
                placeholder="e.g. TRP-1045"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-[14px] bg-white text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Charge Type</label>
              <select required className="w-full border border-slate-300 rounded-xl px-4 py-3 text-[14px] bg-white text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm">
                <option value="">Select Charge Type</option>
                <option value="Detention">Detention Charges</option>
                <option value="Loading">Loading/Unloading Charges (Hamali)</option>
                <option value="Toll">Toll Charges</option>
                <option value="Weighbridge">Weighbridge Charges</option>
                <option value="Other">Other Penalty/Charge</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input 
                  required 
                  type="number" 
                  className="w-full border border-slate-300 rounded-xl pl-9 pr-4 py-3 text-[14px] bg-white text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
                  placeholder="0.00" 
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Description & Remarks</label>
              <textarea 
                required 
                rows={4}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-[14px] bg-white text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm resize-none" 
                placeholder="Provide details about why this charge was incurred..." 
              />
            </div>
            
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white shrink-0">
          <button 
            type="submit" 
            form="charge-form"
            disabled={isSubmitting}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Additional Charge"}
          </button>
        </div>
      </div>
    </div>
  );
}
