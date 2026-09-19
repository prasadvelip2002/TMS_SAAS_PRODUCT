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
  const [dispatchNotice, setDispatchNotice] = useState<{ driverName: string, phone: string, shareUrl?: string } | null>(null);
  
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

      const waInfo = res?.whatsAppNotification;
      const driverPhone = selectedDriver?.phone || selectedDriver?.phoneNumber || "";

      // Backend dispatches the WhatsApp notification directly to the driver's number in background

      setDispatchNotice({
        driverName: selectedDriver?.name || "Driver",
        phone: driverPhone,
        shareUrl: waInfo?.shareUrl
      });

      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Failed to assign trip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      
      {dispatchNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-emerald-950 text-sm">Trip Assigned & WhatsApp Dispatched!</p>
            <p className="mt-1 text-emerald-800">
              Trip details were sent directly to <strong>{dispatchNotice.driverName}</strong> (+{dispatchNotice.phone}).
            </p>
            {dispatchNotice.shareUrl && (
              <a
                href={dispatchNotice.shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-white border border-emerald-300 px-3 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open WhatsApp Chat Directly</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Indent Summary Box */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-1">
        <p><strong>Customer:</strong> {indent.customer?.name || "Customer"}</p>
        <p><strong>Route:</strong> {indent.source} → {indent.destination}</p>
        <p><strong>Cargo:</strong> {indent.material} ({indent.weight} Tons)</p>
        {indent.loadingDate && (
          <p><strong>Pickup Schedule:</strong> {new Date(indent.loadingDate).toLocaleDateString()} {indent.loadingTime ? `@ ${formatTime12H(indent.loadingTime)}` : ''}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
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
        <div className="col-span-2 space-y-2">
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
        <div className="border-t border-slate-200 pt-4 mt-2 col-span-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Operational & Advance Details</h3>
          <div className="grid grid-cols-3 gap-3">
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
        <div className="border-t border-slate-200 pt-3 col-span-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Commercials</h3>
          <div className="grid grid-cols-2 gap-4">
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
