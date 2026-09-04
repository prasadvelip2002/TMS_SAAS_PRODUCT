"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td, Badge } from "@/components/PrototypeUI";
import { Loader2, FileText, CheckCircle, Search, Grid, List, Plus, ShoppingCart, DollarSign, X, MessageCircle } from "lucide-react";
import { formatTime12H } from "@/lib/utils";

export default function SalesDashboard() {
  const [indents, setIndents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Panel state
  const [selectedIndent, setSelectedIndent] = useState<any>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [vendorQuote, setVendorQuote] = useState<any>(null);
  const [salesQuotes, setSalesQuotes] = useState<any[]>([]);
  
  // Form state
  const [margin, setMargin] = useState<number>(0);
  const [baseRate, setBaseRate] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [poNumber, setPoNumber] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchApi("/Indents");
      // Show all indents in sales & procurement lifecycle, including New/Pending for Own Fleet
      setIndents(data.filter((i: any) => 
        i.status === "New" ||
        i.status === "Pending" ||
        i.status === "Supplier_Shortlisted" || 
        i.status === "SQ_Generated" || 
        i.status === "PO_Received" ||
        i.status === "Assigned"
      ));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openPanel = async (indent: any) => {
    setSelectedIndent(indent);
    setIsPanelOpen(true);
    setMargin(0);
    const initialBase = indent.customerRate || 0;
    setBaseRate(initialBase);
    setSellingPrice(initialBase);
    setPoNumber("");
    setVendorQuote(null);
    setSalesQuotes([]);

    try {
      if (indent.status === "Supplier_Shortlisted") {
        // Fetch winning vendor quote
        const quotes = await fetchApi(`/Procurement/Quotations/${indent.id}`);
        const winningQuote = quotes.find((q: any) => q.status === "Approved");
        if (winningQuote) setVendorQuote(winningQuote);
      } else if (indent.status !== "New" && indent.status !== "Pending") {
        // Fetch Sales Quotes
        const sqs = await fetchApi(`/Sales/Quotations/${indent.id}`);
        setSalesQuotes(sqs);
      }
    } catch (e) {
      console.error("Failed to load details");
    }
  };

  const handleGenerateSQ = async () => {
    const isOwnFleet = selectedIndent?.status === "New" || selectedIndent?.status === "Pending";
    
    if (isOwnFleet && sellingPrice <= 0) {
      return alert("Please enter a valid Selling Price for the Customer Quotation.");
    }
    if (!isOwnFleet && margin <= 0) {
      return alert("Please add a margin to generate the SQ.");
    }
    
    try {
      await fetchApi(`/Sales/GenerateSQ/${selectedIndent.id}`, {
        method: "POST",
        body: JSON.stringify({
          vendorQuotationId: vendorQuote?.id || null,
          baseRate: Number(baseRate),
          margin: Number(margin),
          sellingPrice: isOwnFleet ? Number(sellingPrice) : (Number(vendorQuote?.quotedRate || 0) + Number(margin))
        })
      });
      alert("Sales Quotation (SQ) generated successfully and ready for customer!");
      setIsPanelOpen(false);
      loadData();
    } catch (e) {
      alert("Failed to generate SQ");
    }
  };

  const handleAcceptPO = async (sqId: number) => {
    if (!poNumber) return alert("Please enter the Customer PO Number.");
    
    try {
      await fetchApi(`/Sales/ApproveSQ/${sqId}`, {
        method: "POST",
        body: JSON.stringify({ poNumber })
      });
      alert("Customer PO Accepted! Trip is now ready. Proceed to Trip Assignment to assign your Own Vehicle & Driver.");
      setIsPanelOpen(false);
      loadData();
    } catch (e) {
      alert("Failed to accept Customer PO");
    }
  };

  const copyToWhatsApp = () => {
    if (!salesQuotes[0]) return;
    const sq = salesQuotes[0];
    const pickupInfo = selectedIndent?.loadingDate 
      ? `\n*Pickup Scheduled*: ${new Date(selectedIndent.loadingDate).toLocaleDateString()}${selectedIndent.loadingTime ? ` at ${formatTime12H(selectedIndent.loadingTime)}` : ''}`
      : '';
    const message = `Hello ${selectedIndent?.customer?.name},\n\nHere is our Sales Quotation for your transport request (IND-${1000 + selectedIndent.id}):\n\n*Route*: ${selectedIndent.source} to ${selectedIndent.destination}${pickupInfo}\n*Cargo*: ${selectedIndent.material} (${selectedIndent.weight} Tons)\n*Vehicle Required*: ${selectedIndent.vehicleType}\n\n*Total Quotation (Selling Price)*: ₹${sq.sellingPrice.toLocaleString('en-IN')}\n\nPlease reply with your PO Number to confirm this booking.\n\nThank you,\nTransitflow Logistics`;
    
    navigator.clipboard.writeText(message);
    alert("Quotation copied to clipboard! You can now paste it into WhatsApp.");
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end mb-[20px] shrink-0">
        <div>
          <h1 className="font-disp font-bold text-[28px] text-slate-900 tracking-tight leading-tight">Sales</h1>
          <p className="text-[14px] text-slate-500 mt-1 font-medium">Add margin, generate Sales Quotations, and receive POs.</p>
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
        </div>
      </div>

      {/* FULL WIDTH TABLE */}
      <div className="bg-white border border-slate-200 rounded-[16px] overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="overflow-auto flex-1">
          <ProtoTable headers={["ID", "CUSTOMER", "ROUTE", "MATERIAL", "STATUS", "ACTIONS"]}>
            {loading ? (
              <tr>
                <Td colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-10 h-10 mb-3 animate-spin text-slate-300" />
                    <span className="text-[14px] font-medium">Loading Sales Data...</span>
                  </div>
                </Td>
              </tr>
            ) : indents.length === 0 ? (
              <tr>
                <Td colSpan={6} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <FileText className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-[16px] font-bold text-slate-800 mb-1">No Pending Sales Actions</h3>
                    <p className="text-[14px] text-slate-500 max-w-sm mx-auto">
                      Shortlist suppliers in the Procurement dashboard first.
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
                    <Badge color={
                      indent.status === "Supplier_Shortlisted" ? "orange" :
                      indent.status === "SQ_Generated" ? "blue" :
                      indent.status === "PO_Received" || indent.status === "Assigned" ? "green" :
                      indent.status === "New" || indent.status === "Pending" ? "blue" :
                      "grey"
                    }>
                      {indent.status === "Assigned" ? "Trip Generated" : 
                       (indent.status === "New" || indent.status === "Pending") ? "Ready for SQ (Own Fleet)" : indent.status}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      {(indent.status === "New" || indent.status === "Pending") && (
                        <button 
                          onClick={() => openPanel(indent)}
                          className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-xl text-[12px] font-bold hover:bg-purple-100 transition-colors flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Generate SQ (Own Fleet)
                        </button>
                      )}
                      {indent.status === "Supplier_Shortlisted" && (
                        <button 
                          onClick={() => openPanel(indent)}
                          className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-xl text-[12px] font-bold hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Generate SQ
                        </button>
                      )}
                      {indent.status === "SQ_Generated" && (
                        <button 
                          onClick={() => openPanel(indent)}
                          className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-xl text-[12px] font-bold hover:bg-purple-100 transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Accept Customer PO
                        </button>
                      )}
                      {(indent.status === "PO_Received" || indent.status === "Assigned") && (
                        <button 
                          onClick={() => openPanel(indent)}
                          className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-xl text-[12px] font-bold hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                        >
                          <List className="w-3.5 h-3.5" /> View Details
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

      {/* OVERLAY */}
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsPanelOpen(false)}
      />

      {/* SLIDE PANEL */}
      <div 
        className={`fixed top-0 right-0 h-full w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-200 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {(selectedIndent?.status === "New" || selectedIndent?.status === "Pending") 
                ? "Generate SQ (Own Fleet)" 
                : selectedIndent?.status === "Supplier_Shortlisted" 
                ? "Generate Sales Quotation" 
                : "Customer PO & Acceptance"}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[13px] text-slate-500 font-medium">IND-{selectedIndent ? 1000 + selectedIndent.id : ""}</span>
              {selectedIndent?.loadingDate && (
                <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-semibold">
                  Pickup: {new Date(selectedIndent.loadingDate).toLocaleDateString()} {selectedIndent.loadingTime ? `@ ${formatTime12H(selectedIndent.loadingTime)}` : ''}
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={() => setIsPanelOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* OWN FLEET QUOTATION FORM */}
          {(selectedIndent?.status === "New" || selectedIndent?.status === "Pending") && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-1">Own Fleet Direct Booking</div>
                <p className="text-xs text-purple-900">This trip will be executed with company-owned assets. Provide the freight quotation directly to the customer.</p>
              </div>

              <div className="space-y-4 border border-slate-200 p-5 rounded-xl bg-white shadow-sm">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Target Customer Selling Price (₹)</label>
                  <div className="relative">
                    <span className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm">₹</span>
                    <input 
                      type="number" 
                      value={sellingPrice || ""}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="w-full h-[42px] bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:bg-white outline-none transition-all"
                      placeholder="e.g. 45000"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Total freight offered to customer in the Sales Quotation</span>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Estimated Fleet Operating Cost / Base (₹)</label>
                  <div className="relative">
                    <span className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm">₹</span>
                    <input 
                      type="number" 
                      value={baseRate || ""}
                      onChange={(e) => setBaseRate(Number(e.target.value))}
                      className="w-full h-[42px] bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 text-sm focus:border-blue-500 focus:bg-white outline-none transition-all"
                      placeholder="e.g. 35000"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Internal vehicle diesel, driver bata & toll estimation</span>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <div className="flex justify-between items-center text-sm font-medium text-emerald-600">
                    <span>Projected Company Margin:</span>
                    <span className="font-bold">₹{((Number(sellingPrice) || 0) - (Number(baseRate) || 0)).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedIndent?.status === "Supplier_Shortlisted" && vendorQuote && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Winning Supplier Rate</div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-slate-800 font-bold">{vendorQuote.vendor?.name}</div>
                    <div className="text-sm text-slate-500">{vendorQuote.proposedVehicleType}</div>
                    {(vendorQuote.availableDate || vendorQuote.availableTime) && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                        <span>Vehicle Available:</span>
                        <span className="font-bold">
                          {vendorQuote.availableDate ? new Date(vendorQuote.availableDate).toLocaleDateString() : 'Immediate'}
                          {vendorQuote.availableTime ? ` at ${formatTime12H(vendorQuote.availableTime)}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-xl font-black text-slate-800">
                    ₹{vendorQuote.quotedRate?.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 block">Pricing Calculation</label>
                <div className="space-y-4 border border-slate-200 p-5 rounded-xl bg-white shadow-sm">
                  
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-1">Add Margin (₹)</label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="number" 
                        value={margin || ""}
                        onChange={(e) => setMargin(Number(e.target.value))}
                        className="w-full h-[42px] bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 text-sm focus:border-blue-500 focus:bg-white outline-none transition-all"
                        placeholder="e.g. 5000"
                      />
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-100 pt-4 mt-2">
                    <div className="flex justify-between items-center text-sm font-medium text-slate-500 mb-1">
                      <span>Base Rate</span>
                      <span>₹{vendorQuote.quotedRate?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium text-blue-600 mb-2">
                      <span>Margin Added</span>
                      <span>+ ₹{(Number(margin) || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-[18px] font-black text-slate-900 pt-2 border-t border-slate-200 border-dashed">
                      <span>Selling Price (to Customer)</span>
                      <span>₹{((vendorQuote.quotedRate || 0) + (Number(margin) || 0)).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {selectedIndent?.status === "SQ_Generated" && salesQuotes.length > 0 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm">
                <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-2">Active Sales Quotation</div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-blue-900 font-bold text-xl">₹{salesQuotes[0].sellingPrice?.toLocaleString('en-IN')}</div>
                    <div className="text-xs text-blue-600/80 mt-1">Route: {selectedIndent?.source} → {selectedIndent?.destination}</div>
                  </div>
                  <Badge color="blue">Waiting for PO</Badge>
                </div>
                <button 
                  onClick={copyToWhatsApp}
                  className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> Copy Quotation for WhatsApp
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 block">Customer Approval</label>
                <div className="space-y-4 border border-slate-200 p-5 rounded-xl bg-white shadow-sm">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-1">Customer PO Number</label>
                    <input 
                      type="text" 
                      value={poNumber}
                      onChange={(e) => setPoNumber(e.target.value)}
                      className="w-full h-[42px] bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm focus:border-blue-500 focus:bg-white outline-none transition-all"
                      placeholder="e.g. PO-2026-904"
                    />
                  </div>
                  <div className="text-xs text-slate-500 flex gap-2 items-start">
                    <div className="w-4 h-4 shrink-0 mt-0.5 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">i</div>
                    <p>Entering the PO number confirms customer booking. This automatically moves the order to Trip Assignment for vehicle & driver dispatch.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(selectedIndent?.status === "PO_Received" || selectedIndent?.status === "Assigned") && salesQuotes.length > 0 && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 shadow-sm">
                <div className="text-[11px] font-bold text-green-600 uppercase tracking-wider mb-2">Approved Sales Quotation</div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-green-900 font-bold text-xl">₹{salesQuotes[0].sellingPrice?.toLocaleString('en-IN')}</div>
                    <div className="text-xs text-green-700 mt-1">Confirmed Booking</div>
                  </div>
                  <Badge color="green">PO Accepted</Badge>
                </div>
              </div>

              <div>
                <div className="space-y-4 border border-green-200 p-5 rounded-xl bg-white shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-1">Customer PO Accepted</h3>
                    <p className="text-xs text-slate-500 mb-3">Trip has been generated successfully.</p>
                    <a 
                      href="/trips/assignment" 
                      className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
                    >
                      Go to Trip Assignment →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="p-6 border-t border-slate-100 bg-white">
          {(selectedIndent?.status === "New" || selectedIndent?.status === "Pending") ? (
            <button 
              onClick={handleGenerateSQ}
              disabled={sellingPrice <= 0}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Generate & Send SQ (Own Fleet)
            </button>
          ) : selectedIndent?.status === "Supplier_Shortlisted" ? (
             <button 
               onClick={handleGenerateSQ}
               disabled={margin <= 0}
               className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
             >
               Generate & Send SQ
             </button>
          ) : selectedIndent?.status === "SQ_Generated" ? (
            <button 
               onClick={() => handleAcceptPO(salesQuotes[0]?.id)}
               disabled={!poNumber}
               className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
             >
               <CheckCircle className="w-4 h-4" /> Accept PO & Assign Trip
             </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
