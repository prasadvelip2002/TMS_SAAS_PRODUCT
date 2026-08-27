"use client";

import { useEffect, useState } from "react";
import { getIndents, getTrips, fetchApi } from "@/lib/api";
import { ProtoTable, Td, Badge, RouteTrack } from "@/components/PrototypeUI";
import { IndentForm } from "@/components/IndentForm";
import { TripAssignmentForm } from "@/components/TripAssignmentForm";
import { MapPin, X, Activity, FileText, Truck } from "lucide-react";
import Link from "next/link";

function SlideOver({ isOpen, onClose, title, subtitle, children }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Slide-over Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200">
         {/* Form Header */}
         <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
           <div>
             <h3 className="font-bold text-lg text-slate-900 tracking-tight">{title}</h3>
             {subtitle && <p className="text-[13px] font-medium text-slate-500 mt-0.5">{subtitle}</p>}
           </div>
           <button 
             onClick={onClose} 
             className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
           >
             <X className="w-5 h-5" />
           </button>
         </div>
         
         {/* Form Body - Scrollable */}
         <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
           {children}
         </div>
      </div>
    </div>
  );
}

export default function TripsPage() {
  const [indents, setIndents] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [isIndentModalOpen, setIsIndentModalOpen] = useState(false);
  const [assigningIndent, setAssigningIndent] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'indents' | 'trips'>('indents');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [ind, trp] = await Promise.all([getIndents(), getTrips()]);
      setIndents(ind);
      setTrips(trp);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingIndents = indents.filter(i => i.status !== 'Assigned');

  const TRIP_STAGES = ['Indent', 'Confirmed', 'Assigned', 'Started', 'Delivered', 'POD', 'Approved', 'Paid'];
  const getStageIdx = (trip: any) => {
    if (trip.invoice?.status === 'Paid') return 7;
    const map: Record<string, number> = {
      'Pending Assignment': 1, 'Assigned': 2, 'Started': 3, 'Delivered': 4, 'POD_Uploaded': 5, 'Closed': 6, 'Approved': 6
    };
    return map[trip.status] ?? 0;
  };
  const getBadgeColor = (status: string) => {
    const map: Record<string, 'blue' | 'orange' | 'green' | 'red' | 'grey'> = {
      'Pending Assignment': 'orange', 'Assigned': 'blue', 'Started': 'blue', 'Delivered': 'orange', 'POD_Uploaded': 'blue', 'Closed': 'green', 'Approved': 'green', 'Paid': 'green'
    };
    return map[status] ?? 'grey';
  };

  const handleCreateOutboundLeg = async (tripId: number) => {
    if (!confirm("Generate a next leg for this Trip?")) return;
    try {
      await fetchApi(`/Trips/${tripId}/create-outbound-leg`, { method: "POST" });
      loadData();
    } catch (e) {
      console.error(e);
      alert("Failed to create outbound leg");
    }
  };

  const getLegBadge = (legType: string) => {
    if (legType === "InboundLeg1") return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[10px] font-bold uppercase tracking-wider ml-2">Leg 1</span>;
    if (legType === "OutboundLeg2") return <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md text-[10px] font-bold uppercase tracking-wider ml-2">Leg 2</span>;
    return null;
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trip & Indent Dashboard</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Monitor pending indents and track active trips in real-time.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-6 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('indents')}
          className={`font-semibold text-[14px] pb-3 border-b-2 transition-colors ${activeTab === 'indents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Pending Indents
          <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] ${activeTab === 'indents' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{pendingIndents.length}</span>
        </button>
        <button 
          onClick={() => setActiveTab('trips')}
          className={`font-semibold text-[14px] pb-3 border-b-2 transition-colors ${activeTab === 'trips' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Active Trips
          <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] ${activeTab === 'trips' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{trips.length}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-16">
          <Activity className="animate-spin text-blue-600 w-8 h-8" />
        </div>
      ) : activeTab === 'indents' ? (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-end">
            <button 
              onClick={() => setIsIndentModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition-all text-[13px]"
            >
              + Create Indent
            </button>
          </div>
          <ProtoTable headers={["INDENT #", "CUSTOMER", "ROUTE", "MATERIAL", "DATE", "STATUS", "ACTIONS"]}>
            {pendingIndents.length === 0 ? (
              <tr>
                <Td colSpan={7} className="p-0 hover:bg-transparent">
                  <div className="p-20 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No pending indents</h3>
                    <p className="text-slate-500 text-[14.5px] mb-8 max-w-sm">All indents have been assigned to trips, or no indents exist.</p>
                  </div>
                </Td>
              </tr>
            ) : (
              pendingIndents.map(indent => (
                <tr key={indent.id} className="hover:bg-slate-50 transition-colors">
                  <Td className="font-mono font-semibold text-[12.5px]">IND-{1000 + indent.id}</Td>
                  <Td>{indent.customer?.name}</Td>
                  <Td className="text-[12px]">{indent.source} &rarr; {indent.destination}</Td>
                  <Td className="text-[12px]">{indent.material} ({indent.weight}t)</Td>
                  <Td className="text-[12px] whitespace-nowrap">{new Date(indent.loadingDate).toLocaleDateString()}</Td>
                  <Td><Badge color="orange">{indent.status}</Badge></Td>
                  <Td>
                    <button 
                      onClick={() => setAssigningIndent(indent)}
                      className="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 font-medium px-3 py-1.5 rounded-lg transition-all text-[12px]"
                    >
                      Assign Trip
                    </button>
                  </Td>
                </tr>
              ))
            )}
          </ProtoTable>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 overflow-hidden">
          <ProtoTable headers={["TRIP ID", "ROUTE", "VEHICLE", "DRIVER", "PROGRESS", "STATUS", "ACTIONS"]}>
            {trips.length === 0 ? (
              <tr>
                <Td colSpan={7} className="p-0 hover:bg-transparent">
                  <div className="p-20 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
                      <Truck className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No active trips</h3>
                    <p className="text-slate-500 text-[14.5px] mb-8 max-w-sm">There are no trips currently active in the system.</p>
                  </div>
                </Td>
              </tr>
            ) : (
              trips.map(trip => (
                <tr key={trip.id} className="hover:bg-slate-50 transition-colors">
                  <Td className="font-mono font-semibold text-[12.5px]">
                    TRP-{1000 + trip.id}
                    {getLegBadge(trip.legType)}
                  </Td>
                  <Td className="text-[12px]">
                    {trip.legType === 'InboundLeg1' ? (
                      trip.indent?.warehouseLocation 
                        ? <>{trip.indent?.source} &rarr; <span className="font-semibold text-purple-600">{trip.indent?.warehouseLocation}</span></>
                        : <>{trip.indent?.source} &rarr; {trip.indent?.destination}</>
                    ) : trip.legType === 'OutboundLeg2' ? (
                      trip.indent?.warehouseLocation 
                        ? <><span className="font-semibold text-purple-600">{trip.indent?.warehouseLocation}</span> &rarr; {trip.indent?.destination}</>
                        : <><span className="font-semibold text-purple-600">{trip.indent?.destination}</span> &rarr; {trip.indent?.source} <span className="text-slate-400 text-[10px] ml-1">(Return)</span></>
                    ) : (
                      <>{trip.indent?.source} &rarr; {trip.indent?.destination}</>
                    )}
                  </Td>
                  <Td className="text-[12px] font-mono">{trip.vehicle?.vehicleNumber || "—"}</Td>
                  <Td className="text-[12px]">{trip.driver?.name || "—"}</Td>
                  <Td className="w-[200px]">
                    <RouteTrack stages={TRIP_STAGES} currentIdx={getStageIdx(trip)} />
                  </Td>
                  <Td>
                    <Badge color={trip.invoice?.status === 'Paid' ? 'green' : getBadgeColor(trip.status)}>
                      {trip.invoice?.status === 'Paid' ? 'Paid' : trip.status}
                    </Badge>
                  </Td>
                  <Td className="flex gap-2 items-center">
                    {(!trip.legType || trip.legType === "Direct") && (
                      <button 
                        onClick={() => handleCreateOutboundLeg(trip.id)}
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg text-[11.5px] font-bold uppercase tracking-wide transition-colors"
                      >
                        + Add Next Leg
                      </button>
                    )}
                    {trip.legType === "OutboundLeg2" && (
                      <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">From TRP-{1000 + (trip.parentTripId || 0)}</span>
                    )}
                    <Link href={`/trips/${trip.id}/tracking`}>
                      <button className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-3 py-1.5 rounded-lg text-[11.5px] font-bold uppercase tracking-wide transition-colors">
                        <MapPin className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                    <a 
                      href={`/trips/${trip.id}/lr`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-[11.5px] font-bold uppercase tracking-wide transition-colors ml-2"
                    >
                      Print LR
                    </a>
                  </Td>
                </tr>
              ))
            )}
          </ProtoTable>
        </div>
      )}

      {/* Slide-overs */}
      <SlideOver 
        isOpen={isIndentModalOpen} 
        onClose={() => setIsIndentModalOpen(false)} 
        title="Create New Indent"
        subtitle="Log a new customer request"
      >
        <IndentForm onSuccess={() => { setIsIndentModalOpen(false); loadData(); }} />
      </SlideOver>
      
      <SlideOver 
        isOpen={!!assigningIndent} 
        onClose={() => setAssigningIndent(null)} 
        title="Assign Trip"
        subtitle={`Indent #IND-${assigningIndent ? 1000 + assigningIndent.id : ''}`}
      >
        {assigningIndent && (
          <TripAssignmentForm indent={assigningIndent} onSuccess={() => { setAssigningIndent(null); loadData(); }} />
        )}
      </SlideOver>
    </div>
  );
}
