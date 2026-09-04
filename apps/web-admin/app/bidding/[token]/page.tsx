"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { Loader2, CheckCircle, AlertTriangle, FileText, MapPin, Truck, Calendar } from "lucide-react";

export default function VendorBiddingPage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [rfqDetails, setRfqDetails] = useState<any>(null);
  
  // Form State
  const [rate, setRate] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    fetchApi(`/Procurement/RFQ/${token}`)
      .then(data => {
        setRfqDetails(data);
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        setFetching(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rate) return alert("Please enter your quoted rate");
    
    setLoading(true);
    try {
      await fetchApi(`/Procurement/SubmitBid/${token}`, {
        method: "POST",
        body: JSON.stringify({
          quotedRate: parseFloat(rate),
          proposedVehicleType: vehicle,
          remarks: remarks
        })
      });
      setSuccess(true);
    } catch (e) {
      console.error(e);
      alert("Failed to submit bid. Link may be expired.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Bid Submitted!</h1>
          <p className="text-slate-500 mb-8">Your quotation has been sent to Transitflow Logistics. You will be notified if your bid is approved.</p>
          <button onClick={() => window.close()} className="text-slate-400 hover:text-slate-600 font-medium text-sm">
            You may close this window
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100">
        
        <div className="bg-[#0F172A] p-6 text-center">
          <img src="/logo.png" alt="TRANSITFLOW LOGISTICS" className="h-8 mx-auto mix-blend-multiply bg-white/90 px-3 py-1 rounded" />
          <h2 className="text-white font-semibold mt-4">Transport RFQ Submission</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl text-sm mb-6 flex gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-blue-600" />
            <p>You have been invited by Transitflow Logistics to bid on a trip. Please review the details and submit your best rate.</p>
          </div>

          {fetching ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : rfqDetails ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trip Details</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Route</div>
                  <div className="text-[13px] font-semibold text-slate-800 flex flex-col">
                    <span>{rfqDetails.indent?.source}</span>
                    <span className="text-slate-300">↓</span>
                    <span>{rfqDetails.indent?.destination}</span>
                  </div>
                </div>
                
                <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Cargo</div>
                  <div className="text-[13px] font-semibold text-slate-800">{rfqDetails.indent?.material}</div>
                  <div className="text-[11px] text-slate-500">{rfqDetails.indent?.weight} Tons</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1"><Truck className="w-3 h-3" /> Vehicle Req.</div>
                  <div className="text-[12px] font-semibold text-slate-800">{rfqDetails.indent?.vehicleType}</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Pickup</div>
                  <div className="text-[12px] font-semibold text-slate-800">{new Date(rfqDetails.indent?.loadingDate).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
              Unable to load trip details. Link may be invalid or expired.
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Your Quoted Rate (₹)</label>
            <input 
              type="number" 
              required
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="e.g. 15000"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Proposed Vehicle</label>
            <input 
              type="text" 
              required
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              placeholder="e.g. 32ft Container or TN-01-AB-1234"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Remarks (Optional)</label>
            <textarea 
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Any conditions or notes..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors mt-4 flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Quotation"}
          </button>
        </form>

      </div>
    </div>
  );
}
