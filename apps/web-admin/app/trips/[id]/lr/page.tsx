"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchApi } from "@/lib/api";

export default function LorryReceiptPrint() {
  const params = useParams();
  const tripId = params.id as string;
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tripId) {
      fetchApi(`/Trips/${tripId}`)
        .then((data) => {
          setTrip(data);
          setLoading(false);
          // Small timeout to allow images (logo) to load before triggering print
          setTimeout(() => {
            window.print();
          }, 500);
        })
        .catch((err) => {
          console.error("Failed to load trip:", err);
          setLoading(false);
        });
    }
  }, [tripId]);

  if (loading) return <div className="p-10 text-center font-sans">Loading Document...</div>;
  if (!trip) return <div className="p-10 text-center font-sans text-red-500">Failed to load LR</div>;

  const lrNumber = `TRANSITFLOW-LR-${trip.id.toString().padStart(4, '0')}`;
  const date = new Date(trip.createdAt).toLocaleDateString('en-IN');
  
  // Format for A4 print
  return (
    <div className="bg-white min-h-screen text-black font-sans print:m-0 print:p-0">
      <div className="w-full max-w-[210mm] mx-auto p-[20mm] print:p-[10mm]">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
          <div>
            <img src="/logo.png" alt="TRANSITFLOW LOGISTICS" className="h-14 mb-2 mix-blend-multiply" />
            <h1 className="text-xl font-black uppercase tracking-widest text-slate-900">Transitflow Logistics</h1>
            <p className="text-[11px] text-slate-600">Global Warehousing & 3PL Provider</p>
            <p className="text-[11px] text-slate-600">info@transitflowlogistics.com | +91 98765 43210</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold uppercase tracking-wider mb-2">Lorry Receipt</h2>
            <div className="inline-block border border-black p-2 text-left">
              <p className="text-sm"><strong>LR No:</strong> {lrNumber}</p>
              <p className="text-sm"><strong>Date:</strong> {date}</p>
            </div>
            {trip.legType === "InboundLeg1" && <p className="text-[10px] font-bold mt-2 uppercase text-slate-500">Leg 1: Inbound to Warehouse</p>}
            {trip.legType === "OutboundLeg2" && <p className="text-[10px] font-bold mt-2 uppercase text-slate-500">Leg 2: Outbound to OEM (TRP-{trip.parentTripId})</p>}
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div className="border border-slate-400 p-4 min-h-[140px]">
            <h3 className="font-bold text-[12px] border-b border-slate-300 pb-1 mb-2 uppercase text-slate-500">Consignor (Sender)</h3>
            <p className="font-bold text-sm uppercase">{trip.indent?.customer?.name || 'Loading Customer Details...'}</p>
            <p className="text-[12px] mt-1">{trip.indent?.customer?.address || 'Address pending'}</p>
            <p className="text-[12px] mt-1"><strong>GSTIN:</strong> {trip.indent?.customer?.gstin || 'N/A'}</p>
            <p className="text-[12px]"><strong>Phone:</strong> {trip.indent?.customer?.phone || 'N/A'}</p>
          </div>
          <div className="border border-slate-400 p-4 min-h-[140px]">
            <h3 className="font-bold text-[12px] border-b border-slate-300 pb-1 mb-2 uppercase text-slate-500">Consignee (Receiver)</h3>
            <p className="font-bold text-sm uppercase">
              {trip.legType === "InboundLeg1" ? "TRANSITFLOW LOGISTICS WAREHOUSE" : "OEM PLANT (Destination)"}
            </p>
            <p className="text-[12px] mt-1 whitespace-pre-line">
              {trip.legType === "InboundLeg1" 
                ? "Central Hub, Warehouse No. 42,\nIndustrial Area, Phase 1" 
                : trip.indent?.destination}
            </p>
          </div>
        </div>

        {/* Transport Details */}
        <div className="mb-6">
          <table className="w-full text-left border-collapse border border-slate-400">
            <tbody>
              <tr className="border-b border-slate-400 bg-slate-50">
                <th className="p-2 border-r border-slate-400 text-[11px] uppercase text-slate-500 w-1/4">Vehicle No</th>
                <td className="p-2 border-r border-slate-400 text-sm font-bold">{trip.vehicle?.vehicleNumber || 'Unassigned'}</td>
                <th className="p-2 border-r border-slate-400 text-[11px] uppercase text-slate-500 w-1/4">Driver Name</th>
                <td className="p-2 text-sm">{trip.driver?.name || 'Unassigned'}</td>
              </tr>
              <tr className="border-b border-slate-400">
                <th className="p-2 border-r border-slate-400 text-[11px] uppercase text-slate-500">From</th>
                <td className="p-2 border-r border-slate-400 text-sm">{trip.legType === "OutboundLeg2" ? "Transitflow Warehouse" : trip.indent?.source}</td>
                <th className="p-2 border-r border-slate-400 text-[11px] uppercase text-slate-500">To</th>
                <td className="p-2 text-sm">{trip.legType === "InboundLeg1" ? "Transitflow Warehouse" : trip.indent?.destination}</td>
              </tr>
              <tr>
                <th className="p-2 border-r border-slate-400 text-[11px] uppercase text-slate-500">Driver Phone</th>
                <td className="p-2 border-r border-slate-400 text-sm">{trip.driver?.phone || 'N/A'}</td>
                <th className="p-2 border-r border-slate-400 text-[11px] uppercase text-slate-500">Transporter</th>
                <td className="p-2 text-sm">{trip.vendor?.name || 'Transitflow Own Fleet'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Cargo Details */}
        <div className="mb-10">
          <table className="w-full text-left border-collapse border border-slate-400">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-400">
                <th className="p-3 text-[12px] font-bold uppercase">S.No</th>
                <th className="p-3 text-[12px] font-bold uppercase border-l border-slate-400">Description of Goods</th>
                <th className="p-3 text-[12px] font-bold uppercase border-l border-slate-400 text-center">Actual Weight</th>
                <th className="p-3 text-[12px] font-bold uppercase border-l border-slate-400 text-center">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-40 align-top">
                <td className="p-3 text-sm">1</td>
                <td className="p-3 text-sm border-l border-slate-400 font-semibold">{trip.indent?.material || 'General Cargo'}</td>
                <td className="p-3 text-sm border-l border-slate-400 text-center">{trip.indent?.weight} Tonnes</td>
                <td className="p-3 text-sm border-l border-slate-400 text-center">As per invoice</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-4 pt-16 mt-10">
          <div className="text-center">
            <div className="border-t border-black pt-2 text-[12px] uppercase font-bold text-slate-600">Consignor Signature</div>
          </div>
          <div className="text-center">
            <div className="border-t border-black pt-2 text-[12px] uppercase font-bold text-slate-600">Driver Signature</div>
          </div>
          <div className="text-center">
            <div className="border-t border-black pt-2 text-[12px] uppercase font-bold text-slate-600">For Transitflow Logistics</div>
          </div>
        </div>

        {/* Terms */}
        <div className="mt-10 border-t border-slate-300 pt-4">
          <p className="text-[9px] text-slate-500 uppercase text-justify leading-relaxed">
            <strong>Terms & Conditions:</strong> 1. Goods are transported at owner's risk unless explicitly insured. 2. Transitflow Logistics is not responsible for damages caused by improper packaging, natural calamities, or unforeseen circumstances. 3. All disputes are subject to local jurisdiction. 4. Demurrage will be charged after 24 hours of vehicle arrival at destination. 5. This LR must be surrendered at the time of delivery.
          </p>
        </div>

      </div>
    </div>
  );
}
