"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td } from "@/components/PrototypeUI";
import { Search, Grid, List, CheckCircle, FileText, Loader2, X } from "lucide-react";

export default function ConfirmationPage() {
  const [indents, setIndents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState("");

  const filteredIndents = indents.filter((indent) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      `ind-${1000 + indent.id}`.toLowerCase().includes(q) ||
      indent.id?.toString().includes(q) ||
      indent.customer?.name?.toLowerCase().includes(q) ||
      indent.source?.toLowerCase().includes(q) ||
      indent.destination?.toLowerCase().includes(q) ||
      indent.warehouseLocation?.toLowerCase().includes(q) ||
      indent.vehicleType?.toLowerCase().includes(q) ||
      indent.material?.toLowerCase().includes(q)
    );
  });

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
          <div className="relative flex items-center">
            <Search className="w-[16px] h-[16px] text-slate-400 absolute left-[14px] top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search indents by ID, customer, route, material..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[240px] md:w-[280px] h-[42px] bg-white border border-slate-200 rounded-[12px] pl-[40px] pr-[34px] text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
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
              ) : filteredIndents.length === 0 ? (
                <tr>
                  <Td colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                        <FileText className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-[16px] font-bold text-slate-800 mb-1">
                        {searchQuery ? "No matching indents found" : "No Pending Confirmations"}
                      </h3>
                      <p className="text-[14px] text-slate-500 max-w-sm mx-auto mb-4">
                        {searchQuery 
                          ? `No indents matched "${searchQuery}".` 
                          : "All indents have been confirmed or there are no new indents right now."}
                      </p>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl transition-all"
                        >
                          Clear Filter
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ) : (
                filteredIndents.map((indent) => (
                  <tr key={indent.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
                    <Td className="font-mono text-[13px] font-semibold text-slate-600">IND-{1000 + indent.id}</Td>
                    <Td className="font-semibold text-slate-800">{indent.customer?.name || "Unknown"}</Td>
                    <Td>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[13px] font-medium text-slate-700">{indent.source}</span>
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
      ) : (
        <div className="flex flex-col min-h-0 flex-1">
          {loading ? (
            <div className="flex justify-center p-16">
              <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
            </div>
          ) : filteredIndents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-20 flex flex-col items-center justify-center text-center mt-2">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-800 mb-1">
                {searchQuery ? "No matching indents found" : "No Pending Confirmations"}
              </h3>
              <p className="text-[14px] text-slate-500 max-w-sm mx-auto mb-4">
                {searchQuery 
                  ? `No indents matched "${searchQuery}".` 
                  : "All indents have been confirmed or there are no new indents right now."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl transition-all"
                >
                  Clear Filter
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredIndents.map(indent => (
                <div key={indent.id} className="bg-white rounded-2xl p-0 shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                  {/* Ticket Header */}
                  <div className="bg-slate-50/80 p-4 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-700 p-1.5 rounded-lg">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-mono font-bold text-slate-900 text-sm">IND-{1000 + indent.id}</div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-1">{indent.customer?.name || "Unknown"}</div>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-sky-50 text-sky-700 border-sky-100">
                      Pending
                    </span>
                  </div>
                  
                  {/* Ticket Route */}
                  <div className="px-5 py-5 border-b border-slate-100 border-dashed relative">
                    {indent.warehouseLocation ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 flex-wrap font-semibold text-slate-800 text-xs">
                          <span>{indent.source}</span>
                          <span className="text-slate-300">→</span>
                          <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10px]">
                            {indent.warehouseLocation} (Hub)
                          </span>
                          <span className="text-slate-300">→</span>
                          <span>{indent.destination}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Source</div>
                          <div className="font-semibold text-slate-800 text-sm truncate" title={indent.source}>{indent.source}</div>
                        </div>
                        <div className="flex-shrink-0 flex items-center justify-center">
                          <div className="w-8 h-px bg-slate-300"></div>
                          <div className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center mx-1 bg-white shadow-sm z-10">
                            <span className="text-[10px]">→</span>
                          </div>
                          <div className="w-8 h-px bg-slate-300"></div>
                        </div>
                        <div className="flex-1 text-right">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Destination</div>
                          <div className="font-semibold text-slate-800 text-sm truncate" title={indent.destination}>{indent.destination}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Ticket Details */}
                  <div className="px-5 py-4 bg-slate-50/30 flex-1 grid grid-cols-2 gap-y-4 gap-x-2">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vehicle Type</div>
                      <div className="font-medium text-slate-700 text-[13px]">{indent.vehicleType}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Weight</div>
                      <div className="font-medium text-slate-700 text-[13px]">{indent.weight} Tons</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Material</div>
                      <div className="font-medium text-slate-700 text-[13px] line-clamp-1">{indent.material}</div>
                    </div>
                  </div>
                  
                  {/* Ticket Action */}
                  <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
                    <button 
                      onClick={() => handleConfirm(indent.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Confirm Trip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
