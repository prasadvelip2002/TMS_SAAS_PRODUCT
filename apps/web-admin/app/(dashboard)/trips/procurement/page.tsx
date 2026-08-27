"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td, Badge } from "@/components/PrototypeUI";
import { Loader2, Send, CheckCircle, Truck, DollarSign, X, Search, Grid, List, MapPin } from "lucide-react";

export default function ProcurementDashboard() {
  const [indents, setIndents] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // RFQ Broadcast State
  const [isRfqPanelOpen, setIsRfqPanelOpen] = useState(false);
  const [selectedIndent, setSelectedIndent] = useState<any>(null);
  const [selectedVendors, setSelectedVendors] = useState<number[]>([]);
  
  // View Bids State
  const [isBidsPanelOpen, setIsBidsPanelOpen] = useState(false);
  const [bids, setBids] = useState<any[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [indentsData, vendorsData] = await Promise.all([
        fetchApi("/Indents"),
        fetchApi("/Vendors")
      ]);
      // Only show indents that are New/Pending or have active RFQs
      setIndents(indentsData.filter((i: any) => i.status === "New" || i.status === "Pending" || i.status === "Assigned"));
      setVendors(vendorsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openRfqPanel = (indent: any) => {
    setSelectedIndent(indent);
    setSelectedVendors([]);
    setIsRfqPanelOpen(true);
    setIsBidsPanelOpen(false);
  };

  const handleSendRfq = async () => {
    if (selectedVendors.length === 0) return alert("Select at least one vendor");
    try {
      await fetchApi(`/Procurement/BroadcastRFQ/${selectedIndent.id}`, {
        method: "POST",
        body: JSON.stringify(selectedVendors),
      });
      setIsRfqPanelOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
      alert("Failed to send RFQ");
    }
  };

  const openBidsPanel = async (indent: any) => {
    setSelectedIndent(indent);
    setIsBidsPanelOpen(true);
    setIsRfqPanelOpen(false);
    setLoadingBids(true);
    try {
      const data = await fetchApi(`/Procurement/Quotations/${indent.id}`);
      setBids(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBids(false);
    }
  };

  const handleApproveBid = async (quotationId: number) => {
    if (!confirm("Are you sure you want to approve this rate? It will generate a Trip and Purchase Order automatically.")) return;
    try {
      const res = await fetchApi(`/Procurement/ApproveBid/${quotationId}`, { method: "POST" });
      alert(`Success! Generated Trip #${res.tripId} and ${res.poNumber}`);
      setIsBidsPanelOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
      alert("Failed to approve bid");
    }
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end mb-[20px] shrink-0">
        <div>
          <h1 className="font-disp font-bold text-[28px] text-slate-900 tracking-tight leading-tight">Procurement & Bidding</h1>
          <p className="text-[14px] text-slate-500 mt-1 font-medium">Manage vendor RFQs, compare bids, and generate POs.</p>
        </div>
        
        <div className="flex items-center gap-[12px]">
          <div className="relative">
            <Search className="w-[16px] h-[16px] text-slate-400 absolute left-[14px] top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search indents..." 
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
          <ProtoTable headers={["ID", "CUSTOMER", "ROUTE", "MATERIAL", "STATUS", "RFQ STATUS", "ACTIONS"]}>
            {loading ? (
              <tr>
                <Td colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-10 h-10 mb-3 animate-spin text-slate-300" />
                    <span className="text-[14px] font-medium">Loading Procurement Data...</span>
                  </div>
                </Td>
              </tr>
            ) : indents.length === 0 ? (
              <tr>
                <Td colSpan={7} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <Send className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-[16px] font-bold text-slate-800 mb-1">No Active Procurements</h3>
                    <p className="text-[14px] text-slate-500 max-w-sm mx-auto">
                      There are no active indents requiring vendor bidding right now.
                    </p>
                  </div>
                </Td>
              </tr>
            ) : (
              indents.map((indent) => (
                <tr key={indent.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
                  <Td className="font-mono text-[13px] font-semibold text-slate-600">IND-{1000 + indent.id}</Td>
                  <Td className="font-semibold text-slate-800">{indent.customer?.name}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-slate-700 max-w-[120px] truncate">{indent.source}</span>
                      <span className="text-slate-300">→</span>
                      <span className="text-[13px] font-medium text-slate-700 max-w-[120px] truncate">{indent.destination}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="text-[13px] font-medium text-slate-800">{indent.material}</div>
                    <div className="text-[11px] text-slate-500">{indent.weight} Tons • {indent.vehicleType}</div>
                  </Td>
                  <Td>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${indent.status === "Assigned" ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                      {indent.status}
                    </span>
                  </Td>
                  <Td>
                    <Badge 
                      color={
                        indent.rfqStatus === "Pending" ? "grey" :
                        indent.rfqStatus === "Sent" ? "blue" :
                        indent.rfqStatus === "QuotationReceived" ? "orange" :
                        "green"
                      }
                    >
                      {indent.rfqStatus}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      {indent.rfqStatus === "Pending" && (
                        <button 
                          onClick={() => openRfqPanel(indent)}
                          className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-xl text-[12px] font-bold hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" /> Broadcast RFQ
                        </button>
                      )}
                      {(indent.rfqStatus === "Sent" || indent.rfqStatus === "QuotationReceived") && (
                        <button 
                          onClick={() => openBidsPanel(indent)}
                          className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl text-[12px] font-bold hover:bg-amber-100 transition-colors flex items-center gap-1.5 relative"
                        >
                          <DollarSign className="w-3.5 h-3.5" /> View Bids
                          {indent.rfqStatus === "QuotationReceived" && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-sm border border-white" />
                          )}
                        </button>
                      )}
                      {indent.rfqStatus === "Approved" && (
                        <button className="bg-slate-100 text-slate-400 border border-slate-200 px-3 py-1.5 rounded-xl text-[12px] font-bold cursor-not-allowed flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" /> PO Generated
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </ProtoTable>
        </div>
      </div>

      {/* OVERLAYS FOR SLIDE PANELS */}
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${(isRfqPanelOpen || isBidsPanelOpen) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => { setIsRfqPanelOpen(false); setIsBidsPanelOpen(false); }}
      />

      {/* RFQ BROADCAST PANEL */}
      <div 
        className={`fixed top-0 right-0 h-full w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-200 ${isRfqPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Broadcast RFQ</h2>
            <p className="text-[13px] text-slate-500 mt-1 font-medium">Select vendors to invite</p>
          </div>
          <button 
            onClick={() => setIsRfqPanelOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl text-sm">
            You are requesting a vehicle for <br/>
            <strong className="text-sky-800 flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5"/> {selectedIndent?.source} → {selectedIndent?.destination}</strong>
            <div className="mt-2 text-sky-700/80">
              Required: <strong>{selectedIndent?.vehicleType}</strong> ({selectedIndent?.weight} Tons)
            </div>
          </div>
          
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 block">Vendor Directory</label>
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-sm">
              {vendors.map(v => (
                <label key={v.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors group">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors"
                    checked={selectedVendors.includes(v.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedVendors([...selectedVendors, v.id]);
                      else setSelectedVendors(selectedVendors.filter(id => id !== v.id));
                    }}
                  />
                  <div>
                    <div className="font-bold text-slate-700 text-sm group-hover:text-blue-700 transition-colors">{v.name}</div>
                    <div className="text-[12px] font-medium text-slate-500 mt-0.5">{v.city}, {v.state}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white">
          <button 
            onClick={handleSendRfq}
            disabled={selectedVendors.length === 0}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" /> Send RFQ to {selectedVendors.length} Vendors
          </button>
        </div>
      </div>

      {/* VIEW BIDS PANEL */}
      <div 
        className={`fixed top-0 right-0 h-full w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-200 ${isBidsPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Vendor Bids</h2>
            <p className="text-[13px] text-slate-500 mt-1 font-medium">IND-{selectedIndent ? 1000 + selectedIndent.id : ""}</p>
          </div>
          <button 
            onClick={() => setIsBidsPanelOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {loadingBids ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Loader2 className="w-10 h-10 mb-3 animate-spin text-slate-300" />
              <span className="text-[14px] font-medium">Loading Bids...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {bids.map(bid => (
                <div key={bid.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-slate-800 text-[15px]">{bid.vendor?.name}</h4>
                      <div className="text-[12px] font-medium text-slate-500 flex items-center gap-1.5 mt-1">
                        <Truck className="w-3.5 h-3.5 text-slate-400" /> {bid.proposedVehicleType || "Vehicle TBD"}
                      </div>
                    </div>
                    <Badge color={bid.status === "Pending" ? "grey" : bid.status === "Approved" ? "green" : bid.status === "Rejected" ? "red" : "orange"}>
                      {bid.status}
                    </Badge>
                  </div>
                  
                  {bid.status !== "Pending" ? (
                    <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                      <div>
                        <div className="text-[11px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Quoted Rate</div>
                        <div className="text-xl font-black text-slate-800">₹{bid.quotedRate?.toLocaleString('en-IN')}</div>
                      </div>
                      
                      {bid.status === "QuotationReceived" && (
                        <button 
                          onClick={() => handleApproveBid(bid.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-[13px] font-bold shadow-sm shadow-green-600/20 transition-all"
                        >
                          Approve & Generate PO
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 text-[13px] text-slate-400 font-medium italic bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                      Waiting for vendor to submit bid...
                    </div>
                  )}
                  
                  {/* Magic Link For Demo Purposes */}
                  {bid.status === "Pending" && (
                    <div className="mt-3 text-[11px] font-medium text-slate-400 flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg">
                      <span className="shrink-0">Vendor Magic Link:</span>
                      <a href={`/bidding/${bid.magicLinkToken}`} target="_blank" className="text-blue-500 hover:underline truncate hover:text-blue-600 transition-colors">
                        /bidding/{bid.magicLinkToken}
                      </a>
                    </div>
                  )}
                </div>
              ))}
              
              {bids.length === 0 && (
                <div className="text-center p-10 text-slate-400 text-[14px] font-medium">No RFQs sent for this indent yet.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
