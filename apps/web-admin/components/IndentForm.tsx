"use client";

import { useState, useEffect } from "react";
import { createIndent, getCustomers } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function IndentForm({ onSuccess }: { onSuccess: () => void }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    customerId: "",
    source: "",
    destinations: [""],
    material: "",
    weight: "",
    vehicleType: "",
    loadingDate: new Date().toISOString().split('T')[0],
    customerRate: "",
    pricingModel: "CaseToCase",
    warehouseLocation: "",
  });

  useEffect(() => {
    getCustomers().then(setCustomers).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createIndent({
        ...formData,
        customerId: parseInt(formData.customerId),
        weight: parseFloat(formData.weight),
        loadingDate: new Date(formData.loadingDate).toISOString(),
        destination: formData.destinations[0] || "",
        destinationsJson: JSON.stringify(formData.destinations),
        customerRate: formData.customerRate ? parseFloat(formData.customerRate) : null,
        pricingModel: formData.pricingModel
      });
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("Failed to create indent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Customer</label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.customerId}
            onChange={e => setFormData({...formData, customerId: e.target.value})}
            required
          >
            <option value="">Select a customer...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.gstin})</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Source</label>
          <input 
            type="text" 
            required 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.source}
            onChange={e => setFormData({...formData, source: e.target.value})}
            placeholder="e.g. Bangalore"
          />
        </div>

        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium">Destinations</label>
          {formData.destinations.map((dest, index) => (
            <div key={index} className="flex gap-2 mt-2">
              <input 
                type="text" 
                required 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={dest}
                onChange={e => {
                  const newDests = [...formData.destinations];
                  newDests[index] = e.target.value;
                  setFormData({...formData, destinations: newDests});
                }}
                placeholder={`Destination ${index + 1}`}
              />
              {index > 0 && (
                <Button type="button" variant="outline" onClick={() => {
                  const newDests = formData.destinations.filter((_, i) => i !== index);
                  setFormData({...formData, destinations: newDests});
                }}>
                  Remove
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => {
            setFormData({...formData, destinations: [...formData.destinations, ""]});
          }}>
            + Add Another Destination
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Material</label>
          <input 
            type="text" 
            required 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.material}
            onChange={e => setFormData({...formData, material: e.target.value})}
            placeholder="e.g. Cement"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Weight (Tons)</label>
          <input 
            type="number" 
            step="0.01" 
            required 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.weight}
            onChange={e => setFormData({...formData, weight: e.target.value})}
            placeholder="e.g. 20"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Vehicle Type Req.</label>
          <input 
            type="text" 
            required 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.vehicleType}
            onChange={e => setFormData({...formData, vehicleType: e.target.value})}
            placeholder="e.g. 10 Wheeler"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Loading Date</label>
          <input 
            type="date" 
            required 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.loadingDate}
            onChange={e => setFormData({...formData, loadingDate: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Pricing Model</label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.pricingModel}
            onChange={e => setFormData({...formData, pricingModel: e.target.value})}
          >
            <option value="CaseToCase">Case to Case / Spot Rate</option>
            <option value="AnnualContract">Annual Contract</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Customer Rate (₹)</label>
          <input 
            type="number" 
            step="0.01" 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.customerRate}
            onChange={e => setFormData({...formData, customerRate: e.target.value})}
            placeholder="e.g. 15000"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Intermediate Warehouse (Optional)</label>
          <input 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.warehouseLocation}
            onChange={e => setFormData({...formData, warehouseLocation: e.target.value})}
            placeholder="e.g. Bhiwandi Hub"
          />
        </div>
      </div>
      
      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
          {loading ? "Creating..." : "Create Indent"}
        </Button>
      </div>
    </form>
  );
}
