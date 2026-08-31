"use client";

import { useEffect, useState, useRef } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td, Badge } from "@/components/PrototypeUI";
import { Loader2, Camera, CheckCircle, Smartphone, ExternalLink, XCircle, X, Search, Grid, List, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function AdminPODDashboard() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Verify Slide-Over Panel
  const [isVerifyPanelOpen, setIsVerifyPanelOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [tripDocuments, setTripDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Admin Native Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingTrip, setUploadingTrip] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchApi("/Trips");
      // Filter trips that are Assigned, Started, Delivered, or Closed (Waiting for or completed POD review)
      const podTrips = data.filter((t: any) => 
        (t.status === "Assigned" || t.status === "Started" || t.status === "Delivered" || t.status === "Closed")
      );
      setTrips(podTrips);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openVerifyPanel = async (trip: any) => {
    setSelectedTrip(trip);
    setIsVerifyPanelOpen(true);
    setLoadingDocs(true);
    try {
      const data = await fetchApi(`/Documents/trip/${trip.id}`);
      setTripDocuments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleApprove = async (tripId: number) => {
    if (!confirm("Approve this POD? This will close the trip and mark it ready for final billing.")) return;
    try {
      await fetchApi(`/Documents/pod/approve/${tripId}`, { method: "POST" });
      setIsVerifyPanelOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
      alert("Failed to approve POD.");
    }
  };

  const handleAdminUploadClick = (trip: any) => {
    setUploadingTrip(trip);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingTrip) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", "POD");
      formData.append("entityId", uploadingTrip.id.toString());
      formData.append("documentType", "DeliveryReceipt");

      const token = localStorage.getItem('token');
      const uploadRes = await fetch("http://localhost:5063/api/Documents/Upload", {
        method: "POST",
        headers: {
           ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });
      
      if (!uploadRes.ok) throw new Error("Upload failed");
      const uploadData = await uploadRes.json();

      await fetchApi(`/Documents/pod/submit/${uploadingTrip.podMagicLinkToken}`, {
        method: "POST",
        body: JSON.stringify({ fileUrl: uploadData.fileUrl || "/dummy-pod.jpg" })
      });

      alert("POD uploaded successfully!");
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to upload document");
    } finally {
      setIsUploading(false);
      setUploadingTrip(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative h-full flex flex-col">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*,.pdf" 
      />
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end mb-[20px] shrink-0">
        <div>
          <h1 className="font-disp font-bold text-[28px] text-slate-900 tracking-tight leading-tight">POD Management</h1>
          <p className="text-[14px] text-slate-500 mt-1 font-medium">Review and approve Proof of Delivery documents uploaded by drivers.</p>
        </div>
        
        <div className="flex items-center gap-[12px]">
          <div className="relative">
            <Search className="w-[16px] h-[16px] text-slate-400 absolute left-[14px] top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search trips..." 
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
          <ProtoTable headers={["TRIP ID", "CUSTOMER & ROUTE", "DRIVER & VEHICLE", "TRIP STATUS", "POD STATUS", "ACTIONS"]}>
            {loading ? (
              <tr>
                <Td colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-10 h-10 mb-3 animate-spin text-slate-300" />
                    <span className="text-[14px] font-medium">Loading POD Data...</span>
                  </div>
                </Td>
              </tr>
            ) : trips.length === 0 ? (
              <tr>
                <Td colSpan={6} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <Camera className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-[16px] font-bold text-slate-800 mb-1">No Active Trips</h3>
                    <p className="text-[14px] text-slate-500 max-w-sm mx-auto">
                      There are no active trips requiring POD review right now.
                    </p>
                  </div>
                </Td>
              </tr>
            ) : (
              trips.map((trip) => (
                <tr key={trip.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
                  <Td className="font-mono text-[13px] font-semibold text-slate-600">
                    <Link href={`/trips/${trip.id}/lr`} className="hover:text-blue-600 hover:underline">
                      TRP-{trip.id}
                    </Link>
                  </Td>
                  <Td>
                    <div className="font-semibold text-slate-800">{trip.indent?.customer?.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[200px]">
                      {trip.indent?.source} → {trip.indent?.destination}
                    </div>
                  </Td>
                  <Td>
                    <div className="font-semibold text-slate-700">{trip.driver?.name}</div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">{trip.vehicle?.registrationNumber}</div>
                  </Td>
                  <Td>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${trip.status === "Delivered" ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-sky-50 text-sky-700 border border-sky-100'}`}>
                      {trip.status}
                    </span>
                  </Td>
                  <Td>
                    {trip.podReceivedDate ? (
                      <Badge color="green">Verified & Closed</Badge>
                    ) : trip.podUploadedDate ? (
                      <Badge color="orange">Pending Review</Badge>
                    ) : (
                      <Badge color="grey">Awaiting Upload</Badge>
                    )}
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      {!trip.podUploadedDate ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Driver Upload Link:</span>
                          <a 
                            href={`/pod/${trip.podMagicLinkToken}`} 
                            target="_blank"
                            className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1.5 w-max mb-1"
                          >
                            <Smartphone className="w-3.5 h-3.5 text-slate-500" /> Open Mobile View
                          </a>
                          <button 
                            onClick={() => handleAdminUploadClick(trip)}
                            disabled={isUploading && uploadingTrip?.id === trip.id}
                            className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1.5 w-max disabled:opacity-50"
                          >
                            {isUploading && uploadingTrip?.id === trip.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" /> : <Camera className="w-3.5 h-3.5 text-emerald-500" />} 
                            Upload for Driver
                          </button>
                        </div>
                      ) : !trip.podReceivedDate ? (
                        <button 
                          onClick={() => openVerifyPanel(trip)}
                          className="bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-xl text-[12px] font-bold hover:bg-amber-100 transition-colors flex items-center gap-2 relative shadow-sm"
                        >
                          <ImageIcon className="w-4 h-4" /> Review Image
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-sm border border-white" />
                        </button>
                      ) : (
                        <button className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-[12px] font-bold flex items-center gap-1.5 cursor-not-allowed opacity-70">
                          <CheckCircle className="w-4 h-4" /> Billing Ready
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </ProtoTable>
        </div>
      </div>

      {/* OVERLAY FOR SLIDE PANEL */}
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isVerifyPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsVerifyPanelOpen(false)}
      />

      {/* REVIEW POD PANEL */}
      <div 
        className={`fixed top-0 right-0 h-full w-[600px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-200 ${isVerifyPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Camera className="w-5 h-5 text-slate-400" /> Review POD
            </h2>
            <p className="text-[13px] text-slate-500 mt-1 font-medium">TRP-{selectedTrip?.id} • {selectedTrip?.indent?.customer?.name}</p>
          </div>
          <button 
            onClick={() => setIsVerifyPanelOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {loadingDocs ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Loader2 className="w-10 h-10 mb-3 animate-spin text-slate-300" />
              <span className="text-[14px] font-medium">Loading Images...</span>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm flex gap-3 shadow-sm">
                <CheckCircle className="w-5 h-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-bold mb-1">Verify Delivery Signatures</p>
                  <p className="text-amber-700/80 text-[13px]">Please verify the image is clear and contains the required receiving signatures or stamps before approving. Once approved, the trip is closed and ready for billing.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {tripDocuments.length > 0 ? tripDocuments.map((doc: any) => (
                  <div key={doc.id} className="border border-slate-200 rounded-2xl overflow-hidden group bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-slate-100 flex items-center justify-center relative h-[400px]">
                      <img 
                        src={`http://localhost:5063${doc.fileUrl}`} 
                        alt="POD Document" 
                        className="max-h-full max-w-full object-contain"
                      />
                      <a 
                        href={`http://localhost:5063${doc.fileUrl}`} 
                        target="_blank"
                        className="absolute top-4 right-4 bg-white/95 backdrop-blur p-2.5 rounded-xl shadow-sm text-slate-600 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center">
                      <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Uploaded By Driver</div>
                        <div className="text-[14px] font-semibold text-slate-800">{new Date(doc.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                    <XCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">No documents found for this trip.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {tripDocuments.length > 0 && !loadingDocs && (
          <div className="p-6 border-t border-slate-100 bg-white flex gap-3 shrink-0">
            <button 
              onClick={() => setIsVerifyPanelOpen(false)}
              className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button 
              onClick={() => handleApprove(selectedTrip.id)}
              className="flex-[2] bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 flex justify-center items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" /> Verify & Close Trip
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
