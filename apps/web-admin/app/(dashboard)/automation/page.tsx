"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td } from "@/components/PrototypeUI";
import { Search, Grid, List, RefreshCw, Activity, Loader2 } from "lucide-react";

export default function AutomationPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (isManualRefresh = false) => {
    if (!isManualRefresh) setLoading(true);
    else setIsRefreshing(true);
    
    try {
      const data = await fetchApi("/Notifications");
      setLogs(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Poll every 30 seconds
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-full flex flex-col">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end mb-[20px] shrink-0">
        <div>
          <h1 className="font-disp font-bold text-[28px] text-slate-900 tracking-tight leading-tight">Daily Scheduler & Automation Logs</h1>
          <p className="text-[14px] text-slate-500 mt-1 font-medium flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Real-time view of background worker activities (e.g., WhatsApp Reminders, Approvals)
          </p>
        </div>
        
        <div className="flex items-center gap-[16px]">
          <button 
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Logs
          </button>
          
          <div className="h-[24px] w-[1px] bg-slate-200"></div>

          <div className="relative">
            <Search className="w-[16px] h-[16px] text-slate-400 absolute left-[14px] top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search logs..." 
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
      <div className="bg-white border border-slate-200 rounded-[16px] overflow-hidden shadow-sm flex-1 flex flex-col relative">
        {isRefreshing && (
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 overflow-hidden z-10">
            <div className="h-full bg-blue-500 animate-progress"></div>
          </div>
        )}
        
        <div className="overflow-x-auto flex-1">
          <ProtoTable headers={["TIMESTAMP", "CATEGORY", "TITLE", "MESSAGE", "ENTITY ID", "STATUS"]}>
            {loading && logs.length === 0 ? (
              <tr>
                <Td colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-10 h-10 mb-3 animate-spin text-slate-300" />
                    <span className="text-[14px] font-medium">Loading automation logs...</span>
                  </div>
                </Td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <Td colSpan={6} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <Activity className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-[16px] font-bold text-slate-800 mb-1">No System Logs</h3>
                    <p className="text-[14px] text-slate-500 max-w-sm mx-auto">
                      The background workers haven't generated any logs yet.
                    </p>
                  </div>
                </Td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
                  <Td className="font-mono text-[12px] font-semibold text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </Td>
                  <Td>
                    <span className="px-[8px] py-[3px] bg-slate-100 text-slate-600 rounded-[6px] text-[10px] font-bold uppercase tracking-widest border border-slate-200/60">
                      {log.type}
                    </span>
                  </Td>
                  <Td className="font-bold text-[13px] text-slate-800">{log.title}</Td>
                  <Td className="text-[13px] text-slate-600 max-w-[400px] truncate" title={log.message}>{log.message}</Td>
                  <Td className="font-mono text-[13px] font-semibold text-slate-600">{log.entityId ? `#${log.entityId}` : '—'}</Td>
                  <Td>
                    {log.isRead ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-[12px]">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        Processed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-amber-600 font-bold text-[12px]">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                        Pending
                      </span>
                    )}
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
