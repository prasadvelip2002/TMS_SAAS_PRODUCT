"use client";

import { useState, useEffect } from "react";
import { Building2, Users, Plus, LayoutDashboard, DollarSign, Activity } from "lucide-react";

export default function SaaSAdminPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Tenant Form State
  const [showModal, setShowModal] = useState(false);
  const [newTenant, setNewTenant] = useState({
    TenantName: "",
    CompanyName: "",
    AdminEmail: "",
    AdminPassword: ""
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const userStr = localStorage.getItem("user");
      const token = userStr ? JSON.parse(userStr).token : "";
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5063/api";
      const res = await fetch(`${apiUrl}/Tenants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTenants(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const userStr = localStorage.getItem("user");
      const token = userStr ? JSON.parse(userStr).token : "";
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5063/api";
      const res = await fetch(`${apiUrl}/Tenants`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(newTenant)
      });
      if (res.ok) {
        setShowModal(false);
        setNewTenant({ TenantName: "", CompanyName: "", AdminEmail: "", AdminPassword: "" });
        fetchTenants();
      } else {
        alert("Failed to create tenant");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Activity className="animate-spin text-blue-600 w-8 h-8" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">SaaS Administration</h1>
          <p className="text-slate-500 mt-1">Manage platform tenants, billing, and global settings.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-5 h-5" />
          Provision New Tenant
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active Tenants</p>
              <h3 className="text-2xl font-bold text-slate-800">{tenants.length}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Monthly Recurring Revenue</p>
              <h3 className="text-2xl font-bold text-slate-800">$12,450 <span className="text-sm text-emerald-500 font-medium">^ 12%</span></h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Platform Users</p>
              <h3 className="text-2xl font-bold text-slate-800">{tenants.reduce((acc, t) => acc + (t.userCount || 0), 0)}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Tenant Directory</h2>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase font-medium text-xs">
              <tr>
                <th className="px-6 py-4">Tenant Name</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4 text-center">Companies</th>
                <th className="px-6 py-4 text-center">Users</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.map((t, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      {t.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                      {t.companyCount || 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                      {t.userCount || 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No tenants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Provision New Tenant</h2>
              <p className="text-sm text-slate-500 mt-1">This will create a new isolated workspace.</p>
            </div>
            <form onSubmit={handleCreateTenant} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tenant Name (e.g. Acme Corp)</label>
                <input required type="text" className="w-full border-slate-200 rounded-xl px-4 py-2.5 focus:ring-blue-600 focus:border-blue-600" value={newTenant.TenantName} onChange={e => setNewTenant({...newTenant, TenantName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Primary Company Name</label>
                <input required type="text" className="w-full border-slate-200 rounded-xl px-4 py-2.5 focus:ring-blue-600 focus:border-blue-600" value={newTenant.CompanyName} onChange={e => setNewTenant({...newTenant, CompanyName: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Admin Email</label>
                  <input required type="email" className="w-full border-slate-200 rounded-xl px-4 py-2.5 focus:ring-blue-600 focus:border-blue-600" value={newTenant.AdminEmail} onChange={e => setNewTenant({...newTenant, AdminEmail: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Admin Password</label>
                  <input required type="text" className="w-full border-slate-200 rounded-xl px-4 py-2.5 focus:ring-blue-600 focus:border-blue-600" value={newTenant.AdminPassword} onChange={e => setNewTenant({...newTenant, AdminPassword: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50">
                  {creating ? "Provisioning..." : "Create Tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
