"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td } from "@/components/PrototypeUI";
import { MessageSquare, Bell, Search, Filter, X, Activity } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    try {
      const data = await fetchApi("/Notifications");
      setNotifications(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredNotifications = notifications.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      n.title?.toLowerCase().includes(q) ||
      n.message?.toLowerCase().includes(q) ||
      n.type?.toLowerCase().includes(q) ||
      n.entityId?.toString().includes(q)
    );
  });

  return (
    <div className="max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications & WhatsApp</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">History of automated WhatsApp messages and system alerts sent to users.</p>
        </div>
      </div>

      {/* Search & Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 p-2 mb-6 flex items-center justify-between">
        <div className="flex items-center px-4 gap-3 flex-1">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search communication logs by title, type, or message content..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none focus:outline-none text-sm text-slate-700 font-medium placeholder:text-slate-400 py-2.5"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-lg text-slate-900 tracking-tight">Communication Log</h3>
            <p className="text-[13px] font-medium text-slate-500 mt-0.5">Recent automated messages</p>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-16">
            <Activity className="animate-spin text-blue-600 w-8 h-8" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {searchQuery ? "No matching communications found" : "No communications yet"}
            </h3>
            <p className="text-slate-500 text-[14.5px] mb-8 max-w-sm">
              {searchQuery
                ? `No logs matched "${searchQuery}". Try another search term.`
                : "There are no recent WhatsApp messages or system alerts to display for this tenant."}
            </p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl transition-all"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <ProtoTable headers={["DATE", "TYPE", "TITLE", "MESSAGE PREVIEW", "ENTITY"]}>
            {filteredNotifications.map((n) => (
              <tr key={n.id} className="hover:bg-slate-50 transition-colors">
                <Td className="font-mono text-[12px]">{new Date(n.createdAt).toLocaleString()}</Td>
                <Td>
                  <span className="px-[8px] py-[3px] bg-blue-50 text-blue-700 rounded-[6px] text-[11px] font-semibold border border-blue-100">
                    {n.type}
                  </span>
                </Td>
                <Td className="font-semibold text-slate-900">{n.title}</Td>
                <Td className="text-slate-600 max-w-md truncate">{n.message}</Td>
                <Td className="font-mono text-[12px]">{n.entityId ? `#${n.entityId}` : "—"}</Td>
              </tr>
            ))}
          </ProtoTable>
        )}
      </div>
    </div>
  );
}
