"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td, Badge } from "@/components/PrototypeUI";
import { 
  Loader2, FileText, CheckCircle, Search, Grid, List, Plus, DollarSign, X, 
  MessageCircle, Calculator, SlidersHorizontal, Fuel, Truck, Utensils, 
  Receipt, AlertTriangle, TrendingUp, TrendingDown, Percent, Lock, Building2, 
  Calendar, Info, HelpCircle
} from "lucide-react";
import { formatTime12H } from "@/lib/utils";

interface CostBreakdown {
  fuel: number;
  driverAllowance: number;
  foodAllowance: number;
  toll: number;
  loading: number;
  unloading: number;
  driverDays: number;
  driverDailyWage: number;
  otherDescription: string;
  otherAmount: number;
  marginMode: "percentage" | "fixed";
  marginPercentage: number;
}

const defaultCostBreakdown: CostBreakdown = {
  fuel: 0,
  driverAllowance: 0,
  foodAllowance: 0,
  toll: 0,
  loading: 0,
  unloading: 0,
  driverDays: 0,
  driverDailyWage: 0,
  otherDescription: "",
  otherAmount: 0,
  marginMode: "percentage",
  marginPercentage: 15,
};

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

  // Cost sheet modal state
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown>(defaultCostBreakdown);

  // Sales Quotations across all indents to track Vendor vs Own Fleet
  const [allSqs, setAllSqs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [indentsData, sqsData] = await Promise.all([
        fetchApi("/Indents"),
        fetchApi("/Sales/Quotations").catch(() => [])
      ]);
      setAllSqs(sqsData || []);
      setIndents((indentsData || []).filter((i: any) => 
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

  const getIndentFulfillment = (indent: any) => {
    const sq = allSqs.find((s: any) => s.indentId === indent.id);
    if (sq) {
      if (sq.winningVendorQuotation) {
        return {
          isVendor: true,
          vendorName: sq.winningVendorQuotation.vendor?.name || "Transporter",
          buyRate: sq.winningVendorQuotation.quotedRate,
          sellingPrice: sq.sellingPrice,
          vehicleType: sq.winningVendorQuotation.proposedVehicleType || indent.vehicleType
        };
      } else {
        return {
          isVendor: false,
          vendorName: "Company Own Fleet",
          buyRate: sq.baseRate,
          sellingPrice: sq.sellingPrice,
          vehicleType: indent.vehicleType
        };
      }
    }

    if (indent.status === "Supplier_Shortlisted") {
      return {
        isVendor: true,
        vendorName: "3rd Party Vendor",
        buyRate: null,
        sellingPrice: null,
        vehicleType: indent.vehicleType
      };
    }

    return {
      isVendor: false,
      vendorName: "Company Own Fleet",
      buyRate: null,
      sellingPrice: null,
      vehicleType: indent.vehicleType
    };
  };

  const isContractCustomer = (indent: any) => {
    if (!indent) return false;
    return indent.pricingModel === "AnnualContract" || 
           indent.customer?.customerType === "Contract" || 
           (Number(indent.customerRate) > 0);
  };

  const calculateOperatingExpenses = () => {
    const driverWagesTotal = (Number(costBreakdown.driverDays) || 0) * (Number(costBreakdown.driverDailyWage) || 0);
    return (
      (Number(costBreakdown.fuel) || 0) +
      (Number(costBreakdown.driverAllowance) || 0) +
      (Number(costBreakdown.foodAllowance) || 0) +
      (Number(costBreakdown.toll) || 0) +
      (Number(costBreakdown.loading) || 0) +
      (Number(costBreakdown.unloading) || 0) +
      driverWagesTotal +
      (Number(costBreakdown.otherAmount) || 0)
    );
  };

  const openPanel = async (indent: any) => {
    setSelectedIndent(indent);
    setIsPanelOpen(true);
    setCostBreakdown(defaultCostBreakdown);
    setPoNumber("");
    setVendorQuote(null);
    setSalesQuotes([]);

    const isContract = isContractCustomer(indent);
    const initialContractRate = Number(indent.customerRate) || 0;

    if (isContract && initialContractRate > 0) {
      setSellingPrice(initialContractRate);
      setBaseRate(0);
      setMargin(initialContractRate);
    } else {
      setBaseRate(0);
      setMargin(0);
      setSellingPrice(0);
    }

    try {
      if (indent.status === "Supplier_Shortlisted") {
        // Fetch winning vendor quote
        const quotes = await fetchApi(`/Procurement/Quotations/${indent.id}`);
        const winningQuote = quotes.find((q: any) => q.status === "Approved");
        if (winningQuote) {
          setVendorQuote(winningQuote);
          setBaseRate(winningQuote.quotedRate);
          if (isContract && initialContractRate > 0) {
            setMargin(initialContractRate - winningQuote.quotedRate);
          }
        }
      } else if (indent.status !== "New" && indent.status !== "Pending") {
        // Fetch Sales Quotes
        const sqs = await fetchApi(`/Sales/Quotations/${indent.id}`);
        setSalesQuotes(sqs);
      }
    } catch (e) {
      console.error("Failed to load details");
    }
  };

  // Cost sheet calculations
  const operatingExpenses = calculateOperatingExpenses();
  const vehicleBaseCost = vendorQuote ? (Number(vendorQuote.quotedRate) || 0) : 0;
  const totalTripCost = vehicleBaseCost + operatingExpenses;

  // Spot calculations for modal
  const spotCalculatedMargin = costBreakdown.marginMode === "percentage"
    ? Math.round(totalTripCost * ((Number(costBreakdown.marginPercentage) || 0) / 100))
    : Number(margin) || 0;
  const spotCalculatedSellingPrice = totalTripCost + spotCalculatedMargin;

  // Contract calculations for modal
  const contractRate = Number(selectedIndent?.customerRate) || Number(sellingPrice) || 0;
  const contractNetMargin = contractRate - totalTripCost;
  const contractMarginPercent = contractRate > 0 ? ((contractNetMargin / contractRate) * 100).toFixed(1) : "0";

  const handleApplyCostSheet = () => {
    const isContract = isContractCustomer(selectedIndent);
    if (isContract) {
      setSellingPrice(contractRate);
      setBaseRate(totalTripCost);
      setMargin(contractNetMargin);
    } else {
      setBaseRate(totalTripCost);
      setMargin(spotCalculatedMargin);
      setSellingPrice(spotCalculatedSellingPrice);
    }
    setIsCostModalOpen(false);
  };

  const handleGenerateSQ = async () => {
    const isOwnFleet = selectedIndent?.status === "New" || selectedIndent?.status === "Pending";
    const isContract = isContractCustomer(selectedIndent);
    
    if (isOwnFleet && sellingPrice <= 0) {
      return alert("Please enter a valid Selling Price for the Customer Quotation.");
    }
    if (!isOwnFleet && !isContract && margin <= 0) {
      return alert("Please add a margin to generate the SQ.");
    }
    if (isContract && sellingPrice <= 0) {
      return alert("Contract rate is missing or invalid.");
    }
    
    try {
      const finalSellingPrice = isContract 
        ? Number(sellingPrice) 
        : (isOwnFleet ? Number(sellingPrice) : (Number(baseRate || vendorQuote?.quotedRate || 0) + Number(margin)));

      const legType = vendorQuote?.serviceScope === "SourceToHub" 
        ? "InboundLeg1" 
        : (selectedIndent?.warehouseLocation ? "EntireRoute" : "Direct");

      await fetchApi(`/Sales/GenerateSQ/${selectedIndent.id}`, {
        method: "POST",
        body: JSON.stringify({
          vendorQuotationId: vendorQuote?.id || null,
          baseRate: Number(baseRate || vendorQuote?.quotedRate || 0),
          margin: Number(margin),
          sellingPrice: finalSellingPrice,
          legType: legType
        })
      });
      alert(isContract ? "Contract Booking confirmed and SQ generated!" : (legType === "InboundLeg1" ? "Leg 1 Sales Quotation generated successfully!" : "Sales Quotation (SQ) generated successfully!"));
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
      alert("Customer PO Accepted! Trip is now ready. Proceed to Trip Assignment to assign vehicle & driver.");
      setIsPanelOpen(false);
      loadData();
    } catch (e) {
      alert("Failed to accept Customer PO");
    }
  };

  const copyToWhatsApp = () => {
    if (!salesQuotes[0]) return;
    const sq = salesQuotes[0];
    const isContract = isContractCustomer(selectedIndent);
    const pickupInfo = selectedIndent?.loadingDate 
      ? `\n*Pickup Scheduled*: ${new Date(selectedIndent.loadingDate).toLocaleDateString()}${selectedIndent.loadingTime ? ` at ${formatTime12H(selectedIndent.loadingTime)}` : ''}`
      : '';

    let message = "";
    const routeDisplay = selectedIndent?.warehouseLocation
      ? `${selectedIndent.source} ➔ ${selectedIndent.warehouseLocation} (Hub) ➔ ${selectedIndent.destination}`
      : `${selectedIndent.source} to ${selectedIndent.destination}`;

    if (isContract) {
      // Contract customer: Order details & Fixed Contract Rate ONLY. No margins or internal operating costs exposed.
      message = `Hello ${selectedIndent?.customer?.name},\n\n` +
        `Here is our Order Confirmation for your transport booking (IND-${1000 + selectedIndent.id}):\n\n` +
        `*Route*: ${routeDisplay}${pickupInfo}\n` +
        `*Cargo*: ${selectedIndent.material} (${selectedIndent.weight} Tons)\n` +
        `*Vehicle Required*: ${selectedIndent.vehicleType}\n\n` +
        `*Agreed Contract Rate*: ₹${Number(sq.sellingPrice).toLocaleString('en-IN')}\n\n` +
        `Please reply with your PO Number or Gate Dispatch Clearance to proceed.\n\n` +
        `Thank you,\nTransitflow Logistics`;
    } else {
      // Spot customer: Sales quotation with selling price
      message = `Hello ${selectedIndent?.customer?.name},\n\n` +
        `Here is our Sales Quotation for your transport request (IND-${1000 + selectedIndent.id}):\n\n` +
        `*Route*: ${routeDisplay}${pickupInfo}\n` +
        `*Cargo*: ${selectedIndent.material} (${selectedIndent.weight} Tons)\n` +
        `*Vehicle Required*: ${selectedIndent.vehicleType}\n\n` +
        `*Total Quotation (Selling Price)*: ₹${Number(sq.sellingPrice).toLocaleString('en-IN')}\n\n` +
        `Please reply with your PO Number to confirm this booking.\n\n` +
        `Thank you,\nTransitflow Logistics`;
    }
    
    navigator.clipboard.writeText(message);
    alert("Quotation copied to clipboard! You can now paste it into WhatsApp.");
  };

  const filteredIndents = indents.filter((indent) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const fulfillment = getIndentFulfillment(indent);
    return (
      `ind-${1000 + indent.id}`.toLowerCase().includes(q) ||
      indent.id.toString().includes(q) ||
      indent.customer?.name?.toLowerCase().includes(q) ||
      indent.source?.toLowerCase().includes(q) ||
      indent.destination?.toLowerCase().includes(q) ||
      indent.warehouseLocation?.toLowerCase().includes(q) ||
      indent.material?.toLowerCase().includes(q) ||
      indent.vehicleType?.toLowerCase().includes(q) ||
      indent.status?.toLowerCase().includes(q) ||
      fulfillment?.vendorName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative h-full flex flex-col">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end mb-[20px] shrink-0">
        <div>
          <h1 className="font-disp font-bold text-[28px] text-slate-900 tracking-tight leading-tight">Sales</h1>
          <p className="text-[14px] text-slate-500 mt-1 font-medium">Manage customer pricing, trip cost estimation, and PO approvals.</p>
        </div>
        
        <div className="flex items-center gap-[12px]">
          <div className="relative">
            <Search className="w-[16px] h-[16px] text-slate-400 absolute left-[14px] top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, customer, route..." 
              className="w-[280px] h-[42px] bg-white border border-slate-200 rounded-[12px] pl-[40px] pr-[36px] text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FULL WIDTH TABLE */}
      <div className="bg-white border border-slate-200 rounded-[16px] overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="overflow-auto flex-1">
          <ProtoTable headers={["ID", "CUSTOMER & TYPE", "ROUTE", "MATERIAL", "FLEET FULFILLMENT", "STATUS", "ACTIONS"]}>
            {loading ? (
              <tr>
                <Td colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-10 h-10 mb-3 animate-spin text-slate-300" />
                    <span className="text-[14px] font-medium">Loading Sales Data...</span>
                  </div>
                </Td>
              </tr>
            ) : filteredIndents.length === 0 ? (
              <tr>
                <Td colSpan={7} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <FileText className="w-8 h-8 text-slate-300" />
                    </div>
                    <span className="text-[15px] font-semibold text-slate-700">
                      {searchQuery ? "No Matching Sales Records" : "No Sales Activities"}
                    </span>
                    <span className="text-[13px] text-slate-400 mt-1 max-w-[320px] text-center">
                      {searchQuery ? `No results found for "${searchQuery}". Try a different term.` : "Shortlist a supplier quotation from the Procurement RFQ module to generate customer pricing."}
                    </span>
                  </div>
                </Td>
              </tr>
            ) : (
              filteredIndents.map((indent) => {
                const isContract = isContractCustomer(indent);
                const fulfillment = getIndentFulfillment(indent);

                return (
                  <tr key={indent.id} className="hover:bg-slate-50/80 transition-colors">
                    <Td className="font-mono text-[13px] font-semibold text-slate-900">
                      IND-{1000 + indent.id}
                    </Td>
                    <Td>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {indent.customer?.name}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        {isContract ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Building2 className="w-3 h-3" /> Contract (₹{Number(indent.customerRate || 0).toLocaleString('en-IN')})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            ⚡ Spot
                          </span>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col gap-0.5">
                        <div className="text-[13px] font-semibold text-slate-800 flex items-center gap-1.5 flex-wrap">
                          <span>{indent.source}</span>
                          {indent.warehouseLocation ? (
                            <>
                              <span className="text-slate-300">→</span>
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                {indent.warehouseLocation} (Hub)
                              </span>
                              <span className="text-slate-300">→</span>
                            </>
                          ) : (
                            <span className="text-slate-300">→</span>
                          )}
                          <span>{indent.destination}</span>
                        </div>
                        {indent.loadingDate && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Pickup: {new Date(indent.loadingDate).toLocaleDateString()} {indent.loadingTime ? `@ ${formatTime12H(indent.loadingTime)}` : ''}
                          </div>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <div className="text-[13px] font-medium text-slate-800">{indent.material}</div>
                      <div className="text-[11px] text-slate-500">{indent.weight} Tons • {indent.vehicleType}</div>
                    </Td>
                    <Td>
                      {fulfillment.isVendor ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 w-fit">
                            <Building2 className="w-3.5 h-3.5 text-blue-600" /> Vendor: {fulfillment.vendorName}
                          </span>
                          {fulfillment.buyRate ? (
                            <span className="text-[11px] text-slate-500 font-medium">
                              Buy Rate: ₹{Number(fulfillment.buyRate).toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-[10.5px] text-slate-400">
                              3rd Party Transporter
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 w-fit">
                            <Truck className="w-3.5 h-3.5 text-purple-600" /> Company Own Fleet
                          </span>
                          {fulfillment.buyRate ? (
                            <span className="text-[11px] text-slate-500 font-medium">
                              Base Cost: ₹{Number(fulfillment.buyRate).toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-[10.5px] text-purple-600/80">
                              Company Assets
                            </span>
                          )}
                        </div>
                      )}
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
                            className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-colors flex items-center gap-1.5 border ${
                              fulfillment.isVendor 
                                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' 
                                : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                            }`}
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> 
                            {fulfillment.isVendor ? "Accept PO (Vendor)" : "Accept PO (Own Fleet)"}
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
                );
              })
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
        className={`fixed top-0 right-0 h-full w-[470px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-200 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">
                {(selectedIndent?.status === "New" || selectedIndent?.status === "Pending") 
                  ? "Generate SQ (Own Fleet)" 
                  : selectedIndent?.status === "Supplier_Shortlisted" 
                  ? (isContractCustomer(selectedIndent) ? "Contract Booking & SQ" : "Generate Sales Quotation")
                  : "Customer PO & Acceptance"}
              </h2>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[13px] text-slate-500 font-semibold">IND-{selectedIndent ? 1000 + selectedIndent.id : ""}</span>
              {isContractCustomer(selectedIndent) ? (
                <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Contract Rate
                </span>
              ) : (
                <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                  Spot Pricing
                </span>
              )}
              {selectedIndent?.loadingDate && (
                <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                  {new Date(selectedIndent.loadingDate).toLocaleDateString()}
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
          {/* ROUTE & MATERIAL INFO BANNER */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Customer:</span>
              <span className="text-slate-900 font-bold">{selectedIndent?.customer?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Route:</span>
              <span className="text-slate-900 font-bold flex items-center gap-1 flex-wrap">
                <span>{selectedIndent?.source}</span>
                {selectedIndent?.warehouseLocation ? (
                  <>
                    <span className="text-slate-400">→</span>
                    <span className="text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded text-[11px] font-bold">
                      {selectedIndent.warehouseLocation} (Hub)
                    </span>
                    <span className="text-slate-400">→</span>
                  </>
                ) : (
                  <span className="text-slate-400">→</span>
                )}
                <span>{selectedIndent?.destination}</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Cargo & Vehicle:</span>
              <span className="text-slate-900 font-bold">{selectedIndent?.material} ({selectedIndent?.weight}T) • {selectedIndent?.vehicleType}</span>
            </div>
          </div>

          {/* OWN FLEET QUOTATION FORM */}
          {(selectedIndent?.status === "New" || selectedIndent?.status === "Pending") && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-1">Own Fleet Direct Booking</div>
                <p className="text-xs text-purple-900">This trip will be executed with company-owned assets. Calculate internal expenses and set customer quotation.</p>
              </div>

              <div className="space-y-4 border border-slate-200 p-5 rounded-xl bg-white shadow-sm">
                {/* Cost Sheet Trigger */}
                <button
                  type="button"
                  onClick={() => setIsCostModalOpen(true)}
                  className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:border-blue-300 text-blue-700 p-3 rounded-xl flex items-center justify-between text-xs font-bold transition-all shadow-sm group"
                >
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                    <span>Trip Cost Sheet & Margin Calculator</span>
                  </div>
                  {operatingExpenses > 0 ? (
                    <span className="bg-blue-600 text-white px-2 py-0.5 rounded-md text-[11px]">
                      Expenses: ₹{operatingExpenses.toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <span className="text-blue-500 underline text-[11px]">Estimate Route Costs →</span>
                  )}
                </button>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Target Customer Selling Price (₹)</label>
                  <div className="relative">
                    <span className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm">₹</span>
                    <input 
                      type="number" 
                      value={sellingPrice || ""}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      disabled={isContractCustomer(selectedIndent)}
                      className="w-full h-[42px] bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:bg-white outline-none transition-all disabled:opacity-80 disabled:bg-slate-100"
                      placeholder="e.g. 45000"
                    />
                    {isContractCustomer(selectedIndent) && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Contract Fixed
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {isContractCustomer(selectedIndent) 
                      ? "Rate locked from annual customer contract." 
                      : "Total freight offered to customer in the Sales Quotation."}
                  </span>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-sm font-semibold text-slate-700">Estimated Fleet Operating Cost / Base (₹)</label>
                    <button
                      type="button"
                      onClick={() => setIsCostModalOpen(true)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors shadow-xs"
                    >
                      <Receipt className="w-3 h-3 text-blue-500" /> View Driver Charges
                    </button>
                  </div>
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
                  <span className="text-[11px] text-slate-400 mt-1 block">Vehicle fuel, driver bata, tolls, and operating expenses</span>

                  {/* ITEMISED DRIVER & ROUTE CHARGES BREAKDOWN CARD */}
                  {operatingExpenses > 0 && (
                    <div className="mt-3 bg-slate-50/80 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
                      <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-blue-600" /> Driver & Route Charges Breakdown
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsCostModalOpen(true)}
                          className="text-[11px] font-bold text-blue-600 hover:underline"
                        >
                          Edit Charges →
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        {costBreakdown.driverDays > 0 && costBreakdown.driverDailyWage > 0 && (
                          <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-200/80">
                            <span className="text-slate-500">Driver Wage ({costBreakdown.driverDays}d × ₹{costBreakdown.driverDailyWage}):</span>
                            <span className="font-bold text-slate-800">₹{(costBreakdown.driverDays * costBreakdown.driverDailyWage).toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {costBreakdown.driverAllowance > 0 && (
                          <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-200/80">
                            <span className="text-slate-500">Driver Bata / Allowance:</span>
                            <span className="font-bold text-slate-800">₹{costBreakdown.driverAllowance.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {costBreakdown.foodAllowance > 0 && (
                          <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-200/80">
                            <span className="text-slate-500">Food Allowance:</span>
                            <span className="font-bold text-slate-800">₹{costBreakdown.foodAllowance.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {costBreakdown.fuel > 0 && (
                          <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-200/80">
                            <span className="text-slate-500">Fuel (Diesel):</span>
                            <span className="font-bold text-slate-800">₹{costBreakdown.fuel.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {costBreakdown.toll > 0 && (
                          <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-200/80">
                            <span className="text-slate-500">Toll Charges:</span>
                            <span className="font-bold text-slate-800">₹{costBreakdown.toll.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {costBreakdown.loading > 0 && (
                          <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-200/80">
                            <span className="text-slate-500">Loading / Hamali:</span>
                            <span className="font-bold text-slate-800">₹{costBreakdown.loading.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {costBreakdown.unloading > 0 && (
                          <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-200/80">
                            <span className="text-slate-500">Unloading Charges:</span>
                            <span className="font-bold text-slate-800">₹{costBreakdown.unloading.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {costBreakdown.otherAmount > 0 && (
                          <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-200/80">
                            <span className="text-slate-500">{costBreakdown.otherDescription || "Other / Misc"}:</span>
                            <span className="font-bold text-slate-800">₹{costBreakdown.otherAmount.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <div className={`flex justify-between items-center text-sm font-medium ${((Number(sellingPrice) || 0) - (Number(baseRate) || 0)) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    <span>Projected Company Margin:</span>
                    <span className="font-bold">
                      {((Number(sellingPrice) || 0) - (Number(baseRate) || 0)) >= 0 ? '+' : ''}
                      ₹{((Number(sellingPrice) || 0) - (Number(baseRate) || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3RD PARTY SUPPLIER QUOTATION FLOW */}
          {selectedIndent?.status === "Supplier_Shortlisted" && vendorQuote && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Winning Supplier Rate</div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-slate-800 font-bold text-base">{vendorQuote.vendor?.name}</div>
                    <div className="text-sm text-slate-500">{vendorQuote.proposedVehicleType}</div>
                    {vendorQuote.serviceScope === "SourceToHub" && (
                      <div className="mt-2 bg-amber-100/70 text-amber-900 border border-amber-300 px-2 py-1 rounded-md text-[11px] font-bold w-fit flex items-center gap-1">
                        <span>📍 Quoted for Leg 1 Only (Source → Hub)</span>
                      </div>
                    )}
                    {vendorQuote.serviceScope === "EntireRoute" && (
                      <div className="mt-2 bg-emerald-100/70 text-emerald-900 border border-emerald-300 px-2 py-1 rounded-md text-[11px] font-bold w-fit flex items-center gap-1">
                        <span>🛣️ Quoted for Full Route (Source → Hub → Destination)</span>
                      </div>
                    )}
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
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isContractCustomer(selectedIndent) ? "Contract Pricing & Financials" : "Pricing Calculation"}
                  </label>
                  {isContractCustomer(selectedIndent) && (
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Contract Rate Locked
                    </span>
                  )}
                </div>

                <div className="space-y-4 border border-slate-200 p-5 rounded-xl bg-white shadow-sm">
                  {/* Trip Cost Sheet & Margin Calculator Button */}
                  <button
                    type="button"
                    onClick={() => setIsCostModalOpen(true)}
                    className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:border-blue-300 text-blue-700 p-3 rounded-xl flex items-center justify-between text-xs font-bold transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                      <span>Trip Cost Sheet & Margin Calculator</span>
                    </div>
                    {operatingExpenses > 0 ? (
                      <span className="bg-blue-600 text-white px-2 py-0.5 rounded-md text-[11px]">
                        +₹{operatingExpenses.toLocaleString('en-IN')} Expenses
                      </span>
                    ) : (
                      <span className="text-blue-500 underline text-[11px]">Add Fuel, Toll, Wages →</span>
                    )}
                  </button>

                  {/* CONTRACT CUSTOMER SPECIFIC PRICING VIEW */}
                  {isContractCustomer(selectedIndent) ? (
                    <div className="space-y-3 pt-1">
                      <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4">
                        <div className="flex justify-between items-center text-xs font-medium text-blue-600 mb-1">
                          <span>Contract Agreed Customer Rate</span>
                          <span className="font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px]">No Extra Margin Added</span>
                        </div>
                        <div className="text-2xl font-black text-blue-900">
                          ₹{contractRate.toLocaleString('en-IN')}
                        </div>
                        <p className="text-[11px] text-blue-600/80 mt-1">
                          Rate is automatically fetched from contract rate sheet for {selectedIndent?.source} → {selectedIndent?.destination}.
                        </p>
                      </div>

                      <div className="border-t border-slate-100 pt-3 space-y-2 text-sm">
                        {vendorQuote ? (
                          <div className="flex justify-between items-center text-slate-500 font-medium">
                            <span>Supplier Buying Rate</span>
                            <span>₹{vendorQuote.quotedRate?.toLocaleString('en-IN')}</span>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center text-slate-500 font-medium">
                            <span>Execution Mode</span>
                            <span className="text-purple-700 font-bold bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-xs">Own Fleet Vehicle</span>
                          </div>
                        )}
                        {operatingExpenses > 0 && (
                          <div className="flex justify-between items-center text-slate-500 font-medium">
                            <span className="flex items-center gap-1.5">
                              Estimated Route Operating Expenses
                              <button
                                type="button"
                                onClick={() => setIsCostModalOpen(true)}
                                className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors shadow-2xs"
                              >
                                <Receipt className="w-2.5 h-2.5 text-blue-500" /> View Charges
                              </button>
                            </span>
                            <span>+ ₹{operatingExpenses.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-slate-700 font-semibold pt-1 border-t border-slate-100">
                          <span>Total Estimated Cost</span>
                          <span>₹{totalTripCost.toLocaleString('en-IN')}</span>
                        </div>

                        {/* PROFIT / LOSS BANNER */}
                        <div className={`p-3 rounded-lg border flex items-center justify-between text-xs font-bold ${
                          contractNetMargin >= 0 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}>
                          <div className="flex items-center gap-1.5">
                            {contractNetMargin >= 0 ? (
                              <>
                                <TrendingUp className="w-4 h-4 text-emerald-600" />
                                <span>Projected Net Profit:</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-4 h-4 text-rose-600" />
                                <span>Projected Net Loss:</span>
                              </>
                            )}
                          </div>
                          <span className="text-sm font-black">
                            {contractNetMargin >= 0 ? '+' : ''}₹{contractNetMargin.toLocaleString('en-IN')} ({contractMarginPercent}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* SPOT CUSTOMER SPECIFIC PRICING VIEW */
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-sm font-semibold text-slate-700">Applied Margin (₹)</label>
                          <button 
                            type="button" 
                            onClick={() => setIsCostModalOpen(true)}
                            className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <SlidersHorizontal className="w-3 h-3 text-blue-500" /> Set in Cost Sheet →
                          </button>
                        </div>
                        <div 
                          className="relative cursor-pointer"
                          onClick={() => setIsCostModalOpen(true)}
                          title="Click to configure margin in Trip Cost Sheet & Margin Calculator"
                        >
                          <span className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm">₹</span>
                          <input 
                            type="number" 
                            value={margin || ""}
                            readOnly
                            disabled
                            className="w-full h-[42px] bg-slate-100/80 border border-slate-200 rounded-lg pl-8 pr-32 text-sm font-bold text-slate-800 outline-none cursor-pointer select-none"
                            placeholder="0 (Click to configure)"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1 shadow-2xs pointer-events-none">
                            <Lock className="w-3 h-3 text-slate-400" /> From Cost Sheet
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          Margin is calculated and updated from the Trip Cost Sheet & Margin Calculator.
                        </span>
                      </div>
                      
                      <div className="border-t border-slate-100 pt-4 mt-2 space-y-2">
                        <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                          <span>Supplier Buying Rate</span>
                          <span>₹{vendorQuote.quotedRate?.toLocaleString('en-IN')}</span>
                        </div>
                        {operatingExpenses > 0 && (
                          <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                            <span className="flex items-center gap-1.5">
                              Estimated Operating Expenses
                              <button
                                type="button"
                                onClick={() => setIsCostModalOpen(true)}
                                className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors shadow-2xs"
                              >
                                <Receipt className="w-2.5 h-2.5 text-blue-500" /> View Charges
                              </button>
                            </span>
                            <span>+ ₹{operatingExpenses.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-sm font-medium text-blue-600">
                          <span>Margin Added</span>
                          <span>+ ₹{(Number(margin) || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center text-[18px] font-black text-slate-900 pt-3 border-t border-slate-200 border-dashed">
                          <span>Selling Price (to Customer)</span>
                          <span>₹{((vendorQuote.quotedRate || 0) + operatingExpenses + (Number(margin) || 0)).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* ACTIVE SALES QUOTATION READY FOR PO */}
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
                  className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" /> 
                  {isContractCustomer(selectedIndent) ? "Copy Contract Order Confirmation for WhatsApp" : "Copy Quotation for WhatsApp"}
                </button>
                <span className="text-[11px] text-blue-600/70 mt-1.5 block text-center">
                  {isContractCustomer(selectedIndent) 
                    ? "Sends formal order details with fixed contract rate only (margins and expenses are private)." 
                    : "Sends quotation details with selling price to customer."}
                </span>
              </div>

              {/* FLEET EXECUTION / FULFILLMENT MODE CARD */}
              <div className={`p-4 rounded-xl border ${
                salesQuotes[0]?.winningVendorQuotation 
                  ? 'bg-blue-50/70 border-blue-200 text-blue-900' 
                  : 'bg-purple-50/70 border-purple-200 text-purple-900'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    {salesQuotes[0]?.winningVendorQuotation ? (
                      <>
                        <Building2 className="w-4 h-4 text-blue-600" /> 
                        3rd Party Transporter Assignment
                      </>
                    ) : (
                      <>
                        <Truck className="w-4 h-4 text-purple-600" /> 
                        Company Own Fleet Fulfillment
                      </>
                    )}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    salesQuotes[0]?.winningVendorQuotation 
                      ? 'bg-blue-200 text-blue-800' 
                      : 'bg-purple-200 text-purple-800'
                  }`}>
                    {salesQuotes[0]?.winningVendorQuotation ? 'Vendor Trip' : 'Own Asset Trip'}
                  </span>
                </div>

                {salesQuotes[0]?.winningVendorQuotation ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-blue-700 font-medium">Awarded Transporter:</span>
                      <span className="font-bold">{salesQuotes[0].winningVendorQuotation.vendor?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 font-medium">Transporter Cost (Buy Rate):</span>
                      <span className="font-bold">₹{Number(salesQuotes[0].winningVendorQuotation.quotedRate).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 font-medium">Customer Selling Rate:</span>
                      <span className="font-bold">₹{Number(salesQuotes[0].sellingPrice).toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-[11px] text-blue-600/80 pt-1.5 border-t border-blue-200/60 mt-1.5">
                      ✓ Accepting PO automatically issues a Supplier PO to {salesQuotes[0].winningVendorQuotation.vendor?.name}.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-purple-700 font-medium">Execution Mode:</span>
                      <span className="font-bold">Company-Owned Fleet Vehicle & Driver</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700 font-medium">Customer Selling Rate:</span>
                      <span className="font-bold">₹{Number(salesQuotes[0].sellingPrice).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700 font-medium">Estimated Operating Cost:</span>
                      <span className="font-bold">₹{Number(salesQuotes[0].baseRate || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-[11px] text-purple-600/80 pt-1.5 border-t border-purple-200/60 mt-1.5">
                      ✓ Accepting PO moves order to Trip Assignment to dispatch your company vehicle & driver.
                    </p>
                  </div>
                )}
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
                      className="w-full h-[42px] bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm focus:border-blue-500 focus:bg-white outline-none transition-all font-semibold"
                      placeholder="e.g. PO-2026-904"
                    />
                  </div>
                  <div className="text-xs text-slate-500 flex gap-2 items-start">
                    <div className="w-4 h-4 shrink-0 mt-0.5 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 font-bold">i</div>
                    <p>Entering the PO number confirms customer booking. This automatically moves the order to Trip Assignment for vehicle & driver dispatch.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* APPROVED / ASSIGNED TRIP STATUS */}
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

        {/* BOTTOM ACTION BUTTON */}
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
               disabled={!isContractCustomer(selectedIndent) && margin <= 0}
               className={`w-full text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${
                 isContractCustomer(selectedIndent) 
                   ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' 
                   : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
               }`}
             >
               {isContractCustomer(selectedIndent) ? "Confirm Contract Booking & Generate SQ" : "Generate & Send SQ"}
             </button>
          ) : selectedIndent?.status === "SQ_Generated" ? (
            <button 
               onClick={() => handleAcceptPO(salesQuotes[0]?.id)}
               disabled={!poNumber}
               className={`w-full text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${
                 salesQuotes[0]?.winningVendorQuotation
                   ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                   : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20'
               }`}
             >
               <CheckCircle className="w-4 h-4" /> 
               {salesQuotes[0]?.winningVendorQuotation ? "Accept PO & Issue Supplier PO" : "Accept PO & Assign Own Fleet"}
             </button>
          ) : null}
        </div>
      </div>

      {/* TRIP COST SHEET & PROFITABILITY CALCULATOR MODAL */}
      {isCostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-base">Trip Cost Sheet & Profitability Calculator</h3>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{selectedIndent?.source} → {selectedIndent?.destination}</span>
                  <span>•</span>
                  <span>{selectedIndent?.vehicleType || "Standard"}</span>
                  <span>•</span>
                  {isContractCustomer(selectedIndent) ? (
                    <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                      🏢 Contract Rate: ₹{contractRate.toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                      ⚡ Spot Pricing
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setIsCostModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Cost Sheet Grid */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Operating Expenses Breakdown (Admin Estimation)
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Fuel */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                      <Fuel className="w-3.5 h-3.5 text-blue-600" /> Fuel / Diesel Expense (₹)
                    </label>
                    <input 
                      type="number" 
                      value={costBreakdown.fuel || ""}
                      onChange={(e) => setCostBreakdown({ ...costBreakdown, fuel: Number(e.target.value) })}
                      placeholder="e.g. 7500"
                      className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 font-semibold text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Toll */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                      <Receipt className="w-3.5 h-3.5 text-indigo-600" /> Toll Charges / Fastag (₹)
                    </label>
                    <input 
                      type="number" 
                      value={costBreakdown.toll || ""}
                      onChange={(e) => setCostBreakdown({ ...costBreakdown, toll: Number(e.target.value) })}
                      placeholder="e.g. 1800"
                      className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 font-semibold text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Driver Allowance */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                      <Truck className="w-3.5 h-3.5 text-amber-600" /> Driver Allowance / Bata (₹)
                    </label>
                    <input 
                      type="number" 
                      value={costBreakdown.driverAllowance || ""}
                      onChange={(e) => setCostBreakdown({ ...costBreakdown, driverAllowance: Number(e.target.value) })}
                      placeholder="e.g. 1000"
                      className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 font-semibold text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Food Allowance */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                      <Utensils className="w-3.5 h-3.5 text-emerald-600" /> Food Allowance (₹)
                    </label>
                    <input 
                      type="number" 
                      value={costBreakdown.foodAllowance || ""}
                      onChange={(e) => setCostBreakdown({ ...costBreakdown, foodAllowance: Number(e.target.value) })}
                      placeholder="e.g. 600"
                      className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 font-semibold text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Loading Charges */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="font-semibold text-slate-700 block mb-1.5">
                      Loading Charges / Hamali (₹)
                    </label>
                    <input 
                      type="number" 
                      value={costBreakdown.loading || ""}
                      onChange={(e) => setCostBreakdown({ ...costBreakdown, loading: Number(e.target.value) })}
                      placeholder="e.g. 800"
                      className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 font-semibold text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Unloading Charges */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="font-semibold text-slate-700 block mb-1.5">
                      Unloading Charges (₹)
                    </label>
                    <input 
                      type="number" 
                      value={costBreakdown.unloading || ""}
                      onChange={(e) => setCostBreakdown({ ...costBreakdown, unloading: Number(e.target.value) })}
                      placeholder="e.g. 800"
                      className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 font-semibold text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Driver Wages Calculation */}
                <div className="mt-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" /> Driver Wages (Days × Daily Wage)
                    </label>
                    <span className="font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                      Total Wage: ₹{((Number(costBreakdown.driverDays) || 0) * (Number(costBreakdown.driverDailyWage) || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">Trip Duration (Days)</span>
                      <input 
                        type="number" 
                        value={costBreakdown.driverDays || ""}
                        onChange={(e) => setCostBreakdown({ ...costBreakdown, driverDays: Number(e.target.value) })}
                        placeholder="e.g. 2"
                        className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 font-semibold text-slate-800 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">Daily Wage Rate (₹ / day)</span>
                      <input 
                        type="number" 
                        value={costBreakdown.driverDailyWage || ""}
                        onChange={(e) => setCostBreakdown({ ...costBreakdown, driverDailyWage: Number(e.target.value) })}
                        placeholder="e.g. 800"
                        className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 font-semibold text-slate-800 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Others */}
                <div className="mt-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700 block mb-2">
                    Others / Miscellaneous Route Charges
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <input 
                        type="text" 
                        value={costBreakdown.otherDescription}
                        onChange={(e) => setCostBreakdown({ ...costBreakdown, otherDescription: e.target.value })}
                        placeholder="Details (e.g. Extra Drop, State Permit, Greasing)"
                        className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 font-medium text-slate-800 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <input 
                        type="number" 
                        value={costBreakdown.otherAmount || ""}
                        onChange={(e) => setCostBreakdown({ ...costBreakdown, otherAmount: Number(e.target.value) })}
                        placeholder="Amount (₹)"
                        className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 font-semibold text-slate-800 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* FINANCIAL SUMMARY SECTION */}
              <div className="border-t border-slate-200 pt-4">
                <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Operating Expenses Subtotal:</span>
                    <span className="font-bold text-white">₹{operatingExpenses.toLocaleString('en-IN')}</span>
                  </div>
                  {vendorQuote && (
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Vehicle / Supplier Freight ({vendorQuote.vendor?.name}):</span>
                      <span className="font-bold text-white">₹{vendorQuote.quotedRate?.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm font-bold text-slate-100 pt-2 border-t border-slate-800">
                    <span>Total Effective Trip Cost:</span>
                    <span className="text-base text-amber-400">₹{totalTripCost.toLocaleString('en-IN')}</span>
                  </div>

                  {/* CONTRACT CUSTOMER COMPARISON */}
                  {isContractCustomer(selectedIndent) ? (
                    <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700 space-y-2 mt-2">
                      <div className="flex justify-between items-center text-slate-300 text-xs">
                        <span>Contract Agreed Rate (Selling Price):</span>
                        <span className="font-black text-white text-sm">₹{contractRate.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-700 font-bold">
                        <span className="flex items-center gap-1">
                          {contractNetMargin >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-400" />
                          )}
                          Admin Margin (Profit / Loss):
                        </span>
                        <span className={`text-base ${contractNetMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {contractNetMargin >= 0 ? '+' : ''}₹{contractNetMargin.toLocaleString('en-IN')} ({contractMarginPercent}%)
                        </span>
                      </div>
                      {contractNetMargin < 0 && (
                        <p className="text-[11px] text-rose-300">
                          ⚠️ Warning: Estimated operating expenses exceed the fixed contract price. This trip will result in a loss.
                        </p>
                      )}
                    </div>
                  ) : (
                    /* SPOT CUSTOMER MARGIN CALCULATION */
                    <div className="bg-slate-800/80 rounded-lg p-3.5 border border-slate-700 space-y-3 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-200">Select Margin Mode:</span>
                        <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setCostBreakdown({ ...costBreakdown, marginMode: "percentage" })}
                            className={`px-2.5 py-1 rounded-md font-bold transition-all ${costBreakdown.marginMode === "percentage" ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                          >
                            % Percentage
                          </button>
                          <button
                            type="button"
                            onClick={() => setCostBreakdown({ ...costBreakdown, marginMode: "fixed" })}
                            className={`px-2.5 py-1 rounded-md font-bold transition-all ${costBreakdown.marginMode === "fixed" ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                          >
                            ₹ Fixed Amount
                          </button>
                        </div>
                      </div>

                      {costBreakdown.marginMode === "percentage" ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-300">Margin Percentage:</span>
                            <div className="flex gap-1.5">
                              {[10, 12, 15, 20].map((pct) => (
                                <button
                                  key={pct}
                                  type="button"
                                  onClick={() => setCostBreakdown({ ...costBreakdown, marginPercentage: pct })}
                                  className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                                    costBreakdown.marginPercentage === pct
                                      ? 'bg-blue-500 text-white border-blue-400'
                                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                                  }`}
                                >
                                  {pct}%
                                </button>
                              ))}
                            </div>
                            <input 
                              type="number" 
                              value={costBreakdown.marginPercentage || ""}
                              onChange={(e) => setCostBreakdown({ ...costBreakdown, marginPercentage: Number(e.target.value) })}
                              placeholder="%"
                              className="w-16 h-7 bg-slate-900 border border-slate-700 rounded px-2 text-center text-white font-bold text-xs outline-none focus:border-blue-400"
                            />
                          </div>
                          <div className="flex justify-between items-center text-xs text-blue-300 font-semibold">
                            <span>Calculated Profit Margin:</span>
                            <span>+ ₹{spotCalculatedMargin.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-300">Fixed Margin Amount (₹):</span>
                          <input 
                            type="number" 
                            value={margin || ""}
                            onChange={(e) => setMargin(Number(e.target.value))}
                            placeholder="e.g. 5000"
                            className="w-28 h-8 bg-slate-900 border border-slate-700 rounded-lg px-2 text-right text-white font-bold text-xs outline-none focus:border-blue-400"
                          />
                        </div>
                      )}

                      <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-700 font-black">
                        <span className="text-slate-200">Customer Selling Price:</span>
                        <span className="text-emerald-400 text-lg">
                          ₹{spotCalculatedSellingPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsCostModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleApplyCostSheet}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors shadow-md shadow-blue-600/20 flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" /> Apply to Quotation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
