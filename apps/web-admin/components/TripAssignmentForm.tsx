"use client";

import { useState, useEffect } from "react";
import { assignTrip, getVendors, getVehicles, getDrivers } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatTime12H } from "@/lib/utils";

export function TripAssignmentForm({ indent, onSuccess }: { indent: any, onSuccess: () => void }) {
  const [vendors, setVendors] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await assignTrip({
        indentId: indent.id,
        vendorId: parseInt(formData.vendorId),
        vehicleId: parseInt(formData.vehicleId),
        driverId: parseInt(formData.driverId),
        bookingType: formData.bookingType,
        ratePerTon: parseFloat(formData.ratePerTon),
        fixedRate: parseFloat(formData.fixedRate),
        advanceAmount: parseFloat(formData.advanceAmount),
        startingKM: formData.startingKM ? parseFloat(formData.startingKM) : null,
        tripStartDate: new Date(formData.tripStartDate).toISOString(),
      });
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("Failed to assign trip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      
      <div className="bg-slate-50 p-4 rounded-lg border mb-4 text-sm space-y-1">
        <p><strong>Customer:</strong> {indent.customer?.name}</p>
        <p><strong>Route:</strong> {indent.source} to {indent.destination}</p>
        <p><strong>Material:</strong> {indent.material} ({indent.weight} Tons)</p>
        {indent.loadingDate && (
          <p><strong>Pickup Scheduled:</strong> {new Date(indent.loadingDate).toLocaleDateString()} {indent.loadingTime ? `at ${formatTime12H(indent.loadingTime)}` : ''}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Fleet Vendor</label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.vendorId}
            onChange={e => setFormData({...formData, vendorId: e.target.value})}
            required
          >
            <option value="">Select a vendor...</option>
            {vendors.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Vehicle</label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.vehicleId}
            onChange={e => setFormData({...formData, vehicleId: e.target.value})}
            required
          >
            <option value="">Select a vehicle...</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.registrationNumber} ({v.type})</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Driver</label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.driverId}
            onChange={e => setFormData({...formData, driverId: e.target.value})}
            required
          >
            <option value="">Select a driver...</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.phoneNumber})</option>
            ))}
          </select>
        </div>

        <div className="border-t pt-4 mt-4 col-span-2">
          <h3 className="font-semibold mb-3">Operational Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Advance Amount (₹)</label>
              <input 
                type="number" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.advanceAmount}
                onChange={e => setFormData({...formData, advanceAmount: e.target.value})}
                placeholder="e.g. 10000"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Starting KM</label>
              <input 
                type="number" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.startingKM}
                onChange={e => setFormData({...formData, startingKM: e.target.value})}
                placeholder="e.g. 45000"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Trip Start Date</label>
              <input 
                type="date" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.tripStartDate}
                onChange={e => setFormData({...formData, tripStartDate: e.target.value})}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <h3 className="font-semibold mb-3">Freight Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Booking Type</label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.bookingType}
              onChange={e => setFormData({...formData, bookingType: e.target.value})}
              required
            >
              <option value="Fixed">Fixed Rate</option>
              <option value="PerTon">Per Ton Rate</option>
            </select>
          </div>

          {formData.bookingType === "Fixed" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Fixed Rate (₹)</label>
              <input 
                type="number" 
                required 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.fixedRate}
                onChange={e => setFormData({...formData, fixedRate: e.target.value})}
                placeholder="e.g. 50000"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Rate Per Ton (₹)</label>
              <input 
                type="number" 
                required 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.ratePerTon}
                onChange={e => setFormData({...formData, ratePerTon: e.target.value})}
                placeholder="e.g. 1200"
              />
              <p className="text-xs text-muted-foreground mt-1">Total will be: ₹{(parseFloat(formData.ratePerTon || "0") * indent.weight).toFixed(2)}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
          {loading ? "Assigning..." : "Confirm & Assign Trip"}
        </Button>
      </div>
    </form>
  );
}
