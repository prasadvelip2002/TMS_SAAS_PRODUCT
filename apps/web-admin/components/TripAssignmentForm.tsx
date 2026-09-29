"use client";

import { useState, useEffect } from "react";
import { assignTrip, getVendors, getVehicles, getDrivers } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatTime12H } from "@/lib/utils";
import { MessageSquare, CheckCircle2, Send, ExternalLink, ShieldCheck, AlertCircle } from "lucide-react";

export function TripAssignmentForm({ indent, onSuccess }: { indent: any, onSuccess: () => void }) {
  const [vendors, setVendors] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoSendWhatsApp, setAutoSendWhatsApp] = useState(true);
  const [assignedTripSuccess, setAssignedTripSuccess] = useState<{
    tripId: number;
    driverName: string;
    driverPhone: string;
    vehicleNumber: string;
    trackingUrl: string;
    shareUrl?: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQr, setShowQr] = useState(false);
  
  const [formData, setFormData] = useState({
    vendorId: "",
    vehicleId: "",
    driverId: "",
    bookingType: "Fixed",
    ratePerTon: "0",
    fixedRate: "0",
    advanceAmount: "0",
    startingKM: "",
    tripStartDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    getVendors().then(setVendors).catch(console.error);
    getVehicles().then(setVehicles).catch(console.error);
    getDrivers().then(setDrivers).catch(console.error);
  }, []);

  const selectedDriver = drivers.find(d => d.id.toString() === formData.driverId);
  const selectedVehicle = vehicles.find(v => v.id.toString() === formData.vehicleId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res: any = await assignTrip({
        indentId: indent.id,
        vendorId: formData.vendorId ? parseInt(formData.vendorId) : null,
        vehicleId: parseInt(formData.vehicleId),
        driverId: parseInt(formData.driverId),
        bookingType: formData.bookingType,
        ratePerTon: parseFloat(formData.ratePerTon || "0"),
        fixedRate: parseFloat(formData.fixedRate || "0"),
        advanceAmount: parseFloat(formData.advanceAmount || "0"),
        startingKM: formData.startingKM ? parseFloat(formData.startingKM) : null,
        tripStartDate: new Date(formData.tripStartDate).toISOString(),
      });

      const assignedTripId = res?.id || res?.tripId || res?.trip?.id || indent?.id;
      const waInfo = res?.whatsAppNotification;
      const driverPhone = selectedDriver?.phone || selectedDriver?.phoneNumber || "";
      const trackingUrl = typeof window !== "undefined" 
        ? `${window.location.origin}/driver/trip/${assignedTripId}` 
        : `/driver/trip/${assignedTripId}`;

      setAssignedTripSuccess({
        tripId: assignedTripId,
        driverName: selectedDriver?.name || "Driver",
        driverPhone: driverPhone,
        vehicleNumber: selectedVehicle?.vehicleNumber || selectedVehicle?.registrationNumber || "Vehicle",
        trackingUrl: trackingUrl,
        shareUrl: waInfo?.shareUrl
      });
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Failed to assign trip");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!assignedTripSuccess?.trackingUrl) return;
    navigator.clipboard.writeText(assignedTripSuccess.trackingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (assignedTripSuccess) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(assignedTripSuccess.trackingUrl)}`;

    return (
      <div className="space-y-4 py-2 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-5 rounded-2xl space-y-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-emerald-950">Trip #{assignedTripSuccess.tripId} Successfully Assigned!</h3>
              <p className="text-xs text-emerald-800">
                Vehicle: <strong>{assignedTripSuccess.vehicleNumber}</strong> • Driver: <strong>{assignedTripSuccess.driverName}</strong> (+91 {assignedTripSuccess.driverPhone})
              </p>
            </div>
          </div>

          <div className="bg-white/90 border border-emerald-200 p-3 rounded-xl text-xs space-y-2">
            <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
              Driver Smartphone GPS Activation Link:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={assignedTripSuccess.trackingUrl}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-mono text-[11px] text-slate-800 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shrink-0"
              >
                {copiedLink ? "Copied!" : "Copy Link"}
              </button>
            </div>
            <p className="text-[11px] text-emerald-800">
              👉 When the driver taps this link on their mobile and taps <strong>START TRIP</strong>, their GPS location immediately streams to your Admin Live Map.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <a
              href={assignedTripSuccess.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Driver Phone Console</span>
            </a>

            {assignedTripSuccess.driverPhone && (
              <a
                href={assignedTripSuccess.shareUrl || `https://wa.me/${assignedTripSuccess.driverPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`🚛 *TransitFlow · Trip Assignment*\n\nHello *${assignedTripSuccess.driverName}*,\nTrip #${assignedTripSuccess.tripId} has been assigned to you (${assignedTripSuccess.vehicleNumber}).\n\n📍 Tap this link to turn ON your GPS and start the trip:\n👉 ${assignedTripSuccess.trackingUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow transition"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>Open WhatsApp Chat Directly</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => setShowQr(!showQr)}
              className="py-2 px-3 bg-white border border-emerald-300 text-emerald-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition"
            >
              <span>{showQr ? "Hide QR Code" : "📲 Show Phone Scan QR Code"}</span>
            </button>

            <a
              href="/map"
              className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition text-center"
            >
              <span>🗺️ Go to Live Fleet Map</span>
            </a>
          </div>

          {/* Collapsible QR Code for Mobile Scanning during Live Demo */}
          {showQr && (
            <div className="p-4 bg-white rounded-xl border border-emerald-200 text-center space-y-2 animate-in fade-in">
              <p className="text-xs font-bold text-slate-800">Scan with Driver's Mobile Camera:</p>
              <img
                src={qrUrl}
                alt="Driver Tracking QR Code"
                className="w-36 h-36 mx-auto rounded-lg border border-slate-200 shadow-sm"
              />
              <p className="text-[10px] text-slate-500">Scan to open the GPS telemetry broadcast instantly on any mobile phone.</p>
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="button"
            onClick={onSuccess}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-2 rounded-xl text-xs"
          >
            Done & Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">

      {/* Indent Summary Box */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-1">
        <p><strong>Customer:</strong> {indent.customer?.name || "Customer"}</p>
        <p><strong>Route:</strong> {indent.source} → {indent.destination}</p>
        <p><strong>Cargo:</strong> {indent.material} ({indent.weight} Tons)</p>
        {indent.loadingDate && (
          <p><strong>Pickup Schedule:</strong> {new Date(indent.loadingDate).toLocaleDateString()} {indent.loadingTime ? `@ ${formatTime12H(indent.loadingTime)}` : ''}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Vendor */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Fleet Vendor</label>
          <select 
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.vendorId}
            onChange={e => setFormData({...formData, vendorId: e.target.value})}
          >
            <option value="">No Vendor (Own Fleet)</option>
            {vendors.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>

        {/* Vehicle */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Vehicle</label>
          <select 
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.vehicleId}
            onChange={e => setFormData({...formData, vehicleId: e.target.value})}
            required
          >
            <option value="">Select a vehicle...</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.vehicleNumber || v.registrationNumber} ({v.type || "Truck"})</option>
            ))}
          </select>
        </div>

        {/* Driver Selection & Live WhatsApp Card */}
        <div className="col-span-1 sm:col-span-2 space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span>Assign Driver</span>
            {selectedDriver?.phone && (
              <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px] normal-case">
                <MessageSquare className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                WhatsApp: +91 {selectedDriver.phone}
              </span>
            )}
          </label>
          <select 
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={formData.driverId}
            onChange={e => setFormData({...formData, driverId: e.target.value})}
            required
          >
            <option value="">Select a driver...</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} {d.phone ? `(+91 ${d.phone})` : "(No Phone)"}
              </option>
            ))}
          </select>

          {/* Selected Driver WhatsApp Direct Notification Status Banner */}
          {formData.driverId && selectedDriver && (
            <div className={`mt-2 p-3.5 rounded-xl border transition-all ${
              selectedDriver.phone 
                ? "bg-emerald-50/80 border-emerald-200 text-emerald-900" 
                : "bg-amber-50 border-amber-200 text-amber-900"
            }`}>
              {selectedDriver.phone ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="font-bold text-xs text-emerald-950">
                        Direct WhatsApp Dispatch to Driver: +91 {selectedDriver.phone}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-800 px-2 py-0.5 rounded-full">
                      Automated
                    </span>
                  </div>

                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Upon clicking <strong>Confirm & Assign Trip</strong>, a WhatsApp trip assignment notification with the route (<strong>{indent.source} → {indent.destination}</strong>), vehicle, and advance will go directly to <strong>{selectedDriver.name}</strong>.
                  </p>

                  <label className="flex items-center gap-2 pt-1 text-xs font-semibold text-emerald-900 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={autoSendWhatsApp} 
                      onChange={e => setAutoSendWhatsApp(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-emerald-300"
                    />
                    <span>Open chat & confirm WhatsApp dispatch on assignment</span>
                  </label>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-950">No Phone Number on File</p>
                    <p className="text-amber-800 mt-0.5">
                      Driver <strong>{selectedDriver.name}</strong> doesn't have a phone number. Add their phone number in the Drivers menu to enable automatic WhatsApp notifications.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Operational Details */}
        <div className="border-t border-slate-200 pt-4 mt-2 col-span-1 sm:col-span-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Operational & Advance Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Advance Amount (₹)</label>
              <input 
                type="number" 
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"
                value={formData.advanceAmount}
                onChange={e => setFormData({...formData, advanceAmount: e.target.value})}
                placeholder="e.g. 10000"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Starting KM</label>
              <input 
                type="number" 
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"
                value={formData.startingKM}
                onChange={e => setFormData({...formData, startingKM: e.target.value})}
                placeholder="e.g. 45000"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Trip Start Date</label>
              <input 
                type="date" 
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
                value={formData.tripStartDate}
                onChange={e => setFormData({...formData, tripStartDate: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Commercials */}
        <div className="border-t border-slate-200 pt-3 col-span-1 sm:col-span-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Commercials</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Booking Type</label>
              <select 
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                value={formData.bookingType}
                onChange={e => setFormData({...formData, bookingType: e.target.value})}
              >
                <option value="Fixed">Fixed Rate</option>
                <option value="PerTon">Per Ton Rate</option>
              </select>
            </div>

            <div className="space-y-1.5">
              {formData.bookingType === "Fixed" ? (
                <>
                  <label className="text-xs font-medium text-slate-600">Fixed Rate (₹)</label>
                  <input 
                    type="number" 
                    required 
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"
                    value={formData.fixedRate}
                    onChange={e => setFormData({...formData, fixedRate: e.target.value})}
                    placeholder="e.g. 25000"
                  />
                </>
              ) : (
                <>
                  <label className="text-xs font-medium text-slate-600">Rate Per Ton (₹)</label>
                  <input 
                    type="number" 
                    required 
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"
                    value={formData.ratePerTon}
                    onChange={e => setFormData({...formData, ratePerTon: e.target.value})}
                    placeholder="e.g. 1200"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Total: ₹{(parseFloat(formData.ratePerTon || "0") * indent.weight).toFixed(2)}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Submit Button */}
      <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Driver is notified instantly on WhatsApp</span>
        </div>
        <Button 
          type="submit" 
          disabled={loading} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all"
        >
          <Send className="w-4 h-4" />
          <span>{loading ? "Assigning & Dispatching WhatsApp..." : "Confirm & Assign Trip"}</span>
        </Button>
      </div>
    </form>
  );
}
