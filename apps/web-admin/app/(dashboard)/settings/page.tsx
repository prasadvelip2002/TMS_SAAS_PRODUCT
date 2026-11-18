"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { 
  Building2, 
  MapPin, 
  Users, 
  CreditCard, 
  Activity, 
  Upload, 
  Save, 
  CheckCircle2, 
  Plus, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  Crown, 
  Truck, 
  Phone, 
  FileText, 
  X, 
  UserPlus,
  Loader2
} from "lucide-react";

interface BranchItem {
  id: number;
  name: string;
  code?: string;
  location?: string;
  address?: string;
  phone?: string;
  gstNumber?: string;
  isHeadOffice: boolean;
  status?: string;
  activeTripsCount: number;
  teamMembersCount: number;
}

interface TeamUserItem {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  branchId?: number;
  branchName?: string;
  createdAt: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  
  // Company Profile State
  const [company, setCompany] = useState({
    name: "",
    gstin: "",
    address: "",
  });
  const [saved, setSaved] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  // Branches State
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);
  const [branchForm, setBranchForm] = useState({
    name: "",
    code: "",
    location: "",
    address: "",
    phone: "",
    gstNumber: "",
    isHeadOffice: false
  });
  const [branchSaving, setBranchSaving] = useState(false);

  // Team Management State
  const [teamUsers, setTeamUsers] = useState<TeamUserItem[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TeamUserItem | null>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "Branch Supervisor",
    branchId: 0
  });
  const [userSaving, setUserSaving] = useState(false);

  // Current user state for branch isolation
  const [currentUser, setCurrentUser] = useState<any>(null);
  const isBranchManager = currentUser?.role === "Branch Manager" || currentUser?.role === "Branch Supervisor";

  useEffect(() => {
    let role = "Tenant Admin";
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setCurrentUser(u);
        role = u.role || "Tenant Admin";
        if (u.role === "Branch Manager" || u.role === "Branch Supervisor") {
          setActiveTab("team");
        }
      } catch (e) {}
    }

    fetchCompany();

    // Only Tenant Admin and Platform Admin manage billing and subscriptions
    if (role === "Tenant Admin" || role === "Platform Admin") {
      fetchSubscription();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "branches") {
      fetchBranches();
    } else if (activeTab === "team") {
      fetchUsers();
      fetchBranches();
    }
  }, [activeTab]);

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
      // Non-critical if user lacks company view permissions
    }
  };

  const fetchSubscription = async () => {
    try {
      const data = await fetchApi("/Subscriptions/current");
      if (data) {
        setSubscription(data);
      }
    } catch (e: any) {
      // Subscriptions are strictly for global tenant admins
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    setBranchesLoading(true);
    try {
      const data = await fetchApi("/Branches");
      if (Array.isArray(data)) {
        setBranches(data);
      }
    } catch (e) {
      console.error("Failed to fetch branches:", e);
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchUsers = async () => {
    setTeamLoading(true);
    try {
      const data = await fetchApi("/Users");
      if (Array.isArray(data)) {
        setTeamUsers(data);
      }
    } catch (e) {
      console.error("Failed to fetch users:", e);
    } finally {
      setTeamLoading(false);
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
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

  // Branch CRUD Handlers
  const handleOpenAddBranch = () => {
    setEditingBranch(null);
    setBranchForm({
      name: "",
      code: "",
      location: "",
      address: "",
      phone: "",
      gstNumber: "",
      isHeadOffice: branches.length === 0
    });
    setIsBranchModalOpen(true);
  };

  const handleOpenEditBranch = (b: BranchItem) => {
    setEditingBranch(b);
    setBranchForm({
      name: b.name,
      code: b.code || "",
      location: b.location || "",
      address: b.address || "",
      phone: b.phone || "",
      gstNumber: b.gstNumber || "",
      isHeadOffice: b.isHeadOffice
    });
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.name.trim()) {
      alert("Please enter a Branch Name.");
      return;
    }

    setBranchSaving(true);
    try {
      if (editingBranch) {
        await fetchApi(`/Branches/${editingBranch.id}`, {
          method: "PUT",
          body: JSON.stringify(branchForm)
        });
      } else {
        await fetchApi("/Branches", {
          method: "POST",
          body: JSON.stringify(branchForm)
        });
      }
      setIsBranchModalOpen(false);
      fetchBranches();
    } catch (e: any) {
      alert(`Error saving branch: ${e?.message || e}`);
    } finally {
      setBranchSaving(false);
    }
  };

  const handleDeleteBranch = async (id: number) => {
    if (!confirm("Are you sure you want to remove this branch?")) return;
    try {
      await fetchApi(`/Branches/${id}`, { method: "DELETE" });
      fetchBranches();
    } catch (e: any) {
      alert(`Failed to delete branch: ${e?.message || e}`);
    }
  };

  // User CRUD Handlers
  const handleOpenAddUser = () => {
    setEditingUser(null);
    const defaultBranchId = isBranchManager ? (currentUser?.branchId || 0) : (branches.length > 0 ? branches[0].id : 0);
    const defaultRole = isBranchManager ? "Logistics Executive" : "Branch Manager";
    setUserForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: defaultRole,
      branchId: defaultBranchId
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: TeamUserItem) => {
    setEditingUser(u);
    setUserForm({
      name: u.name,
      email: u.email,
      phone: u.phone || "",
      password: "",
      role: u.role,
      branchId: u.branchId || 0
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.email.trim()) {
      alert("Name and Email are required.");
      return;
    }
    if (!editingUser && !userForm.password.trim()) {
      alert("Please provide a password for this user.");
      return;
    }

    setUserSaving(true);
    try {
      if (editingUser) {
        await fetchApi(`/Users/${editingUser.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: userForm.name,
            phone: userForm.phone,
            role: userForm.role,
            branchId: userForm.branchId > 0 ? userForm.branchId : null,
            password: userForm.password ? userForm.password : undefined
          })
        });
      } else {
        await fetchApi("/Users", {
          method: "POST",
          body: JSON.stringify({
            name: userForm.name,
            email: userForm.email,
            phone: userForm.phone,
            password: userForm.password,
            role: userForm.role,
            branchId: userForm.branchId > 0 ? userForm.branchId : null
          })
        });
      }
      setIsUserModalOpen(false);
      fetchUsers();
    } catch (e: any) {
      alert(`Error saving user: ${e?.message || e}`);
    } finally {
      setUserSaving(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;
    try {
      await fetchApi(`/Users/${id}`, { method: "DELETE" });
      fetchUsers();
    } catch (e: any) {
      alert(`Failed to remove team member: ${e?.message || e}`);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isBranchManager ? `Branch Hub Team (${currentUser?.branchName || 'My Branch'})` : "Organization Settings"}
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          {isBranchManager 
            ? "Manage and assign Logistics Executives and Finance Executives for your branch operations."
            : "Manage your company profile, multi-branch network, role-based access, and subscriptions."}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200/80 bg-slate-50/50 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {!isBranchManager && (
            <button 
              onClick={() => setActiveTab("profile")}
              className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors border-b-[3px] shrink-0 ${activeTab === "profile" ? "border-blue-600 text-blue-700 bg-white font-bold" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"}`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                Company Profile
              </div>
            </button>
          )}
          {!isBranchManager && (
            <button 
              onClick={() => setActiveTab("branches")}
              className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors border-b-[3px] shrink-0 ${activeTab === "branches" ? "border-blue-600 text-blue-700 bg-white font-bold" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"}`}
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                Branches & Cost Centers ({branches.length})
              </div>
            </button>
          )}
          <button 
            onClick={() => setActiveTab("team")}
            className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors border-b-[3px] shrink-0 ${activeTab === "team" ? "border-blue-600 text-blue-700 bg-white font-bold" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"}`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              {isBranchManager ? `Branch Team Members (${teamUsers.length})` : `Team & Role Access (${teamUsers.length})`}
            </div>
          </button>
          {!isBranchManager && (
            <button 
              onClick={() => setActiveTab("billing")}
              className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors border-b-[3px] shrink-0 ${activeTab === "billing" ? "border-blue-600 text-blue-700 bg-white font-bold" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"}`}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                Subscription & Billing
              </div>
            </button>
          )}
        </div>

        <div className="p-4 sm:p-8">
          {/* TAB 1: COMPANY PROFILE */}
          {activeTab === "profile" && (
            <div className="max-w-2xl">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4 sm:mb-6 tracking-tight">Company Information</h2>
              <form onSubmit={handleSaveCompany} className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition-colors cursor-pointer shrink-0">
                    <Upload className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Logo</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 text-sm sm:text-base">Company Brand Logo</h3>
                    <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">Used across official PDF LR copies, Invoices, and Quotations.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] sm:text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Company / Entity Name</label>
                    <input type="text" className="w-full border border-slate-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" value={company.name} onChange={e => setCompany({...company, name: e.target.value})} />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] sm:text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Head Office GSTIN</label>
                    <input type="text" className="w-full border border-slate-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" value={company.gstin} onChange={e => setCompany({...company, gstin: e.target.value})} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] sm:text-[11.5px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Registered Corporate Address</label>
                    <textarea rows={3} className="w-full border border-slate-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-[14px] bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" value={company.address} onChange={e => setCompany({...company, address: e.target.value})} />
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

          {/* TAB 2: MULTI-BRANCH NETWORK */}
          {activeTab === "branches" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" /> Multi-Branch Hubs & Cost Centers
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Configure your physical depots, loading hubs, and regional offices across India.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddBranch}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add Branch Hub
                </button>
              </div>

              {/* Metrics Pill */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Branches</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">{branches.length}</span>
                </div>
                <div className="bg-blue-50/60 border border-blue-200/60 rounded-2xl p-4">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">Head Office Hub</span>
                  <span className="text-base font-bold text-blue-900 mt-1 block truncate">
                    {branches.find(b => b.isHeadOffice)?.name || "Not designated"}
                  </span>
                </div>
                <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl p-4">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Active Dispatches Across Hubs</span>
                  <span className="text-2xl font-black text-emerald-800 mt-1 block">
                    {branches.reduce((acc, b) => acc + (b.activeTripsCount || 0), 0)}
                  </span>
                </div>
              </div>

              {/* Branches Grid */}
              {branchesLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="text-xs font-medium">Loading branch network...</span>
                </div>
              ) : branches.length === 0 ? (
                <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-300">
                  <MapPin className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-800">No Branches Configured</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Click "Add Branch Hub" above to set up your primary and regional operating hubs.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {branches.map((b) => (
                    <div 
                      key={b.id} 
                      className={`rounded-2xl border p-5 transition-all bg-white relative flex flex-col justify-between ${
                        b.isHeadOffice ? "border-blue-400 shadow-md ring-1 ring-blue-500/20" : "border-slate-200 hover:border-slate-300 shadow-sm"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-slate-900 text-base">{b.name}</h3>
                              {b.code && (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                  {b.code}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 font-medium block mt-0.5">
                              {b.location || "Location not set"}
                            </span>
                          </div>

                          {b.isHeadOffice ? (
                            <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold flex items-center gap-1 shrink-0">
                              <Crown className="w-3 h-3 text-amber-500 fill-current" /> Head Office
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold shrink-0">
                              Branch Hub
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/80 rounded-xl p-3 mb-4">
                          {b.address && (
                            <div className="flex items-start gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{b.address}</span>
                            </div>
                          )}
                          {b.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{b.phone}</span>
                            </div>
                          )}
                          {b.gstNumber && (
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>GSTIN: <strong className="font-mono text-slate-800">{b.gstNumber}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3 text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-blue-500" /> {b.activeTripsCount} Trips
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" /> {b.teamMembersCount} Staff
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditBranch(b)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                            title="Edit Branch"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {!b.isHeadOffice && (
                            <button
                              onClick={() => handleDeleteBranch(b.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete Branch"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TEAM & ROLE-BASED ACCESS (RBAC) */}
          {activeTab === "team" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" /> Team Members & Branch Assignment (RBAC)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Assign users to specific branches to restrict trip visibility, or grant Super-Admin multi-branch access.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddUser}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 shrink-0"
                >
                  <UserPlus className="w-4 h-4" /> Add Team Member
                </button>
              </div>

              {/* Team Table */}
              {teamLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="text-xs font-medium">Loading team members...</span>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500">
                      <tr>
                        <th className="py-3 px-4">Member Name</th>
                        <th className="py-3 px-4">Role Access</th>
                        <th className="py-3 px-4">Assigned Branch Hub</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {teamUsers.map((u) => {
                        const isGlobalAdmin = u.role === "Tenant Admin" || u.role === "Admin" || u.role === "Director/Operations Head";
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-blue-900 text-white font-black text-xs flex items-center justify-center">
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span className="block font-bold text-slate-900">{u.name}</span>
                                  <span className="text-[11px] text-slate-400 font-normal">{u.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-block ${
                                isGlobalAdmin 
                                  ? "bg-purple-50 text-purple-700 border-purple-200" 
                                  : u.role === "Operations Manager"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : u.role === "Finance"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
                                isGlobalAdmin 
                                  ? "bg-slate-100 text-slate-700 border border-slate-200"
                                  : "bg-blue-50 text-blue-800 border border-blue-200"
                              }`}>
                                <MapPin className="w-3 h-3 text-blue-500" />
                                {isGlobalAdmin ? "All Branches (Consolidated)" : u.branchName || "Unassigned"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                              {u.phone || "—"}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditUser(u)}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                                  title="Edit User"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                {u.role !== "Tenant Admin" && (
                                  <button
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SUBSCRIPTION & BILLING */}
          {activeTab === "billing" && (
            <div className="max-w-3xl">
              <h2 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">Current Plan Details</h2>
              
              {loading ? (
                <div className="flex justify-center p-8"><Activity className="animate-spin text-blue-600" /></div>
              ) : subscription ? (
                <div className="bg-gradient-to-br from-[#0F172A] to-blue-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-blue-900/10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 relative z-10">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold tracking-wider text-white mb-3 sm:mb-4 uppercase">
                        {subscription.subscriptionStatus === "Trialing" ? "14-Day Free Trial" : "Active Subscription"}
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black tracking-tight">{subscription.plan?.name || "Free Trial"} Plan</h3>
                      <p className="text-slate-300 font-medium text-xs sm:text-sm mt-1 sm:mt-2">Your subscription is active until {new Date(subscription.endDate).toLocaleDateString()}.</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-3xl sm:text-5xl font-black">${subscription.plan?.price || 0}<span className="text-base sm:text-lg text-slate-400 font-medium">/mo</span></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-10 relative z-10 border-t border-white/10 pt-6 sm:pt-8">
                    <div>
                      <div className="text-slate-400 font-medium text-xs sm:text-sm mb-1 uppercase tracking-wider">Max Users</div>
                      <div className="text-xl sm:text-2xl font-bold">{subscription.plan?.maxUsers || 5} <span className="text-xs sm:text-sm font-medium text-slate-400 ml-1">Included</span></div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-medium text-xs sm:text-sm mb-1 uppercase tracking-wider">Monthly Trips</div>
                      <div className="text-xl sm:text-2xl font-bold">{subscription.plan?.maxTripsPerMonth || 100} <span className="text-xs sm:text-sm font-medium text-slate-400 ml-1">Included</span></div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-medium text-xs sm:text-sm mb-1 uppercase tracking-wider">Branches</div>
                      <div className="text-xl sm:text-2xl font-bold">{subscription.plan?.maxBranches || 10} <span className="text-xs sm:text-sm font-medium text-slate-400 ml-1">Included</span></div>
                    </div>
                  </div>

                  <div className="mt-6 sm:mt-8 relative z-10">
                    <button className="w-full sm:w-auto bg-white text-blue-900 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg text-sm">
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
        </div>
      </div>

      {/* MODAL: ADD / EDIT BRANCH */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingBranch ? "Edit Branch Hub" : "Add New Branch Hub"}
                </h3>
              </div>
              <button 
                onClick={() => setIsBranchModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bangalore Hub"
                    value={branchForm.name}
                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BLR"
                    value={branchForm.code}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium uppercase focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  City / State Region
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore, Karnataka"
                  value={branchForm.location}
                  onChange={(e) => setBranchForm({ ...branchForm, location: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Hub Physical Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Street / Industrial Area address"
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Hub Phone / Contact
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    State GSTIN
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 29AAAAA0000A1Z5"
                    value={branchForm.gstNumber}
                    onChange={(e) => setBranchForm({ ...branchForm, gstNumber: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium uppercase focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isHeadOfficeCheck"
                  checked={branchForm.isHeadOffice}
                  onChange={(e) => setBranchForm({ ...branchForm, isHeadOffice: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isHeadOfficeCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Designate this branch as the organization's Head Office
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={branchSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {branchSaving ? "Saving..." : editingBranch ? "Update Branch" : "Create Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT TEAM USER */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingUser ? "Edit Team Member" : "Add Team Member"}
                </h3>
              </div>
              <button 
                onClick={() => setIsUserModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    disabled={!!editingUser}
                    placeholder="ramesh@company.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {editingUser ? "Change Password (Leave blank to keep unchanged)" : "Sign-in Password *"}
                </label>
                <input
                  type="password"
                  placeholder={editingUser ? "••••••••" : "Minimum 6 characters"}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    System Role *
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 bg-white"
                  >
                    {isBranchManager ? (
                      <>
                        <option value="Logistics Executive">Logistics Executive (Operations, Trips & Fleet)</option>
                        <option value="Finance Executive">Finance Executive (Billing, Settlements & Invoices)</option>
                      </>
                    ) : (
                      <>
                        <option value="Tenant Admin">Tenant Admin (Super Admin - All Branches)</option>
                        <option value="Branch Manager">Branch Manager (Full Branch Access & Team Delegation)</option>
                        <option value="Logistics Executive">Logistics Executive (Operations, Trips & Fleet)</option>
                        <option value="Finance Executive">Finance Executive (Billing, Settlements & Invoices)</option>
                        <option value="Branch Supervisor">Branch Supervisor (Legacy)</option>
                        <option value="Operations Manager">Operations Manager</option>
                        <option value="Dispatcher">Dispatcher</option>
                        <option value="Finance">Finance / Billing</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Assigned Branch Hub
                    </label>
                    {!isBranchManager && (
                      <button 
                        type="button" 
                        onClick={() => { setIsUserModalOpen(false); setActiveTab("branches"); handleOpenAddBranch(); }}
                        className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        + Add New Branch
                      </button>
                    )}
                  </div>
                  {isBranchManager ? (
                    <div className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold bg-slate-100 text-slate-700 flex items-center justify-between">
                      <span>{currentUser?.branchName || "Current Branch"}</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-extrabold uppercase">Locked to Hub</span>
                    </div>
                  ) : (
                    <select
                      disabled={userForm.role === "Tenant Admin"}
                      value={userForm.branchId}
                      onChange={(e) => setUserForm({ ...userForm, branchId: Number(e.target.value) })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value={0}>All Branches (Super Admin)</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} {b.location ? `(${b.location})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {userForm.role === "Tenant Admin" ? (
                <p className="text-[11px] text-purple-600 font-semibold bg-purple-50 p-2.5 rounded-xl border border-purple-200">
                  ℹ️ Tenant Admins have full consolidated access to view and manage all branches across the entire organization.
                </p>
              ) : isBranchManager ? (
                <p className="text-[11px] text-blue-600 font-semibold bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                  🔒 This team member will be assigned to <b>{currentUser?.branchName || 'your branch'}</b> with access dedicated to {userForm.role === "Finance Executive" ? "Invoicing, Payments & Settlements" : "Trips, Indents, RFQ & Fleet"}.
                </p>
              ) : (
                <p className="text-[11px] text-blue-600 font-semibold bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                  🔒 This user will only see trips, indents, and documents originating from or assigned to their designated branch hub.
                </p>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {userSaving ? "Saving..." : editingUser ? "Update Member" : "Create Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
