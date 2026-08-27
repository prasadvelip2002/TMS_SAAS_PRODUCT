"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { Building2, MapPin, Users, CreditCard, Activity, Upload, Save, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  
  const [company, setCompany] = useState({
    name: "",
    gstin: "",
    address: "",
  });
  
  const [subscription, setSubscription] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchCompany();
    fetchSubscription();
  }, []);

  const fetchCompany = async () => {
    try {
      const data = await fetchApi("/Companies/current");
      if (data) {
        setCompany({
          name: data.name || "",
          gstin: data.gstin || "",
          address: data.address || "",
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSubscription = async () => {
    try {
      const data = await fetchApi("/Subscriptions/current");
      if (data) {
        setSubscription(data);
      }
    } catch (e: any) {
      if (!e.message?.includes("404")) {
        console.error("Failed to fetch subscription:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi("/Companies/current", {
        method: "PUT",
        body: JSON.stringify(company),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Failed to save company settings.");
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Settings</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Manage your company profile, branches, billing, and team members.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 overflow-hidden">
        <div className="flex border-b border-slate-200/80 bg-slate-50/50">
          <button 
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-4 text-sm font-medium transition-colors border-b-[3px] ${activeTab === "profile" ? "border-blue-600 text-blue-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"}`}
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4.5 h-4.5" />
              Company Profile
            </div>
          </button>
          <button 
            onClick={() => setActiveTab("branches")}
            className={`px-6 py-4 text-sm font-medium transition-colors border-b-[3px] ${activeTab === "branches" ? "border-blue-600 text-blue-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"}`}
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4.5 h-4.5" />
              Branches & Cost Centers
            </div>
          </button>
          <button 
            onClick={() => setActiveTab("team")}
            className={`px-6 py-4 text-sm font-medium transition-colors border-b-[3px] ${activeTab === "team" ? "border-blue-600 text-blue-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"}`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4.5 h-4.5" />
              Team Management
            </div>
          </button>
          <button 
            onClick={() => setActiveTab("billing")}
            className={`px-6 py-4 text-sm font-medium transition-colors border-b-[3px] ${activeTab === "billing" ? "border-blue-600 text-blue-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"}`}
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-4.5 h-4.5" />
              Subscription & Billing
            </div>
          </button>
        </div>

        <div className="p-8">
          {activeTab === "profile" && (
            <div className="max-w-2xl">
              <h2 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">Company Information</h2>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition-colors cursor-pointer">
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Logo</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">Upload Company Logo</h3>
                    <p className="text-sm font-medium text-slate-500 mt-0.5">Square image, recommended 512x512px. Max 2MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Company/Tenant Name</label>
                    <input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" value={company.name} onChange={e => setCompany({...company, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">GSTIN</label>
                    <input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" value={company.gstin} onChange={e => setCompany({...company, gstin: e.target.value})} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Registered Address</label>
                    <textarea rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" value={company.address} onChange={e => setCompany({...company, address: e.target.value})} />
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center gap-2">
                    <Save className="w-5 h-5" />
                    Save Changes
                  </button>
                  {saved && <span className="text-emerald-600 flex items-center gap-1.5 font-medium text-sm"><CheckCircle2 className="w-4.5 h-4.5" /> Saved successfully</span>}
                </div>
              </form>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="max-w-3xl">
              <h2 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">Current Plan Details</h2>
              
              {loading ? (
                <div className="flex justify-center p-8"><Activity className="animate-spin text-blue-600" /></div>
              ) : subscription ? (
                <div className="bg-gradient-to-br from-[#0F172A] to-blue-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-blue-900/10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                  
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold tracking-wider text-white mb-4 uppercase">
                        {subscription.subscriptionStatus === "Trialing" ? "14-Day Free Trial" : "Active Subscription"}
                      </div>
                      <h3 className="text-3xl font-black tracking-tight">{subscription.plan?.name || "Free Trial"} Plan</h3>
                      <p className="text-slate-300 font-medium mt-2">Your subscription is active until {new Date(subscription.endDate).toLocaleDateString()}.</p>
                    </div>
                    <div className="text-right">
                      <div className="text-5xl font-black">${subscription.plan?.price || 0}<span className="text-lg text-slate-400 font-medium">/mo</span></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 mt-10 relative z-10 border-t border-white/10 pt-8">
                    <div>
                      <div className="text-slate-400 font-medium text-sm mb-1 uppercase tracking-wider">Max Users</div>
                      <div className="text-2xl font-bold">{subscription.plan?.maxUsers || 5} <span className="text-sm font-medium text-slate-400 ml-1">Included</span></div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-medium text-sm mb-1 uppercase tracking-wider">Monthly Trips</div>
                      <div className="text-2xl font-bold">{subscription.plan?.maxTripsPerMonth || 100} <span className="text-sm font-medium text-slate-400 ml-1">Included</span></div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-medium text-sm mb-1 uppercase tracking-wider">Branches</div>
                      <div className="text-2xl font-bold">{subscription.plan?.maxBranches || 1} <span className="text-sm font-medium text-slate-400 ml-1">Included</span></div>
                    </div>
                  </div>

                  <div className="mt-8 relative z-10">
                    <button className="bg-white text-blue-900 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg">
                      Upgrade Plan
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 text-amber-800 p-6 rounded-2xl border border-amber-200">
                  <h3 className="font-bold text-lg mb-2">No Active Subscription</h3>
                  <p className="font-medium">Your tenant does not have an active subscription or free trial assigned. Please contact the Platform Admin.</p>
                </div>
              )}
            </div>
          )}

          {(activeTab === "branches" || activeTab === "team") && (
            <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-white shadow-sm text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Activity className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Coming Soon</h3>
              <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto">This section is currently under development in the SaaS Readiness rollout.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
