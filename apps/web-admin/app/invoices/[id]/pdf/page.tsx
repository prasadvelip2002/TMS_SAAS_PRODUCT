"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { Loader2, Printer, CheckCircle } from "lucide-react";

export default function InvoicePDF() {
  const params = useParams();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        const data = await fetchApi(`/Finance/invoices/${id}`);
        setInvoice(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadInvoice();
  }, [id]);

  if (loading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!invoice) return <div className="p-8 text-center text-red-500 font-bold">Invoice not found.</div>;

  return (
    <div className="bg-slate-200 min-h-screen py-8 print:bg-white print:py-0 text-slate-800 font-sans">
      
      {/* Action Bar (Hidden when printing) */}
      <div className="max-w-[210mm] mx-auto mb-4 flex justify-end gap-3 print:hidden">
        {invoice.status === "Unpaid" && (
          <Badge>Pending Payment</Badge>
        )}
        <button 
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow flex gap-2 font-bold hover:bg-blue-700"
        >
          <Printer className="w-5 h-5" /> Print Invoice
        </button>
      </div>

      {/* A4 Paper Container */}
      <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-xl print:shadow-none p-[20mm] box-border relative">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-blue-700 mb-1">TAX INVOICE</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Transitflow Logistics Solutions</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold text-slate-900">{invoice.invoiceNumber}</div>
            <div className="text-sm text-slate-500 mt-1">Date: <span className="font-semibold text-slate-800">{new Date(invoice.invoiceDate).toLocaleDateString()}</span></div>
            <div className="text-sm text-slate-500">Due Date: <span className="font-semibold text-slate-800">{new Date(invoice.dueDate).toLocaleDateString()}</span></div>
          </div>
        </div>

        {/* Addresses */}
        <div className="flex justify-between mb-8 text-sm">
          <div className="w-1/2 pr-4">
            <h3 className="font-bold text-slate-400 uppercase tracking-wider mb-2 text-xs">Billed To</h3>
            <p className="font-black text-lg text-slate-800">{invoice.customer?.name}</p>
            <p className="text-slate-600 leading-relaxed mt-1">
              {invoice.customer?.address}<br/>
              {invoice.customer?.city}, {invoice.customer?.state}<br/>
              GSTIN: <span className="font-semibold">{invoice.customer?.gstin}</span>
            </p>
          </div>
          <div className="w-1/2 pl-4 border-l border-slate-200">
            <h3 className="font-bold text-slate-400 uppercase tracking-wider mb-2 text-xs">Service Provider</h3>
            <p className="font-bold text-slate-800">TRANSITFLOW LOGISTICS SOLUTIONS</p>
            <p className="text-slate-600 leading-relaxed mt-1">
              123 Transport Nagar, Sector 4<br/>
              Mumbai, Maharashtra 400001<br/>
              GSTIN: <span className="font-semibold">27AADCH1234D1Z5</span><br/>
              PAN: <span className="font-semibold">AADCH1234D</span>
            </p>
          </div>
        </div>

        {/* Line Items (Trips) */}
        <div className="mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y-2 border-slate-900 bg-slate-50 text-slate-800">
                <th className="py-3 px-2 text-left font-bold w-12">#</th>
                <th className="py-3 px-2 text-left font-bold">Trip ID / Details</th>
                <th className="py-3 px-2 text-left font-bold">Vehicle</th>
                <th className="py-3 px-2 text-right font-bold w-24">Freight</th>
                <th className="py-3 px-2 text-right font-bold w-24">Toll/Halt</th>
                <th className="py-3 px-2 text-right font-bold w-32">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.trips?.map((trip: any, idx: number) => {
                const rowFreight = trip.customerRate ?? trip.indent?.customerRate ?? trip.freightCharges;
                const rowTotal = rowFreight + (trip.tollCharges || 0);
                return (
                  <tr key={trip.id} className="text-slate-700">
                    <td className="py-3 px-2 align-top">{idx + 1}</td>
                    <td className="py-3 px-2 align-top">
                      <div className="font-bold text-slate-900">TRP-{trip.id}</div>
                      <div className="text-xs text-slate-500 mt-1">{trip.indent?.source} to {trip.indent?.destination}</div>
                    </td>
                    <td className="py-3 px-2 align-top font-mono text-xs">{trip.vehicle?.vehicleNumber}</td>
                    <td className="py-3 px-2 align-top text-right">{rowFreight.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-2 align-top text-right">{trip.tollCharges?.toLocaleString('en-IN') || "0"}</td>
                    <td className="py-3 px-2 align-top text-right font-semibold">{rowTotal.toLocaleString('en-IN')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Box */}
        <div className="flex justify-end mb-12">
          <div className="w-1/2 bg-slate-50 rounded-xl p-5 border border-slate-200">
            <div className="flex justify-between mb-2 text-sm text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold">₹{invoice.totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between mb-4 text-sm text-slate-600">
              <span>IGST (18%)</span>
              <span className="font-semibold">₹{invoice.taxAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between pt-3 border-t-2 border-slate-900">
              <span className="font-black text-lg text-slate-900">Grand Total</span>
              <span className="font-black text-xl text-blue-700">₹{invoice.grandTotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-[10px] text-right text-slate-400 mt-1 uppercase">Amount in Words: (Calculation Omitted)</div>
          </div>
        </div>

        {/* Bank Details & Signature */}
        <div className="flex justify-between text-sm mt-auto pt-8 border-t border-slate-200 absolute bottom-[20mm] left-[20mm] right-[20mm]">
          <div>
            <h3 className="font-bold text-slate-800 mb-2">Bank Details</h3>
            <p className="text-slate-600">
              Bank: <strong>HDFC Bank Ltd.</strong><br/>
              A/c Name: <strong>TRANSITFLOW LOGISTICS SOLUTIONS</strong><br/>
              A/c No: <strong>50200012345678</strong><br/>
              IFSC: <strong>HDFC0001234</strong>
            </p>
          </div>
          <div className="text-center flex flex-col items-center justify-end">
            <div className="w-40 h-16 border-b-2 border-slate-300 mb-2"></div>
            <p className="font-bold text-slate-800">Authorized Signatory</p>
            <p className="text-xs text-slate-500">Transitflow Logistics Solutions</p>
          </div>
        </div>

      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="bg-red-100 text-red-800 border border-red-200 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider">{children}</span>;
}
