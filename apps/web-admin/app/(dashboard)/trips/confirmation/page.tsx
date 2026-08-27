"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td } from "@/components/PrototypeUI";
import { Search, Grid, List, CheckCircle, FileText, Loader2 } from "lucide-react";

export default function ConfirmationPage() {
  const [indents, setIndents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadIndents = async () => {
    setLoading(true);
    try {
      const data = await fetchApi("/Indents");
      setIndents(data.filter((i: any) => i.status === 'Pending'));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIndents();
  }, []);

  const handleConfirm = async (id: number) => {
    try {
      await fetchApi(`/Indents/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "Confirmed" }),
      });
      loadIndents();
    } catch (error) {
      console.error(error);
      alert("Failed to confirm indent");
    }
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end mb-[20px] shrink-0">
        <div>
          <h1 className="font-disp font-bold text-[28px] text-slate-900 tracking-tight leading-tight">Trip Confirmation Sheet</h1>
          <p className="text-[14px] text-slate-500 mt-1 font-medium">Review pending indents and confirm them for Trip Execution</p>
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
          <ProtoTable headers={["INDENT ID", "CUSTOMER", "ROUTE", "MATERIAL", "VEHICLE TYPE", "ACTION"]}>
            {loading ? (
              <tr>
                <Td colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-10 h-10 mb-3 animate-spin text-slate-300" />
                    <span className="text-[14px] font-medium">Loading Indents...</span>
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
                    <h3 className="text-[16px] font-bold text-slate-800 mb-1">No Pending Confirmations</h3>
                    <p className="text-[14px] text-slate-500 max-w-sm mx-auto">
                      All indents have been confirmed or there are no new indents right now.
                    </p>
                  </div>
                </Td>
              </tr>
            ) : (
              indents.map((indent) => (
                <tr key={indent.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
                  <Td className="font-mono text-[13px] font-semibold text-slate-600">IND-{1000 + indent.id}</Td>
                  <Td className="font-semibold text-slate-800">{indent.customer?.name || "Unknown"}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-slate-700">{indent.source}</span>
                      <span className="text-slate-300">→</span>
                      <span className="text-[13px] font-medium text-slate-700">{indent.destination}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="text-[13px] font-medium text-slate-800">{indent.material}</div>
                    <div className="text-[11px] text-slate-500">{indent.weight} Tons</div>
                  </Td>
                  <Td>
                    <div className="text-[13px] font-medium text-slate-800">{indent.vehicleType}</div>
                  </Td>
                  <Td>
                    <button 
                      onClick={() => handleConfirm(indent.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-[13px] font-bold transition-all shadow-sm shadow-green-600/20 flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Confirm
                    </button>
                  </Td>
                </tr>
              ))
            )}
          </ProtoTable>
        </div>
      </div>
    </div>
  );
}
