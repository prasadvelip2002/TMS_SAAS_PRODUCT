"use client";

import { ProtoTable, Td } from "@/components/PrototypeUI";
import { MessageSquare, Bell, Search, Filter } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications & WhatsApp</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">History of automated WhatsApp messages and system alerts sent to users.</p>
        </div>
        <button 
          className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2"
        >
          <Filter className="w-4.5 h-4.5 text-slate-400" />
          Filter Logs
        </button>
      </div>

      {/* Search & Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 p-2 mb-6 flex items-center justify-between">
        <div className="flex items-center px-4 gap-3 flex-1">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search communication logs by recipient or message content..." 
            className="w-full bg-transparent border-none focus:outline-none text-sm text-slate-700 font-medium placeholder:text-slate-400 py-2.5"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-lg text-slate-900 tracking-tight">Communication Log</h3>
            <p className="text-[13px] font-medium text-slate-500 mt-0.5">Recent automated messages</p>
          </div>
        </div>
        
        <ProtoTable headers={["DATE", "RECIPIENT", "TYPE", "MESSAGE PREVIEW", "STATUS"]}>
          <tr>
            <Td colSpan={5} className="p-0 hover:bg-transparent">
              <div className="p-20 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No communications yet</h3>
                <p className="text-slate-500 text-[14.5px] mb-8 max-w-sm">There are no recent WhatsApp messages or system alerts to display for this tenant.</p>
                <button 
                  className="bg-blue-50 text-blue-700 font-medium px-6 py-3 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  Configure Triggers
                </button>
              </div>
            </Td>
          </tr>
        </ProtoTable>
      </div>
    </div>
  );
}
