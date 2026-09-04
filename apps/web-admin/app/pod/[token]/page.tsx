"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { Loader2, Camera, UploadCloud, CheckCircle, AlertTriangle, Truck } from "lucide-react";

export default function DriverPODUpload() {
  const params = useParams();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [trip, setTrip] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadTripDetails();
  }, [token]);

  const loadTripDetails = async () => {
    try {
      const data = await fetchApi(`/Documents/pod/${token}`);
      setTrip(data);
      if (data.isAlreadyUploaded) {
        setSuccess(true);
      }
    } catch (e) {
      setError("This link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      // 1. Upload the physical file
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("entityType", "POD");
      formData.append("entityId", trip.tripId);
      formData.append("documentType", "DeliveryReceipt");

      const uploadRes = await fetch("http://localhost:5063/api/Documents/Upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();

      // 2. Submit the POD record
      await fetchApi(`/Documents/pod/submit/${token}`, {
        method: "POST",
        body: JSON.stringify({ fileUrl: url }),
      });

      setSuccess(true);
    } catch (e) {
      console.error(e);
      alert("Failed to upload the POD. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm text-center max-w-sm w-full">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800 mb-2">Invalid Link</h2>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center max-w-sm w-full transform transition-all scale-100 hover:scale-105 duration-300">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">POD Uploaded!</h1>
          <p className="text-slate-500 mb-6 text-sm">Thank you! Your Proof of Delivery has been sent to Transitflow Logistics successfully.</p>
          <button onClick={() => window.close()} className="text-blue-500 font-semibold text-sm hover:underline">
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-10">
      <div className="bg-[#0F172A] text-white p-6 pt-10 rounded-b-[40px] shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-500/10" />
        <div className="relative z-10">
          <img src="/logo.png" alt="TRANSITFLOW LOGISTICS" className="h-6 mb-4 mix-blend-multiply bg-white/90 px-2 py-0.5 rounded" />
          <h1 className="text-2xl font-black mb-1">Upload POD</h1>
          <p className="text-blue-200 text-sm opacity-80">Proof of Delivery Submission</p>
        </div>
      </div>

      <div className="px-5 max-w-md mx-auto space-y-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Trip Details</div>
              <div className="font-semibold text-slate-800 leading-tight mb-2">
                {trip.source} <span className="text-slate-300 mx-1">→</span> {trip.destination}
              </div>
              <div className="text-sm text-slate-600">Customer: <span className="font-bold">{trip.customer}</span></div>
              <div className="text-sm text-slate-600">Vehicle: <span className="font-bold">{trip.vehicle}</span></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {previewUrl ? (
            <div className="relative">
              <img src={previewUrl} alt="POD Preview" className="w-full h-64 object-cover" />
              <button 
                onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                className="absolute top-3 right-3 bg-white/90 backdrop-blur text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm"
              >
                Retake Photo
              </button>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="h-64 bg-slate-50 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 m-4 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-4">
                <Camera className="w-7 h-7" />
              </div>
              <span className="font-bold text-slate-700 mb-1">Tap to Open Camera</span>
              <span className="text-xs text-slate-500 text-center px-6">Take a clear picture of the signed and stamped Lorry Receipt</span>
            </div>
          )}
          
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          {previewUrl && (
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={handleUpload}
                disabled={uploading}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-[0_4px_14px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</>
                ) : (
                  <><UploadCloud className="w-5 h-5" /> Submit Document</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
