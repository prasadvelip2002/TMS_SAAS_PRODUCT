"use client";

import { useEffect, useState } from "react";
import { getPendingCharges, approveCharge, rejectCharge } from "@/lib/api";
import { Panel, ProtoTable, Td, ProtoButton, Badge } from "@/components/PrototypeUI";
import { Search, X } from "lucide-react";

export default function ApprovalsPage() {
  const [charges, setCharges] = useState<any[]>([]);
  const [loading, setLoading] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = () => {
    getPendingCharges().then(setCharges).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCharges = charges.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      c.tripId?.toString().includes(q) ||
      `trp-${c.tripId}`.toLowerCase().includes(q) ||
      c.chargeType?.toLowerCase().includes(q) ||
      c.amount?.toString().includes(q) ||
      c.status?.toLowerCase().includes(q)
    );
  });

  const handleApprove = async (id: number) => {
    if (!confirm("Are you sure you want to approve this charge?")) return;
    setLoading(id);
    try {
      await approveCharge(id);
      loadData();
    } catch (e) {
      alert("Failed to approve");
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm("Are you sure you want to reject this charge?")) return;
    setLoading(id);
    try {
      await rejectCharge(id);
      loadData();
    } catch (e) {
      alert("Failed to reject");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-[20px]">
        <h1 className="font-disp font-semibold text-[22px] text-ink">Manager Approvals</h1>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 p-2 mb-6 flex items-center justify-between">
        <div className="flex items-center px-4 gap-3 flex-1">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search approvals by Trip ID (e.g. TRP-1), charge type, amount..." 
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

      <Panel title="Pending Additional Charges" hint="Charges requested by drivers that require your approval before final settlement.">
        <ProtoTable headers={["Date", "Trip ID", "Type", "Amount", "Status", "Actions"]}>
          {filteredCharges.length === 0 ? (
            <tr>
              <Td className="text-center text-muted-text py-8">
                <span className="col-span-6 block">
                  {searchQuery ? `No pending approvals matched "${searchQuery}".` : "No pending approvals. All caught up!"}
                </span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Clear Filter
                  </button>
                )}
              </Td>
            </tr>
          ) : (
            filteredCharges.map((charge) => (
              <tr key={charge.id} className="hover:bg-slate-50 transition-colors">
                <Td>{new Date(charge.createdAt).toLocaleDateString()}</Td>
                <Td className="font-mono text-[12.8px]">TRP-{charge.tripId}</Td>
                <Td>{charge.chargeType}</Td>
                <Td className="font-mono text-signal font-semibold">₹{charge.amount.toLocaleString()}</Td>
                <Td>
                  <Badge color="orange">{charge.status}</Badge>
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <ProtoButton 
                      variant="primary"
                      onClick={() => handleApprove(charge.id)}
                    >
                      {loading === charge.id ? "..." : "Approve"}
                    </ProtoButton>
                    <ProtoButton 
                      variant="ghost"
                      onClick={() => handleReject(charge.id)}
                    >
                      {loading === charge.id ? "..." : "Reject"}
                    </ProtoButton>
                  </div>
                </Td>
              </tr>
            ))
          )}
        </ProtoTable>
      </Panel>
    </div>
  );
}
