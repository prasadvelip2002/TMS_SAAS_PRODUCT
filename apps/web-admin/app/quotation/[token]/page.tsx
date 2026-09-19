"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  MapPin, 
  Truck, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  ArrowRight
} from "lucide-react";
import { formatTime12H } from "@/lib/utils";

export default function CustomerQuotationPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [quoteDetails, setQuoteDetails] = useState<any>(null);

  // Form State
  const [poNumber, setPoNumber] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchApi(`/Sales/QuotationByToken/${token}`)
      .then((data) => {
        setQuoteDetails(data);
        if (data.status === "Approved" || data.status === "PO_Received") {
          setSuccess(true);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("This quotation link is invalid, expired, or has already been completed.");
      })
      .finally(() => {
        setFetching(false);
      });
  }, [token]);

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poNumber.trim()) {
      alert("Please enter your Purchase Order (PO) Number or reference.");
      return;
    }

    setLoading(true);
    try {
      await fetchApi(`/Sales/ApproveByToken/${token}`, {
        method: "POST",
        body: JSON.stringify({
          poNumber: poNumber.trim(),
          remarks: remarks.trim() || undefined
        })
      });
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to confirm order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading your Sales Quotation...</p>
      </div>
    );
  }

  if (error || !quoteDetails) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-slate-100">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Quotation Unavailable</h2>
          <p className="text-sm text-slate-500 mb-6">{error || "Unable to locate quotation details."}</p>
          <div className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl">
            Please contact TransitFlow support or reply to your WhatsApp notification.
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-slate-100">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm animate-bounce">
            <CheckCircle className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Order Confirmed!</h2>
          <p className="text-sm text-slate-500 mt-2 mb-6 font-medium">
            Thank you, <strong className="text-slate-800">{quoteDetails.customerName}</strong>. Your order has been confirmed and moved to active vehicle placement.
          </p>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2 mb-6 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Booking Ref:</span>
              <span className="font-mono font-bold text-slate-800">IND-{1000 + (quoteDetails.indent?.id || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Confirmed Rate:</span>
              <span className="font-bold text-emerald-700">₹{Number(quoteDetails.sellingPrice).toLocaleString('en-IN')}</span>
            </div>
            {poNumber && (
              <div className="flex justify-between">
                <span className="text-slate-500">PO Number:</span>
                <span className="font-mono font-bold text-blue-700">{poNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Route:</span>
              <span className="font-semibold text-slate-700">{quoteDetails.indent?.source} ➔ {quoteDetails.indent?.destination}</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60 text-[11px] text-emerald-800 font-medium">
            🚛 Our operations team is allocating the vehicle. You will receive live WhatsApp updates as the vehicle is dispatched.
          </div>
        </div>
      </div>
    );
  }

  const indent = quoteDetails.indent || {};
  const formattedPickupTime = indent.loadingTime ? formatTime12H(indent.loadingTime) : "Scheduled";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-6 px-4">
      {/* Top Header */}
      <div className="w-full max-w-lg mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/30">
            TF
          </div>
          <span className="font-bold text-slate-900 text-base tracking-tight">TransitFlow Logistics</span>
        </div>
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> Secure Magic Link
        </span>
      </div>

      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-blue-300">Sales Quotation</span>
              <h1 className="text-2xl font-black mt-0.5 tracking-tight">IND-{1000 + (indent.id || 0)}</h1>
              <p className="text-xs text-slate-300 mt-0.5">Prepared for <strong className="text-white">{quoteDetails.customerName}</strong></p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-blue-200 font-semibold block">Agreed Freight Rate</span>
              <span className="text-2xl font-black text-emerald-400">₹{Number(quoteDetails.sellingPrice).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Consignment Details */}
        <div className="p-5 space-y-4">
          {/* Route Card */}
          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-600" /> Route Specification</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <span className="truncate">{indent.source}</span>
              <ArrowRight className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="truncate">{indent.destination}</span>
            </div>
            {indent.warehouseLocation && (
              <div className="mt-1 text-[11px] font-semibold text-blue-700 flex items-center gap-1">
                <span>Via Consolidation Hub:</span> <span>{indent.warehouseLocation}</span>
              </div>
            )}
          </div>

          {/* Cargo Specs Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Cargo & Weight</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">{indent.material || "General Cargo"}</span>
              <span className="text-[11px] text-slate-500 font-medium">{indent.weight} Metric Tons</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Vehicle Required</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">{indent.vehicleType || "As Specified"}</span>
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                <Truck className="w-3 h-3 text-slate-400" /> Dedicated Fleet
              </span>
            </div>
          </div>

          {/* Pickup Timing */}
          <div className="flex items-center justify-between p-3 bg-blue-50/60 border border-blue-200/60 rounded-2xl text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-slate-700 font-semibold">
                {indent.loadingDate ? new Date(indent.loadingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "Immediate"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-900 font-bold">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Reporting: {formattedPickupTime}</span>
            </div>
          </div>

          {/* Customer Confirmation Form */}
          <form onSubmit={handleApprove} className="mt-6 pt-4 border-t border-slate-100 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Purchase Order (PO) Number / Work Order Ref <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. PO-2026-8891 or DISPATCH-OK"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Enter your company's PO number or dispatch confirmation clearance.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Special Loading / Gate Instructions (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Contact warehouse gate supervisor upon arrival..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !poNumber.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Confirming Order...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Accept Quotation & Confirm Booking
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
          TransitFlow Transport & Supply Chain Operating System
        </div>
      </div>
    </div>
  );
}
