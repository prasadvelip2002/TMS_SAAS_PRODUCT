"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td, Badge } from "@/components/PrototypeUI";
import { Loader2, Send, CheckCircle, Truck, DollarSign, X, Search, Grid, List, MapPin, Activity, FileText, Calendar, Clock, MessageCircle } from "lucide-react";
import { formatTime12H } from "@/lib/utils";

export default function ProcurementDashboard() {
  const [indents, setIndents] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // RFQ Broadcast State
  const [isRfqPanelOpen, setIsRfqPanelOpen] = useState(false);
  const [selectedIndent, setSelectedIndent] = useState<any>(null);
  const [selectedVendors, setSelectedVendors] = useState<number[]>([]);
  const [rfqLoadingDate, setRfqLoadingDate] = useState("");
  const [rfqLoadingTime, setRfqLoadingTime] = useState("");
  
  // View Bids State
  const [isBidsPanelOpen, setIsBidsPanelOpen] = useState(false);
  const [bids, setBids] = useState<any[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [expandedBidId, setExpandedBidId] = useState<number | null>(null);

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
    setRfqLoadingDate(indent.loadingDate ? indent.loadingDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    setRfqLoadingTime(indent.loadingTime || "10:00");
    setIsRfqPanelOpen(true);
    setIsBidsPanelOpen(false);
  };

  const handleSendRfq = async () => {
    if (selectedVendors.length === 0) return alert("Select at least one vendor");
    try {
      await fetchApi(`/Procurement/BroadcastRFQ/${selectedIndent.id}`, {
        method: "POST",
        body: JSON.stringify({
          vendorIds: selectedVendors,
          loadingDate: rfqLoadingDate ? new Date(rfqLoadingDate).toISOString() : null,
          loadingTime: rfqLoadingTime
        }),
      });
      setIsRfqPanelOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
      alert("Failed to send RFQ");
    }
  };

  const copyRfqToWhatsApp = () => {
    if (!selectedIndent) return;
    const formattedTime = formatTime12H(rfqLoadingTime || selectedIndent.loadingTime);
    const msg = `📢 *NEW RFQ / LOAD ENQUIRY*\n*Indent Ref*: IND-${1000 + selectedIndent.id}\n*Route*: ${selectedIndent.source} → ${selectedIndent.destination}\n*Material*: ${selectedIndent.material} (${selectedIndent.weight} Tons)\n*Vehicle Required*: ${selectedIndent.vehicleType}\n\n📅 *Pickup Date*: ${rfqLoadingDate ? new Date(rfqLoadingDate).toLocaleDateString() : (selectedIndent.loadingDate ? new Date(selectedIndent.loadingDate).toLocaleDateString() : '')}\n⏰ *Pickup Reporting Time*: ${formattedTime || 'Immediate'}\n\nPlease reply with your best freight rate and vehicle availability.`;
    navigator.clipboard.writeText(msg);
    alert("RFQ details copied to clipboard with Pickup Date & Time! You can paste this to vendors on WhatsApp.");
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
    if (!confirm("Are you sure you want to approve this rate?")) return;
    try {
      const res = await fetchApi(`/Procurement/ApproveBid/${quotationId}`, { method: "POST" });
      alert(`Success! ${res.message}`);
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
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-[8px] transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-800'}`}><List className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-[8px] transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-800'}`}><Grid className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white border border-slate-200 rounded-[16px] overflow-hidden shadow-sm flex-1 flex flex-col">
          <div className="overflow-auto flex-1">
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
                      {indent.loadingDate && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Pickup: {new Date(indent.loadingDate).toLocaleDateString()} {indent.loadingTime ? `@ ${formatTime12H(indent.loadingTime)}` : ''}
                        </div>
                      )}
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
                          <button 
                            onClick={() => openBidsPanel(indent)}
                            className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-xl text-[12px] font-bold hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> View Approved Bid
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
      ) : (
        <div className="flex flex-col min-h-0 flex-1">
          {loading ? (
            <div className="flex justify-center p-16">
              <Activity className="animate-spin text-blue-600 w-8 h-8" />
            </div>
          ) : indents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-20 flex flex-col items-center justify-center text-center mt-2">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
                <Send className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-800 mb-1">No Active Procurements</h3>
              <p className="text-[14px] text-slate-500 max-w-sm mx-auto">
                There are no active indents requiring vendor bidding right now.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {indents.map(indent => (
                <div key={indent.id} className="bg-white rounded-2xl p-0 shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                  {/* Ticket Header */}
                  <div className="bg-slate-50/80 p-4 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-700 p-1.5 rounded-lg">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-mono font-bold text-slate-900 text-sm">IND-{1000 + indent.id}</div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-1">{indent.customer?.name}</div>
                      </div>
                    </div>
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
                  </div>
                  
                  {/* Ticket Route */}
                  <div className="px-5 py-5 border-b border-slate-100 border-dashed relative">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Source</div>
                        <div className="font-semibold text-slate-800 text-sm truncate" title={indent.source}>{indent.source}</div>
                      </div>
                      <div className="flex-shrink-0 flex items-center justify-center">
                        <div className="w-8 h-px bg-slate-300"></div>
                        <div className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center mx-1 bg-white shadow-sm z-10">
                          <MapPin className="w-3 h-3 text-blue-500" />
                        </div>
                        <div className="w-8 h-px bg-slate-300"></div>
                      </div>
                      <div className="flex-1 text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Destination</div>
                        <div className="font-semibold text-slate-800 text-sm truncate" title={indent.destination}>{indent.destination}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Ticket Details */}
                  <div className="px-5 py-4 bg-slate-50/30 flex-1 grid grid-cols-2 gap-y-4 gap-x-2">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Material</div>
                      <div className="font-medium text-slate-700 text-[13px]">{indent.material}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Weight</div>
                      <div className="font-medium text-slate-700 text-[13px]">{indent.weight} Tons</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</div>
                      <div className="font-medium text-slate-700 text-[13px]">{new Date(indent.loadingDate).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</div>
                      <div className="font-medium text-slate-700 text-[13px]">{indent.truckType || indent.vehicleType}</div>
                    </div>
                  </div>
                  
                  {/* Ticket Action */}
                  <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
                    {indent.rfqStatus === "Pending" && (
                      <button 
                        onClick={() => openRfqPanel(indent)}
                        className="w-full bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" /> Broadcast RFQ
                      </button>
                    )}
                    {(indent.rfqStatus === "Sent" || indent.rfqStatus === "QuotationReceived") && (
                      <button 
                        onClick={() => openBidsPanel(indent)}
                        className="w-full bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-700 font-bold py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2 relative"
                      >
                        <DollarSign className="w-4 h-4" /> View Bids
                        {indent.rfqStatus === "QuotationReceived" && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-sm border border-white" />
                        )}
                      </button>
                    )}
                    {indent.rfqStatus === "Approved" && (
                      <button 
                        onClick={() => openBidsPanel(indent)}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> View Approved Bid
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
          <div className="bg-sky-50 border border-sky-200/80 p-5 rounded-2xl text-sm shadow-sm space-y-3">
            <div className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">Trip & Load Requirement</div>
            <div>
              <strong className="text-slate-900 text-[15px] flex items-center gap-1.5"><MapPin className="w-4 h-4 text-sky-600 shrink-0"/> {selectedIndent?.source} → {selectedIndent?.destination}</strong>
              <div className="mt-1 text-slate-600 text-xs font-medium">
                Required: <strong className="text-slate-800">{selectedIndent?.vehicleType}</strong> ({selectedIndent?.weight} Tons • {selectedIndent?.material || 'Goods'})
              </div>
            </div>

            <div className="pt-3 border-t border-sky-100">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Pickup & Reporting Schedule (Sent in RFQ)
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block mb-1">📅 Pickup Date:</span>
                  <input 
                    type="date"
                    value={rfqLoadingDate}
                    onChange={(e) => setRfqLoadingDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] text-slate-500 font-semibold">⏰ Pickup Time:</span>
                    {rfqLoadingTime && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {formatTime12H(rfqLoadingTime)}
                      </span>
                    )}
                  </div>
                  <input 
                    type="time"
                    value={rfqLoadingTime}
                    onChange={(e) => setRfqLoadingTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                  />
                </div>
              </div>
              <p className="text-[11px] text-sky-800/80 mt-2 font-medium">
                ⚡ Vendors will be informed of this exact reporting time before submitting quotations.
              </p>
            </div>

            <button 
              type="button"
              onClick={copyRfqToWhatsApp}
              className="w-full mt-1 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5 text-green-600" /> Copy RFQ Details for WhatsApp
            </button>
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
                    <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <div className="text-[11px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Quoted Rate</div>
                          <div className="text-xl font-black text-slate-800">₹{bid.quotedRate?.toLocaleString('en-IN')}</div>
                        </div>
                        
                        {bid.status === "QuotationReceived" && (
                          <button 
                            onClick={() => handleApproveBid(bid.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-[13px] font-bold shadow-sm shadow-green-600/20 transition-all"
                          >
                            Shortlist Supplier
                          </button>
                        )}
                      </div>

                      {bid.availableDate && (
                        <div className="mb-3 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 w-max">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Vehicle Available: {new Date(bid.availableDate).toLocaleDateString()}{bid.availableTime ? ` at ${formatTime12H(bid.availableTime)}` : ''}</span>
                        </div>
                      )}
                      
                      <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-center">
                         <button 
                           onClick={() => setExpandedBidId(expandedBidId === bid.id ? null : bid.id)}
                           className="text-blue-600 hover:text-blue-800 text-[12px] font-bold flex items-center gap-1"
                         >
                           {expandedBidId === bid.id ? 'Hide Details' : 'View Details'}
                         </button>
                      </div>

                      {expandedBidId === bid.id && (
                        <div className="mt-4 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                          <div className="mb-3">
                             <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Proposed Vehicle</div>
                             <div className="text-[13px] text-slate-800 font-medium">{bid.proposedVehicleType || "Not Specified"}</div>
                          </div>
                          <div>
                             <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Vendor Remarks</div>
                             <div className="text-[13px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 whitespace-pre-wrap">
                               {bid.remarks || "No remarks provided."}
                             </div>
                          </div>
                        </div>
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
